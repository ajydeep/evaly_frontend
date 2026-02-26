import api from './axios'
import { Session, SessionSummary, ExamResult } from '../types'

export const sessionsApi = {
  create: async (payload: { mode: 'PRACTICE' | 'EXAM'; subjectCode?: string; difficulty?: string; questionCount?: number }) => {
    const res = await api.post('/sessions', payload)
    return res.data.data as Session | { session: Session; durationSeconds: number; totalMarks: number }
  },

  getAll: async () => {
    const res = await api.get('/sessions')
    return res.data.data as SessionSummary[]
  },

  getById: async (id: string) => {
    const res = await api.get(`/sessions/${id}`)
    return res.data.data as Session
  },

  submitExam: async (id: string) => {
    const res = await api.post(`/sessions/${id}/submit`)
    return res.data.data as ExamResult
  },
}