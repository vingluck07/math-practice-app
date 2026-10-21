import type { MistakePattern } from '../types/mistake'
import { DEFAULT_MASTERY_THRESHOLD } from '../utils/practiceConfig'
import type { Rng } from '../utils/math'

const DAY_MS = 24 * 60 * 60 * 1000

/** Misses beyond this many no longer raise the priority further. */
const MAX_COUNTED_MISSES = 5

export interface PriorityOptions {
  now?: Date
  /** Correct similar questions needed for mastery. */
  threshold?: number
}

/**
 * How much a mistake needs review, from 0 up to 3. Three equal parts:
 * missed often (more misses), missed recently (fades over weeks), and little
 * successful review so far (fewer correct similar questions).
 */
export function reviewPriority(
  pattern: MistakePattern,
  { now = new Date(), threshold = DEFAULT_MASTERY_THRESHOLD }: PriorityOptions = {},
): number {
  const frequency = Math.min(pattern.incorrectCount, MAX_COUNTED_MISSES) / MAX_COUNTED_MISSES
  const daysSince = Math.max(0, (now.getTime() - Date.parse(pattern.lastIncorrectAt)) / DAY_MS)
  const recency = 1 / (1 + daysSince / 7)
  const progress = Math.min(pattern.similarCorrectCount, threshold) / threshold
  return frequency + recency + (1 - progress)
}

export interface SelectOptions extends PriorityOptions {
  rng?: Rng
  /** The pattern used for the previous question; skipped when there is another choice. */
  avoidId?: string
}

/**
 * Picks the next mistake to practice from the ones not yet mastered. Higher priority
 * means a better chance, but the choice is random, so patterns with similar priority
 * take turns and several different mistakes mix within one session.
 * Returns null when nothing needs review.
 */
export function selectMistakePattern(
  patterns: readonly MistakePattern[],
  { rng = Math.random, avoidId, ...priorityOptions }: SelectOptions = {},
): MistakePattern | null {
  const active = patterns.filter((p) => !p.mastered)
  const pool = active.length > 1 ? active.filter((p) => p.id !== avoidId) : active
  if (pool.length === 0) return null

  const weights = pool.map((p) => reviewPriority(p, priorityOptions))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let point = rng() * total
  for (let i = 0; i < pool.length; i++) {
    point -= weights[i]
    if (point < 0) return pool[i]
  }
  return pool[pool.length - 1]
}
