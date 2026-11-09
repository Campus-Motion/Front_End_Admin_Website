import { useEffect, useState } from 'react'
import { AppShell }     from '../components/layout/AppShell'
import { NewsPage }     from './NewsPage'
import { EventsPage }   from './EventsPage'
import { UsersPage }    from './UsersPage'
import { LocationsPage} from './LocationsPage'
import { AuditPage }    from './AuditPage'
import { PointsPage } from './PointsPage'
import { LivePointsPage } from './LivePointsPage'
import { pointsLiveEnabled, pointsPreviewEnabled } from '../config/pointsPreview'

export function DashboardShell({ user, onLogout }) {
  const [tab,    setTab]    = useState('news')
  const [counts, setCounts] = useState({ news: null, events: null, users: null, audit: null })

  const setCount = key => val => setCounts(c => ({ ...c, [key]: val }))

  const showLivePoints = pointsLiveEnabled && user.role === 'admin'
  const pages = {
    news:      <NewsPage      onCountChange={setCount('news')}   />,
    events:    <EventsPage    onCountChange={setCount('events')} />,
    users:     <UsersPage     onCountChange={setCount('users')}  currentUser={user} />,
    locations: <LocationsPage />,
    ...(pointsPreviewEnabled ? {
      points: <PointsPage key="points" onOpenEvents={() => setTab('events')} onOpenWheel={() => setTab('wheel')} />,
      wheel: <PointsPage key="wheel" wheelOnly />,
    } : showLivePoints ? {
      points: <LivePointsPage key="points" />,
      wheel: <LivePointsPage key="wheel" wheelOnly />,
    } : {}),
    audit:     <AuditPage     onCountChange={setCount('audit')}  />,
  }

  return (
    <AppShell
      user={user}
      onLogout={onLogout}
      activeTab={tab}
      onTabChange={setTab}
      counts={counts}
      showPoints={pointsPreviewEnabled || showLivePoints}
    >
      {pages[tab]}
    </AppShell>
  )
}
