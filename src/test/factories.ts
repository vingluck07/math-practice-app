import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeAttempt, PracticeSession } from '../types/session'

let counter = 0

/** An attempt where the student picked the right answer unless `correct` is false. */
export function makeAttempt(
  options: {
    operation?: MathOperation
    difficulty?: DifficultyLevel
    correct?: boolean
    firstOperand?: number
    secondOperand?: number
    confident?: boolean
    sessionId?: string
    at?: string
  } = {},
): PracticeAttempt {
  counter += 1
  const { operation = 'addition', difficulty = 1, correct = true, confident = true } = options
  return {
    id: `attempt-${counter}`,
    questionId: `question-${counter}`,
    operation,
    firstOperand: options.firstOperand ?? 3,
    secondOperand: options.secondOperand ?? 4,
    correctAnswer: 7,
    selectedAnswer: correct ? 7 : 8,
    selfReportedCorrect: confident,
    difficulty,
    source: 'regular',
    attemptedAt: options.at ?? '2026-10-01T12:00:00.000Z',
    sessionId: options.sessionId ?? 'session-1',
  }
}

export function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  counter += 1
  return {
    id: `session-${counter}`,
    startedAt: '2026-10-01T12:00:00.000Z',
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 10,
    attempted: 4,
    correct: 3,
    incorrect: 1,
    ...overrides,
  }
}
