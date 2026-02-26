import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { sessionsApi } from '../api/sessions'
import { attemptsApi } from '../api/attempts'
import { Session, SessionQuestion } from '../types'

export default function ExamModePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession]           = useState<Session | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [timeLeft, setTimeLeft]         = useState(0)
  const [showConfirm, setShowConfirm]   = useState(false)

  // Answers stored locally until submit
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds: string[]; natResponse?: number; isSkipped: boolean }>>({})

  const startTimeRef     = useRef<number>(Date.now())
  const questionStartRef = useRef<number>(Date.now())
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sessionsApi.getById(sessionId!)
        setSession(data)
        setTimeLeft(data.durationSeconds ?? 3600)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  // Countdown timer
  useEffect(() => {
    if (!session || loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleFinalSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [session, loading])

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const timerColor = timeLeft < 300 ? 'text-red-500' : timeLeft < 600 ? 'text-amber-500' : 'text-ink-900'

  // Save current response to local state when navigating
  const saveCurrentResponse = useCallback((sqId: string, opts: string[], nat?: number) => {
    setAnswers(prev => ({
      ...prev,
      [sqId]: { selectedOptionIds: opts, natResponse: nat, isSkipped: false }
    }))
  }, [])

  // When user navigates away from a question, sync the save to backend silently
  const syncToBackend = async (sq: SessionQuestion) => {
    const ans = answers[sq.id]
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000)
    await attemptsApi.submit({
      sessionQuestionId: sq.id,
      mode: 'EXAM',
      selectedOptionIds: ans?.selectedOptionIds,
      natResponse: ans?.natResponse,
      timeSpentSeconds: timeSpent,
      isSkipped: !ans || ans.selectedOptionIds.length === 0,
    })
  }

  const handleNavigate = async (newIndex: number) => {
    if (!session) return
    const current = session.sessionQuestions[currentIndex]
    await syncToBackend(current)
    questionStartRef.current = Date.now()
    setCurrentIndex(newIndex)
  }

  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!session) return
    clearInterval(timerRef.current!)
    setSubmitting(true)
    try {
      // Sync last question
      const current = session.sessionQuestions[currentIndex]
      await syncToBackend(current)
      // Submit session
      await sessionsApi.submitExam(sessionId!)
      navigate(`/results/${sessionId}`)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const questions = session.sessionQuestions
  const current   = questions[currentIndex]
  const q         = current.question
  const currentAnswer = answers[current.id] ?? { selectedOptionIds: [], isSkipped: false }

  // Group questions by section
  const sections = questions.reduce((acc, sq) => {
    const sec = sq.sectionName ?? 'General'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(sq)
    return acc
  }, {} as Record<string, SessionQuestion[]>)

  const answeredCount = Object.keys(answers).filter(id => answers[id].selectedOptionIds.length > 0).length

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Exam header — no layout/nav, fully immersive */}
      <header className="bg-white border-b border-cream-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-ink-900">Exam Simulation</span>
            <span className="badge bg-red-100 text-red-500">LIVE</span>
          </div>

          <div className={`font-display text-2xl font-bold tabular-nums ${timerColor}`}>
            {formatTimer(timeLeft)}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-500">{answeredCount}/{questions.length} answered</span>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all">
              Submit Exam
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto">

        {/* Question panel */}
        <div className="flex-1 px-8 py-6">
          {/* Question meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-ink-500">Q{currentIndex + 1} of {questions.length}</span>
            <span className="badge bg-cream-200 text-ink-500">{q.type === 'MCQ' ? 'Single Correct' : q.type === 'MULTI' ? 'Multiple Correct' : 'Numerical'}</span>
            <span className="badge bg-cream-200 text-ink-500">{q.marks}M</span>
            {q.negativeMarks > 0 && <span className="badge bg-red-50 text-red-400">−{q.negativeMarks}M</span>}
          </div>

          {/* Question text */}
          <div className="card p-6 mb-4">
            <p className="text-ink-900 text-base leading-relaxed font-medium">{q.text}</p>
          </div>

          {/* Options */}
          {(q.type === 'MCQ' || q.type === 'MULTI') && (
            <div className="space-y-2.5">
              {q.options.map((opt) => {
                const isSelected = currentAnswer.selectedOptionIds.includes(opt.id)
                return (
                  <button key={opt.id}
                    onClick={() => {
                      if (q.type === 'MCQ') {
                        setAnswers(prev => ({ ...prev, [current.id]: { ...prev[current.id], selectedOptionIds: [opt.id], isSkipped: false } }))
                      } else {
                        setAnswers(prev => {
                          const cur = prev[current.id]?.selectedOptionIds ?? []
                          return { ...prev, [current.id]: {
                            ...prev[current.id],
                            selectedOptionIds: cur.includes(opt.id) ? cur.filter(id => id !== opt.id) : [...cur, opt.id],
                            isSkipped: false,
                          }}
                        })
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all
                      ${isSelected
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                        : 'border-cream-300 bg-white hover:border-blue-300 hover:bg-blue-50 text-ink-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all
                        ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-cream-300'}`}>
                      </span>
                      {opt.text}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {q.type === 'NAT' && (
            <div className="card p-5">
              <label className="label">Your Numerical Answer</label>
              <input type="number" step="any"
                className="input max-w-xs text-lg font-semibold"
                placeholder="Enter number"
                value={currentAnswer.natResponse ?? ''}
                onChange={e => setAnswers(prev => ({
                  ...prev,
                  [current.id]: { ...prev[current.id], natResponse: parseFloat(e.target.value), selectedOptionIds: [], isSkipped: false }
                }))}
              />
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex items-center gap-3 mt-6">
            <button disabled={currentIndex === 0} onClick={() => handleNavigate(currentIndex - 1)}
              className="btn-secondary disabled:opacity-40">
              ← Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button onClick={() => handleNavigate(currentIndex + 1)} className="btn-primary">
                Next →
              </button>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-xl text-sm">
                Review & Submit →
              </button>
            )}
          </div>
        </div>

        {/* Right panel: section navigator */}
        <aside className="w-64 border-l border-cream-200 bg-white px-4 py-6 overflow-y-auto">
          <h3 className="text-xs uppercase tracking-wide text-ink-400 font-semibold mb-4">Navigator</h3>
          {Object.entries(sections).map(([sectionName, sqs]) => (
            <div key={sectionName} className="mb-5">
              <p className="text-xs font-semibold text-ink-500 mb-2">{sectionName}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {sqs.map((sq) => {
                  const isActive = sq.id === current.id
                  const isAnswered = (answers[sq.id]?.selectedOptionIds?.length ?? 0) > 0 || answers[sq.id]?.natResponse !== undefined
                  return (
                    <button key={sq.id}
                      onClick={() => handleNavigate(questions.findIndex(q => q.id === sq.id))}
                      className={`aspect-square rounded-lg text-xs font-semibold transition-all
                        ${isActive ? 'bg-blue-500 text-white' :
                          isAnswered ? 'bg-green-100 text-green-600' :
                          'bg-cream-100 text-ink-400 hover:bg-cream-200'}`}
                    >
                      {sq.order}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-4 space-y-1.5 text-xs text-ink-400">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Current</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-cream-100 inline-block" /> Not visited</div>
          </div>
        </aside>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full animate-fade-up">
            <h3 className="font-display text-xl font-semibold text-ink-900 mb-2">Submit Exam?</h3>
            <p className="text-sm text-ink-500 mb-4">
              You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              Unanswered questions score 0. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">
                Go back
              </button>
              <button onClick={() => { setShowConfirm(false); handleFinalSubmit() }}
                disabled={submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                {submitting ? <LoadingSpinner size="sm" /> : null}
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}