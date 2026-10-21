import { describe, expect, it } from 'vitest'
import { makeAttempt } from '../test/factories'
import type { MistakePattern } from '../types/mistake'
import { isIncorrectAttempt, mistakePatternId, recordMistake } from './mistakeService'

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
