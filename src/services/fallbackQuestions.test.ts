import { describe, expect, it } from 'vitest'
import { LEVELS } from '../test/helpers'
import type { MathOperation } from '../types/question'
import { getQuestionErrors } from '../utils/validation'
import { createFallbackQuestion } from './fallbackQuestions'

const OPERATIONS: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division']

describe('createFallbackQuestion', () => {
  it.each(OPERATIONS.flatMap((op) => LEVELS.map((level) => [op, level] as const)))(
    '%s at level %i is valid',
    (operation, level) => {
      const q = createFallbackQuestion([operation], level)
      expect(q.operation).toBe(operation)
      expect(getQuestionErrors(q)).toEqual([])
    },
  )

  it('copes with unusable input', () => {
    const q = createFallbackQuestion([], 9 as never)
    expect(getQuestionErrors(q)).toEqual([])
  })
})
