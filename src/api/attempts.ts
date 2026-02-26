import api from './axios'
import { AttemptResult } from '../types'

interface AttemptPayload {
  sessionQuestionId: string
  mode: 'PRACTICE' | 'EXAM'
  selectedOptionIds?: string[]
  natResponse?: number
  timeSpentSeconds: number
  hintsUsed?: number
  isSkipped?: boolean
}

export const attemptsApi = {
  submit: async (payload: AttemptPayload) => {
    const res = await api.post('/attempts', payload)
    return res.data.data as AttemptResult | { saved: boolean }
  },
}