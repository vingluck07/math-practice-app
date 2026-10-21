import { beforeEach, describe, expect, it } from 'vitest'
import { repairStoredData } from './dataRepair'
import { STORAGE_KEYS } from './storageService'

describe('repairStoredData', () => {
  beforeEach(() => localStorage.clear())

  it('does nothing when there is no saved data', () => {
    expect(repairStoredData()).toEqual({ repaired: [], failed: false })
  })

  it('repairs only the damaged section', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '{"defaultDifficulty":2}')
    localStorage.setItem(STORAGE_KEYS.attempts, 'not json')
    localStorage.setItem(STORAGE_KEYS.sessions, '[{"bad":true}]')
    localStorage.setItem(STORAGE_KEYS.statistics, '{"oops":1}')
    localStorage.setItem(STORAGE_KEYS.activeSession, '"junk"')
    localStorage.setItem(STORAGE_KEYS.mistakePatterns, '[]')

    const report = repairStoredData()
    expect(report.failed).toBe(false)
    expect(report.repaired.sort()).toEqual(
      ['activeSession', 'attempts', 'sessions', 'statistics'].sort(),
    )
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBe('{"defaultDifficulty":2}')
    expect(localStorage.getItem(STORAGE_KEYS.attempts)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBe('[]')
    expect(localStorage.getItem(STORAGE_KEYS.activeSession)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.statistics) as string)).toHaveProperty(
      'attempted',
    )
  })

  it('resets damaged settings without touching other sections', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '[1,2]')
    localStorage.setItem(STORAGE_KEYS.sessions, '[]')
    expect(repairStoredData().repaired).toEqual(['settings'])
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBe('[]')
  })
})
