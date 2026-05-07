import { useEffect, useState } from 'react'
import { locationsApi } from '../api'
import { Alert }   from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { Icon }    from '../components/ui/Icons'

function listFrom(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  return []
}

const EMPTY = { label: '', latitude: '', longitude: '' }

export function LocationsPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try { setItems(listFrom(await locationsApi.getAll())) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    setSaving(true)
    try {
      await locationsApi.create({
        label:     form.label.trim(),
        latitude:  Number(form.latitude),
        longitude: Number(form.longitude),
      })
      setForm(EMPTY)
      setSuccess('Location added.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <p className="page-subtitle">Event start and end points</p>
      </div>

      <div className="panel-2col">
        <div className="card">
          <div className="section-header" style={{ marginBottom:'var(--space-4)' }}>
            <div>
              <p className="kicker">Add</p>
              <h2>New location</h2>
            </div>
          </div>
          <Alert variant="error"   message={error}   onDismiss={() => setError('')} />
          <Alert variant="success" message={success} onDismiss={() => setSuccess('')} />
          <form onSubmit={handleSubmit} style={{ display:'grid', gap:'var(--space-4)', marginTop: error||success ? 'var(--space-4)' : 0 }}>
            <div className="form-field">
              <label className="form-label" htmlFor="loc-label">Label</label>
              <input id="loc-label" name="label" className="form-input"
                placeholder="EPFL Main Gate" value={form.label} onChange={set} required />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="loc-lat">Latitude</label>
                <input id="loc-lat" name="latitude" type="number" step="any" className="form-input"
                  placeholder="46.5197" value={form.latitude} onChange={set} required />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="loc-lng">Longitude</label>
                <input id="loc-lng" name="longitude" type="number" step="any" className="form-input"
                  placeholder="6.6323" value={form.longitude} onChange={set} required />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Icon name="plus" size={15} />
                {saving ? 'Saving…' : 'Add location'}
              </button>
            </div>
          </form>
        </div>

        <section>
          <div className="section-header">
            <div><p className="kicker">All</p><h2>Locations</h2></div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={load} aria-label="Refresh">
              <Icon name="refresh" size={14} />
            </button>
          </div>
          {loading
            ? <div style={{ display:'flex', justifyContent:'center', padding:'var(--space-12)' }}><Spinner /></div>
            : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>ID</th><th>Label</th><th>Latitude</th><th>Longitude</th></tr>
                  </thead>
                  <tbody>
                    {items.map(loc => (
                      <tr key={loc.id}>
                        <td style={{ color:'var(--color-text-faint)', fontSize:'var(--text-xs)', fontVariantNumeric:'tabular-nums' }}>{loc.id}</td>
                        <td className="cell-primary"><Icon name="location" size={13} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />{loc.label}</td>
                        <td style={{ fontVariantNumeric:'tabular-nums', fontSize:'var(--text-sm)' }}>{loc.latitude}</td>
                        <td style={{ fontVariantNumeric:'tabular-nums', fontSize:'var(--text-sm)' }}>{loc.longitude}</td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--color-text-muted)', padding:'var(--space-8)' }}>No locations yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          }
        </section>
      </div>
    </>
  )
}
