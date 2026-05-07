import { http } from './client'

export const newsApi = {
  /** Admin view — returns drafts too */
  getAll:   (params = {}) => {
    const qs = new URLSearchParams({ limit: 100, ...params }).toString()
    return http.get(`/news/admin?${qs}`)
  },
  getOne:   (id)  => http.get(`/news/${id}`),
  create:   (data) => http.post('/news', data),
  update:   (id, data) => http.put(`/news/${id}`, data),
  delete:   (id)  => http.delete(`/news/${id}`),
  uploadPhoto: (id, formData) => http.upload(`/news/${id}/photo`, formData),
}
