import { useState } from 'react'
import { useStorageStatus } from '../app/storageStatusContext'
import { clearPracticeHistory, loadSessions, loadStatistics } from '../services/practiceStorage'
import { recentSessionSummaries } from '../services/statisticsService'

function load() {
  return {
    statistics: loadStatistics(),
    recentSessions: recentSessionSummaries(loadSessions()),
  }
}

/** Saved statistics and recent sessions, plus a way to erase them. */
export function useStatistics() {
  const [data, setData] = useState(load)
  const { reportStorageProblem } = useStorageStatus()

  return {
    ...data,
    /** Erases all practice history and statistics (settings stay), then reloads. */
    reset() {
      if (!clearPracticeHistory()) reportStorageProblem()
      setData(load())
    },
  }
}
