import { describe, expect, it } from 'vitest'
import { makePattern } from '../test/factories'
import { seededRng } from '../test/helpers'
import { getQuestionErrors } from '../utils/validation'
import { generateReviewQuestion, reviewSessionConfig } from './reviewQuestions'

const multiplication = makePattern({
  id: 'multiplication:8:7',
  operation: 'multiplication',
  firstOperand: 8,
  secondOperand: 7,
  correctAnswer: 56,
  difficulty: 2,
})
const addition = makePattern({ difficulty: 1 })

describe('generateReviewQuestion', () => {
  it('makes valid mistake-review questions that record their pattern', () => {
    const rng = seededRng(4)
    for (let i = 0; i < 50; i++) {
      const q = generateReviewQuestion([multiplication, addition], undefined, { rng })
      expect(q).not.toBeNull()
      expect(getQuestionErrors(q!)).toEqual([])
      expect(q!.source).toBe('mistake-review')
      expect([multiplication.id, addition.id]).toContain(q!.mistakePatternId)
    }
  })

  it('mixes different mistakes and avoids the same one twice in a row', () => {
    const rng = seededRng(9)
    const seen = new Set<string>()
    let previous = generateReviewQuestion([multiplication, addition], undefined, { rng })!
    for (let i = 0; i < 40; i++) {
      const next = generateReviewQuestion([multiplication, addition], previous, { rng })!
      expect(next.mistakePatternId).not.toBe(previous.mistakePatternId)
      seen.add(next.mistakePatternId!)
      previous = next
    }
    expect(seen.size).toBe(2)
  })

  it('stays at each mistake’s own level', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 40; i++) {
      const q = generateReviewQuestion([multiplication, addition], undefined, { rng })!
      expect(q.difficulty).toBe(q.mistakePatternId === multiplication.id ? 2 : 1)
    }
  })

  it('returns null when every mistake is mastered', () => {
    expect(generateReviewQuestion([{ ...addition, mastered: true }])).toBeNull()
    expect(generateReviewQuestion([])).toBeNull()
  })
})

describe('reviewSessionConfig', () => {
  it('records the operations being reviewed and the first level', () => {
    const first = generateReviewQuestion([addition])!
    const config = reviewSessionConfig(
      [
        addition,
        multiplication,
        { ...makePattern({ id: 'x', operation: 'division' }), mastered: true },
      ],
      { operations: ['addition'], difficulty: 1, sessionLength: 10 },
      first,
    )
    expect(config).toMatchObject({
      mode: 'mistake-review',
      operations: ['addition', 'multiplication'],
      difficulty: first.difficulty,
      sessionLength: 10,
    })
  })
})
