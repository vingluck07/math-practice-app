import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearActiveSession, loadActiveSession } from '../../services/activeSessionStorage'
import { Button } from '../common/Button'
import './ResumePrompt.css'

/** Offers to continue a session that was left running (for example, after closing the tab). */
export default function ResumePrompt() {
  const navigate = useNavigate()
  // Read once when the page opens.
  const [saved, setSaved] = useState(() => loadActiveSession())
  if (!saved) return null

  const { state } = saved
  const total = state.session.sessionLength
  const where =
    total === 'continuous'
      ? `question ${state.currentQuestionIndex + 1}`
      : `question ${state.currentQuestionIndex + 1} of ${total}`

  return (
    <section className="resume" aria-labelledby="resume-title">
      <h2 id="resume-title" className="resume__title">
        Pick up where you left off?
      </h2>
      <p className="resume__text">You have a practice session in progress, at {where}.</p>
      <div className="resume__actions">
        <Button
          variant="accent"
          onClick={() => navigate('/practice/session', { state: { resume: true } })}
        >
          Continue Session
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            clearActiveSession()
            setSaved(null)
          }}
        >
          Start Fresh
        </Button>
      </div>
    </section>
  )
}
