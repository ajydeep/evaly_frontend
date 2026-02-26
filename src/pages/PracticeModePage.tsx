import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import DifficultyBadge from '../components/DifficultyBadge'
import { sessionsApi } from '../api/sessions'
import { attemptsApi } from '../api/attempts'
import { Session, SessionQuestion, AttemptResult } from '../types'

export default function PracticeModePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession]           = useState<Session | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)

  // Per-question state
  const [selected, setSelected]         = useState<string[]>([])
  const [natValue, setNatValue]         = useState('')
  const [hintsShown, setHintsShown]     = useState(0)
  const [result, setResult]             = useState<AttemptResult | null>(null)
  const [isSkipped, setIsSkipped]       = useState(false)

  // Timer
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sessionsApi.getById(sessionId!)
        setSession(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  // Reset state when moving to a new question
  useEffect(() => {
    setSelected([])
    setNatValue('')
    setHintsShown(0)
    setResult(null)
    setIsSkipped(false)
    startTimeRef.current = Date.now()
  }, [currentIndex])

  if (loading || !session) {
    return <Layout><div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div></Layout>
  }

  const questions = session.sessionQuestions
  const current: SessionQuestion = questions[currentIndex]
  const q = current.question
  const isLast = currentIndex === questions.length - 1
  const alreadyAttempted = !!result

  const handleOptionClick = (optionId: string) => {
    if (alreadyAttempted) return
    if (q.type === 'MCQ') {
      setSelected([optionId])
    } else if (q.type === 'MULTI') {
      setSelected(prev =>
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      )
    }
  }

  const handleSubmitAttempt = async (skip = false) => {
    setSubmitting(true)
    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const data = await attemptsApi.submit({
        sessionQuestionId: current.id,
        mode: 'PRACTICE',
        selectedOptionIds: q.type !== 'NAT' ? selected : undefined,
        natResponse: q.type === 'NAT' && natValue !== '' ? parseFloat(natValue) : undefined,
        timeSpentSeconds: timeSpent,
        hintsUsed: hintsShown,
        isSkipped: skip,
      })
      setResult(data as AttemptResult)
      setIsSkipped(skip)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (isLast) {
      navigate(`/results/${sessionId}`)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const canSubmit = (q.type === 'NAT' ? natValue !== '' : selected.length > 0)

  const getOptionStyle = (optionId: string) => {
    const base = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 '
    if (!alreadyAttempted) {
      return base + (selected.includes(optionId)
        ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
        : 'border-cream-300 bg-white hover:border-blue-300 hover:bg-blue-50 text-ink-700')
    }
    // After submission
    const isCorrect = result?.correctOptionIds?.includes(optionId)
    const wasSelected = selected.includes(optionId)
    if (isCorrect) return base + 'border-green-400 bg-green-50 text-green-700 font-medium'
    if (wasSelected && !isCorrect) return base + 'border-red-300 bg-red-50 text-red-600'
    return base + 'border-cream-200 bg-cream-50 text-ink-400'
  }

  return (
    <Layout>
      {/* Progress bar */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={q.difficulty} />
            <span className="badge bg-blue-100 text-blue-600">{q.subject.name}</span>
            {q.concept && <span className="badge bg-cream-200 text-ink-500">{q.concept.name}</span>}
          </div>
        </div>
        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main question area */}
        <div className="lg:col-span-2 space-y-4">

          {/* Question card */}
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-ink-400 font-medium uppercase tracking-wide">
                {q.type === 'MCQ' ? 'Single Correct' : q.type === 'MULTI' ? 'Multiple Correct' : 'Numerical Answer'}
              </span>
              <span className="text-xs text-ink-400">·</span>
              <span className="text-xs text-ink-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            </div>

            <p className="text-ink-900 text-base leading-relaxed font-medium mb-6">{q.text}</p>

            {/* MCQ / MULTI options */}
            {(q.type === 'MCQ' || q.type === 'MULTI') && (
              <div className="space-y-2.5">
                {q.options.map((opt) => (
                  <button key={opt.id} onClick={() => handleOptionClick(opt.id)}
                    className={getOptionStyle(opt.id)}>
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold
                        ${selected.includes(opt.id) && !alreadyAttempted ? 'border-blue-500 bg-blue-500 text-white' :
                          alreadyAttempted && result?.correctOptionIds?.includes(opt.id) ? 'border-green-500 bg-green-500 text-white' :
                          alreadyAttempted && selected.includes(opt.id) ? 'border-red-400 bg-red-400 text-white' :
                          'border-cream-300'}`}>
                        {selected.includes(opt.id) || (alreadyAttempted && result?.correctOptionIds?.includes(opt.id))
                          ? (result?.correctOptionIds?.includes(opt.id) ? '✓' : selected.includes(opt.id) && !alreadyAttempted ? '•' : '✕')
                          : ''}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* NAT input */}
            {q.type === 'NAT' && (
              <div>
                <label className="label">Your Answer (Numerical)</label>
                <input type="number" step="any"
                  className={`input max-w-xs text-lg font-semibold ${alreadyAttempted ?
                    (result?.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50') : ''}`}
                  placeholder="Enter number"
                  value={natValue}
                  onChange={e => setNatValue(e.target.value)}
                  disabled={alreadyAttempted}
                />
                {alreadyAttempted && !result?.isCorrect && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Correct answer: {q.natAnswer}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Result feedback */}
          {alreadyAttempted && !isSkipped && (
            <div className={`card p-5 border-l-4 animate-fade-up ${result?.isCorrect ? 'border-l-green-500' : 'border-l-red-400'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{result?.isCorrect ? '✅' : '❌'}</span>
                <span className={`font-semibold ${result?.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  {result?.isCorrect ? `Correct! +${result?.marksAwarded} marks` : 'Incorrect — no marks deducted'}
                </span>
              </div>
              {q.explanation && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400 font-medium mb-2">Explanation</p>
                  <p className="text-sm text-ink-700 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          )}

          {isSkipped && (
            <div className="card p-5 border-l-4 border-l-amber-400 animate-fade-up">
              <p className="text-sm text-amber-600 font-medium">Question skipped</p>
              {q.explanation && (
                <p className="text-sm text-ink-600 mt-2 leading-relaxed">{q.explanation}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 animate-fade-up">
            {!alreadyAttempted ? (
              <>
                <button
                  onClick={() => handleSubmitAttempt(false)}
                  disabled={!canSubmit || submitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : null}
                  Submit Answer
                </button>
                <button onClick={() => handleSubmitAttempt(true)} disabled={submitting} className="btn-secondary">
                  Skip
                </button>
              </>
            ) : (
              <button onClick={handleNext} className="btn-primary">
                {isLast ? 'Finish Session →' : 'Next Question →'}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar: hints + navigator */}
        <div className="space-y-4">

          {/* Hints */}
          {q.hints.length > 0 && (
            <div className="card p-5 animate-fade-up stagger-1">
              <h3 className="font-semibold text-ink-900 mb-3 text-sm">Hints</h3>
              <div className="space-y-2">
                {q.hints.map((hint, i) => (
                  <div key={hint.id}>
                    {i < hintsShown ? (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 animate-fade-up">
                        <p className="text-xs text-blue-500 font-medium mb-1">Hint {i + 1}</p>
                        <p className="text-sm text-ink-700">{hint.text}</p>
                      </div>
                    ) : (
                      !alreadyAttempted && i === hintsShown && (
                        <button
                          onClick={() => setHintsShown(h => h + 1)}
                          className="w-full text-left px-3 py-2.5 border border-dashed border-blue-200 rounded-xl text-sm text-blue-400 hover:bg-blue-50 hover:border-blue-300 transition-all">
                          + Reveal hint {i + 1}
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question navigator */}
          <div className="card p-5 animate-fade-up stagger-2">
            <h3 className="font-semibold text-ink-900 mb-3 text-sm">Questions</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((sq, i) => (
                <button
                  key={sq.id}
                  onClick={() => { if (i <= currentIndex || sq.attempt) setCurrentIndex(i) }}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all
                    ${i === currentIndex ? 'bg-blue-500 text-white' :
                      sq.attempt?.isCorrect === true ? 'bg-green-100 text-green-600' :
                      sq.attempt?.isSkipped ? 'bg-amber-100 text-amber-500' :
                      sq.attempt?.isCorrect === false ? 'bg-red-100 text-red-500' :
                      i < currentIndex ? 'bg-cream-200 text-ink-500' :
                      'bg-cream-100 text-ink-300 cursor-default'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-ink-400">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Correct</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Wrong</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Skipped</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}