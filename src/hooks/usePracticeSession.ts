import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../app/settingsContext'
import { useStorageStatus } from '../app/storageStatusContext'
import { clearActiveSession, saveActiveSession } from '../services/activeSessionStorage'
import { generateNextQuestion, generateRandomQuestion } from '../services/questionGenerator'
import { loadMistakePatterns, saveProgress } from '../services/practiceStorage'
import { generateReviewQuestion, reviewSessionConfig } from '../services/reviewQuestions'
import {
  advance,
  endSession,
  hasRecordedCurrentQuestion,
  isLastQuestion,
  recordResult as applyResult,
  startSession,
} from '../services/practiceSession'
import type { Question } from '../types/question'
import type { ActiveSessionRecord, PracticeConfig, PracticeSessionState } from '../types/session'

function createSession(config: PracticeConfig, threshold: number): PracticeSessionState | null {
  try {
    if (config.mode === 'mistake-review') {
      const patterns = loadMistakePatterns()
      const first = generateReviewQuestion(patterns, undefined, { threshold })
      return first ? startSession(reviewSessionConfig(patterns, config, first), first) : null
    }
    return startSession(config, generateRandomQuestion(config.operations, config.difficulty))
  } catch {
    return null
  }
}

/** The next question after one that was recorded (or null when the session is over). */
function nextQuestionFor(
  state: PracticeSessionState,
  config: PracticeConfig,
  threshold: number,
): Question | null {
  if (isLastQuestion(state)) return null
  return config.mode === 'mistake-review'
    ? generateReviewQuestion(loadMistakePatterns(), state.currentQuestion, { threshold })
    : generateNextQuestion(config.operations, config.difficulty, state.currentQuestion)
}

/**
 * Picks a saved session back up. If its current question was already answered (the
 * page was refreshed on the answer screen), moves straight on to the next one.
 */
function resumeSession(saved: ActiveSessionRecord, threshold: number): PracticeSessionState | null {
  try {
    const { state, config } = saved
    if (!hasRecordedCurrentQuestion(state)) return state
    const advanced = advance(state, nextQuestionFor(state, config, threshold))
    saveProgress(state, advanced, threshold)
    return advanced
  } catch {
    return null
  }
}

/**
 * Runs one practice session: the current question, recorded attempts and progress.
 * The running session is saved after every change so it survives a page refresh;
 * pass `resumeFrom` to continue a saved one.
 */
export function usePracticeSession(config: PracticeConfig, resumeFrom?: ActiveSessionRecord) {
  const { settings } = useSettings()
  const threshold = settings.masteryThreshold
  const [state, setState] = useState(() =>
    resumeFrom ? resumeSession(resumeFrom, threshold) : createSession(config, threshold),
  )
  const [nextFailed, setNextFailed] = useState(false)
  const { reportStorageProblem } = useStorageStatus()

  // Always holds the latest state, so two quick events can never both act on stale data.
  const latest = useRef(state)
  // The answer picked on the current question, kept so a refresh can bring it back.
  const initialSelected = resumeFrom?.selectedAnswer ?? null
  const selected = useRef<number | null>(initialSelected)

  /** Saves the running session (or clears it once it is over). */
  function persist(current: PracticeSessionState) {
    if (!current.isActive) {
      clearActiveSession()
      return
    }
    const result = saveActiveSession({ config, state: current, selectedAnswer: selected.current })
    if (!result.ok) reportStorageProblem()
  }

  // A new session is saved right away; a resumed one is already saved.
  useEffect(() => {
    if (latest.current) persist(latest.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Saves what changed (a failure shows a friendly warning, but practice carries on). */
  function commit(next: PracticeSessionState) {
    const previous = latest.current
    if (!previous || next === previous) return
    if (!saveProgress(previous, next, threshold).ok) reportStorageProblem()
    if (next.currentQuestion.id !== previous.currentQuestion.id) selected.current = null
    persist(next)
    latest.current = next
    setState(next)
  }

  return {
    state,
    /** The answer to show as already picked when a saved session is resumed on this question. */
    restoredAnswerFor: (questionId: string) =>
      resumeFrom?.state.currentQuestion.id === questionId ? initialSelected : null,
    /** Remembers the picked answer (so it can be restored after a refresh). */
    selectAnswer(value: number) {
      selected.current = value
      if (latest.current?.isActive) persist(latest.current)
    },
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
        // In a review session, a null question (nothing left to review) ends the session.
        commit(advance(current, nextQuestionFor(current, config, threshold)))
      } catch {
        setNextFailed(true)
      }
    },

    end() {
      if (latest.current) commit(endSession(latest.current))
    },
  }
}
