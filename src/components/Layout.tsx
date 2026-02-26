import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Topbar */}
      <header className="bg-white border-b border-cream-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-display font-semibold text-lg text-ink-900 hover:text-blue-500 transition-colors"
          >
            Evaly
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500 hidden sm:block">{user?.name}</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-medium text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button onClick={handleLogout} className="btn-ghost text-ink-400 hover:text-red-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}