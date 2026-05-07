import { http } from './client'

export const eventsApi = {
  getAll:   (params = {}) => {
    const qs = new URLSearchParams({ limit: 100, ...params }).toString()
    return http.get(`/events?${qs}`)
  },
  getOne:   (id)       => http.get(`/events/${id}`),
  create:   (data)     => http.post('/events', data),
  update:   (id, data) => http.put(`/events/${id}`, data),
  delete:   (id)       => http.delete(`/events/${id}`),
  getParticipants: (id) => http.get(`/events/${id}/participants`),
}
