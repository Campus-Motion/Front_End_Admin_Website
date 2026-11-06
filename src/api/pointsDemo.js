import { availableMonths } from '../domain/points.js'
const key = 'campus-motion-points-preview-v1'
const people = ['Inès Martin', 'Noah Diallo', 'Lina Bernard', 'Adam Petit', 'Jade Robert', 'Sami Laurent', 'Lou Garcia'].map((username, index) => ({
  id: index + 1, username, email: 'demo' + (index + 1) + '@example.invalid', role: 'user',
}))
export const profile = { id: 100, username: 'Demo Admin', role: 'admin' }
const seeds = {
  users: people,
  events: [
    { id: 1, title: 'Sortie vélo du campus', type: 'bike', start_time: '2026-10-23T14:00:00', distance_m: 18000 },
    { id: 2, title: 'Initiation au badminton', type: 'badminton', start_time: '2026-11-06T17:30:00' },
  ],
  points: {
    1: { validated: true, roles: { 1: 'member', 2: 'participant', 3: 'participant' } },
    2: { validated: false, roles: { 1: 'participant', 2: 'participant', 3: 'participant', 4: 'participant', 5: 'external' } },
  },
  news: [{ id: 1, title: 'Bienvenue sur Campus Motion', body: 'Découvrez les prochaines activités du campus.', status: 'draft' }],
  locations: [{ id: 1, label: 'Centre sportif' }],
  audit: [],
}
function read() {
  try { return JSON.parse(localStorage.getItem(key)) ?? structuredClone(seeds) }
  catch { return structuredClone(seeds) }
}
let data = read()
function save(next) {
  localStorage.setItem(key, JSON.stringify(next))
  data = next
}
export function readAdjustments() { return structuredClone(data.adjustments ?? []) }
export function addManualPoints(userId, month, amount, note) {
  if (!data.users.some(user => String(user.id) === String(userId))) throw new Error('Choose a person.')
  if (!availableMonths().includes(month)) throw new Error('Choose the current or previous month.')
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100000) throw new Error('Enter a whole number from 1 to 100000.')
  if (!note.trim()) throw new Error('Enter a reason.')
  const item = { id: crypto.randomUUID(), userId: String(userId), month, amount, note: note.trim(), createdAt: new Date().toISOString() }
  save({ ...data, adjustments: [...(data.adjustments ?? []), item] })
  return readAdjustments()
}
export function readPoints() { return structuredClone(data.points) }
export function writePoints(points) { save({ ...data, points }) }
async function request(method, path, body) {
  const [collection, id, action] = path.split('?')[0].split('/').filter(Boolean)
  if (path === '/users/me') return profile
  if (path === '/auth/login') return { access_token: 'local-demo' }
  if (path === '/auth/logout') return null
  const group = collection === 'admin' ? id : collection
  const items = data[group]
  if (!Array.isArray(items)) throw new Error('Unavailable in this local demo.')
  if (collection === 'events' && action === 'participants') {
    const roles = data.points[id]?.roles ?? {}
    return { data: data.users.filter(user => roles[user.id] === 'participant'), meta: { total: Object.values(roles).filter(role => role === 'participant').length } }
  }
  if (method === 'GET') {
    if (id && collection !== 'admin' && id !== 'admin') return items.find(item => String(item.id) === id)
    return structuredClone(items)
  }
  if (collection === 'news' && action === 'photo') throw new Error('Photo upload is unavailable in the local demo.')
  const itemId = Number(collection === 'admin' ? action : id)
  const next = { ...data }
  if (method === 'DELETE') {
    next[group] = items.filter(item => item.id !== itemId)
    next.points = structuredClone(data.points)
    if (group === 'events') delete next.points[itemId]
    if (group === 'users') {
      for (const record of Object.values(next.points)) delete record.roles[itemId]
    }
  } else if (method === 'POST') {
    const newId = Math.max(0, ...items.map(item => item.id), ...Object.keys(data.points).map(Number)) + 1
    next[group] = [...items, { ...body, id: newId }]
  } else {
    next[group] = items.map(item => item.id === itemId ? { ...item, ...body } : item)
  }
  save(next)
  return null
}
export const http = {
  get: path => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: path => request('DELETE', path),
  upload: (path, body) => request('POST', path, body),
}

