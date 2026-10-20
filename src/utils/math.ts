import type { MathOperation } from '../types/question'

/** A random number source returning values in [0, 1), like `Math.random`. */
export type Rng = () => number

export const OPERATION_SYMBOLS: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

/** Returns a random integer from `min` to `max`, both inclusive. */
export function randomInt(min: number, max: number, rng: Rng = Math.random): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError(`randomInt needs integer bounds, got ${min} and ${max}`)
  }
  if (min > max) {
    throw new RangeError(`randomInt needs min <= max, got ${min} and ${max}`)
  }
  return Math.min(max, min + Math.floor(rng() * (max - min + 1)))
}

/** Returns a random element of a non-empty array. */
export function pickRandom<T>(items: readonly T[], rng: Rng = Math.random): T {
  if (items.length === 0) {
    throw new RangeError('pickRandom needs a non-empty array')
  }
  return items[randomInt(0, items.length - 1, rng)]
}

/** Builds the text shown on a question card, e.g. "8 × 7 = ?". */
export function formatQuestionText(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): string {
  return `${firstOperand} ${OPERATION_SYMBOLS[operation]} ${secondOperand} = ?`
}

const OPERATION_WORDS: Record<MathOperation, string> = {
  addition: 'plus',
  subtraction: 'minus',
  multiplication: 'times',
  division: 'divided by',
}

/** The problem in words for screen readers, e.g. "7 times 8". */
export function spokenQuestionText(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): string {
  return `${firstOperand} ${OPERATION_WORDS[operation]} ${secondOperand}`
}

/** The solved problem shown on the back of a card, e.g. "7 × 8 = 56". */
export function formatAnswerText(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  answer: number,
): string {
  return `${firstOperand} ${OPERATION_SYMBOLS[operation]} ${secondOperand} = ${answer}`
}
