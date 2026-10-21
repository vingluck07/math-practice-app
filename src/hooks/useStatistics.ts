import { useState } from 'react'
import { useStorageStatus } from '../app/storageStatusContext'
import { buildMistakeStatistics, sortByIncorrectCount } from '../services/mistakeStatistics'
import {
  clearPracticeHistory,
  loadAttempts,
  loadMistakePatterns,
  loadSessions,
  loadStatistics,
} from '../services/practiceStorage'
import { recentSessionSummaries } from '../services/statisticsService'

function load() {
  const patterns = loadMistakePatterns()
  return {
    statistics: loadStatistics(),
    recentSessions: recentSessionSummaries(loadSessions()),
    mistakes: buildMistakeStatistics(patterns, loadAttempts()),
    /** Every saved mistake, most missed first. */
    patterns: sortByIncorrectCount(patterns),
  }
}

/** Saved statistics, mistake statistics and recent sessions, plus a way to erase them. */
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
