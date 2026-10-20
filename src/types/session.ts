import type { DifficultyLevel, MathOperation, Question, QuestionSource } from './question'

export type SessionLength = number | 'continuous'

export interface PracticeAttempt {
  id: string
  questionId: string
  operation: MathOperation
  firstOperand: number
  secondOperand: number
  correctAnswer: number
  selectedAnswer: number
  selfReportedCorrect: boolean
  difficulty: DifficultyLevel
  source: QuestionSource
  attemptedAt: string
  sessionId: string
}

export interface PracticeSession {
  id: string
  startedAt: string
  completedAt?: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  attempted: number
  correct: number
  incorrect: number
}

/** Settings chosen on the practice setup page and handed to a practice session. */
export interface PracticeConfig {
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
}

/** Everything the practice page needs to run one session. */
export interface PracticeSessionState {
  session: PracticeSession
  currentQuestion: Question
  /** Zero-based; the question number shown to the student is this plus one. */
  currentQuestionIndex: number
  attempts: PracticeAttempt[]
  isActive: boolean
}
