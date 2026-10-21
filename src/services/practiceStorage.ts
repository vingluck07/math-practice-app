import type { MistakePattern } from '../types/mistake'
import type { PracticeAttempt, PracticeSession, PracticeSessionState } from '../types/session'
import type { AppStatistics } from '../types/statistics'
import {
  isStoredAttempt,
  isStoredMistakePattern,
  isStoredSession,
  isStoredStatistics,
} from '../utils/storageValidation'
import { applyAttempt } from './mistakeService'
import { DEFAULT_MASTERY_THRESHOLD } from '../utils/practiceConfig'
import { addAttemptToStatistics, buildStatistics } from './statisticsService'
import { STORAGE_KEYS, readItem, removeItem, writeItem, type WriteResult } from './storageService'

/** Older records beyond these limits are dropped so storage never fills up. */
export const MAX_STORED_SESSIONS = 100
export const MAX_STORED_ATTEMPTS = 5000
export const MAX_STORED_MISTAKE_PATTERNS = 500

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

/** Loads mistake patterns. Damaged entries are skipped. */
export function loadMistakePatterns(): MistakePattern[] {
  return readList(STORAGE_KEYS.mistakePatterns, isStoredMistakePattern)
}

export function saveMistakePatterns(patterns: MistakePattern[]): WriteResult {
  // When over the limit, the patterns that were missed longest ago are the ones dropped.
  const newest = [...patterns]
    .sort((a, b) => Date.parse(a.lastIncorrectAt) - Date.parse(b.lastIncorrectAt))
    .slice(-MAX_STORED_MISTAKE_PATTERNS)
  return writeList(STORAGE_KEYS.mistakePatterns, newest, MAX_STORED_MISTAKE_PATTERNS)
}

/**
 * Run at start-up: if the saved mistake patterns contain damaged entries, rewrites
 * the list without them so they cannot cause trouble later. Returns false if that failed.
 */
export function repairMistakePatterns(): boolean {
  const stored = readItem(STORAGE_KEYS.mistakePatterns, Array.isArray)
  if (!stored.ok) return stored.reason === 'invalid' ? saveMistakePatterns([]).ok : true
  const valid = (stored.value as unknown[]).filter(isStoredMistakePattern)
  if (valid.length === (stored.value as unknown[]).length) return true
  return saveMistakePatterns(valid).ok
}

/**
 * Updates the mistake patterns for one answered question: wrong answers create or update
 * a pattern, and mistake-review answers move their pattern toward (or away from) mastery.
 */
function recordAttemptMistake(attempt: PracticeAttempt, threshold: number): WriteResult {
  const patterns = loadMistakePatterns()
  const updated = applyAttempt(patterns, attempt, threshold)
  return updated === patterns ? { ok: true } : saveMistakePatterns(updated)
}

/**
 * Loads the running totals. If they are missing or damaged, they are rebuilt
 * from the saved attempts (nothing is written until the next attempt).
 */
export function loadStatistics(): AppStatistics {
  const stored = readItem(STORAGE_KEYS.statistics, isStoredStatistics)
  return stored.ok ? stored.value : buildStatistics(loadAttempts())
}

/**
 * Counts one newly saved attempt in the running totals. If the totals are
 * missing or damaged, they are rebuilt from the saved attempts instead (which
 * already include this one), so nothing is ever counted twice.
 */
function recordAttemptStatistics(attempt: PracticeAttempt): WriteResult {
  const stored = readItem(STORAGE_KEYS.statistics, isStoredStatistics)
  const next = stored.ok
    ? addAttemptToStatistics(stored.value, attempt)
    : buildStatistics(loadAttempts())
  return writeItem(STORAGE_KEYS.statistics, next)
}

/**
 * Erases practice history: attempts, sessions, mistake patterns and the running
 * totals. Settings are kept. Returns false if anything could not be erased.
 */
export function clearPracticeHistory(): boolean {
  return [
    STORAGE_KEYS.attempts,
    STORAGE_KEYS.sessions,
    STORAGE_KEYS.mistakePatterns,
    STORAGE_KEYS.statistics,
    STORAGE_KEYS.activeSession,
  ]
    .map(removeItem)
    .every(Boolean)
}

/**
 * Saves whatever changed between two states of a session: a newly recorded
 * attempt, and the session's updated totals or completion time.
 */
export function saveProgress(
  previous: PracticeSessionState,
  next: PracticeSessionState,
  masteryThreshold: number = DEFAULT_MASTERY_THRESHOLD,
): WriteResult {
  let result: WriteResult = { ok: true }
  if (next.attempts.length > previous.attempts.length) {
    const attempt = next.attempts[next.attempts.length - 1]
    result = saveAttempt(attempt)
    if (result.ok) result = recordAttemptStatistics(attempt)
    const mistakeResult = recordAttemptMistake(attempt, masteryThreshold)
    if (result.ok) result = mistakeResult
  }
  if (next.session !== previous.session) {
    const sessionResult = saveSession(next.session)
    if (result.ok) result = sessionResult
  }
  return result
}
