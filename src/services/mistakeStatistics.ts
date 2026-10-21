import type { MistakePattern } from '../types/mistake'
import type { MathOperation } from '../types/question'
import type { PracticeAttempt } from '../types/session'
import { isAttemptCorrect } from '../utils/accuracy'
import { OPERATIONS } from '../utils/validation'
import { activePatterns, masteredPatterns } from './mistakeService'

/** Most missed first. Ties go to the most recently missed, then to a steady order by ID. */
export function sortByIncorrectCount(patterns: readonly MistakePattern[]): MistakePattern[] {
  return [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      Date.parse(b.lastIncorrectAt) - Date.parse(a.lastIncorrectAt) ||
      a.id.localeCompare(b.id),
  )
}

export interface MissedOperations {
  /** Every operation sharing the highest number of misses, in the usual operation order. */
  operations: MathOperation[]
  misses: number
}

/** The operation(s) missed most, counting every miss of every saved mistake. Null with no mistakes. */
export function mostMissedOperations(patterns: readonly MistakePattern[]): MissedOperations | null {
  const totals = OPERATIONS.map((operation) => ({
    operation,
    misses: patterns
      .filter((p) => p.operation === operation)
      .reduce((sum, p) => sum + p.incorrectCount, 0),
  }))
  const misses = Math.max(...totals.map((t) => t.misses))
  if (misses <= 0) return null
  return { misses, operations: totals.filter((t) => t.misses === misses).map((t) => t.operation) }
}

export interface MistakeStatistics {
  activeCount: number
  masteredCount: number
  /** Mistake-review questions answered. */
  reviewAttempted: number
  /** Mistake-review questions where the right answer was picked. */
  reviewCorrect: number
  mostMissedOperations: MissedOperations | null
  /** The number facts missed most (top few, most missed first). */
  frequentlyMissed: MistakePattern[]
}

export const FREQUENTLY_MISSED_LIMIT = 5

export function buildMistakeStatistics(
  patterns: readonly MistakePattern[],
  attempts: readonly PracticeAttempt[],
  limit = FREQUENTLY_MISSED_LIMIT,
): MistakeStatistics {
  const reviews = attempts.filter((a) => a.source === 'mistake-review')
  return {
    activeCount: activePatterns(patterns).length,
    masteredCount: masteredPatterns(patterns).length,
    reviewAttempted: reviews.length,
    reviewCorrect: reviews.filter(isAttemptCorrect).length,
    mostMissedOperations: mostMissedOperations(patterns),
    frequentlyMissed: sortByIncorrectCount(patterns).slice(0, limit),
  }
}
