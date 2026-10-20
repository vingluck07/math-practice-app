import type { Question } from '../types/question'
import type {
  PracticeAttempt,
  PracticeConfig,
  PracticeSession,
  PracticeSessionState,
} from '../types/session'
import { createId } from '../utils/ids'

/** Starts a session on its first question. */
export function startSession(
  config: PracticeConfig,
  firstQuestion: Question,
  now: Date = new Date(),
): PracticeSessionState {
  const session: PracticeSession = {
    id: createId(),
    startedAt: now.toISOString(),
    operations: [...config.operations],
    difficulty: config.difficulty,
    sessionLength: config.sessionLength,
    attempted: 0,
    correct: 0,
    incorrect: 0,
  }
  return {
    session,
    currentQuestion: firstQuestion,
    currentQuestionIndex: 0,
    attempts: [],
    isActive: true,
  }
}

/** True once a result has been recorded for the question on screen. */
export function hasRecordedCurrentQuestion(state: PracticeSessionState): boolean {
  return state.attempts.some((a) => a.questionId === state.currentQuestion.id)
}

/** True when the question on screen is the last one of a fixed-length session. */
export function isLastQuestion(state: PracticeSessionState): boolean {
  const { sessionLength } = state.session
  return sessionLength !== 'continuous' && state.currentQuestionIndex + 1 >= sessionLength
}

/**
 * Records one answered question. The session's correct/incorrect totals come
 * from the answer the student actually picked; `feltConfident` is their
 * "how do you think you did?" response and is stored separately on the attempt.
 * Does nothing if the session is over or this question was already recorded.
 */
export function recordResult(
  state: PracticeSessionState,
  feltConfident: boolean,
  selectedAnswer: number,
  now: Date = new Date(),
): PracticeSessionState {
  if (!state.isActive || hasRecordedCurrentQuestion(state)) return state

  const { currentQuestion: q, session } = state
  const attempt: PracticeAttempt = {
    id: createId(),
    questionId: q.id,
    operation: q.operation,
    firstOperand: q.firstOperand,
    secondOperand: q.secondOperand,
    correctAnswer: q.correctAnswer,
    selectedAnswer,
    selfReportedCorrect: feltConfident,
    difficulty: q.difficulty,
    source: q.source,
    attemptedAt: now.toISOString(),
    sessionId: session.id,
  }
  const answeredCorrectly = selectedAnswer === q.correctAnswer
  return {
    ...state,
    attempts: [...state.attempts, attempt],
    session: {
      ...session,
      attempted: session.attempted + 1,
      correct: session.correct + (answeredCorrectly ? 1 : 0),
      incorrect: session.incorrect + (answeredCorrectly ? 0 : 1),
    },
  }
}

/** Ends the session immediately (used by End Session and when the last question is done). */
export function endSession(
  state: PracticeSessionState,
  now: Date = new Date(),
): PracticeSessionState {
  if (!state.isActive) return state
  return {
    ...state,
    isActive: false,
    session: { ...state.session, completedAt: now.toISOString() },
  }
}

/**
 * Moves on after a recorded result: shows `nextQuestion`, or finishes the
 * session after the last question of a fixed-length session. Does nothing if
 * the current question has not been recorded yet.
 */
export function advance(
  state: PracticeSessionState,
  nextQuestion: Question | null,
  now: Date = new Date(),
): PracticeSessionState {
  if (!state.isActive || !hasRecordedCurrentQuestion(state)) return state
  if (isLastQuestion(state) || nextQuestion === null) return endSession(state, now)
  return {
    ...state,
    currentQuestion: nextQuestion,
    currentQuestionIndex: state.currentQuestionIndex + 1,
  }
}
