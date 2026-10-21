import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { migrateStorage } from '../services/migrations'
import { clearAppData } from '../services/storageService'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'
import { loadSettings, saveSettings } from '../services/settingsStorage'
import type { AppSettings } from '../types/settings'
import { SettingsContext } from './settingsContext'
import { StorageStatusContext } from './storageStatusContext'

/** Runs once at startup: upgrades stored data, then loads the saved settings. */
function startUp(): { settings: AppSettings; storageProblem: boolean } {
  const migration = migrateStorage()
  return {
    settings: loadSettings(),
    storageProblem: migration.status === 'unavailable' || migration.status === 'failed',
  }
}

/** Holds app-wide state: settings (saved in the browser) and whether saving is working. */
export default function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(startUp)
  const [settings, setSettings] = useState<AppSettings>(initial.settings)
  const [hasStorageProblem, setHasStorageProblem] = useState(initial.storageProblem)
  const latestSettings = useRef(initial.settings)

  /** Applies and saves a settings change. A failed save shows a warning but changes still apply. */
  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    const next = { ...latestSettings.current, ...changes }
    latestSettings.current = next
    setSettings(next)
    if (!saveSettings(next).ok) setHasStorageProblem(true)
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

  const reportStorageProblem = useCallback(() => setHasStorageProblem(true), [])
  const dismissStorageProblem = useCallback(() => setHasStorageProblem(false), [])
  const storageValue = useMemo(
    () => ({ hasStorageProblem, reportStorageProblem, dismissStorageProblem }),
    [hasStorageProblem, reportStorageProblem, dismissStorageProblem],
  )

  return (
    <StorageStatusContext.Provider value={storageValue}>
      <SettingsContext.Provider value={settingsValue}>{children}</SettingsContext.Provider>
    </StorageStatusContext.Provider>
  )
}
