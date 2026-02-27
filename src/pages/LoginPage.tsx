import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import LoadingSpinner from '../components/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const setAuth   = useAuthStore((s) => s.setAuth)
  const navigate  = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, token } = await authApi.login(email, password)
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-semibold text-ink-900 mb-2">
            Evaly
          </h1>
          <p className="text-ink-500 text-sm">Adaptive Intelligence Testing Platform</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Welcome back
          </h2>
          <p className="text-ink-500 text-sm mb-6">Sign in to continue your preparation</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <LoadingSpinner size="sm" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>



          {/* Quick fill for demo 
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-500 font-medium mb-2"> Trial </p>
            <button
              type="button"
              onClick={() => { setEmail('aryatyagi@gmail.com'); setPassword('Test@123') }}
              className="text-xs text-blue-600 underline underline-offset-2"
            >
              Fill
            </button>
          </div>
          */}

          
        </div>

        <p className="text-center text-sm text-ink-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}