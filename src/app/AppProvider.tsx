import { useMemo, useState, type ReactNode } from 'react'
import type { AppSettings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../utils/defaultSettings'
import { SettingsContext } from './settingsContext'

/** Holds app-wide state. Settings are kept in memory for now; saving them comes in Phase 9. */
export default function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  const value = useMemo(
    () => ({
      settings,
      updateSettings: (changes: Partial<AppSettings>) =>
        setSettings((current) => ({ ...current, ...changes })),
    }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
