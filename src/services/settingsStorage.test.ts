import { afterEach, describe, expect, it, vi } from 'vitest'
import { blockStorage } from '../test/storageHelpers'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'
import { loadSettings, saveSettings } from './settingsStorage'
import { STORAGE_KEYS } from './storageService'

afterEach(() => vi.restoreAllMocks())

describe('settings storage', () => {
  it('uses the defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loads what was saved', () => {
    const custom = {
      ...DEFAULT_SETTINGS,
      cardAnimationEnabled: false,
      defaultSessionLength: 'continuous' as const,
      defaultDifficulty: 3 as const,
      defaultOperations: ['division' as const, 'addition' as const],
      masteryThreshold: 5,
    }
    expect(saveSettings(custom)).toEqual({ ok: true })
    expect(loadSettings()).toEqual(custom)
  })

  it('falls back to the defaults for damaged JSON', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '{oops')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('falls back to the defaults when the saved data is not an object', () => {
    localStorage.setItem(STORAGE_KEYS.settings, '[1,2]')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and replaces invalid ones', () => {
    localStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({
        cardAnimationEnabled: false,
        soundEffectsEnabled: 'yes',
        defaultDifficulty: 9,
        defaultOperations: ['power'],
        defaultSessionLength: 20,
        masteryThreshold: -2,
      }),
    )
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      cardAnimationEnabled: false,
      defaultSessionLength: 20,
    })
  })

  it('does not throw when storage is unavailable', () => {
    blockStorage()
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(saveSettings(DEFAULT_SETTINGS)).toEqual({ ok: false, reason: 'unavailable' })
  })
})
