/**
 * A careful wrapper around `localStorage`. It never throws: every call reports
 * success or failure so the app can keep running when storage is blocked,
 * full, or holds damaged data.
 */

export const STORAGE_PREFIX = 'mathPractice.'

export const STORAGE_KEYS = {
  settings: `${STORAGE_PREFIX}settings`,
  sessions: `${STORAGE_PREFIX}sessions`,
  attempts: `${STORAGE_PREFIX}attempts`,
  mistakePatterns: `${STORAGE_PREFIX}mistakePatterns`,
  statistics: `${STORAGE_PREFIX}statistics`,
  activeSession: `${STORAGE_PREFIX}activeSession`,
  version: `${STORAGE_PREFIX}version`,
} as const

export type StorageFailure = 'unavailable' | 'quota-exceeded' | 'unknown'

export type WriteResult = { ok: true } | { ok: false; reason: StorageFailure }

export type ReadResult<T> =
  { ok: true; value: T } | { ok: false; reason: 'missing' | 'invalid' | 'unavailable' }

/** The browser's storage, or null when it is blocked or missing (for example in private mode). */
function getStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function isStorageAvailable(): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    const probe = `${STORAGE_PREFIX}probe`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  )
}

/** Reads and parses one item, accepting it only if `validate` approves its shape. */
export function readItem<T>(key: string, validate: (value: unknown) => value is T): ReadResult<T> {
  const storage = getStorage()
  if (!storage) return { ok: false, reason: 'unavailable' }

  let text: string | null
  try {
    text = storage.getItem(key)
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
  if (text === null) return { ok: false, reason: 'missing' }

  try {
    const value: unknown = JSON.parse(text)
    return validate(value) ? { ok: true, value } : { ok: false, reason: 'invalid' }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

export function writeItem(key: string, value: unknown): WriteResult {
  const storage = getStorage()
  if (!storage) return { ok: false, reason: 'unavailable' }
  try {
    storage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? 'quota-exceeded' : 'unknown' }
  }
}

export function removeItem(key: string): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/** Every key this app owns. Other sites' and apps' data is never touched. */
function appKeys(storage: Storage): string[] {
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
  }
  return keys
}

export function hasAppData(): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    return appKeys(storage).some((key) => key !== STORAGE_KEYS.version)
  } catch {
    return false
  }
}

/** Removes only this app's keys. Returns false if anything could not be removed. */
export function clearAppData(): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    appKeys(storage).forEach((key) => storage.removeItem(key))
    return true
  } catch {
    return false
  }
}

/** What this app has saved: characters used (about two bytes each) and a rough browser limit. */
export interface StorageUsage {
  usedCharacters: number
  /** Browsers typically allow about 5 million characters per site. */
  approximateLimit: number
}

export const APPROXIMATE_STORAGE_LIMIT = 5_000_000

/** Measures only this app's keys (names and values). Returns zero when storage is unavailable. */
export function getStorageUsage(): StorageUsage {
  const storage = getStorage()
  let used = 0
  if (storage) {
    try {
      for (const key of appKeys(storage)) used += key.length + (storage.getItem(key)?.length ?? 0)
    } catch {
      used = 0
    }
  }
  return { usedCharacters: used, approximateLimit: APPROXIMATE_STORAGE_LIMIT }
}
