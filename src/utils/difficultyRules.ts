import type { DifficultyLevel } from '../types/question'

export type Range = readonly [min: number, max: number]

export function inRange(value: number, [min, max]: Range): boolean {
  return Number.isInteger(value) && value >= min && value <= max
}

/** Allowed operand ranges. A question is built from one randomly chosen variant. */
export interface OperandRule {
  first: Range
  second: Range
}

export interface OperandRules {
  variants: readonly OperandRule[]
  /** Largest allowed result (addition only). */
  maxResult?: number
}

export interface DivisionRule {
  divisor: Range
  quotient: Range
}

const ONE_DIGIT: Range = [2, 9]
const TWO_DIGIT: Range = [10, 99]

export const ADDITION_RULES: Record<DifficultyLevel, OperandRules> = {
  1: { variants: [{ first: [0, 10], second: [0, 10] }], maxResult: 20 },
  2: { variants: [{ first: [0, 50], second: [0, 50] }], maxResult: 100 },
  3: { variants: [{ first: [0, 100], second: [0, 100] }], maxResult: 200 },
  4: { variants: [{ first: [10, 1000], second: [10, 1000] }], maxResult: 2000 },
}

/** Both operands come from the same range; the larger one is shown first (no negative answers). */
export const SUBTRACTION_RULES: Record<DifficultyLevel, OperandRules> = {
  1: { variants: [{ first: [0, 10], second: [0, 10] }] },
  2: { variants: [{ first: [0, 50], second: [0, 50] }] },
  3: { variants: [{ first: [0, 100], second: [0, 100] }] },
  4: { variants: [{ first: [10, 1000], second: [10, 1000] }] },
}

export const MULTIPLICATION_RULES: Record<DifficultyLevel, OperandRules> = {
  1: { variants: [{ first: [0, 5], second: [0, 5] }] },
  2: { variants: [{ first: [0, 10], second: [0, 10] }] },
  3: {
    variants: [
      { first: ONE_DIGIT, second: ONE_DIGIT },
      { first: ONE_DIGIT, second: TWO_DIGIT },
    ],
  },
  4: {
    variants: [
      { first: TWO_DIGIT, second: ONE_DIGIT },
      { first: TWO_DIGIT, second: TWO_DIGIT },
    ],
  },
}

/** Division is built backwards: pick a divisor and quotient, then dividend = divisor × quotient. */
export const DIVISION_RULES: Record<DifficultyLevel, readonly DivisionRule[]> = {
  1: [{ divisor: [1, 5], quotient: [1, 5] }],
  2: [{ divisor: [1, 10], quotient: [1, 10] }],
  3: [{ divisor: [1, 12], quotient: [1, 12] }],
  4: [
    { divisor: [2, 9], quotient: [10, 99] },
    { divisor: [10, 20], quotient: [10, 50] },
  ],
}
