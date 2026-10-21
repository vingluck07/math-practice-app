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
