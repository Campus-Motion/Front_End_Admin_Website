import { useEffect, useState } from 'react'
import { http, readAdjustments, readPoints, writePoints } from '../api/pointsDemo'
import { MonthlyPoints } from './MonthlyPoints'
import { calculateTotals, participantCount, score } from '../domain/points'
import { Badge } from '../components/ui/Badge'

const eventsApi = { getAll: () => http.get('/events') }
const adminApi = { getUsers: () => http.get('/admin/users') }
const roles = { participant: 'Participant', member: 'Association organiser', external: 'External organiser' }

export function PointsPage({ onOpenEvents, onOpenWheel, wheelOnly = false }) {
  const [adjustments, setAdjustments] = useState(readAdjustments)
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [points, setPoints] = useState(readPoints)
  const [selection, setSelection] = useState('2')
  const [person, setPerson] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([eventsApi.getAll(), adminApi.getUsers()])
      .then(([events, users]) => {
        setEvents(events)
        setUsers(users)
        setSelection(current => events.some(event => String(event.id) === current) ? current : String(events[0]?.id ?? ''))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const record = points[selection] ?? { validated: false, roles: {} }
  const count = participantCount(record.roles)
  const peopleCount = Object.keys(record.roles).length
  const available = users.filter(user => !record.roles[user.id])
  const selectedUser = available.some(user => String(user.id) === person) ? person : String(available[0]?.id ?? '')
  const totals = calculateTotals(events, points, adjustments)
  const ranked = users.filter(user => totals.has(String(user.id))).sort((a, b) =>
    totals.get(String(b.id)) - totals.get(String(a.id)) || a.username.localeCompare(b.username))
  let rank = 0

  function save(nextRecord) {
    const next = { ...points, [selection]: nextRecord }
    try {
      writePoints(next)
      setPoints(next)
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

  if (wheelOnly) return <><div className="page-header"><p className="kicker">Management · Local demo</p><h1 className="page-title">Prize draw</h1></div><MonthlyPoints users={users} events={events} points={points} adjustments={adjustments} onAdjustments={setAdjustments} showWheels /></>

  return (
    <>
      <div className="page-header">
        <p className="kicker">Management · Local demo</p>
        <h1 className="page-title">Points &amp; ranking</h1>
        <p className="page-subtitle">Assign roles per event and validate its points. All records are fictional and stored in this browser.</p>
        <button className="btn btn-primary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={onOpenWheel}>Open ticket wheel</button>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="panel-2col">
        <section className="card">
          <div className="section-header">
            <div><p className="kicker">Event feed</p><h2>Participants &amp; points</h2></div>
            <button className="btn btn-ghost btn-sm" onClick={onOpenEvents}>Manage events</button>
          </div>
          {loading ? <p>Loading demo data…</p> : events.length === 0 ? <p>Create an event from the Events tab.</p> : <>
            <label className="form-field">
              <span className="form-label">Event</span>
              <select className="form-select" value={selection} onChange={event => { setSelection(event.target.value); setPerson('') }}>
                {events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
              </select>
            </label>
            <p className="page-subtitle" style={{ marginBlock: 'var(--space-4)' }}>
              <Badge variant={record.validated ? 'published' : 'draft'}>{record.validated ? 'Validated' : 'Draft'}</Badge>
              {' · '}{count} participant{count === 1 ? '' : 's'} · {peopleCount} people total · Association organiser {count >= 4 ? '+2' : '+1'} · External organiser {count >= 4 ? '+3' : '+0'}
            </p>
            <div className="table-wrap">
              <table className="data-table">
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
                      <td>+{score(role, count)}</td>
                      {!record.validated && <td><button className="btn btn-ghost btn-sm" aria-label={'Remove ' + user.username} onClick={() => setRole(user.id, '')}>Remove</button></td>}
                    </tr>
                  })}
                  {Object.keys(record.roles).length === 0 && <tr><td colSpan="4">No registrations yet.</td></tr>}
                </tbody>
              </table>
            </div>
            {!record.validated && available.length > 0 &&
              <form style={{ marginBlock: 'var(--space-4)' }} onSubmit={event => { event.preventDefault(); setRole(selectedUser, 'participant'); setPerson('') }}>
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
          </>}
        </section>
        <section className="card">
          <div className="section-header"><div><p className="kicker">Validated events</p><h2>Ranking</h2></div></div>
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Rank</th><th>Person</th><th>Points</th></tr></thead>
            <tbody>{ranked.map((user, index) => {
              const total = totals.get(String(user.id))
              if (!index || total !== totals.get(String(ranked[index - 1].id))) rank = index + 1
              return <tr key={user.id}><td>{rank}</td><td className="cell-primary">{user.username}</td><td>{total}</td></tr>
            })}{ranked.length === 0 && <tr><td colSpan="3">No validated points yet.</td></tr>}</tbody>
          </table></div>
          <p className="page-subtitle" style={{ marginTop: 'var(--space-4)' }}>Participant +2 · Association organiser +1, or +2 with 4 participants in addition to the organiser · External organiser +3 with 4 participants in addition to the organiser.</p>
        </section>
      </div>
      <MonthlyPoints users={users} events={events} points={points} adjustments={adjustments} onAdjustments={setAdjustments} />
    </>
  )
}




