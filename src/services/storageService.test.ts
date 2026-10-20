import { afterEach, describe, expect, it, vi } from 'vitest'
import { blockStorage, fillStorage } from '../test/storageHelpers'
import {
  STORAGE_KEYS,
  clearAppData,
  hasAppData,
  isStorageAvailable,
  readItem,
  removeItem,
  writeItem,
} from './storageService'

const isNumberArray = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((n) => typeof n === 'number')

afterEach(() => vi.restoreAllMocks())

describe('writeItem and readItem', () => {
  it('round-trips data', () => {
    expect(writeItem('mathPractice.test', [1, 2, 3])).toEqual({ ok: true })
    expect(readItem('mathPractice.test', isNumberArray)).toEqual({ ok: true, value: [1, 2, 3] })
  })

  it('reports missing data', () => {
    expect(readItem('mathPractice.nothing', isNumberArray)).toEqual({
      ok: false,
      reason: 'missing',
    })
  })

  it('reports data that is not valid JSON', () => {
    localStorage.setItem('mathPractice.test', '{not json')
    expect(readItem('mathPractice.test', isNumberArray)).toEqual({ ok: false, reason: 'invalid' })
  })

  it('reports data with the wrong shape', () => {
    localStorage.setItem('mathPractice.test', JSON.stringify({ a: 1 }))
    expect(readItem('mathPractice.test', isNumberArray)).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('when storage is unavailable', () => {
  it('never throws and reports "unavailable"', () => {
    blockStorage()
    expect(isStorageAvailable()).toBe(false)
    expect(writeItem('mathPractice.test', 1)).toEqual({ ok: false, reason: 'unavailable' })
    expect(readItem('mathPractice.test', isNumberArray)).toEqual({
      ok: false,
      reason: 'unavailable',
    })
    expect(removeItem('mathPractice.test')).toBe(false)
    expect(clearAppData()).toBe(false)
    expect(hasAppData()).toBe(false)
  })

  it('is detected when writes are refused', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('nope')
    })
    expect(isStorageAvailable()).toBe(false)
  })
})

describe('when storage is full', () => {
  it('reports "quota-exceeded"', () => {
    fillStorage()
    expect(writeItem('mathPractice.test', 'x')).toEqual({ ok: false, reason: 'quota-exceeded' })
  })

  it('reports other write errors as "unknown"', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('something else')
    })
    expect(writeItem('mathPractice.test', 'x')).toEqual({ ok: false, reason: 'unknown' })
  })
})

describe('clearing data', () => {
  it('removes only this app’s keys', () => {
    writeItem(STORAGE_KEYS.settings, {})
    writeItem(STORAGE_KEYS.attempts, [])
    localStorage.setItem('someOtherApp.theme', 'dark')
    expect(hasAppData()).toBe(true)

    expect(clearAppData()).toBe(true)
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.attempts)).toBeNull()
    expect(localStorage.getItem('someOtherApp.theme')).toBe('dark')
    expect(hasAppData()).toBe(false)
  })

  it('removes a single item', () => {
    writeItem('mathPractice.test', 1)
    expect(removeItem('mathPractice.test')).toBe(true)
    expect(localStorage.getItem('mathPractice.test')).toBeNull()
  })
})
