import { describe, expect, it } from 'vitest'
import { LEVELS, seededRng } from '../test/helpers'
import type { MistakePattern } from '../types/mistake'
import type { MathOperation } from '../types/question'
import { getQuestionErrors } from '../utils/validation'
import { generateQuestion } from './questionGenerator'
import { generateSimilarQuestion, similarProblems } from './similarQuestions'

const OPERATIONS: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

function pattern(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
  difficulty: MistakePattern['difficulty'] = 2,
): MistakePattern {
  return {
    id: `${operation}:${firstOperand}:${secondOperand}`,
    operation,
    firstOperand,
    secondOperand,
    correctAnswer,
    difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: '2026-10-01T12:00:00.000Z',
    mastered: false,
  }
}

function patternFromRegular(
  operation: MathOperation,
  level: MistakePattern['difficulty'],
  rng: () => number,
) {
  const q = generateQuestion(operation, level, { rng })
  return pattern(operation, q.firstOperand, q.secondOperand, q.correctAnswer, level)
}

const pairs = (list: ReturnType<typeof similarProblems>) =>
  list.map((p) => `${p.firstOperand} ${p.operation} ${p.secondOperand}`)

describe('generateSimilarQuestion', () => {
  it.each(OPERATIONS)(
    'makes valid, labelled, same-level questions for %s mistakes',
    (operation) => {
      const rng = seededRng(7)
      for (const level of LEVELS) {
        for (let i = 0; i < 60; i++) {
          const source = patternFromRegular(operation, level, rng)
          const q = generateSimilarQuestion(source, { rng })
          expect(getQuestionErrors(q)).toEqual([])
          expect(q.difficulty).toBe(level)
          expect(q.source).toBe('mistake-review')
          expect(q.mistakePatternId).toBe(source.id)
          const same =
            q.operation === source.operation &&
            q.firstOperand === source.firstOperand &&
            q.secondOperand === source.secondOperand
          expect(same).toBe(false)
        }
      }
    },
  )

  it('does not repeat the question that was just shown', () => {
    const rng = seededRng(3)
    const source = pattern('multiplication', 8, 7, 56)
    let previous = generateSimilarQuestion(source, { rng })
    for (let i = 0; i < 100; i++) {
      const next = generateSimilarQuestion(source, { rng, previous })
      const same =
        next.operation === previous.operation &&
        next.firstOperand === previous.firstOperand &&
        next.secondOperand === previous.secondOperand
      expect(same).toBe(false)
      previous = next
    }
  })

  it('uses a mix of strategies over time', () => {
    const rng = seededRng(11)
    const source = pattern('multiplication', 8, 7, 56)
    const seen = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const q = generateSimilarQuestion(source, { rng })
      seen.add(
        q.operation === 'division' ? 'fact-family' : q.firstOperand === 7 ? 'reversed' : 'nearby',
      )
    }
    expect(seen).toEqual(new Set(['nearby', 'reversed', 'fact-family']))
  })

  it('is repeatable with a seeded generator', () => {
    const source = pattern('addition', 6, 7, 13)
    const a = generateSimilarQuestion(source, { rng: seededRng(5) })
    const b = generateSimilarQuestion(source, { rng: seededRng(5) })
    expect([a.firstOperand, a.secondOperand, a.operation]).toEqual([
      b.firstOperand,
      b.secondOperand,
      b.operation,
    ])
  })
})

describe('nearby numbers', () => {
  it('changes the numbers a little within the same operation and level', () => {
    const list = similarProblems(pattern('multiplication', 8, 7, 56), 'nearby')
    expect(list.length).toBeGreaterThan(3)
    for (const p of list) {
      expect(p.operation).toBe('multiplication')
      expect(Math.abs(p.firstOperand - 8)).toBeLessThanOrEqual(2)
      expect(Math.abs(p.secondOperand - 7)).toBeLessThanOrEqual(2)
    }
    expect(pairs(list)).toContain('8 multiplication 6')
    expect(pairs(list)).toContain('9 multiplication 7')
  })

  it('stays inside the difficulty range', () => {
    // 10 × 10 is the top of Level 2, so nothing above 10 may appear.
    const list = similarProblems(pattern('multiplication', 10, 10, 100, 2), 'nearby')
    expect(list.every((p) => p.firstOperand <= 10 && p.secondOperand <= 10)).toBe(true)
  })

  it('never makes a negative subtraction', () => {
    const list = similarProblems(pattern('subtraction', 3, 3, 0, 1), 'nearby')
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((p) => p.correctAnswer >= 0 && p.firstOperand >= p.secondOperand)).toBe(true)
  })

  it('keeps division whole and never divides by zero', () => {
    const list = similarProblems(pattern('division', 6, 1, 6, 1), 'nearby')
    expect(list.length).toBeGreaterThan(0)
    for (const p of list) {
      expect(p.secondOperand).toBeGreaterThan(0)
      expect(p.firstOperand % p.secondOperand).toBe(0)
      expect(p.firstOperand / p.secondOperand).toBe(p.correctAnswer)
    }
  })

  it('leaves out the original question', () => {
    const list = similarProblems(pattern('addition', 6, 7, 13), 'nearby')
    expect(pairs(list)).not.toContain('6 addition 7')
  })
})

describe('reversed operands', () => {
  it('swaps the numbers for addition and multiplication', () => {
    expect(pairs(similarProblems(pattern('addition', 6, 9, 15), 'reversed'))).toEqual([
      '9 addition 6',
    ])
    expect(pairs(similarProblems(pattern('multiplication', 8, 7, 56), 'reversed'))).toEqual([
      '7 multiplication 8',
    ])
  })

  it('makes nothing when the numbers are already the same', () => {
    expect(similarProblems(pattern('addition', 4, 4, 8), 'reversed')).toEqual([])
  })

  it('does not treat reversed subtraction or division as equivalent', () => {
    expect(similarProblems(pattern('subtraction', 9, 4, 5), 'reversed')).toEqual([])
    expect(similarProblems(pattern('division', 56, 7, 8, 3), 'reversed')).toEqual([])
  })
})

describe('fact families', () => {
  it('turns multiplication into division', () => {
    const list = similarProblems(pattern('multiplication', 8, 7, 56), 'fact-family')
    expect(
      list.map((p) => [p.operation, p.firstOperand, p.secondOperand, p.correctAnswer]),
    ).toEqual([
      ['division', 56, 7, 8],
      ['division', 56, 8, 7],
    ])
  })

  it('turns division into multiplication', () => {
    const list = similarProblems(pattern('division', 56, 7, 8, 3), 'fact-family')
    expect(
      list.map((p) => [p.operation, p.firstOperand, p.secondOperand, p.correctAnswer]),
    ).toEqual([
      ['multiplication', 8, 7, 56],
      ['multiplication', 7, 8, 56],
    ])
  })

  it('turns addition into subtraction', () => {
    const list = similarProblems(pattern('addition', 6, 7, 13), 'fact-family')
    expect(
      list.map((p) => [p.operation, p.firstOperand, p.secondOperand, p.correctAnswer]),
    ).toEqual([
      ['subtraction', 13, 6, 7],
      ['subtraction', 13, 7, 6],
    ])
  })

  it('turns subtraction into addition', () => {
    const list = similarProblems(pattern('subtraction', 13, 6, 7), 'fact-family')
    expect(
      list.map((p) => [p.operation, p.firstOperand, p.secondOperand, p.correctAnswer]),
    ).toEqual([
      ['addition', 6, 7, 13],
      ['addition', 7, 6, 13],
    ])
  })

  it('drops related questions that do not fit the level', () => {
    // 10 + 10 = 20, but Level 1 subtraction only goes up to 10.
    expect(similarProblems(pattern('addition', 10, 10, 20, 1), 'fact-family')).toEqual([])
    // 0 × 5 = 0 would need a division by 5 with a quotient of 0.
    expect(similarProblems(pattern('multiplication', 0, 5, 0, 1), 'fact-family')).toEqual([])
  })
})
