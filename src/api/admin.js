import { http } from './client'

export const adminApi = {
  getUsers:    (params = {}) => {
    const qs = new URLSearchParams({ limit: 50, ...params }).toString()
    return http.get(`/admin/users?${qs}`)
  },
  updateRole:  (id, role) => http.patch(`/admin/users/${id}/role`, { role }),
  deleteUser:  (id)       => http.delete(`/admin/users/${id}`),
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams({ limit: 100, ...params }).toString()
    return http.get(`/admin/audit?${qs}`)
  },
  deleteComment:  (id) => http.delete(`/admin/comments/${id}`),
  deleteActivity: (id) => http.delete(`/admin/activities/${id}`),
}
