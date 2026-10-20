import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import type { AppStatistics, OperationStatistics } from '../types/statistics'
import { calculateAccuracy, isAttemptCorrect } from '../utils/accuracy'
import { DIFFICULTY_LEVELS, OPERATIONS } from '../utils/validation'

function emptyCounts(): OperationStatistics {
  return { attempted: 0, correct: 0, incorrect: 0 }
}

export function createEmptyStatistics(): AppStatistics {
  return {
    ...emptyCounts(),
    byOperation: Object.fromEntries(OPERATIONS.map((o) => [o, emptyCounts()])) as Record<
      MathOperation,
      OperationStatistics
    >,
    byDifficulty: Object.fromEntries(DIFFICULTY_LEVELS.map((d) => [d, emptyCounts()])) as Record<
      DifficultyLevel,
      OperationStatistics
    >,
  }
}

function addTo(counts: OperationStatistics, correct: boolean): OperationStatistics {
  return {
    attempted: counts.attempted + 1,
    correct: counts.correct + (correct ? 1 : 0),
    incorrect: counts.incorrect + (correct ? 0 : 1),
  }
}

/**
 * Returns new statistics with one more attempt counted. An attempt is correct
 * when the student picked the right answer (not based on their self-assessment).
 */
export function addAttemptToStatistics(
  stats: AppStatistics,
  attempt: PracticeAttempt,
): AppStatistics {
  const correct = isAttemptCorrect(attempt)
  return {
    ...addTo(stats, correct),
    byOperation: {
      ...stats.byOperation,
      [attempt.operation]: addTo(stats.byOperation[attempt.operation], correct),
    },
    byDifficulty: {
      ...stats.byDifficulty,
      [attempt.difficulty]: addTo(stats.byDifficulty[attempt.difficulty], correct),
    },
  }
}

/** Counts a whole list of attempts from scratch. */
export function buildStatistics(attempts: readonly PracticeAttempt[]): AppStatistics {
  return attempts.reduce(addAttemptToStatistics, createEmptyStatistics())
}

/** Accuracy for a group of counts, or null when nothing was attempted (never divides by zero). */
export function accuracyOf(counts: OperationStatistics): number | null {
  return calculateAccuracy(counts.correct, counts.attempted)
}

export interface SessionSummary {
  id: string
  startedAt: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  attempted: number
  correct: number
  incorrect: number
  accuracy: number | null
}

/** The newest sessions first, skipping any in which no question was answered. */
export function recentSessionSummaries(
  sessions: readonly PracticeSession[],
  limit = 10,
): SessionSummary[] {
  return sessions
    .filter((s) => s.attempted > 0)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      startedAt: s.startedAt,
      operations: s.operations,
      difficulty: s.difficulty,
      attempted: s.attempted,
      correct: s.correct,
      incorrect: s.incorrect,
      accuracy: calculateAccuracy(s.correct, s.attempted),
    }))
}
