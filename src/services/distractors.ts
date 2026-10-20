import type { Question } from '../types/question'
import type { Rng } from '../utils/math'
import { shuffle } from '../utils/shuffle'
import { QuestionGenerationError } from './errors'

export const DISTRACTOR_COUNT = 3

export interface DistractorOptions {
  rng?: Rng
  /** Allow negative choices. No difficulty level needs this yet, so it defaults to false. */
  allowNegative?: boolean
}

/** How far a wrong choice may be from the answer and still look believable. */
export function plausibleDistance(correctAnswer: number): number {
  return Math.max(5, Math.ceil(Math.abs(correctAnswer) * 0.5))
}

/** Subtracts column by column, always taking the larger digit minus the smaller (a common slip). */
function columnWiseDifference(a: number, b: number): number {
  const width = Math.max(String(a).length, String(b).length)
  const x = String(a).padStart(width, '0')
  const y = String(b).padStart(width, '0')
  return Number([...x].map((digit, i) => Math.abs(Number(digit) - Number(y[i]))).join(''))
}

/** Operation-specific wrong answers a child might plausibly pick. */
function commonMistakes(question: Question): number[] {
  const { operation, firstOperand: a, secondOperand: b, correctAnswer: c } = question
  const nearby = [c - 1, c + 1, c - 2, c + 2]

  switch (operation) {
    case 'addition':
      // Off by one or two, a forgotten or extra carry (±10), or subtracting instead.
      return [...nearby, c - 10, c + 10, Math.abs(a - b)]
    case 'subtraction':
      // Off by one or two, a borrowing slip (±10), adding instead, or column-wise subtraction.
      return [...nearby, c - 10, c + 10, a + b, columnWiseDifference(a, b)]
    case 'multiplication':
      // Neighboring facts in the times table, or adding the factors.
      return [(a - 1) * b, (a + 1) * b, a * (b - 1), a * (b + 1), a + b, ...nearby]
    case 'division':
      // The divisor itself, or a neighboring fact in the same fact family.
      return [c - 1, c + 1, c - 2, c + 2, b, c + b, c - b]
  }
}

/**
 * Returns three unique wrong answers: whole numbers, different from the correct
 * answer, close enough to be believable, and never negative unless allowed.
 */
export function generateDistractors(
  question: Question,
  { rng = Math.random, allowNegative = false }: DistractorOptions = {},
): number[] {
  const correct = question.correctAnswer
  const limit = plausibleDistance(correct)
  const chosen = new Set<number>()

  const tryAdd = (n: number) => {
    const acceptable =
      Number.isInteger(n) &&
      n !== correct &&
      (allowNegative || n >= 0) &&
      Math.abs(n - correct) <= limit
    if (acceptable && chosen.size < DISTRACTOR_COUNT) chosen.add(n)
  }

  for (const n of shuffle(commonMistakes(question), rng)) tryAdd(n)

  // Top up with nearby numbers, widening one step at a time. The loop is bounded by `limit`.
  for (let step = 1; step <= limit && chosen.size < DISTRACTOR_COUNT; step++) {
    for (const n of shuffle([correct - step, correct + step], rng)) tryAdd(n)
  }

  if (chosen.size < DISTRACTOR_COUNT) {
    throw new QuestionGenerationError(
      `Could not find enough answer choices for ${question.displayText}`,
    )
  }
  return [...chosen]
}

/** Returns the correct answer plus three distractors, in random order. */
export function buildChoices(question: Question, options: DistractorOptions = {}): number[] {
  return shuffle([question.correctAnswer, ...generateDistractors(question, options)], options.rng)
}
