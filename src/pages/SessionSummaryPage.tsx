import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, ButtonLink } from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import Panel from '../components/common/Panel'
import StatTile from '../components/common/StatTile'
import { activePatterns } from '../services/mistakeService'
import { loadMistakePatterns } from '../services/practiceStorage'
import type { PracticeAttempt, PracticeConfig, PracticeSession } from '../types/session'
import { calculateAccuracy, encouragement } from '../utils/accuracy'
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../utils/practiceConfig'
import './SessionSummaryPage.css'

interface SummaryState {
  session?: PracticeSession
  attempts?: PracticeAttempt[]
}

export default function SessionSummaryPage() {
  const { session, attempts = [] } = (useLocation().state as SummaryState | null) ?? {}
  const [activeMistakes] = useState(() => activePatterns(loadMistakePatterns()).length)

  if (!session) {
    return (
      <ErrorMessage
        title="Session Summary"
        message="There is no session to show right now. Start a new practice to see your results here."
      >
        <ButtonLink to="/practice/setup" variant="accent">
          Start Practice
        </ButtonLink>
        <ButtonLink to="/" variant="secondary">
          Return Home
        </ButtonLink>
      </ErrorMessage>
    )
  }

  const accuracy = calculateAccuracy(session.correct, session.attempted)
  const operations = OPERATION_OPTIONS.filter((o) => session.operations.includes(o.value))
    .map((o) => o.label)
    .join(', ')
  const difficulty = DIFFICULTY_OPTIONS.find((d) => d.value === session.difficulty)
  const reviewCount = attempts.filter((a) => a.source === 'mistake-review').length
  const sameSettings: PracticeConfig = {
    operations: session.operations,
    difficulty: session.difficulty,
    sessionLength: session.sessionLength,
    ...(session.mode ? { mode: session.mode } : {}),
  }
  const isReview = session.mode === 'mistake-review'
  const mistakesConfig: PracticeConfig = {
    ...sameSettings,
    mode: 'mistake-review',
  }

  return (
    <Panel className="summary">
      <h1>Session Summary</h1>
      <p className="summary__message">{encouragement(accuracy)}</p>

      <dl className="stat-grid summary__stats" aria-label="Results">
        <StatTile label="Questions" value={session.attempted} />
        <StatTile label="Correct" value={session.correct} />
        <StatTile label="Incorrect" value={session.incorrect} />
        <StatTile label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
      </dl>

      <dl className="summary__details" aria-label="Session details">
        <div>
          <dt>Practiced:</dt> <dd>{operations}</dd>
        </div>
        <div>
          <dt>Level:</dt>{' '}
          <dd>
            {isReview ? 'Based on your mistakes' : `${session.difficulty} (${difficulty?.label})`}
          </dd>
        </div>
        <div>
          <dt>Mistake review questions:</dt> <dd>{reviewCount}</dd>
        </div>
      </dl>

      <div className="panel__actions summary__actions">
        <ButtonLink to="/practice/session" state={{ config: sameSettings }} variant="accent">
          Practice Again
        </ButtonLink>
        {activeMistakes > 0 ? (
          <ButtonLink to="/practice/session" state={{ config: mistakesConfig }} variant="secondary">
            Practice Mistakes
          </ButtonLink>
        ) : (
          <Button variant="secondary" disabled aria-describedby="mistakes-note">
            Practice Mistakes
          </Button>
        )}
        <ButtonLink to="/practice/setup" variant="primary">
          Change Settings
        </ButtonLink>
        <ButtonLink to="/statistics" variant="primary">
          View Statistics
        </ButtonLink>
        <ButtonLink to="/" variant="secondary">
          Return Home
        </ButtonLink>
      </div>
      {activeMistakes === 0 && (
        <p id="mistakes-note" className="summary__note">
          No mistakes to review right now.
        </p>
      )}
    </Panel>
  )
}
