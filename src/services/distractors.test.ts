import { describe, expect, it } from 'vitest'
import { LEVELS, SAMPLES, seededRng } from '../test/helpers'
import type { MathOperation, Question } from '../types/question'
import { generateAddition } from './generators/addition'
import { generateDivision } from './generators/division'
import { generateMultiplication } from './generators/multiplication'
import { generateSubtraction } from './generators/subtraction'
import { buildChoices, generateDistractors, plausibleDistance } from './distractors'

const generators = {
  addition: generateAddition,
  subtraction: generateSubtraction,
  multiplication: generateMultiplication,
  division: generateDivision,
} as const
const OPERATIONS = Object.keys(generators) as MathOperation[]

function makeQuestion(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
): Question {
  return {
    id: 'q',
    operation,
    firstOperand,
    secondOperand,
    displayText: `${firstOperand} ? ${secondOperand}`,
    correctAnswer,
    choices: [],
    difficulty: 2,
    source: 'regular',
  }
}

describe('generateDistractors', () => {
  it.each(OPERATIONS.flatMap((op) => LEVELS.map((level) => [op, level] as const)))(
    '%s level %i: three unique, whole, non-negative, believable wrong answers',
    (operation, level) => {
      const rng = seededRng(level * 31)
      for (let i = 0; i < SAMPLES; i++) {
        const q = generators[operation](level, { rng })
        const wrong = generateDistractors(q, { rng })
        expect(wrong).toHaveLength(3)
        expect(new Set(wrong).size).toBe(3)
        for (const w of wrong) {
          expect(Number.isInteger(w)).toBe(true)
          expect(w).not.toBe(q.correctAnswer)
          expect(w).toBeGreaterThanOrEqual(0)
          expect(Math.abs(w - q.correctAnswer)).toBeLessThanOrEqual(
            plausibleDistance(q.correctAnswer),
          )
        }
      }
    },
  )

  it('works when the answer is zero', () => {
    for (const q of [
      makeQuestion('addition', 0, 0, 0),
      makeQuestion('multiplication', 0, 5, 0),
      makeQuestion('subtraction', 4, 4, 0),
    ]) {
      const rng = seededRng(2)
      for (let i = 0; i < 100; i++) {
        const wrong = generateDistractors(q, { rng })
        expect(new Set(wrong).size).toBe(3)
        expect(wrong.every((w) => w > 0)).toBe(true)
      }
    }
  })

  it('works when the answer is very small', () => {
    const q = makeQuestion('addition', 0, 1, 1)
    const wrong = generateDistractors(q)
    expect(wrong.every((w) => w >= 0 && w !== 1)).toBe(true)
  })

  it('can produce negative choices only when allowed', () => {
    const q = makeQuestion('addition', 0, 1, 1)
    const rng = seededRng(4)
    let sawNegative = false
    for (let i = 0; i < 300; i++) {
      if (generateDistractors(q, { rng, allowNegative: true }).some((w) => w < 0))
        sawNegative = true
      expect(generateDistractors(q, { rng }).every((w) => w >= 0)).toBe(true)
    }
    expect(sawNegative).toBe(true)
  })

  it('uses neighboring multiplication facts', () => {
    const q = makeQuestion('multiplication', 8, 7, 56)
    const rng = seededRng(6)
    const seen = new Set<number>()
    for (let i = 0; i < 300; i++) generateDistractors(q, { rng }).forEach((w) => seen.add(w))
    for (const fact of [48, 49, 63, 64]) expect(seen).toContain(fact)
  })

  it('uses carry and borrow slips (plus or minus ten)', () => {
    const rng = seededRng(8)
    const add = new Set<number>()
    const sub = new Set<number>()
    for (let i = 0; i < 300; i++) {
      generateDistractors(makeQuestion('addition', 38, 27, 65), { rng }).forEach((w) => add.add(w))
      generateDistractors(makeQuestion('subtraction', 82, 38, 44), { rng }).forEach((w) =>
        sub.add(w),
      )
    }
    expect(add).toContain(55)
    expect(add).toContain(75)
    expect(sub).toContain(34)
    expect(sub).toContain(54)
    expect(sub).toContain(56) // column-by-column slip (5 and 6)
  })

  it('uses fact-family answers for division', () => {
    const q = makeQuestion('division', 56, 7, 8)
    const rng = seededRng(10)
    const seen = new Set<number>()
    for (let i = 0; i < 300; i++) generateDistractors(q, { rng }).forEach((w) => seen.add(w))
    expect(seen).toContain(7) // the divisor
    expect(seen).toContain(9)
    expect(seen).toContain(6)
  })
})

describe('buildChoices', () => {
  it('returns four unique choices with the correct answer exactly once', () => {
    const rng = seededRng(12)
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateMultiplication(3, { rng })
      const choices = buildChoices(q, { rng })
      expect(choices).toHaveLength(4)
      expect(new Set(choices).size).toBe(4)
      expect(choices.filter((c) => c === q.correctAnswer)).toHaveLength(1)
    }
  })

  it('places the correct answer in every position over many questions', () => {
    const rng = seededRng(14)
    const counts = [0, 0, 0, 0]
    for (let i = 0; i < 800; i++) {
      const q = generateAddition(2, { rng })
      counts[buildChoices(q, { rng }).indexOf(q.correctAnswer)]++
    }
    for (const count of counts) expect(count).toBeGreaterThan(100)
  })
})
