import { afterEach, describe, expect, it, vi } from 'vitest'
import { blockStorage } from '../test/storageHelpers'
import { CURRENT_SCHEMA_VERSION, migrateStorage } from './migrations'
import { STORAGE_KEYS } from './storageService'

afterEach(() => vi.restoreAllMocks())

const storedVersion = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.version) ?? 'null')

describe('migrateStorage', () => {
  it('stamps the version on a fresh install', () => {
    const result = migrateStorage()
    expect(result).toEqual({ status: 'migrated', from: 0, to: CURRENT_SCHEMA_VERSION })
    expect(storedVersion()).toEqual({ version: CURRENT_SCHEMA_VERSION })
  })

  it('upgrades data saved before versioning and keeps it', () => {
    localStorage.setItem(STORAGE_KEYS.attempts, '[]')
    localStorage.setItem('someOtherApp.theme', 'dark')
    expect(migrateStorage().status).toBe('migrated')
    expect(storedVersion()).toEqual({ version: CURRENT_SCHEMA_VERSION })
    expect(localStorage.getItem(STORAGE_KEYS.attempts)).toBe('[]')
    expect(localStorage.getItem('someOtherApp.theme')).toBe('dark')
  })

  it('does nothing when the data is already current', () => {
    localStorage.setItem(STORAGE_KEYS.version, JSON.stringify({ version: CURRENT_SCHEMA_VERSION }))
    expect(migrateStorage()).toEqual({ status: 'current', version: CURRENT_SCHEMA_VERSION })
  })

  it('treats a damaged version record as version 0', () => {
    localStorage.setItem(STORAGE_KEYS.version, 'garbage')
    expect(migrateStorage().status).toBe('migrated')
    expect(storedVersion()).toEqual({ version: CURRENT_SCHEMA_VERSION })
  })

  it('leaves data from a newer version of the app untouched', () => {
    localStorage.setItem(STORAGE_KEYS.version, JSON.stringify({ version: 99 }))
    localStorage.setItem(STORAGE_KEYS.attempts, '[1]')
    expect(migrateStorage()).toEqual({ status: 'newer', version: 99 })
    expect(storedVersion()).toEqual({ version: 99 })
    expect(localStorage.getItem(STORAGE_KEYS.attempts)).toBe('[1]')
  })

  it('reports unavailable storage', () => {
    blockStorage()
    expect(migrateStorage()).toEqual({ status: 'unavailable' })
  })
})
