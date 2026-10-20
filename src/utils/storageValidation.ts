import type { AppSettings } from '../types/settings'
import type { AppStatistics } from '../types/statistics'
import type { PracticeAttempt, PracticeSession } from '../types/session'
import { DEFAULT_SETTINGS } from './defaultSettings'
import { DIFFICULTY_LEVELS, OPERATIONS, isDifficultyLevel, isMathOperation } from './validation'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isTimestamp = (v: unknown): v is string => isString(v) && !Number.isNaN(Date.parse(v))

function isSessionLength(v: unknown): boolean {
  return v === 'continuous' || (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 1000)
}

export function isStoredAttempt(value: unknown): value is PracticeAttempt {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.questionId) &&
    isMathOperation(value.operation) &&
    isFiniteNumber(value.firstOperand) &&
    isFiniteNumber(value.secondOperand) &&
    isFiniteNumber(value.correctAnswer) &&
    isFiniteNumber(value.selectedAnswer) &&
    typeof value.selfReportedCorrect === 'boolean' &&
    isDifficultyLevel(value.difficulty) &&
    (value.source === 'regular' || value.source === 'mistake-review') &&
    isTimestamp(value.attemptedAt) &&
    isString(value.sessionId)
  )
}

export function isStoredSession(value: unknown): value is PracticeSession {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isTimestamp(value.startedAt) &&
    (value.completedAt === undefined || isTimestamp(value.completedAt)) &&
    Array.isArray(value.operations) &&
    value.operations.length > 0 &&
    value.operations.every(isMathOperation) &&
    isDifficultyLevel(value.difficulty) &&
    isSessionLength(value.sessionLength) &&
    isCount(value.attempted) &&
    isCount(value.correct) &&
    isCount(value.incorrect)
  )
}

function isCounts(value: unknown): boolean {
  return (
    isRecord(value) &&
    isCount(value.attempted) &&
    isCount(value.correct) &&
    isCount(value.incorrect) &&
    value.attempted === (value.correct as number) + (value.incorrect as number)
  )
}

/** Checks saved statistics: every group present, counts whole numbers, totals adding up. */
export function isStoredStatistics(value: unknown): value is AppStatistics {
  if (!isRecord(value) || !isCounts(value)) return false
  const { byOperation, byDifficulty } = value
  return (
    isRecord(byOperation) &&
    isRecord(byDifficulty) &&
    OPERATIONS.every((o) => isCounts(byOperation[o])) &&
    DIFFICULTY_LEVELS.every((d) => isCounts(byDifficulty[d]))
  )
}

/**
 * Builds usable settings from whatever was stored: every valid field is kept and
 * every missing or invalid field falls back to its default.
 */
export function sanitizeSettings(raw: unknown): AppSettings {
  const d = DEFAULT_SETTINGS
  if (!isRecord(raw)) return { ...d, defaultOperations: [...d.defaultOperations] }

  const operations =
    Array.isArray(raw.defaultOperations) &&
    raw.defaultOperations.length > 0 &&
    raw.defaultOperations.every(isMathOperation)
      ? [...new Set(raw.defaultOperations)]
      : [...d.defaultOperations]

  return {
    soundEffectsEnabled:
      typeof raw.soundEffectsEnabled === 'boolean'
        ? raw.soundEffectsEnabled
        : d.soundEffectsEnabled,
    cardAnimationEnabled:
      typeof raw.cardAnimationEnabled === 'boolean'
        ? raw.cardAnimationEnabled
        : d.cardAnimationEnabled,
    showExplanations:
      typeof raw.showExplanations === 'boolean' ? raw.showExplanations : d.showExplanations,
    defaultSessionLength: isSessionLength(raw.defaultSessionLength)
      ? (raw.defaultSessionLength as AppSettings['defaultSessionLength'])
      : d.defaultSessionLength,
    defaultDifficulty: isDifficultyLevel(raw.defaultDifficulty)
      ? raw.defaultDifficulty
      : d.defaultDifficulty,
    defaultOperations: operations,
    masteryThreshold:
      typeof raw.masteryThreshold === 'number' &&
      Number.isInteger(raw.masteryThreshold) &&
      raw.masteryThreshold >= 1 &&
      raw.masteryThreshold <= 20
        ? raw.masteryThreshold
        : d.masteryThreshold,
  }
}
