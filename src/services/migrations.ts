import { STORAGE_KEYS, isStorageAvailable, readItem, writeItem } from './storageService'

/** Bump this when the shape of stored data changes, and add a migration below. */
export const CURRENT_SCHEMA_VERSION = 1

/**
 * Each migration upgrades stored data from the previous version to its own
 * number (for example, `1` upgrades from version 0 to version 1). Migrations
 * must only touch this app's own keys.
 */
const MIGRATIONS: Record<number, () => void> = {
  // Version 1: data saved before versioning existed already has the version-1 shape.
  1: () => {},
}

export type MigrationStatus =
  | { status: 'unavailable' }
  | { status: 'current'; version: number }
  | { status: 'migrated'; from: number; to: number }
  | { status: 'newer'; version: number }
  | { status: 'failed'; from: number }

function isVersionRecord(value: unknown): value is { version: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { version?: unknown }).version === 'number' &&
    Number.isInteger((value as { version: number }).version) &&
    (value as { version: number }).version >= 0
  )
}

/**
 * Brings stored data up to the current schema version. Missing or damaged
 * version records count as version 0 (a brand-new or pre-versioning install).
 */
export function migrateStorage(): MigrationStatus {
  if (!isStorageAvailable()) return { status: 'unavailable' }

  const stored = readItem(STORAGE_KEYS.version, isVersionRecord)
  const from = stored.ok ? stored.value.version : 0

  // Data written by a newer version of the app: leave it alone.
  if (from > CURRENT_SCHEMA_VERSION) return { status: 'newer', version: from }
  if (from === CURRENT_SCHEMA_VERSION) return { status: 'current', version: from }

  for (let version = from + 1; version <= CURRENT_SCHEMA_VERSION; version++) {
    try {
      MIGRATIONS[version]?.()
    } catch {
      return { status: 'failed', from: version - 1 }
    }
    if (!writeItem(STORAGE_KEYS.version, { version }).ok)
      return { status: 'failed', from: version - 1 }
  }
  return { status: 'migrated', from, to: CURRENT_SCHEMA_VERSION }
}
