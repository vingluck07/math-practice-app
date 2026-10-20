import { useRef, useState } from 'react'
import { useStorageStatus } from '../app/storageStatusContext'
import { generateNextQuestion, generateRandomQuestion } from '../services/questionGenerator'
import { saveProgress } from '../services/practiceStorage'
import {
  advance,
  endSession,
  hasRecordedCurrentQuestion,
  isLastQuestion,
  recordResult as applyResult,
  startSession,
} from '../services/practiceSession'
import type { PracticeConfig, PracticeSessionState } from '../types/session'

function createSession(config: PracticeConfig): PracticeSessionState | null {
  try {
    return startSession(config, generateRandomQuestion(config.operations, config.difficulty))
  } catch {
    return null
  }
}

/** Runs one practice session: the current question, recorded attempts and progress. */
export function usePracticeSession(config: PracticeConfig) {
  const [state, setState] = useState(() => createSession(config))
  const [nextFailed, setNextFailed] = useState(false)
  const { reportStorageProblem } = useStorageStatus()

  // Always holds the latest state, so two quick events can never both act on stale data.
  const latest = useRef(state)

  /** Saves what changed (a failure shows a friendly warning, but practice carries on). */
  function commit(next: PracticeSessionState) {
    const previous = latest.current
    if (!previous || next === previous) return
    if (!saveProgress(previous, next).ok) reportStorageProblem()
    latest.current = next
    setState(next)
  }

  return {
    state,
    /** True when a question could not be generated. */
    failed: state === null || nextFailed,
    isLastQuestion: state !== null && isLastQuestion(state),
    hasRecordedCurrent: state !== null && hasRecordedCurrentQuestion(state),

    recordResult(feltConfident: boolean, selectedAnswer: number) {
      if (latest.current) commit(applyResult(latest.current, feltConfident, selectedAnswer))
    },

    /** Shows the next question, or ends the session after the last one. */
    next() {
      const current = latest.current
      if (!current) return
      try {
        const nextQuestion = isLastQuestion(current)
          ? null
          : generateNextQuestion(config.operations, config.difficulty, current.currentQuestion)
        commit(advance(current, nextQuestion))
      } catch {
        setNextFailed(true)
      }
    },

    end() {
      if (latest.current) commit(endSession(latest.current))
    },
  }
}
