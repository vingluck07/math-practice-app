import { describe, expect, it } from 'vitest'
import { formatUsage } from './formatUsage'

describe('formatUsage', () => {
  it('is friendly for small and large amounts', () => {
    expect(formatUsage(12)).toBe('under 1 KB')
    expect(formatUsage(2_400)).toBe('2 KB')
    expect(formatUsage(5_000_000)).toBe('5,000 KB')
  })
})
