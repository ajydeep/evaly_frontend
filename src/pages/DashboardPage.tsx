import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { sessionsApi } from '../api/sessions'
import { questionsApi } from '../api/questions'
import { sessionsApi as sApi } from '../api/sessions'
import { SessionSummary, Subject } from '../types'

const DIFFICULTY_OPTIONS = [
  { value: '',       label: 'Any difficulty' },
  { value: 'EASY',   label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD',   label: 'Hard' },
]

export default function DashboardPage() {
  const user    = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [subjects, setSubjects]   = useState<Subject[]>([])
  const [sessions, setSessions]   = useState<SessionSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [starting, setStarting]   = useState(false)

  // Practice config
  const [subject,    setSubject]    = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [qCount,     setQCount]     = useState(10)

  useEffect(() => {
    const load = async () => {
      try {
        const [subjectsData, sessionsData] = await Promise.all([
          questionsApi.getSubjects(),
          sessionsApi.getAll(),
        ])
        setSubjects(subjectsData)
        setSessions(sessionsData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const startPractice = async () => {
    setStarting(true)
    try {
      const result = await sApi.create({
        mode: 'PRACTICE',
        subjectCode: subject || undefined,
        difficulty: difficulty || undefined,
        questionCount: qCount,
      }) as any
      navigate(`/practice/${result.id}`)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start session')
    } finally {
      setStarting(false)
    }
  }

  const startExam = async () => {
    setStarting(true)
    try {
      const result = await sApi.create({ mode: 'EXAM' }) as any
      navigate(`/exam/${result.session.id}`)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start exam')
    } finally {
      setStarting(false)
    }
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  const recentSessions = sessions.slice(0, 5)
  const completedSessions = sessions.filter(s => s.status === 'SUBMITTED')
  const avgAccuracy = completedSessions.length
    ? Math.round(completedSessions.reduce((a, s) => a + (s.accuracy ?? 0), 0) / completedSessions.length)
    : null

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-ink-500 mt-1">Ready to practice? Choose your mode below.</p>
      </div>

      {/* Stats row */}
      {completedSessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Sessions done',  value: completedSessions.length, suffix: '' },
            { label: 'Avg. accuracy',  value: avgAccuracy,              suffix: '%' },
            { label: 'Total questions', value: completedSessions.reduce((a, s) => a + (s._count?.sessionQuestions ?? 0), 0), suffix: '' },
          ].map((stat, i) => (
            <div key={i} className={`card p-5 animate-fade-up stagger-${i + 1}`}>
              <p className="text-xs uppercase tracking-wide text-ink-400 font-medium mb-1">{stat.label}</p>
              <p className="font-display text-3xl font-semibold text-ink-900">
                {stat.value ?? '—'}{stat.suffix}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Mode cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">

        {/* Practice Mode */}
        <div className="card p-6 animate-fade-up stagger-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
              📖
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Practice Mode</h2>
              <p className="text-sm text-ink-500 mt-0.5">Learn with hints, solutions & instant feedback</p>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-1.5 mb-5">
            {['Hints available', 'Instant answer reveal', 'No negative marking', 'Retry wrong questions'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Config */}
          <div className="space-y-3 mb-5 p-4 bg-cream-50 rounded-xl border border-cream-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Subject</label>
                <select className="input text-sm" value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">All subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input text-sm" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  {DIFFICULTY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Questions — {qCount}</label>
              <input type="range" min={3} max={14} value={qCount}
                onChange={e => setQCount(Number(e.target.value))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-ink-400 mt-1">
                <span>3</span><span>14</span>
              </div>
            </div>
          </div>

          <button onClick={startPractice} disabled={starting} className="btn-primary w-full flex items-center justify-center gap-2">
            {starting ? <LoadingSpinner size="sm" /> : null}
            Start Practice Session
          </button>
        </div>

        {/* Exam Mode */}
        <div className="card p-6 animate-fade-up stagger-3">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">
              ⏱
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Exam Simulation</h2>
              <p className="text-sm text-ink-500 mt-0.5">Full pressure. Real conditions. 60 minutes.</p>
            </div>
          </div>

          <ul className="space-y-1.5 mb-5">
            {['60 min countdown timer', 'Negative marking (−1/3)', 'Sectioned by subject', 'Locked after submit', 'No hints'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Exam info box */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-5">
            <p className="text-xs font-medium text-amber-600 mb-1">What's included</p>
            <div className="space-y-1">
              {subjects.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-ink-700">{s.name}</span>
                  <span className="text-ink-400 font-medium">
                    {s.code === 'OS' ? '5' : s.code === 'DBMS' ? '5' : '4'} questions
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startExam} disabled={starting}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-150 active:scale-95 shadow-sm text-sm flex items-center justify-center gap-2">
            {starting ? <LoadingSpinner size="sm" /> : null}
            Start Exam Simulation
          </button>
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="animate-fade-up stagger-4">
          <h3 className="font-display text-xl font-semibold text-ink-900 mb-4">Recent Sessions</h3>
          <div className="card divide-y divide-cream-200">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center gap-4 px-5 py-4 hover:bg-cream-50 transition-colors cursor-pointer"
                onClick={() => session.status === 'SUBMITTED' && navigate(`/results/${session.id}`)}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  session.mode === 'PRACTICE' ? 'bg-blue-400' : 'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {session.mode === 'PRACTICE' ? 'Practice Session' : 'Exam Simulation'}
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {session._count?.sessionQuestions} questions · {formatTime(session.timeTakenSeconds ?? undefined)} · {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {session.status === 'SUBMITTED' ? (
                    <>
                      <p className="text-sm font-semibold text-ink-900">{session.accuracy?.toFixed(0)}%</p>
                      <p className="text-xs text-ink-400">accuracy</p>
                    </>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-600">In progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}