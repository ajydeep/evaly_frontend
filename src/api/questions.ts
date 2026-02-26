import api from './axios'
import { Question, Subject } from '../types'

export const questionsApi = {
  getAll: async (params?: { subjectCode?: string; difficulty?: string; type?: string; limit?: number }) => {
    const res = await api.get('/questions', { params })
    return res.data.data as Question[]
  },

  getSubjects: async () => {
    const res = await api.get('/questions/subjects')
    return res.data.data as Subject[]
  },
}