import { randomInt, type Rng } from './math'

/** Returns a new array with the items in random order (Fisher–Yates). The input is not changed. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i, rng)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
