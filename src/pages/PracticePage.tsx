import { useContext, useEffect, useRef, useState } from 'react'
import {
  Navigate,
  UNSAFE_DataRouterContext,
  useBlocker,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useSettings } from '../app/settingsContext'
import { Button, ButtonLink } from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ProgressBar from '../components/practice/ProgressBar'
import QuestionCard from '../components/practice/QuestionCard'
import { usePracticeSession } from '../hooks/usePracticeSession'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { loadActiveSession } from '../services/activeSessionStorage'
import type { ActiveSessionRecord, PracticeConfig } from '../types/session'
import { isValidPracticeConfig } from '../utils/validation'
import './PracticePage.css'

/**
 * Asks before the student leaves a running session (by a link, or the Back button).
 * Only works under a data router, which is what the real app uses.
 */
function LeaveGuard({ active, onLeave }: { active: boolean; onLeave: () => void }) {
  const blocker = useBlocker(active)
  if (blocker.state !== 'blocked') return null
  return (
    <ConfirmDialog
      title="Leave this session?"
      message="If you leave now, this session will end and the questions you answered so far will be counted."
      confirmLabel="End Session and Leave"
      cancelLabel="Keep Practicing"
      onConfirm={() => {
        onLeave()
        blocker.proceed()
      }}
      onCancel={() => blocker.reset()}
    />
  )
}

function ActiveSession({
  config,
  resumeFrom,
  runId,
}: {
  config: PracticeConfig
  resumeFrom?: ActiveSessionRecord
  /** The ID of the session this page shows (null until the session exists). */
  runId?: string
}) {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const hasDataRouter = useContext(UNSAFE_DataRouterContext) !== null
  const leaving = useRef(false)
  const practice = usePracticeSession(config, resumeFrom)
  const reducedMotion = useReducedMotion()
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const { state } = practice
  const isContinuous = config.sessionLength === 'continuous'

  // When the session ends (last question done, or End Session), show the summary.
  const finished = state !== null && !state.isActive
  useEffect(() => {
    if (state && finished && !leaving.current) {
      navigate('/practice/summary', {
        replace: true,
        state: { session: state.session, attempts: state.attempts },
      })
    }
  }, [finished, state, navigate])

  // Remember which session this page shows, so a refresh brings the same one back.
  const sessionId = state?.session.id
  useEffect(() => {
    if (sessionId && runId !== sessionId) {
      navigate(location.pathname, {
        replace: true,
        state: { ...(location.state as object | null), runId: sessionId },
      })
    }
  }, [sessionId, runId, navigate, location.pathname, location.state])

  if (practice.failed || !state) {
    return (
      <section>
        <h1>Oops!</h1>
        <p>We had trouble making a question. Let&apos;s try setting up again.</p>
        <ButtonLink to="/practice/setup" variant="accent">
          Back to Practice Setup
        </ButtonLink>
      </section>
    )
  }

  return (
    <section>
      <h1 className="sr-only">Practice</h1>
      {/* Announces each new question and how the session is going. */}
      <p className="sr-only" role="status">
        {isContinuous
          ? `Question ${state.currentQuestionIndex + 1}.`
          : `Question ${state.currentQuestionIndex + 1} of ${config.sessionLength}.`}{' '}
        {state.session.attempted} answered, {state.session.correct} correct so far.
      </p>
      {!isContinuous && (
        <ProgressBar completed={state.session.attempted} total={config.sessionLength as number} />
      )}
      <QuestionCard
        key={state.currentQuestion.id}
        question={state.currentQuestion}
        questionNumber={state.currentQuestionIndex + 1}
        total={config.sessionLength}
        animate={settings.cardAnimationEnabled && !reducedMotion}
        initialSelectedAnswer={practice.restoredAnswerFor(state.currentQuestion.id)}
        onSelect={practice.selectAnswer}
        nextLabel={practice.isLastQuestion ? 'See Results' : 'Next Question'}
        onResult={practice.recordResult}
        onNext={practice.next}
      />
      {isContinuous && (
        <div className="practice__end">
          <Button variant="secondary" onClick={() => setConfirmingEnd(true)}>
            End Session
          </Button>
        </div>
      )}
      {hasDataRouter && (
        <LeaveGuard
          active={state.isActive}
          onLeave={() => {
            leaving.current = true
            practice.end()
          }}
        />
      )}
      {confirmingEnd && (
        <ConfirmDialog
          title="End this session?"
          message="You will see how you did so far."
          confirmLabel="Yes, End Session"
          cancelLabel="Keep Practicing"
          onConfirm={practice.end}
          onCancel={() => setConfirmingEnd(false)}
        />
      )}
    </section>
  )
}

interface PracticeLocationState {
  config?: unknown
  /** Set by the "continue" button: pick up the saved session. */
  resume?: boolean
  /** The ID of the session this page was showing, kept so a refresh can bring it back. */
  runId?: string
}

export default function PracticePage() {
  const state = (useLocation().state as PracticeLocationState | null) ?? {}
  // Read once, so what is shown does not change while the page is open.
  const [saved] = useState(() => loadActiveSession())

  // A refresh (same session ID), the "continue" button, or coming back with nothing chosen.
  const resuming =
    saved !== null &&
    ((state.runId !== undefined && state.runId === saved.state.session.id) ||
      state.resume === true ||
      !isValidPracticeConfig(state.config))
  if (resuming && saved) {
    return <ActiveSession config={saved.config} resumeFrom={saved} runId={saved.state.session.id} />
  }

  // No valid setup (for example, the page was opened directly): go choose settings.
  if (!isValidPracticeConfig(state.config)) {
    return <Navigate to="/practice/setup" replace />
  }
  return <ActiveSession config={state.config} runId={state.runId} />
}
