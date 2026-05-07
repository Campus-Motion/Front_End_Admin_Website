import { useEffect, useState } from 'react'
import { authApi }        from './api'
import { Login }          from './pages/Login'
import { DashboardShell } from './pages/DashboardShell'
import { Spinner }        from './components/ui/Spinner'

export default function App() {
  const [user,    setUser]    = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accesstoken')
    if (!token) { setBooting(false); return }
    authApi.getMe()
      .then(profile => {
        if (profile.role === 'admin' || profile.role === 'moderator') setUser(profile)
        else localStorage.removeItem('accesstoken')
      })
      .catch(() => localStorage.removeItem('accesstoken'))
      .finally(() => setBooting(false))
  }, [])

  if (booting) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Spinner size={40} />
      </div>
    )
  }

  if (!user) return <Login onLogin={setUser} />

  return <DashboardShell user={user} onLogout={() => setUser(null)} />
}
