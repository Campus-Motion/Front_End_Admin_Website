import { useEffect, useState } from 'react'
import { http, addManualPoints, readAdjustments, readPoints, writePoints } from '../api/pointsDemo'
import { MonthlyPoints, usePointsMonths } from './MonthlyPoints'
import { calculateTotals, monthKey, monthLabel, roles, score } from '../domain/points'
import { Badge } from '../components/ui/Badge'
import './PointsPage.css'

const activityDate = new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeZone: 'Europe/Zurich' })

function startDate(event) {
  const date = new Date(event.start_time ?? '')
  return Number.isNaN(date.getTime()) ? null : date
}

export function PointsPage({ onOpenEvents, onOpenWheel, wheelOnly = false }) {
  const months = usePointsMonths()
  const [sortOrder, setSortOrder] = useState('name')
  const [chosenMonth, setChosenMonth] = useState('')
  const month = months.includes(chosenMonth) ? chosenMonth : months[0]
  const [adjustments, setAdjustments] = useState(readAdjustments)
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [points, setPoints] = useState(readPoints)
  const [selection, setSelection] = useState('')
  const [person, setPerson] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([http.get('/events'), http.get('/admin/users')])
      .then(([events, users]) => {
        setEvents(events)
        setUsers(users)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const record = points[selection] ?? { validated: false, roles: {} }
  const groups = months.map((key, index) => ({
    key,
    label: index === 0 ? 'Mois actuel' : 'Mois précédent',
    pending: [],
    validated: [],
  }))
  for (const event of events) {
    const date = startDate(event)
    const group = date && groups.find(item => item.key === monthKey(date))
    if (group) group[points[event.id]?.validated ? 'validated' : 'pending'].push(event)
  }
  const pendingCount = groups.reduce((total, group) => total + group.pending.length, 0)
  const validatedCount = groups.reduce((total, group) => total + group.validated.length, 0)
  const peopleCount = Object.keys(record.roles).length
  const available = users.filter(user => !record.roles[user.id])
  const selectedUser = available.some(user => String(user.id) === person) ? person : String(available[0]?.id ?? '')
  const totals = calculateTotals(events, points, adjustments, month)
  const totalFor = user => totals.get(String(user.id)) ?? 0
  const byName = (a, b) => a.username.localeCompare(b.username, 'fr-CH')
  const ranked = [...users].sort((a, b) => totalFor(b) - totalFor(a) || byName(a, b))
  const ranks = new Map()
  ranked.forEach((user, index) => {
    const total = totalFor(user)
    if (!ranks.has(total)) ranks.set(total, index + 1)
  })
  const displayed = [...ranked]
  if (sortOrder === 'name') displayed.sort(byName)
  if (sortOrder === 'lowest') displayed.sort((a, b) => totalFor(a) - totalFor(b) || byName(a, b))

  function adjust(userId, delta) {
    try {
      setAdjustments(addManualPoints(userId, month, delta, 'Correction depuis le classement'))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  function save(nextRecord) {
    const next = { ...points, [selection]: nextRecord }
    try {
      writePoints(next)
      setPoints(next)
      if (nextRecord.validated) setSelection('')
      setError('')
    } catch {
      setError('Local storage is unavailable. Changes could not be saved.')
    }
  }

  function setRole(id, role) {
    const updated = { ...record.roles }
    if (role) updated[id] = role
    else delete updated[id]
    save({ ...record, roles: updated })
  }

  const eventRow = event => {
    const isOpen = selection === String(event.id)
    const date = startDate(event)
    const detailsId = "points-event-" + event.id
    return (
      <li key={event.id}>
        <button type="button" className="points-event-row" aria-expanded={isOpen} aria-controls={isOpen ? detailsId : undefined}
          onClick={() => { setSelection(isOpen ? '' : String(event.id)); setPerson('') }}>
          <span className="points-event-info">
            <strong>{event.title}</strong>
            <span className={points[event.id]?.validated ? 'points-event-status is-validated' : 'points-event-status'}>
              {points[event.id]?.validated ? '✓ Validée' : '● À valider'}
            </span>
            <small>{date && <><time dateTime={date.toISOString()}>{activityDate.format(date)}</time> · </>}{Object.keys(points[event.id]?.roles ?? {}).length} personne(s)</small>
          </span>
          <span className="points-event-action">
            {isOpen ? 'Fermer' : 'Ouvrir'}
            <span className="points-event-chevron" aria-hidden="true" />
          </span>
        </button>
        {isOpen && <div className="points-event-details" id={detailsId}>
          <p className="page-subtitle" style={{ marginBlock: 'var(--space-4)' }}>
            <Badge variant={record.validated ? 'published' : 'draft'}>{record.validated ? 'Validated' : 'Draft'}</Badge>
            {' · '}{peopleCount} personne(s)
          </p>
          <div className="table-wrap">
            <table className="data-table points-roster">
              <thead><tr><th>Person</th><th>Event role</th><th>Points</th>{!record.validated && <th>Action</th>}</tr></thead>
              <tbody>
                {users.filter(user => record.roles[user.id]).map(user => {
                  const role = record.roles[user.id]
                  return <tr key={user.id}>
                    <td className="cell-primary">{user.username}</td>
                    <td>{record.validated ? roles[role] :
                      <select className="form-select" aria-label={'Role for ' + user.username} value={role} onChange={event => setRole(user.id, event.target.value)}>
                        {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>}
                    </td>
                    <td>+{score(role)}</td>
                    {!record.validated && <td><button className="btn btn-ghost btn-sm" aria-label={'Remove ' + user.username} onClick={() => setRole(user.id, '')}>Remove</button></td>}
                  </tr>
                })}
                {Object.keys(record.roles).length === 0 && <tr><td colSpan="4">No registrations yet.</td></tr>}
              </tbody>
            </table>
          </div>
          {!record.validated && available.length > 0 &&
            <form style={{ marginBlock: 'var(--space-4)' }} onSubmit={event => { event.preventDefault(); setRole(selectedUser, 'guest'); setPerson('') }}>
              <label className="form-field">
                <span className="form-label">Add a person</span>
                <select className="form-select" value={selectedUser} onChange={event => setPerson(event.target.value)}>
                  {available.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                </select>
              </label>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-2)' }}>Add to feed</button>
            </form>}
          <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} disabled={!Object.keys(record.roles).length && !record.validated} onClick={() => save({ ...record, validated: !record.validated })}>
            {record.validated ? 'Reopen as draft' : 'Validate event points'}
          </button>
        </div>}
      </li>
    )
  }

  function renderGroups(status) {
    return groups.map(group => (
      <div key={group.key}>
        <h4 className="points-month-heading">{group.label} · {monthLabel(group.key)}</h4>
        {group[status].length
          ? <ul className="points-event-list">{group[status].map(eventRow)}</ul>
          : <p className="page-subtitle">Aucune activité.</p>}
      </div>
    ))
  }

  if (wheelOnly) return <><div className="page-header"><p className="kicker">Management · Local demo</p><h1 className="page-title">Prize draw</h1></div><MonthlyPoints users={users} events={events} points={points} adjustments={adjustments} months={months} /></>

  return (
    <>
      <div className="page-header">
        <p className="kicker">Management · Local demo</p>
        <h1 className="page-title">Points &amp; ranking</h1>
        <p className="page-subtitle">Assign roles per event and validate its points. All records are fictional and stored in this browser.</p>
        <button className="btn btn-primary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={onOpenWheel}>Open ticket wheel</button>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="points-layout">
        <section className="card">
          <div className="section-header">
            <div><p className="kicker">Event feed</p><h2>Participants &amp; points</h2></div>
            <button className="btn btn-ghost btn-sm" onClick={onOpenEvents}>Manage events</button>
          </div>
          {loading ? <p>Chargement…</p> : <>
            <h3>À valider · {pendingCount}</h3>
            {pendingCount ? renderGroups('pending') : <p>Aucune activité à valider.</p>}
            {validatedCount > 0 && <details><summary>Activités validées · {validatedCount}</summary>
              {renderGroups('validated')}
            </details>}
          </>}
        </section>
        <section className="card">
          <div className="section-header"><div><h2>Classement mensuel</h2></div></div>
          <label className="form-field">
            <span className="form-label">Mois du classement et des corrections</span>
            <select className="form-select" value={month} onChange={event => setChosenMonth(event.target.value)}>
              {months.map(key => <option key={key} value={key}>{monthLabel(key)}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Trier par</span>
            <select className="form-select" value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
              <option value="name">Nom (ordre fixe)</option>
              <option value="highest">Plus de points</option>
              <option value="lowest">Moins de points</option>
            </select>
          </label>
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Rank</th><th>Person</th><th>Points</th></tr></thead>
            <tbody>{displayed.map(user => {
              const total = totalFor(user)
              return <tr key={user.id}><td>{ranks.get(total)}</td><td className="cell-primary">{user.username}</td><td><div className="points-adjust">
                <button type="button" aria-label={'Retirer un point à ' + user.username} onClick={() => adjust(user.id, -1)}>−</button>
                <span aria-live="polite">{total}</span>
                <button type="button" aria-label={'Ajouter un point à ' + user.username} onClick={() => adjust(user.id, 1)}>+</button>
              </div></td></tr>
            })}{displayed.length === 0 && <tr><td colSpan="3">No validated points yet.</td></tr>}</tbody>
          </table></div>
          <p className="page-subtitle" style={{ marginTop: 'var(--space-4)' }}>Membre de l’asso (participant ou organisateur) +2 · Participant hors asso +3 · Organisateur hors asso +4</p>
        </section>
      </div>
    </>
  )
}




