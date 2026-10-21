import type { DifficultyLevel, MathOperation, Question, QuestionSource } from './question'

export type SessionLength = number | 'continuous'

/** Regular practice, or questions based on the student's earlier mistakes. */
export type PracticeMode = 'regular' | 'mistake-review'

export interface PracticeAttempt {
  id: string
  questionId: string
  operation: MathOperation
  firstOperand: number
  secondOperand: number
  correctAnswer: number
  selectedAnswer: number
  /** The student's "how do you think you did?" response, given before the answer was revealed. */
  selfReportedCorrect: boolean
  /** For mistake-review questions: the mistake pattern the question was made from. */
  mistakePatternId?: string
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
  /** Missing means regular practice. */
  mode?: PracticeMode
  attempted: number
  /** Questions where the picked answer was the right one. */
  correct: number
  /** Questions where the picked answer was not the right one. */
  incorrect: number
}

/** Settings chosen on the practice setup page and handed to a practice session. */
export interface PracticeConfig {
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  /** Missing means regular practice. */
  mode?: PracticeMode
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

/** What is saved while a session is running, so it can be picked up again after a refresh. */
export interface ActiveSessionRecord {
  config: PracticeConfig
  state: PracticeSessionState
  /** The answer picked on the current question, if any. */
  selectedAnswer: number | null
  savedAt: string
}
