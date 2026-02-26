import api from './axios'
import { User } from '../types'

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password })
    return res.data.data as { user: User; token: string }
  },

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    return res.data.data as { user: User; token: string }
  },

  getMe: async () => {
    const res = await api.get('/auth/me')
    return res.data.data as User
  },
}