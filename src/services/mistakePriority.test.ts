import { describe, expect, it } from 'vitest'
import { makePattern } from '../test/factories'
import { seededRng } from '../test/helpers'
import { reviewPriority, selectMistakePattern } from './mistakePriority'

const NOW = new Date('2026-10-20T12:00:00.000Z')
const opts = { now: NOW }
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString()

describe('reviewPriority', () => {
  it('is higher for frequently missed patterns', () => {
    const often = makePattern({ incorrectCount: 4, lastIncorrectAt: daysAgo(3) })
    const once = makePattern({ incorrectCount: 1, lastIncorrectAt: daysAgo(3) })
    expect(reviewPriority(often, opts)).toBeGreaterThan(reviewPriority(once, opts))
  })

  it('is higher for recently missed patterns', () => {
    const recent = makePattern({ lastIncorrectAt: daysAgo(0) })
    const old = makePattern({ lastIncorrectAt: daysAgo(30) })
    expect(reviewPriority(recent, opts)).toBeGreaterThan(reviewPriority(old, opts))
  })

  it('is higher for patterns with little successful review', () => {
    const fresh = makePattern({ similarCorrectCount: 0, lastIncorrectAt: daysAgo(3) })
    const practiced = makePattern({ similarCorrectCount: 2, lastIncorrectAt: daysAgo(3) })
    expect(reviewPriority(fresh, opts)).toBeGreaterThan(reviewPriority(practiced, opts))
  })

  it('stays between 0 and 3', () => {
    const top = makePattern({ incorrectCount: 99, lastIncorrectAt: NOW.toISOString() })
    expect(reviewPriority(top, opts)).toBeCloseTo(3)
    const bottom = makePattern({
      incorrectCount: 1,
      similarCorrectCount: 3,
      lastIncorrectAt: daysAgo(3650),
    })
    expect(reviewPriority(bottom, opts)).toBeGreaterThan(0)
    expect(reviewPriority(bottom, opts)).toBeLessThan(0.5)
  })

  it('uses the mastery threshold to judge progress', () => {
    const p = makePattern({ similarCorrectCount: 2 })
    expect(reviewPriority(p, { ...opts, threshold: 2 })).toBeLessThan(
      reviewPriority(p, { ...opts, threshold: 5 }),
    )
  })
})

describe('selectMistakePattern', () => {
  const urgent = makePattern({ id: 'urgent', incorrectCount: 5, lastIncorrectAt: daysAgo(0) })
  const calm = makePattern({
    id: 'calm',
    incorrectCount: 1,
    similarCorrectCount: 2,
    lastIncorrectAt: daysAgo(40),
  })

  function tally(patterns: Parameters<typeof selectMistakePattern>[0], n = 2000) {
    const rng = seededRng(21)
    const counts: Record<string, number> = {}
    for (let i = 0; i < n; i++) {
      const id = selectMistakePattern(patterns, { rng, ...opts })?.id ?? 'none'
      counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  }

  it('picks higher-priority patterns more often, but still picks the others', () => {
    const counts = tally([urgent, calm])
    expect(counts.urgent).toBeGreaterThan(counts.calm * 2)
    expect(counts.calm).toBeGreaterThan(0)
  })

  it('shares turns between patterns with similar priority', () => {
    const a = makePattern({ id: 'a' })
    const b = makePattern({ id: 'b' })
    const counts = tally([a, b])
    expect(Math.abs(counts.a - counts.b)).toBeLessThan(200)
  })

  it('never picks mastered patterns', () => {
    const counts = tally([urgent, makePattern({ id: 'done', mastered: true })], 200)
    expect(counts.done).toBeUndefined()
  })

  it('returns null when nothing needs review', () => {
    expect(selectMistakePattern([])).toBeNull()
    expect(selectMistakePattern([makePattern({ mastered: true })])).toBeNull()
  })

  it('avoids the previous pattern when there is another choice', () => {
    const rng = seededRng(2)
    for (let i = 0; i < 100; i++) {
      expect(selectMistakePattern([urgent, calm], { rng, avoidId: 'urgent', ...opts })?.id).toBe(
        'calm',
      )
    }
  })

  it('uses the previous pattern when it is the only one', () => {
    expect(selectMistakePattern([urgent], { avoidId: 'urgent', ...opts })?.id).toBe('urgent')
  })
})
