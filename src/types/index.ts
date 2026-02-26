export type Role = 'STUDENT' | 'ADMIN'
export type QuestionType = 'MCQ' | 'MULTI' | 'NAT'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type SessionMode = 'PRACTICE' | 'EXAM'
export type SessionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Subject {
  id: string
  name: string
  code: string
  concepts: Concept[]
  _count: { questions: number }
}

export interface Concept {
  id: string
  name: string
  subjectId: string
}

export interface Option {
  id: string
  text: string
  order: number
}

export interface Hint {
  id: string
  text: string
  order: number
}

export interface Question {
  id: string
  text: string
  type: QuestionType
  difficulty: Difficulty
  marks: number
  negativeMarks: number
  explanation?: string
  natAnswer?: number
  subject: { name: string; code: string }
  concept?: { name: string }
  options: Option[]
  hints: Hint[]
}

export interface Attempt {
  id: string
  selectedOptionIds: string[]
  natResponse?: number
  isCorrect?: boolean
  marksAwarded?: number
  timeSpentSeconds: number
  hintsUsed: number
  isSkipped: boolean
}

export interface SessionQuestion {
  id: string
  order: number
  sectionName?: string
  question: Question
  attempt?: Attempt
}

export interface Session {
  id: string
  mode: SessionMode
  status: SessionStatus
  startedAt: string
  submittedAt?: string
  durationSeconds?: number
  totalMarks?: number
  score?: number
  accuracy?: number
  timeTakenSeconds?: number
  negativeMarking: boolean
  sessionQuestions: SessionQuestion[]
  _count?: { sessionQuestions: number }
}

export interface SessionSummary {
  id: string
  mode: SessionMode
  status: SessionStatus
  score?: number
  accuracy?: number
  timeTakenSeconds?: number
  startedAt: string
  submittedAt?: string
  totalMarks?: number
  _count: { sessionQuestions: number }
}

export interface AttemptResult {
  attempt: Attempt
  isCorrect: boolean
  marksAwarded: number
  correctOptionIds: string[]
  explanation?: string
}

export interface ExamResult {
  session: Session
  summary: {
    total: number
    attempted: number
    correct: number
    score: number
    accuracy: number
  }
  gradedAttempts: Array<{
    sessionQuestionId: string
    isCorrect: boolean
    marksAwarded: number
    isSkipped: boolean
  }>
}