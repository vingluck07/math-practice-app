import type { PracticeAttempt, PracticeSession, PracticeSessionState } from '../types/session'
import { isStoredAttempt, isStoredSession } from '../utils/storageValidation'
import { STORAGE_KEYS, readItem, writeItem, type WriteResult } from './storageService'

/** Older records beyond these limits are dropped so storage never fills up. */
export const MAX_STORED_SESSIONS = 100
export const MAX_STORED_ATTEMPTS = 5000

/** When the browser reports it is full, this fraction of the oldest records is dropped once. */
const QUOTA_TRIM_FRACTION = 0.2

function readList<T>(key: string, isItem: (value: unknown) => value is T): T[] {
  const stored = readItem(key, Array.isArray)
  return stored.ok ? (stored.value as unknown[]).filter(isItem) : []
}

function writeList<T>(key: string, items: T[], max: number): WriteResult {
  let list = items.slice(-max)
  let result = writeItem(key, list)
  if (!result.ok && result.reason === 'quota-exceeded') {
    list = list.slice(Math.ceil(list.length * QUOTA_TRIM_FRACTION))
    result = writeItem(key, list)
  }
  return result
}

/** Saves a session, replacing any earlier copy with the same ID. */
export function saveSession(session: PracticeSession): WriteResult {
  const sessions = readList(STORAGE_KEYS.sessions, isStoredSession)
  const index = sessions.findIndex((s) => s.id === session.id)
  if (index >= 0) sessions[index] = session
  else sessions.push(session)
  return writeList(STORAGE_KEYS.sessions, sessions, MAX_STORED_SESSIONS)
}

/** Loads sessions, newest first. Damaged entries are skipped. */
export function loadSessions(limit: number = MAX_STORED_SESSIONS): PracticeSession[] {
  return readList(STORAGE_KEYS.sessions, isStoredSession)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .slice(0, limit)
}

/** Saves one completed attempt (ignored if an attempt with that ID is already stored). */
export function saveAttempt(attempt: PracticeAttempt): WriteResult {
  const attempts = readList(STORAGE_KEYS.attempts, isStoredAttempt)
  if (!attempts.some((a) => a.id === attempt.id)) attempts.push(attempt)
  return writeList(STORAGE_KEYS.attempts, attempts, MAX_STORED_ATTEMPTS)
}

/** Loads attempts in the order they were made. Damaged entries are skipped. */
export function loadAttempts(): PracticeAttempt[] {
  return readList(STORAGE_KEYS.attempts, isStoredAttempt)
}

/**
 * Saves whatever changed between two states of a session: a newly recorded
 * attempt, and the session's updated totals or completion time.
 */
export function saveProgress(
  previous: PracticeSessionState,
  next: PracticeSessionState,
): WriteResult {
  let result: WriteResult = { ok: true }
  if (next.attempts.length > previous.attempts.length) {
    result = saveAttempt(next.attempts[next.attempts.length - 1])
  }
  if (next.session !== previous.session) {
    const sessionResult = saveSession(next.session)
    if (result.ok) result = sessionResult
  }
  return result
}
