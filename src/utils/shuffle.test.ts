import { describe, expect, it } from 'vitest'
import { seededRng } from '../test/helpers'
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('keeps exactly the same items', () => {
    const items = [1, 2, 3, 4, 5, 6]
    expect([...shuffle(items, seededRng(3))].sort()).toEqual(items)
  })

  it('does not change the original array', () => {
    const items = [1, 2, 3, 4]
    shuffle(items, seededRng(5))
    expect(items).toEqual([1, 2, 3, 4])
  })

  it('is repeatable with the same seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(shuffle(items, seededRng(9))).toEqual(shuffle(items, seededRng(9)))
  })

  it('puts an item in every position over many shuffles', () => {
    const rng = seededRng(11)
    const positions = new Set<number>()
    for (let i = 0; i < 200; i++) positions.add(shuffle(['x', 'b', 'c', 'd'], rng).indexOf('x'))
    expect(positions.size).toBe(4)
  })

  it('handles empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle([1])).toEqual([1])
  })
})
