import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import DifficultyBadge from '../components/DifficultyBadge'
import { sessionsApi } from '../api/sessions'
import { Session } from '../types'

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading || !session) {
    return <Layout><div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div></Layout>
  }

  const questions = session.sessionQuestions
  const _attempted = questions.filter(sq => sq.attempt && !sq.attempt.isSkipped)
  const correct   = questions.filter(sq => sq.attempt?.isCorrect === true)
  const wrong     = questions.filter(sq => sq.attempt?.isCorrect === false && !sq.attempt?.isSkipped)
  const skipped   = questions.filter(sq => !sq.attempt || sq.attempt.isSkipped)
  const isPractice = session.mode === 'PRACTICE'

  const formatTime = (s?: number) => {
    if (!s) return '—'
    const m = Math.floor(s / 60); const sec = s % 60
    return `${m}m ${sec}s`
  }

  const scoreColor = (acc: number) =>
    acc >= 70 ? 'text-green-600' : acc >= 40 ? 'text-amber-500' : 'text-red-500'

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <span className={`badge ${isPractice ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-500'}`}>
            {isPractice ? 'Practice Mode' : 'Exam Simulation'}
          </span>
          <span className="badge bg-green-100 text-green-600">Completed</span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Session Results</h1>
        <p className="text-ink-500 text-sm mt-1">
          Completed {new Date(session.submittedAt ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          {session.timeTakenSeconds ? ` · ${formatTime(session.timeTakenSeconds)}` : ''}
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Score',    value: `${session.score?.toFixed(2) ?? '0'}${session.totalMarks ? `/${session.totalMarks}` : ''}`, color: 'text-ink-900' },
          { label: 'Accuracy', value: `${session.accuracy?.toFixed(1) ?? 0}%`, color: scoreColor(session.accuracy ?? 0) },
          { label: 'Correct',  value: correct.length,   color: 'text-green-600' },
          { label: 'Wrong',    value: wrong.length,     color: 'text-red-500' },
        ].map((stat, i) => (
          <div key={i} className={`card p-5 animate-fade-up stagger-${i + 1}`}>
            <p className="text-xs uppercase tracking-wide text-ink-400 font-medium mb-1">{stat.label}</p>
            <p className={`font-display text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="card p-5 mb-8 animate-fade-up stagger-3">
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-ink-600 font-medium">{correct.length} correct</span>
          <span className="text-ink-400">{wrong.length} wrong · {skipped.length} skipped</span>
        </div>
        <div className="h-3 bg-cream-200 rounded-full overflow-hidden flex">
          <div className="bg-green-400 h-full transition-all duration-700 rounded-l-full"
            style={{ width: `${(correct.length / questions.length) * 100}%` }} />
          <div className="bg-red-400 h-full transition-all duration-700"
            style={{ width: `${(wrong.length / questions.length) * 100}%` }} />
          <div className="bg-amber-200 h-full transition-all duration-700"
            style={{ width: `${(skipped.length / questions.length) * 100}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-ink-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Correct</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Wrong</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-200 inline-block" />Skipped</span>
        </div>
      </div>

      {/* Question review */}
      <div className="animate-fade-up stagger-4">
        <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Question Review</h2>
        <div className="space-y-3">
          {questions.map((sq, i) => {
            const a = sq.attempt
            const status = !a || a.isSkipped ? 'skipped' : a.isCorrect ? 'correct' : 'wrong'
            const statusConfig = {
              correct: { label: 'Correct',  bg: 'bg-green-50',  border: 'border-l-green-500',  badge: 'bg-green-100 text-green-600' },
              wrong:   { label: 'Wrong',    bg: 'bg-red-50',    border: 'border-l-red-400',    badge: 'bg-red-100 text-red-500' },
              skipped: { label: 'Skipped',  bg: 'bg-cream-50',  border: 'border-l-cream-400',  badge: 'bg-cream-200 text-ink-500' },
            }[status]

            return (
              <div key={sq.id} className={`card border-l-4 ${statusConfig.border} ${statusConfig.bg} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-ink-400 font-medium">Q{i + 1}</span>
                      <span className={`badge ${statusConfig.badge}`}>{statusConfig.label}</span>
                      <DifficultyBadge difficulty={sq.question.difficulty} />
                      <span className="badge bg-cream-200 text-ink-500">{sq.question.subject.name}</span>
                    </div>
                    <p className="text-sm text-ink-800 font-medium leading-relaxed">{sq.question.text}</p>

                    {/* Show explanation for wrong/skipped in practice */}
                    {isPractice && status !== 'correct' && sq.question.explanation && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-cream-200">
                        <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Explanation</p>
                        <p className="text-xs text-ink-600 leading-relaxed">{sq.question.explanation}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display text-lg font-semibold ${
                      (a?.marksAwarded ?? 0) > 0 ? 'text-green-600' :
                      (a?.marksAwarded ?? 0) < 0 ? 'text-red-500' : 'text-ink-400'
                    }`}>
                      {(a?.marksAwarded ?? 0) > 0 ? '+' : ''}{a?.marksAwarded?.toFixed(2) ?? '0'}
                    </p>
                    <p className="text-xs text-ink-400">marks</p>
                    {a?.timeSpentSeconds && (
                      <p className="text-xs text-ink-300 mt-1">{a.timeSpentSeconds}s</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-3 mt-8 animate-fade-up">
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          ← Back to Dashboard
        </button>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Start New Session
        </button>
      </div>
    </Layout>
  )
}