import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt } from '../types/session'

/** Whether the student picked the wrong answer (the confidence check does not matter here). */
export function isIncorrectAttempt(attempt: PracticeAttempt): boolean {
  return attempt.selectedAnswer !== attempt.correctAnswer
}

/** The same question (operation and both operands) always has the same pattern ID. */
export function mistakePatternId(
  operation: PracticeAttempt['operation'],
  firstOperand: number,
  secondOperand: number,
): string {
  return `${operation}:${firstOperand}:${secondOperand}`
}

/**
 * Returns the patterns after an incorrect answer. A new question gets a new pattern;
 * a question missed before keeps its pattern, counts one more miss, gets a fresh
 * timestamp, and loses any progress toward mastery (including a mastered status).
 * Never changes the list it is given, and never creates duplicates.
 */
export function recordMistake(
  patterns: MistakePattern[],
  attempt: PracticeAttempt,
): MistakePattern[] {
  const id = mistakePatternId(attempt.operation, attempt.firstOperand, attempt.secondOperand)
  const existing = patterns.find((p) => p.id === id)

  if (!existing) {
    return [
      ...patterns,
      {
        id,
        operation: attempt.operation,
        firstOperand: attempt.firstOperand,
        secondOperand: attempt.secondOperand,
        correctAnswer: attempt.correctAnswer,
        difficulty: attempt.difficulty,
        incorrectCount: 1,
        similarCorrectCount: 0,
        lastIncorrectAt: attempt.attemptedAt,
        mastered: false,
      },
    ]
  }

  return patterns.map((p) =>
    p.id === id
      ? {
          ...p,
          difficulty: attempt.difficulty,
          incorrectCount: p.incorrectCount + 1,
          similarCorrectCount: 0,
          lastIncorrectAt: attempt.attemptedAt,
          mastered: false,
        }
      : p,
  )
}

/** Patterns that still need review (mastered ones are left out). */
export function activePatterns(patterns: readonly MistakePattern[]): MistakePattern[] {
  return patterns.filter((p) => !p.mastered)
}

export function masteredPatterns(patterns: readonly MistakePattern[]): MistakePattern[] {
  return patterns.filter((p) => p.mastered)
}

/**
 * Updates the pattern behind a mistake-review answer. A correct answer is one more
 * similar question answered correctly, and the pattern is mastered once that reaches
 * `threshold`. An incorrect answer sends the pattern back to the start (no progress,
 * not mastered). Answers whose pattern is missing or already mastered change nothing.
 */
export function recordReviewResult(
  patterns: MistakePattern[],
  attempt: PracticeAttempt,
  threshold: number,
): MistakePattern[] {
  const id = attempt.mistakePatternId
  if (attempt.source !== 'mistake-review' || !id) return patterns
  const target = patterns.find((p) => p.id === id)
  if (!target || target.mastered) return patterns

  const correct = !isIncorrectAttempt(attempt)
  const similarCorrectCount = correct ? target.similarCorrectCount + 1 : 0
  const updated: MistakePattern = {
    ...target,
    similarCorrectCount,
    mastered: correct && similarCorrectCount >= threshold,
  }
  return patterns.map((p) => (p.id === id ? updated : p))
}

/**
 * Everything one answered question does to the mistake patterns: a mistake-review answer
 * updates its pattern's mastery progress, and any wrong answer creates or updates the
 * pattern for the question that was asked. Returns the same list when nothing changed.
 */
export function applyAttempt(
  patterns: MistakePattern[],
  attempt: PracticeAttempt,
  threshold: number,
): MistakePattern[] {
  let next = recordReviewResult(patterns, attempt, threshold)
  if (isIncorrectAttempt(attempt)) next = recordMistake(next, attempt)
  return next
}
