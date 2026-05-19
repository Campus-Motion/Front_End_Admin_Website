import { useEffect, useRef } from 'react'
import { Icon } from './Icons'
import './EditDrawer.css'

/**
 * EditDrawer — a slide-in panel from the right side.
 *
 * Props:
 *   open      boolean — whether the drawer is visible
 *   onClose   fn      — called when user clicks backdrop or Escape
 *   title     string
 *   children  ReactNode
 */
export function EditDrawer({ open, onClose, title, children }) {
  const drawerRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  // Trap focus inside drawer when open
  useEffect(() => {
    if (open) drawerRef.current?.focus()
  }, [open])

  return (
    <div className={`drawer-root ${open ? 'drawer-open' : ''}`} aria-modal="true" role="dialog" aria-label={title}>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="drawer-panel" ref={drawerRef} tabIndex={-1}>
        <div className="drawer-header">
          <h2 className="drawer-title">{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </div>
  )
}
