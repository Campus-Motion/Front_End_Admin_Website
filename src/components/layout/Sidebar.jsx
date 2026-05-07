import { Icon } from '../ui/Icons'

const NAV_ITEMS = [
  { id: 'news',      label: 'News',       icon: 'newspaper' },
  { id: 'events',    label: 'Events',     icon: 'calendar' },
  { id: 'users',     label: 'Users',      icon: 'users' },
  { id: 'locations', label: 'Locations',  icon: 'location' },
  { id: 'audit',     label: 'Audit logs', icon: 'shield' },
]

export function Sidebar({ activeTab, onTabChange, counts = {} }) {
  return (
    <aside className="sidebar" role="navigation" aria-label="Admin sections">
      <div className="sidebar-section">
        <span className="sidebar-section-label">Content</span>
      </div>
      {NAV_ITEMS.slice(0, 2).map(item => (
        <NavButton
          key={item.id}
          item={item}
          active={activeTab === item.id}
          count={counts[item.id]}
          onClick={() => onTabChange(item.id)}
        />
      ))}

      <div className="sidebar-section" style={{ marginTop: 'var(--space-4)' }}>
        <span className="sidebar-section-label">Management</span>
      </div>
      {NAV_ITEMS.slice(2).map(item => (
        <NavButton
          key={item.id}
          item={item}
          active={activeTab === item.id}
          count={counts[item.id]}
          onClick={() => onTabChange(item.id)}
        />
      ))}
    </aside>
  )
}

function NavButton({ item, active, count, onClick }) {
  return (
    <button
      className={`nav-item${active ? ' active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={item.icon} size={17} />
      {item.label}
      {count != null && <span className="nav-item-count">{count}</span>}
    </button>
  )
}
