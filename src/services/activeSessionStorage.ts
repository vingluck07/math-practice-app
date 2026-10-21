import type { ActiveSessionRecord } from '../types/session'
import { isStoredActiveSession } from '../utils/storageValidation'
import { STORAGE_KEYS, readItem, removeItem, writeItem, type WriteResult } from './storageService'

/** A saved session older than this is too stale to offer again. */
export const ACTIVE_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function saveActiveSession(record: Omit<ActiveSessionRecord, 'savedAt'>): WriteResult {
  return writeItem(STORAGE_KEYS.activeSession, { ...record, savedAt: new Date().toISOString() })
}

/**
 * The saved in-progress session, or null when there is none. A damaged or stale
 * one is removed (only this one section; nothing else is touched).
 */
export function loadActiveSession(now: Date = new Date()): ActiveSessionRecord | null {
  const stored = readItem(STORAGE_KEYS.activeSession, isStoredActiveSession)
  if (!stored.ok) {
    if (stored.reason === 'invalid') removeItem(STORAGE_KEYS.activeSession)
    return null
  }
  if (now.getTime() - Date.parse(stored.value.savedAt) > ACTIVE_SESSION_MAX_AGE_MS) {
    removeItem(STORAGE_KEYS.activeSession)
    return null
  }
  return stored.value
}

export function clearActiveSession(): boolean {
  return removeItem(STORAGE_KEYS.activeSession)
}
