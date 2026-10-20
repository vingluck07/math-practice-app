import { describe, expect, it } from 'vitest'
import { LEVELS, SAMPLES, seededRng } from '../test/helpers'
import type { DifficultyLevel, MathOperation } from '../types/question'
import { getQuestionErrors } from '../utils/validation'
import {
  QuestionGenerationError,
  generateQuestion,
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
      }
    },
  )

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
