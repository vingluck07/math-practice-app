import { useLocation } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import Panel from '../components/common/Panel'
import type { PracticeSession } from '../types/session'
import './SessionSummaryPage.css'

/** Interim summary: the full summary page arrives in Phase 8. */
export default function SessionSummaryPage() {
  const session = (useLocation().state as { session?: PracticeSession } | null)?.session

  return (
    <Panel className="summary">
      <h1>Session Summary</h1>
      {session ? (
        <>
          <p className="summary__text">
            You practiced {session.attempted} {session.attempted === 1 ? 'question' : 'questions'}:{' '}
            {session.correct} you said right and {session.incorrect} you said wrong.
          </p>
          <p className="summary__note">The full summary is coming soon.</p>
        </>
      ) : (
        <p className="summary__text">There is no session to show yet.</p>
      )}
      <div className="panel__actions">
        <ButtonLink to="/practice/setup" variant="accent">
          Practice Again
        </ButtonLink>
        <ButtonLink to="/" variant="secondary">
          Return Home
        </ButtonLink>
      </div>
    </Panel>
  )
}
