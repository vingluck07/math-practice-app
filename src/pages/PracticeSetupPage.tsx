import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import type { PracticeConfig } from '../types/session'
import { DEFAULT_PRACTICE_CONFIG } from '../utils/practiceConfig'
import './PracticeSetupPage.css'

export default function PracticeSetupPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<PracticeConfig>(DEFAULT_PRACTICE_CONFIG)

  const hasOperation = config.operations.length > 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasOperation) return
    navigate('/practice/session', { state: { config } })
  }

  return (
    <section>
      <h1>Set Up Your Practice</h1>
      <form onSubmit={handleSubmit} noValidate>
        <OperationSelector
          value={config.operations}
          onChange={(operations) => setConfig({ ...config, operations })}
        />
        <DifficultySelector
          value={config.difficulty}
          onChange={(difficulty) => setConfig({ ...config, difficulty })}
        />
        <SessionLengthSelector
          value={config.sessionLength}
          onChange={(sessionLength) => setConfig({ ...config, sessionLength })}
        />
        <div className="setup-actions">
          <p className="setup-actions__message" role="status">
            {hasOperation ? '' : 'Please pick at least one thing to practice.'}
          </p>
          <Button type="submit" variant="accent" disabled={!hasOperation}>
            Start Session
          </Button>
        </div>
      </form>
    </section>
  )
}
