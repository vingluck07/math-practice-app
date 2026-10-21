import { describe, expect, it } from 'vitest'
import { makeAttempt, makePattern } from '../test/factories'
import type { MistakePattern } from '../types/mistake'
import {
  activePatterns,
  applyAttempt,
  isIncorrectAttempt,
  masteredPatterns,
  mistakePatternId,
  recordMistake,
  recordReviewResult,
} from './mistakeService'

const miss = (options: Parameters<typeof makeAttempt>[0] = {}) =>
  makeAttempt({ correct: false, ...options })

describe('isIncorrectAttempt', () => {
  it('goes by the picked answer, not the confidence check', () => {
    expect(isIncorrectAttempt(miss({ confident: true }))).toBe(true)
    expect(isIncorrectAttempt(makeAttempt({ correct: true, confident: false }))).toBe(false)
  })
})

describe('recordMistake', () => {
  it('creates a pattern with starting counts', () => {
    const attempt = miss({
      operation: 'multiplication',
      firstOperand: 7,
      secondOperand: 8,
      difficulty: 3,
      at: '2026-10-05T09:00:00.000Z',
    })
    const [pattern] = recordMistake([], attempt)
    expect(pattern).toEqual({
      id: mistakePatternId('multiplication', 7, 8),
      operation: 'multiplication',
      firstOperand: 7,
      secondOperand: 8,
      correctAnswer: attempt.correctAnswer,
      difficulty: 3,
      incorrectCount: 1,
      similarCorrectCount: 0,
      lastIncorrectAt: '2026-10-05T09:00:00.000Z',
      mastered: false,
    })
  })

  it('updates the existing pattern instead of adding a duplicate', () => {
    const first = recordMistake([], miss({ at: '2026-10-01T10:00:00.000Z' }))
    const second = recordMistake(first, miss({ at: '2026-10-02T10:00:00.000Z' }))
    expect(second).toHaveLength(1)
    expect(second[0].incorrectCount).toBe(2)
    expect(second[0].lastIncorrectAt).toBe('2026-10-02T10:00:00.000Z')
  })

  it('resets mastery progress when a question is missed again', () => {
    const progressed: MistakePattern = {
      ...recordMistake([], miss())[0],
      similarCorrectCount: 3,
      mastered: true,
    }
    const [again] = recordMistake([progressed], miss())
    expect(again.similarCorrectCount).toBe(0)
    expect(again.mastered).toBe(false)
  })

  it('keeps different questions as separate patterns', () => {
    const list = recordMistake(
      recordMistake([], miss()),
      miss({ firstOperand: 5, secondOperand: 6 }),
    )
    expect(list).toHaveLength(2)
  })

  it('does not change the list it is given', () => {
    const original = recordMistake([], miss())
    const snapshot = JSON.parse(JSON.stringify(original))
    recordMistake(original, miss())
    expect(original).toEqual(snapshot)
  })
})

const review = (correct: boolean, mistakePatternId = 'addition:3:4') =>
  makeAttempt({
    source: 'mistake-review',
    mistakePatternId,
    correct,
    firstOperand: 5,
    secondOperand: 6,
  })

describe('recordReviewResult', () => {
  it('counts a correct answer toward mastery', () => {
    const [updated] = recordReviewResult([makePattern()], review(true), 3)
    expect(updated.similarCorrectCount).toBe(1)
    expect(updated.mastered).toBe(false)
  })

  it('marks a pattern mastered when the threshold is reached', () => {
    let patterns = [makePattern()]
    for (let i = 0; i < 2; i++) patterns = recordReviewResult(patterns, review(true), 3)
    expect(patterns[0]).toMatchObject({ similarCorrectCount: 2, mastered: false })
    patterns = recordReviewResult(patterns, review(true), 3)
    expect(patterns[0]).toMatchObject({ similarCorrectCount: 3, mastered: true })
  })

  it('uses a configurable threshold', () => {
    const [two] = recordReviewResult([makePattern({ similarCorrectCount: 1 })], review(true), 2)
    expect(two.mastered).toBe(true)
    const [five] = recordReviewResult([makePattern({ similarCorrectCount: 3 })], review(true), 5)
    expect(five.mastered).toBe(false)
  })

  it('sends a pattern back to the start after an incorrect review answer', () => {
    const [updated] = recordReviewResult(
      [makePattern({ similarCorrectCount: 2 })],
      review(false),
      3,
    )
    expect(updated).toMatchObject({ similarCorrectCount: 0, mastered: false, incorrectCount: 1 })
  })

  it('ignores regular attempts, unknown patterns and mastered patterns', () => {
    const patterns = [makePattern()]
    expect(recordReviewResult(patterns, makeAttempt(), 3)).toBe(patterns)
    expect(recordReviewResult(patterns, review(true, 'nope'), 3)).toBe(patterns)
    const done = [makePattern({ mastered: true, similarCorrectCount: 3 })]
    expect(recordReviewResult(done, review(true), 3)).toBe(done)
  })

  it('does not change the list it is given', () => {
    const patterns = [makePattern()]
    recordReviewResult(patterns, review(true), 3)
    expect(patterns[0].similarCorrectCount).toBe(0)
  })
})

describe('applyAttempt', () => {
  it('lets a mastered pattern return after a future mistake', () => {
    const mastered = makePattern({ mastered: true, similarCorrectCount: 3 })
    const [back] = applyAttempt([mastered], miss({ firstOperand: 3, secondOperand: 4 }), 3)
    expect(back).toMatchObject({ mastered: false, similarCorrectCount: 0, incorrectCount: 2 })
  })

  it('also records a new pattern for a wrong review answer', () => {
    const next = applyAttempt([makePattern({ similarCorrectCount: 2 })], review(false), 3)
    expect(next).toHaveLength(2)
    expect(next.find((p) => p.id === 'addition:3:4')?.similarCorrectCount).toBe(0)
    expect(next.some((p) => p.id === 'addition:5:6')).toBe(true)
  })

  it('returns the same list for a correct regular answer', () => {
    const patterns = [makePattern()]
    expect(applyAttempt(patterns, makeAttempt(), 3)).toBe(patterns)
  })
})

describe('activePatterns and masteredPatterns', () => {
  it('split patterns by mastery', () => {
    const list = [makePattern({ id: 'a' }), makePattern({ id: 'b', mastered: true })]
    expect(activePatterns(list).map((p) => p.id)).toEqual(['a'])
    expect(masteredPatterns(list).map((p) => p.id)).toEqual(['b'])
  })
})
