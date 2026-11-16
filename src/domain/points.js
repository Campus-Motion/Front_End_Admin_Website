export const roles = {
  participant: 'Participant de l’asso',
  guest: 'Participant hors asso',
  member: 'Organisateur de l’asso',
  external: 'Organisateur hors asso',
}
export const isParticipant = role => role === 'participant' || role === 'guest'
export const score = role => ({ participant: 2, guest: 3, member: 2, external: 4 })[role]

export function monthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit' }).formatToParts(date)
  return parts.find(part => part.type === 'year').value + '-' + parts.find(part => part.type === 'month').value
}
export function availableMonths(date = new Date()) {
  const current = monthKey(date)
  const [year, month] = current.split('-').map(Number)
  return [current, monthKey(new Date(Date.UTC(year, month - 2, 15)))]
}
export function monthLabel(month) {
  return new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' }).format(new Date(month + '-15T12:00:00Z'))
}
export function calculateTotals(events, points, adjustments, month) {
  const totals = new Map()
  function add(id, amount) { totals.set(String(id), (totals.get(String(id)) ?? 0) + amount) }
  for (const event of events) {
    const entry = points[event.id]
    if (!entry?.validated) continue
    if (month && (!event.start_time || monthKey(new Date(event.start_time)) !== month)) continue
    for (const [id, role] of Object.entries(entry.roles)) add(id, score(role))
  }
  for (const item of adjustments) {
    if (!month || item.month === month) add(item.userId, item.amount)
  }
  return totals
}
