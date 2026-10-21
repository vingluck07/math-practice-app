import { describe, expect, it } from 'vitest'
import { LEVELS, SAMPLES, seededRng } from '../test/helpers'
import type { DifficultyLevel, MathOperation } from '../types/question'
import { getQuestionErrors } from '../utils/validation'
import {
  QuestionGenerationError,
  generateQuestion,
  generateNextQuestion,
  generateQuestionSafely,
  generateRandomQuestion,
} from './questionGenerator'

const OPERATIONS: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

describe('generateQuestion', () => {
  it.each(OPERATIONS.flatMap((op) => LEVELS.map((level) => [op, level] as const)))(
    '%s at level %i produces valid questions',
    (operation, level) => {
      const rng = seededRng(level * 100)
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion(operation, level, { rng })
        expect(q.operation).toBe(operation)
        expect(q.difficulty).toBe(level)
        expect(getQuestionErrors(q)).toEqual([])
        expect(q.choices).toHaveLength(4)
        expect(q.choices).toContain(q.correctAnswer)
      }
    },
  )

  it('does not keep the correct answer in a predictable position', () => {
    const rng = seededRng(5)
    const positions = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('multiplication', 2, { rng })
      positions.add(q.choices.indexOf(q.correctAnswer))
    }
    expect(positions.size).toBe(4)
  })

  it('throws a QuestionGenerationError for an unsupported operation', () => {
    expect(() => generateQuestion('modulo' as MathOperation, 1)).toThrow(QuestionGenerationError)
  })

  it('throws a QuestionGenerationError for an unsupported difficulty', () => {
    expect(() => generateQuestion('addition', 9 as DifficultyLevel)).toThrow(
      QuestionGenerationError,
    )
  })
})

describe('generateRandomQuestion', () => {
  it('uses only the enabled operations and eventually uses each one', () => {
    const rng = seededRng(77)
    const seen = new Set<MathOperation>()
    for (let i = 0; i < SAMPLES; i++) {
      seen.add(generateRandomQuestion(['addition', 'division'], 2, { rng }).operation)
    }
    expect([...seen].sort()).toEqual(['addition', 'division'])
  })

  it('works with a single operation', () => {
    expect(generateRandomQuestion(['multiplication'], 1).operation).toBe('multiplication')
  })

  it('throws when no operation is enabled', () => {
    expect(() => generateRandomQuestion([], 1)).toThrow(QuestionGenerationError)
  })
})

describe('generateNextQuestion', () => {
  it('does not repeat the previous problem', () => {
    const rng = seededRng(123)
    let previous = generateNextQuestion(['multiplication'], 1, undefined, { rng })
    for (let i = 0; i < 300; i++) {
      const next = generateNextQuestion(['multiplication'], 1, previous, { rng })
      const same =
        next.firstOperand === previous.firstOperand && next.secondOperand === previous.secondOperand
      expect(same).toBe(false)
      previous = next
    }
  })

  it('works without a previous question', () => {
    expect(generateNextQuestion(['addition'], 1).operation).toBe('addition')
  })
})

describe('generateQuestionSafely', () => {
  it('returns a normal question when generation works', () => {
    const q = generateQuestionSafely(['addition'], 1)
    expect(getQuestionErrors(q)).toEqual([])
  })

  it('falls back to a valid built-in question when generation fails', () => {
    const q = generateQuestionSafely(['addition'], 1, undefined, {
      rng: () => {
        throw new Error('broken')
      },
    })
    expect(getQuestionErrors(q)).toEqual([])
  })
})
