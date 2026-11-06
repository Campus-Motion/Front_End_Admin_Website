import { useEffect, useState } from 'react'
import { addManualPoints } from '../api/pointsDemo'
import { availableMonths, calculateTotals, monthLabel } from '../domain/points'
import { TicketWheel } from './TicketWheel'

export function MonthlyPoints({ users, events, points, adjustments, onAdjustments, showWheels = false }) {
  const [months, setMonths] = useState(availableMonths)
  const [month, setMonth] = useState(months[0])
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    function refresh() {
      const updated = availableMonths()
      setMonths(current => current[0] === updated[0] ? current : updated)
      setMonth(current => updated.includes(current) ? current : updated[0])
    }
    const timer = setInterval(refresh, 1000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])

  function submit(event) {
    event.preventDefault()
    try {
      onAdjustments(addManualPoints(person || String(users[0]?.id ?? ''), month, Number(amount), note))
      setMessage(amount + ' point(s) ajouté(s) pour ' + monthLabel(month) + '.')
      setError('')
      setAmount('')
      setNote('')
    } catch (err) {
      setMessage('')
      setError(err.message)
    }
  }

  return (
    <>
      <section className="card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="section-header"><div><p className="kicker">Attribution manuelle</p><h2>Ajouter des points</h2></div></div>
        <p className="page-subtitle">Les points ajoutés alimentent le classement global et les tickets du mois choisi. Chaque nouveau mois commence avec ses propres tickets. Le mois précédent reste disponible pour le tirage. Calendrier suisse (Europe/Zurich).</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <label className="form-field"><span className="form-label">Personne</span>
            <select required className="form-select" value={person || users[0]?.id || ''} onChange={event => setPerson(event.target.value)}>
              {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
            </select>
          </label>
          <label className="form-field"><span className="form-label">Mois</span>
            <select className="form-select" value={month} onChange={event => setMonth(event.target.value)}>
              {months.map((key, index) => <option key={key} value={key}>{monthLabel(key)} — {index ? 'mois précédent' : 'mois actuel'}</option>)}
            </select>
          </label>
          <label className="form-field"><span className="form-label">Nombre de points à ajouter</span>
            <input className="form-input" type="number" min="1" max="100000" step="1" required value={amount} onChange={event => setAmount(event.target.value)} />
          </label>
          <label className="form-field"><span className="form-label">Motif</span>
            <input className="form-input" required maxLength="200" value={note} onChange={event => setNote(event.target.value)} placeholder="Ex. participation ajoutée après l’activité" />
          </label>
          <button className="btn btn-primary" disabled={!users.length}>Ajouter les points</button>
        </form>
        <p role="status">{message}</p>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <details style={{ marginTop: 'var(--space-4)' }}>
          <summary>Historique des points manuels</summary>
          <ul className="ticket-wheel-legend">
            {adjustments.slice().reverse().map(item => <li key={item.id} style={{ display: 'block' }}>{users.find(user => String(user.id) === item.userId)?.username ?? 'Personne supprimée'} · +{item.amount} · {monthLabel(item.month)} · {item.note}</li>)}
            {!adjustments.length && <li>Aucun ajout manuel.</li>}
          </ul>
        </details>
      </section>
      {showWheels && months.map((key, index) => (
        <TicketWheel key={key} users={users} totals={calculateTotals(events, points, adjustments, key)} title={(index ? 'Mois précédent · ' : 'Mois actuel · ') + monthLabel(key)} />
      ))}
    </>
  )
}
