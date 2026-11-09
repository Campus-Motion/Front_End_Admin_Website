import { useEffect, useRef, useState } from 'react'
import './TicketWheel.css'

const colors = ['#d9714f', '#477d9a', '#8775bd', '#45866b', '#b68738', '#a25979', '#5475bc']

export function TicketWheel({ users, totals, title }) {
  const [angle, setAngle] = useState(0)
  const [drawing, setDrawing] = useState(null)
  const [winner, setWinner] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const entries = users.map(user => ({
    ...user,
    tickets: totals.get(String(user.id)) ?? 0,
  })).filter(user => user.tickets > 0)
  const total = entries.reduce((sum, user) => sum + user.tickets, 0)
  let position = 0
  const segments = entries.map((user, index) => {
    const start = position
    position += user.tickets
    return { ...user, start, end: position, color: colors[index % colors.length] }
  })
  const visible = drawing?.segments ?? segments
  const visibleTotal = drawing?.total ?? total
  const gradient = visible.length
    ? 'conic-gradient(' + visible.map(segment => segment.color + ' ' + (segment.start / visibleTotal * 360) + 'deg ' + (segment.end / visibleTotal * 360) + 'deg').join(', ') + ')'
    : 'var(--color-surface-offset)'

  function spin() {
    if (!total || drawing) return
    const ticket = Math.floor(Math.random() * total)
    const selected = segments.find(segment => ticket < segment.end)
    const target = (ticket + 0.5) / total * 360
    const delta = (360 - target - angle % 360 + 360) % 360
    setWinner(null)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAngle(angle + delta)
      setWinner(selected.username)
      return
    }
    setDrawing({ segments, total })
    setAngle(angle + 1800 + delta)
    timer.current = setTimeout(() => {
      setDrawing(null)
      setWinner(selected.username)
    }, 3600)
  }

  return (
    <section className="card ticket-wheel">
      <div className="section-header">
        <div><p className="kicker">Prize draw</p><h2>{title}</h2></div>
        <span>{visibleTotal} ticket{visibleTotal === 1 ? '' : 's'}</span>
      </div>
      <p className="page-subtitle">1 point = 1 ticket. Les points sont attribués au mois de la date de l’activité.</p>
      <div className="ticket-wheel-layout">
        <div className="ticket-wheel-frame" aria-hidden="true">
          <div className="ticket-wheel-pointer" />
          <div className="ticket-wheel-disc" style={{ background: gradient, transform: 'rotate(' + angle + 'deg)', transition: drawing ? 'transform 3.6s cubic-bezier(.12,.72,.16,1)' : 'none' }}>
            {visible.map(segment => {
              const center = (segment.start + segment.end) / (2 * visibleTotal) * 2 * Math.PI
              return <span key={segment.id} className="ticket-wheel-label" style={{ left: (50 + 33 * Math.sin(center)) + '%', top: (50 - 33 * Math.cos(center)) + '%' }}>{segment.username.split(' ')[0]}</span>
            })}
          </div>
        </div>
        <div>
          <ul className="ticket-wheel-legend">
            {visible.map(segment => <li key={segment.id}><span className="ticket-wheel-swatch" style={{ background: segment.color }} /> <span>{segment.username}</span><strong>{segment.tickets}</strong></li>)}
          </ul>
          {!visible.length && <p>No tickets in this round. Validate more points to add tickets.</p>}
          <div className="ticket-wheel-actions">
            <button className="btn btn-primary" disabled={!total || !!drawing} onClick={spin}>Spin the wheel</button>
          </div>
          <p className="ticket-wheel-result" role="status">{drawing ? 'Drawing…' : winner ? 'Winner: ' + winner : ''}</p>
        </div>
      </div>
    </section>
  )
}
