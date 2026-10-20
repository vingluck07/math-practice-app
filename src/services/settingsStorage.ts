import type { AppSettings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'
import { sanitizeSettings } from '../utils/storageValidation'
import { STORAGE_KEYS, readItem, writeItem, type WriteResult } from './storageService'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Loads saved settings. Missing or damaged data falls back to the defaults, field by field. */
export function loadSettings(): AppSettings {
  const stored = readItem(STORAGE_KEYS.settings, isObject)
  return stored.ok ? sanitizeSettings(stored.value) : sanitizeSettings(DEFAULT_SETTINGS)
}

export function saveSettings(settings: AppSettings): WriteResult {
  return writeItem(STORAGE_KEYS.settings, settings)
}
