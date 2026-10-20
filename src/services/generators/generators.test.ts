import { describe, expect, it } from 'vitest'
import { LEVELS, SAMPLES, seededRng } from '../../test/helpers'
import type { Question } from '../../types/question'
import { getProblemErrors } from '../../utils/validation'
import { generateAddition } from './addition'
import { generateDivision } from './division'
import { generateMultiplication } from './multiplication'
import { generateSubtraction } from './subtraction'

function sample(generate: (rng: () => number) => Question, seed: number): Question[] {
  const rng = seededRng(seed)
  return Array.from({ length: SAMPLES }, () => generate(rng))
}

describe('every generator returns a well-formed Question', () => {
  const cases = [
    ['addition', generateAddition, '+'],
    ['subtraction', generateSubtraction, '−'],
    ['multiplication', generateMultiplication, '×'],
    ['division', generateDivision, '÷'],
  ] as const

  it.each(cases)('%s', (operation, generator, symbol) => {
    for (const level of LEVELS) {
      const q = generator(level)
      expect(q.operation).toBe(operation)
      expect(q.difficulty).toBe(level)
      expect(q.source).toBe('regular')
      expect(q.id).toBeTruthy()
      expect(q.displayText).toBe(`${q.firstOperand} ${symbol} ${q.secondOperand} = ?`)
      expect(getProblemErrors(q)).toEqual([])
    }
  })

  it('passes the source through for mistake review', () => {
    expect(generateAddition(1, { source: 'mistake-review' }).source).toBe('mistake-review')
  })
})

describe('addition', () => {
  const ranges = { 1: 10, 2: 50, 3: 100, 4: 1000 } as const
  const minimums = { 1: 0, 2: 0, 3: 0, 4: 10 } as const
  const maxSums = { 1: 20, 2: 100, 3: 200, 4: 2000 } as const

  it.each(LEVELS)('level %i respects operand ranges and the maximum result', (level) => {
    for (const q of sample((rng) => generateAddition(level, { rng }), level)) {
      for (const n of [q.firstOperand, q.secondOperand]) {
        expect(n).toBeGreaterThanOrEqual(minimums[level])
        expect(n).toBeLessThanOrEqual(ranges[level])
      }
      expect(q.correctAnswer).toBe(q.firstOperand + q.secondOperand)
      expect(q.correctAnswer).toBeLessThanOrEqual(maxSums[level])
    }
  })

  it('reaches the minimum and maximum operands', () => {
    expect(generateAddition(1, { rng: () => 0 }).correctAnswer).toBe(0)
    expect(generateAddition(1, { rng: () => 0.999999 }).correctAnswer).toBe(20)
    expect(generateAddition(2, { rng: () => 0.999999 }).correctAnswer).toBe(100)
  })

  it('sometimes needs carrying at level 3', () => {
    const questions = sample((rng) => generateAddition(3, { rng }), 7)
    expect(questions.some((q) => (q.firstOperand % 10) + (q.secondOperand % 10) >= 10)).toBe(true)
  })
})

describe('subtraction', () => {
  it.each(LEVELS)('level %i never gives a negative answer', (level) => {
    for (const q of sample((rng) => generateSubtraction(level, { rng }), level)) {
      expect(q.firstOperand).toBeGreaterThanOrEqual(q.secondOperand)
      expect(q.correctAnswer).toBe(q.firstOperand - q.secondOperand)
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0)
    }
  })

  it('respects operand ranges', () => {
    const ranges = { 1: 10, 2: 50, 3: 100, 4: 1000 } as const
    for (const level of LEVELS) {
      for (const q of sample((rng) => generateSubtraction(level, { rng }), 20 + level)) {
        expect(q.firstOperand).toBeLessThanOrEqual(ranges[level])
        expect(q.secondOperand).toBeGreaterThanOrEqual(level === 4 ? 10 : 0)
      }
    }
  })

  it('sometimes needs borrowing at level 3', () => {
    const questions = sample((rng) => generateSubtraction(3, { rng }), 8)
    expect(questions.some((q) => q.firstOperand % 10 < q.secondOperand % 10)).toBe(true)
  })
})

describe('multiplication', () => {
  it('level 1 factors are 0 to 5', () => {
    for (const q of sample((rng) => generateMultiplication(1, { rng }), 31)) {
      for (const n of [q.firstOperand, q.secondOperand]) {
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(5)
      }
      expect(q.correctAnswer).toBe(q.firstOperand * q.secondOperand)
    }
  })

  it('level 2 factors are 0 to 10', () => {
    for (const q of sample((rng) => generateMultiplication(2, { rng }), 32)) {
      for (const n of [q.firstOperand, q.secondOperand]) {
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(10)
      }
    }
  })

  it('level 3 is one digit by one or two digits', () => {
    const questions = sample((rng) => generateMultiplication(3, { rng }), 33)
    for (const q of questions) {
      expect(q.firstOperand).toBeGreaterThanOrEqual(2)
      expect(q.firstOperand).toBeLessThanOrEqual(9)
      expect(q.secondOperand).toBeGreaterThanOrEqual(2)
      expect(q.secondOperand).toBeLessThanOrEqual(99)
    }
    expect(questions.some((q) => q.secondOperand >= 10)).toBe(true)
    expect(questions.some((q) => q.secondOperand <= 9)).toBe(true)
  })

  it('level 4 is two digits by one or two digits', () => {
    const questions = sample((rng) => generateMultiplication(4, { rng }), 34)
    for (const q of questions) {
      expect(q.firstOperand).toBeGreaterThanOrEqual(10)
      expect(q.firstOperand).toBeLessThanOrEqual(99)
      expect(q.secondOperand).toBeGreaterThanOrEqual(2)
      expect(q.secondOperand).toBeLessThanOrEqual(99)
    }
    expect(questions.some((q) => q.secondOperand >= 10)).toBe(true)
    expect(questions.some((q) => q.secondOperand <= 9)).toBe(true)
  })
})

describe('division', () => {
  it.each(LEVELS)('level %i never divides by zero and always gives whole answers', (level) => {
    for (const q of sample((rng) => generateDivision(level, { rng }), 40 + level)) {
      expect(q.secondOperand).toBeGreaterThanOrEqual(1)
      expect(q.firstOperand % q.secondOperand).toBe(0)
      expect(Number.isInteger(q.correctAnswer)).toBe(true)
      expect(q.firstOperand).toBe(q.secondOperand * q.correctAnswer)
    }
  })

  it('never uses a zero divisor even at the lowest random values', () => {
    for (const level of LEVELS) {
      expect(generateDivision(level, { rng: () => 0 }).secondOperand).toBeGreaterThan(0)
    }
  })

  it('keeps divisors and dividends within each level', () => {
    const maxDivisor = { 1: 5, 2: 10, 3: 12, 4: 20 } as const
    for (const level of LEVELS) {
      for (const q of sample((rng) => generateDivision(level, { rng }), 50 + level)) {
        expect(q.secondOperand).toBeLessThanOrEqual(maxDivisor[level])
        if (level === 3) expect(q.firstOperand).toBeLessThanOrEqual(144)
      }
    }
  })
})
