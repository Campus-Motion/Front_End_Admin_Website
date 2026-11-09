import { useEffect, useState } from 'react'
import { http } from '../api/client'
import { availableMonths, monthLabel, participantCount, score } from '../domain/points'
import { TicketWheel } from './TicketWheel'

const endpoint = '/admin/points'
const roles = { participant: 'Participant', member: 'Organisateur membre', external: 'Organisateur externe' }
const nameKey = name => name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('fr-CH')

export function LivePointsPage({ wheelOnly = false }) {
  const [data, setData] = useState(null)
  const [eventId, setEventId] = useState('')
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [manualId, setManualId] = useState(null)

  function choose(event) {
    setEventId(event?.id ?? '')
    setEntries(event?.entries ?? [])
    setName('')
  }

  async function reload(id) {
    const snapshot = await http.get(endpoint)
    setData(snapshot)
    choose(snapshot.events.find(event => event.id === id) ?? snapshot.events[0])
  }

  useEffect(() => { reload().catch(err => setError(err.message)) }, [])

  async function run(action) {
    setBusy(true)
    setError('')
    setMessage('')
    try { await action() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const currentMonth = data?.months[0]
  useEffect(() => {
    if (!currentMonth || busy) return
    function refreshMonth() {
      if (availableMonths()[0] !== currentMonth) {
        http.get(endpoint).then(setData).catch(err => setError(err.message))
      }
    }
    const timer = setInterval(refreshMonth, 15000)
    window.addEventListener('focus', refreshMonth)
    return () => { clearInterval(timer); window.removeEventListener('focus', refreshMonth) }
  }, [currentMonth, busy])

  const event = data?.events.find(item => item.id === eventId)
  const participants = participantCount(Object.fromEntries(entries.map(entry => [entry.key, entry.role])))

  function addName(formEvent) {
    formEvent.preventDefault()
    const key = nameKey(name)
    if (!key || entries.some(entry => entry.key === key)) return
    setEntries([...entries, { key, name: name.trim(), role: 'participant' }])
    setName('')
  }

  function save(validated) {
    return run(async () => {
      await http.put(endpoint + '/events/' + eventId, { entries, validated, revision: event.revision })
      await reload(eventId)
      setMessage(validated ? 'Points validés.' : 'Brouillon enregistré.')
    })
  }

  function addManual(formEvent) {
    formEvent.preventDefault()
    const form = formEvent.currentTarget
    const fields = new FormData(form)
    const id = manualId ?? crypto.randomUUID()
    setManualId(id)
    return run(async () => {
      await http.post(endpoint + '/manual', { id, name: fields.get('name'), month: fields.get('month'), amount: Number(fields.get('amount')), note: fields.get('note') })
      setManualId(null)
      form.reset()
      const snapshot = await http.get(endpoint)
      setData(snapshot)
      setMessage('Points ajoutés.')
    })
  }

  return (
    <>
      <div className="page-header"><h1 className="page-title">{wheelOnly ? 'Tirages mensuels' : 'Points et classement'}</h1></div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <p role="status">{message}</p>
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(() => reload(eventId))}>Actualiser</button>
      {!data && !error && <p>Chargement…</p>}
      {data && (wheelOnly ? data.months.map(month => {
        const rows = data.monthly[month]
        return <TicketWheel key={month} title={monthLabel(month)} users={rows.map(row => ({ id: row.key, username: row.name }))}
          totals={new Map(rows.map(row => [row.key, row.tickets]))}
          savedWinner={data.draws.find(draw => draw.month === month)?.winnerName}
          drawTicket={async () => {
            const draw = await http.post(endpoint + '/draws/' + month)
            setData(current => ({ ...current, draws: [...current.draws.filter(item => item.month !== month), draw] }))
            return draw
          }} />
      }) : (
        <>
          <section className="card" style={{ marginTop: 'var(--space-4)' }}>
            <h2>Participants et rôles</h2>
            <p className="page-subtitle">Les inscriptions invitées sont regroupées par nom. Vérifie la liste avant de valider.</p>
            <label className="form-field"><span className="form-label">Événement</span>
              <select className="form-select" value={eventId} disabled={busy || !event} onChange={e => choose(data.events.find(item => item.id === Number(e.target.value)))}>
                {data.events.map(item => <option key={item.id} value={item.id}>{item.title} · {monthLabel(item.month)}</option>)}
              </select>
            </label>
            {event && <>
              <p>{event.validated ? 'Validé' : 'Brouillon'} · {participants} participant(s)</p>
              <div className="table-wrap"><table className="data-table">
                <thead><tr><th>Nom</th><th>Rôle</th><th>Points</th>{!event.validated && <th>Action</th>}</tr></thead>
                <tbody>{entries.map(entry => <tr key={entry.key}>
                  <td>{entry.name}</td>
                  <td>{event.validated ? roles[entry.role] : <select className="form-select" aria-label={'Rôle de ' + entry.name}
                    disabled={busy} value={entry.role} onChange={e => setEntries(entries.map(item => item.key === entry.key ? { ...item, role: e.target.value } : item))}>
                    {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>}</td>
                  <td>+{score(entry.role, participants)}</td>
                  {!event.validated && <td><button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setEntries(entries.filter(item => item.key !== entry.key))}>Retirer</button></td>}
                </tr>)}</tbody>
              </table></div>
              {!event.validated && <>
                <form onSubmit={addName} style={{ marginBlock: 'var(--space-4)' }}>
                  <label className="form-field"><span className="form-label">Nom à ajouter</span>
                    <input className="form-input" value={name} disabled={busy} onChange={e => setName(e.target.value)} required maxLength="200" />
                  </label>
                  <button className="btn btn-ghost btn-sm" disabled={busy}>Ajouter à la liste</button>
                </form>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => {
                  const existing = new Set(entries.map(entry => entry.key))
                  setEntries([...entries, ...event.registrations.filter(entry => !existing.has(entry.key))])
                }}>Importer les inscrits manquants</button>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => save(false)}>Enregistrer le brouillon</button>
              </>}
              <button className="btn btn-primary btn-sm" disabled={busy || (!event.validated && !entries.length)}
                onClick={() => save(!event.validated)}>{event.validated ? 'Rouvrir' : 'Valider les points'}</button>
            </>}
          </section>
          <section className="card" style={{ marginTop: 'var(--space-4)' }}>
            <h2>Classement global</h2>
            <ol>{data.ranking.map(row => <li key={row.key}>{row.name} · {row.tickets} point(s)</li>)}</ol>
          </section>
        </>
      ))}
      {data && <section className="card" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Ajouter des points</h2>
        <form onSubmit={addManual} onChange={() => setManualId(null)}>
          <fieldset disabled={busy} style={{ border: 0, padding: 0, display: 'grid', gap: 'var(--space-3)' }}>
            <label className="form-field"><span className="form-label">Prénom et nom</span><input className="form-input" name="name" list="points-names" required maxLength="200" /></label>
            <datalist id="points-names">{[...new Set([...data.events.flatMap(item => item.entries.map(entry => entry.name)), ...data.manual.map(item => item.name)])].map(value => <option key={value} value={value} />)}</datalist>
            <label className="form-field"><span className="form-label">Mois</span><select className="form-select" name="month">{data.months.map(month => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></label>
            <label className="form-field"><span className="form-label">Points</span><input className="form-input" name="amount" type="number" min="1" max="100000" step="1" required /></label>
            <label className="form-field"><span className="form-label">Motif</span><input className="form-input" name="note" required maxLength="200" /></label>
            <button className="btn btn-primary">Ajouter les points</button>
          </fieldset>
        </form>
        <details><summary>Historique des ajouts</summary><ul>{data.manual.map(item => <li key={item.id}>{item.name} · +{item.amount} · {monthLabel(item.month)} · {item.note}</li>)}</ul></details>
      </section>}
    </>
  )
}
