import { useTheme } from '../../hooks/useTheme'
import { Icon } from '../ui/Icons'
import { authApi } from '../../api'

export function Topbar({ user, onLogout }) {
  const { theme, toggle } = useTheme()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('accesstoken')
    onLogout()
  }

  return (
    <header className="topbar">
      <div className="topbar-logo">
        {/* Campus Motion SVG logo mark */}
        <span className="topbar-logo-mark" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Campus Motion logo">
            <rect width="32" height="32" rx="8" fill="var(--color-primary)"/>
            <path d="M8 22c2-4 4-8 8-8s6 4 8 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="16" cy="10" r="2.5" fill="#fff"/>
          </svg>
        </span>
        <span className="topbar-brand">Campus<span>Motion</span></span>
        <span className="topbar-admin-tag">Admin</span>
      </div>

      <div className="topbar-actions">
        {user && (
          <div className="topbar-user">
            <strong>{user.username}</strong>
            <span className="topbar-role">{user.role}</span>
          </div>
        )}
        <button
          className="theme-toggle"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <Icon name="logout" size={15} />
          Logout
        </button>
      </div>
    </header>
  )
}
