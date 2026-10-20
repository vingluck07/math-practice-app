import { useLocation } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import type { PracticeConfig } from '../types/session'
import { DIFFICULTY_OPTIONS, OPERATION_OPTIONS } from '../utils/practiceConfig'

function readConfig(state: unknown): PracticeConfig | null {
  const config = (state as { config?: PracticeConfig } | null)?.config
  return config && config.operations?.length > 0 ? config : null
}

export default function PracticePage() {
  const config = readConfig(useLocation().state)

  if (!config) {
    return (
      <section>
        <h1>Practice</h1>
        <p>Let&apos;s pick what to practice first.</p>
        <ButtonLink to="/practice/setup" variant="accent">
          Go to Practice Setup
        </ButtonLink>
      </section>
    )
  }

  const operations = OPERATION_OPTIONS.filter((o) => config.operations.includes(o.value))
    .map((o) => o.label)
    .join(', ')
  const difficulty = DIFFICULTY_OPTIONS.find((d) => d.value === config.difficulty)
  const length =
    config.sessionLength === 'continuous' ? 'Continuous' : `${config.sessionLength} questions`

  return (
    <section>
      <h1>Practice</h1>
      <p>Your session is ready. Questions are coming soon!</p>
      <ul aria-label="Session settings">
        <li>Practicing: {operations}</li>
        <li>
          Level: {difficulty?.value} ({difficulty?.label})
        </li>
        <li>Length: {length}</li>
      </ul>
      <ButtonLink to="/practice/setup" variant="secondary">
        Change Settings
      </ButtonLink>
    </section>
  )
}
