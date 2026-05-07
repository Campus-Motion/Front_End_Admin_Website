import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

export function AppShell({ user, onLogout, activeTab, onTabChange, counts, children }) {
  return (
    <div className="app-shell">
      <Topbar user={user} onLogout={onLogout} />
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} counts={counts} />
      <main className="main-content" id="main-content">
        {children}
      </main>
    </div>
  )
}
