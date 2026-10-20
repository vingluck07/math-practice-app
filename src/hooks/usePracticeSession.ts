import { useState } from 'react'
import { generateNextQuestion, generateRandomQuestion } from '../services/questionGenerator'
import {
  advance,
  endSession,
  hasRecordedCurrentQuestion,
  isLastQuestion,
  recordResult,
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

  return {
    state,
    /** True when a question could not be generated. */
    failed: state === null || nextFailed,
    isLastQuestion: state !== null && isLastQuestion(state),
    hasRecordedCurrent: state !== null && hasRecordedCurrentQuestion(state),

    recordResult(gotItRight: boolean, selectedAnswer: number) {
      setState((s) => (s ? recordResult(s, gotItRight, selectedAnswer) : s))
    },

    /** Shows the next question, or ends the session after the last one. */
    next() {
      if (!state) return
      try {
        const nextQuestion = isLastQuestion(state)
          ? null
          : generateNextQuestion(config.operations, config.difficulty, state.currentQuestion)
        setState(advance(state, nextQuestion))
      } catch {
        setNextFailed(true)
      }
    },

    end() {
      setState((s) => (s ? endSession(s) : s))
    },
  }
}
