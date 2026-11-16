import { useEffect, useRef, useState } from 'react'
import './TicketWheel.css'

const colors = ['#d9714f', '#477d9a', '#8775bd', '#45866b', '#b68738', '#a25979', '#5475bc']

export function TicketWheel({ users, totals, title, month }) {
  const [angle, setAngle] = useState(0)
  const [drawing, setDrawing] = useState(null)
  const [winner, setWinner] = useState(null)
  const storageKey = 'campus-motion-wheel-exclusions:' + month
  const [excluded, setExcluded] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey))
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })
  const [error, setError] = useState('')
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const ranked = users.map(user => ({
    ...user,
    tickets: totals.get(String(user.id)) ?? 0,
  }))
    .filter(user => user.tickets > 0)
    .sort((a, b) => b.tickets - a.tickets || a.username.localeCompare(b.username))
  const entries = ranked.filter(user => !excluded.includes(user.id))
  const removed = users.filter(user => excluded.includes(user.id))
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
      setWinner(selected)
      return
    }
    setDrawing({ segments, total })
    setAngle(angle + 1800 + delta)
    timer.current = setTimeout(() => {
      setDrawing(null)
      setWinner(selected)
    }, 3600)
  }

  function updateExclusions(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setExcluded(next)
      setWinner(null)
      setAngle(0)
      setError('')
    } catch {
      setError('Impossible d’enregistrer le changement dans ce navigateur.')
    }
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
              const rotation = center * 180 / Math.PI - 90
              const readableRotation = rotation > 90 && rotation < 270 ? rotation - 180 : rotation
              return <span key={segment.id} className="ticket-wheel-label" style={{ left: (50 + 33 * Math.sin(center)) + '%', top: (50 - 33 * Math.cos(center)) + '%', transform: 'translate(-50%, -50%) rotate(' + readableRotation + 'deg)' }}>{segment.username.split(' ')[0]}</span>
            })}
          </div>
        </div>
        <div>
          <ul className="ticket-wheel-legend">
            {visible.map(segment => <li key={segment.id}><span className="ticket-wheel-swatch" style={{ background: segment.color }} /> <span>{segment.username}</span><strong>{segment.tickets}</strong></li>)}
          </ul>
          {!visible.length && <p>Aucun ticket admissible pour ce tirage.</p>}
          <div className="ticket-wheel-actions">
            <button className="btn btn-primary" disabled={!total || !!drawing} onClick={spin}>Lancer le tirage</button>
            {winner && <button className="btn btn-ghost" onClick={() => updateExclusions([...excluded, winner.id])}>Retirer des prochains tirages</button>}
          </div>
          <p className="ticket-wheel-result" role="status">{drawing ? 'Tirage en cours…' : winner ? 'Gagnant : ' + winner.username : ''}</p>
          {error && <p role="alert">{error}</p>}
          {removed.length > 0 && <div>
            <h3>Personnes retirées</h3>
            <ul className="ticket-wheel-legend">
              {removed.map(user => <li key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span>{user.username}</span>
                <button className="btn btn-ghost btn-sm" disabled={!!drawing} aria-label={'Réintégrer ' + user.username}
                  onClick={() => updateExclusions(excluded.filter(id => id !== user.id))}>Réintégrer</button>
              </li>)}
            </ul>
          </div>}
        </div>
      </div>
    </section>
  )
}
