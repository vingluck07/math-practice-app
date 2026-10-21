import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { migrateStorage } from '../services/migrations'
import { clearAppData, type StorageFailure } from '../services/storageService'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'
import { repairStoredData } from '../services/dataRepair'
import { loadSettings, saveSettings } from '../services/settingsStorage'
import type { AppSettings } from '../types/settings'
import { SettingsContext } from './settingsContext'
import { StorageStatusContext } from './storageStatusContext'

/** Runs once at startup: upgrades stored data, then loads the saved settings. */
function startUp(): {
  settings: AppSettings
  storageProblem: boolean
  reason: StorageFailure | null
} {
  const migration = migrateStorage()
  const repair = repairStoredData()
  return {
    settings: loadSettings(),
    storageProblem:
      migration.status === 'unavailable' || migration.status === 'failed' || repair.failed,
    reason: migration.status === 'unavailable' ? 'unavailable' : null,
  }
}

/** Holds app-wide state: settings (saved in the browser) and whether saving is working. */
export default function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(startUp)
  const [settings, setSettings] = useState<AppSettings>(initial.settings)
  const [hasStorageProblem, setHasStorageProblem] = useState(initial.storageProblem)
  const [reason, setReason] = useState<StorageFailure | null>(initial.reason)
  const latestSettings = useRef(initial.settings)

  /** Applies and saves a settings change. A failed save shows a warning but changes still apply. */
  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    const next = { ...latestSettings.current, ...changes }
    latestSettings.current = next
    setSettings(next)
    const result = saveSettings(next)
    if (!result.ok) {
      setHasStorageProblem(true)
      setReason(result.reason)
    }
  }, [])

  /** Erases all saved data, restores default settings and stamps a fresh schema version. */
  const clearAllData = useCallback(() => {
    const cleared = clearAppData()
    latestSettings.current = DEFAULT_SETTINGS
    setSettings(DEFAULT_SETTINGS)
    migrateStorage()
    if (!cleared) setHasStorageProblem(true)
    return cleared
  }, [])

  const settingsValue = useMemo(
    () => ({ settings, updateSettings, clearAllData }),
    [settings, updateSettings, clearAllData],
  )

  const reportStorageProblem = useCallback((why?: StorageFailure) => {
    setHasStorageProblem(true)
    setReason(why ?? null)
  }, [])
  const dismissStorageProblem = useCallback(() => setHasStorageProblem(false), [])
  const storageValue = useMemo(
    () => ({
      hasStorageProblem,
      storageProblemReason: reason,
      reportStorageProblem,
      dismissStorageProblem,
    }),
    [hasStorageProblem, reason, reportStorageProblem, dismissStorageProblem],
  )

  return (
    <StorageStatusContext.Provider value={storageValue}>
      <SettingsContext.Provider value={settingsValue}>{children}</SettingsContext.Provider>
    </StorageStatusContext.Provider>
  )
}
