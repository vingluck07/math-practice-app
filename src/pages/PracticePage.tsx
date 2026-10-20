import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from '../app/settingsContext'
import { Button, ButtonLink } from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ProgressBar from '../components/practice/ProgressBar'
import QuestionCard from '../components/practice/QuestionCard'
import { usePracticeSession } from '../hooks/usePracticeSession'
import type { PracticeConfig } from '../types/session'
import { isValidPracticeConfig } from '../utils/validation'
import './PracticePage.css'

function ActiveSession({ config }: { config: PracticeConfig }) {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const practice = usePracticeSession(config)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const { state } = practice
  const isContinuous = config.sessionLength === 'continuous'

  // When the session ends (last question done, or End Session), show the summary.
  const finished = state !== null && !state.isActive
  useEffect(() => {
    if (state && finished) {
      navigate('/practice/summary', {
        replace: true,
        state: { session: state.session, attempts: state.attempts },
      })
    }
  }, [finished, state, navigate])

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
      {!isContinuous && (
        <ProgressBar completed={state.session.attempted} total={config.sessionLength as number} />
      )}
      <QuestionCard
        key={state.currentQuestion.id}
        question={state.currentQuestion}
        questionNumber={state.currentQuestionIndex + 1}
        total={config.sessionLength}
        animate={settings.cardAnimationEnabled}
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

export default function PracticePage() {
  const config = (useLocation().state as { config?: unknown } | null)?.config

  // No valid setup (for example, the page was opened directly): go choose settings.
  if (!isValidPracticeConfig(config)) {
    return <Navigate to="/practice/setup" replace />
  }
  return <ActiveSession config={config} />
}
