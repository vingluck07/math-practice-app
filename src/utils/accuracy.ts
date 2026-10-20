import type { PracticeAttempt } from '../types/session'

/** Whether the answer the student picked was the right one (not their self-assessment). */
export function isAttemptCorrect(
  attempt: Pick<PracticeAttempt, 'selectedAnswer' | 'correctAnswer'>,
): boolean {
  return attempt.selectedAnswer === attempt.correctAnswer
}

/** Accuracy as a whole-number percentage, or null when nothing was attempted. */
export function calculateAccuracy(correct: number, attempted: number): number | null {
  if (attempted <= 0) return null
  return Math.round((correct / attempted) * 100)
}

/** A short, encouraging message that never shames the student. */
export function encouragement(accuracy: number | null): string {
  if (accuracy === null) return 'Ready when you are!'
  if (accuracy >= 80) return 'Great job!'
  if (accuracy >= 50) return 'Nice work!'
  return 'Keep practicing, you are improving!'
}
