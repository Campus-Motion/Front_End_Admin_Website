import { useEffect, useState } from 'react'
import { eventsApi } from '../api'
import { EventForm }   from '../components/events/EventForm'
import { EventsTable } from '../components/events/EventsTable'
import { Spinner }     from '../components/ui/Spinner'
import { Icon }        from '../components/ui/Icons'

function listFrom(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  return []
}

export function EventsPage({ onCountChange }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await eventsApi.getAll()
      const sorted = listFrom(res).sort((a, b) => new Date(a.starttime) - new Date(b.starttime))
      setItems(sorted)
      onCountChange?.(sorted.length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const upcoming = items.filter(e => new Date(e.starttime) > new Date()).length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Events</h1>
        <p className="page-subtitle">{upcoming} upcoming · {items.length} total</p>
      </div>

      <div className="panel-2col">
        <EventForm onCreated={load} />

        <section>
          <div className="section-header">
            <div>
              <p className="kicker">Scheduled</p>
              <h2>All events</h2>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={load} aria-label="Refresh">
              <Icon name="refresh" size={14} />
            </button>
          </div>

          {loading
            ? <div style={{ display:'flex', justifyContent:'center', padding:'var(--space-12)' }}><Spinner /></div>
            : <EventsTable items={items} onRefresh={load} />
          }
        </section>
      </div>
    </>
  )
}
