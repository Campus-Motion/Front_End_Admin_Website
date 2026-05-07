import { http } from './client'

export const authApi = {
  login:    (email, password) => http.post('/auth/login', { email, password }),
  logout:   ()                => http.post('/auth/logout'),
  getMe:    ()                => http.get('/users/me'),
}
