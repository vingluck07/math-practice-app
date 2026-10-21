import { describe, expect, it } from 'vitest'
import { seededRng } from '../test/helpers'
import { FEEDBACK_MESSAGES, chooseFeedback } from './feedback'

describe('chooseFeedback', () => {
  it('only uses the written messages', () => {
    const rng = seededRng(1)
    for (const kind of ['correct', 'incorrect'] as const) {
      for (let i = 0; i < 100; i++) {
        expect(FEEDBACK_MESSAGES[kind]).toContain(chooseFeedback(kind, rng))
      }
    }
  })

  it('varies the message and never repeats the last one', () => {
    const rng = seededRng(5)
    const seen = new Set<string>()
    let last: string | undefined
    for (let i = 0; i < 200; i++) {
      const message = chooseFeedback('correct', rng, last)
      expect(message).not.toBe(last)
      seen.add(message)
      last = message
    }
    expect(seen.size).toBe(FEEDBACK_MESSAGES.correct.length)
  })

  it('handles the edge of the random range', () => {
    expect(FEEDBACK_MESSAGES.incorrect).toContain(chooseFeedback('incorrect', () => 0.999999))
    expect(FEEDBACK_MESSAGES.incorrect).toContain(chooseFeedback('incorrect', () => 0))
  })

  it('has supportive wording with no shaming words', () => {
    const banned = /\b(wrong|bad|stupid|fail|dumb|silly|lazy|careless|terrible)\b/i
    for (const message of [...FEEDBACK_MESSAGES.correct, ...FEEDBACK_MESSAGES.incorrect]) {
      expect(message).not.toMatch(banned)
    }
  })
})
