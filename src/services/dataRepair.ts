import type { MistakePattern } from '../types/mistake'
import {
  isStoredActiveSession,
  isStoredAttempt,
  isStoredMistakePattern,
  isStoredSession,
  isStoredStatistics,
} from '../utils/storageValidation'
import { logDevWarning } from '../utils/logger'
import { buildStatistics } from './statisticsService'
import { STORAGE_KEYS, readItem, removeItem, writeItem } from './storageService'

export type RepairedSection =
  'settings' | 'sessions' | 'attempts' | 'mistakePatterns' | 'statistics' | 'activeSession'

export interface RepairReport {
  /** The sections that held damaged data and were fixed (only those sections). */
  repaired: RepairedSection[]
  /** True if a fix could not be saved. */
  failed: boolean
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Checks each saved section on its own and repairs only the one that is damaged:
 * lists drop their bad entries, other sections are removed (settings fall back to
 * defaults, statistics are rebuilt from attempts). Healthy sections are never touched.
 */
export function repairStoredData(): RepairReport {
  const report: RepairReport = { repaired: [], failed: false }

  function done(section: RepairedSection, ok: boolean, detail: string) {
    report.repaired.push(section)
    if (!ok) report.failed = true
    logDevWarning(`Repaired saved ${section}: ${detail}`)
  }

  function repairList<T>(
    section: 'sessions' | 'attempts' | 'mistakePatterns',
    isItem: (value: unknown) => value is T,
  ): T[] {
    const key = STORAGE_KEYS[section]
    const stored = readItem(key, Array.isArray)
    if (!stored.ok) {
      if (stored.reason === 'invalid') done(section, removeItem(key), 'not a list, removed')
      return []
    }
    const all = stored.value as unknown[]
    const valid = all.filter(isItem)
    if (valid.length !== all.length) {
      done(section, writeItem(key, valid).ok, `dropped ${all.length - valid.length} bad entries`)
    }
    return valid
  }

  const settings = readItem(STORAGE_KEYS.settings, isObject)
  if (!settings.ok && settings.reason === 'invalid') {
    done('settings', removeItem(STORAGE_KEYS.settings), 'reset to defaults')
  }

  repairList('sessions', isStoredSession)
  const attempts = repairList('attempts', isStoredAttempt)
  repairList<MistakePattern>('mistakePatterns', isStoredMistakePattern)

  const statistics = readItem(STORAGE_KEYS.statistics, isStoredStatistics)
  if (!statistics.ok && statistics.reason === 'invalid') {
    const ok = writeItem(STORAGE_KEYS.statistics, buildStatistics(attempts)).ok
    done('statistics', ok, 'rebuilt from saved attempts')
  }

  const active = readItem(STORAGE_KEYS.activeSession, isStoredActiveSession)
  if (!active.ok && active.reason === 'invalid') {
    done('activeSession', removeItem(STORAGE_KEYS.activeSession), 'removed')
  }

  return report
}
