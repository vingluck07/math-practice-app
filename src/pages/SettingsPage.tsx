import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../app/settingsContext'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useStorageStatus } from '../app/storageStatusContext'
import { Button, ButtonLink } from '../components/common/Button'
import ChoiceCard from '../components/common/ChoiceCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DifficultySelector from '../components/practice/DifficultySelector'
import OperationSelector from '../components/practice/OperationSelector'
import SessionLengthSelector from '../components/practice/SessionLengthSelector'
import { getStorageUsage } from '../services/storageService'
import { formatUsage } from '../utils/formatUsage'
import type { MathOperation } from '../types/question'
import './SettingsPage.css'

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData } = useSettings()
  const { reportStorageProblem } = useStorageStatus()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [confirmingClear, setConfirmingClear] = useState(false)
  // Measured once when the page opens.
  const [usage] = useState(getStorageUsage)
  const [operationsMessage, setOperationsMessage] = useState('')

  function changeOperations(operations: MathOperation[]) {
    if (operations.length === 0) {
      setOperationsMessage('Keep at least one operation selected.')
      return
    }
    setOperationsMessage('')
    updateSettings({ defaultOperations: operations })
  }

  function handleClear() {
    if (!clearAllData()) reportStorageProblem()
    setConfirmingClear(false)
    navigate('/')
  }

  return (
    <section>
      <h1>Settings</h1>
      <p className="settings__note">
        Your choices are saved automatically in this browser. Clearing your browser data may erase
        your progress.
      </p>

      <fieldset className="setup-group">
        <legend className="setup-group__legend">Preferences</legend>
        <div className="setup-group__options">
          <ChoiceCard
            type="checkbox"
            name="soundEffectsEnabled"
            checked={settings.soundEffectsEnabled}
            onChange={() => updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })}
            label="Sound effects"
            description="Play sounds while you practice."
          />
          <ChoiceCard
            type="checkbox"
            name="cardAnimationEnabled"
            checked={settings.cardAnimationEnabled}
            onChange={() =>
              updateSettings({ cardAnimationEnabled: !settings.cardAnimationEnabled })
            }
            label="Card animation"
            description={
              reducedMotion
                ? 'Your device asks for less motion, so cards change without spinning.'
                : 'Flip the practice cards with a spinning animation.'
            }
          />
          <ChoiceCard
            type="checkbox"
            name="feedbackEffectsEnabled"
            checked={settings.feedbackEffectsEnabled}
            onChange={() =>
              updateSettings({ feedbackEffectsEnabled: !settings.feedbackEffectsEnabled })
            }
            label="Cheering messages"
            description="Friendly messages and a little celebration after each answer."
          />
          <ChoiceCard
            type="checkbox"
            name="showExplanations"
            checked={settings.showExplanations}
            onChange={() => updateSettings({ showExplanations: !settings.showExplanations })}
            label="Show explanations"
            description="Show a short message with each answer."
          />
        </div>
      </fieldset>

      <h2 className="settings__heading">Practice defaults</h2>
      <p className="settings__note">These are what the setup page starts with.</p>
      <OperationSelector value={settings.defaultOperations} onChange={changeOperations} />
      {operationsMessage && (
        <p className="settings__message" role="alert">
          {operationsMessage}
        </p>
      )}
      <DifficultySelector
        value={settings.defaultDifficulty}
        onChange={(defaultDifficulty) => updateSettings({ defaultDifficulty })}
      />
      <SessionLengthSelector
        value={settings.defaultSessionLength}
        onChange={(defaultSessionLength) => updateSettings({ defaultSessionLength })}
      />

      <div className="setup-group settings__danger">
        <h2 className="settings__heading">Clear everything</h2>
        <p>Erase your settings, practice history and statistics and start fresh.</p>
        <Button variant="secondary" onClick={() => setConfirmingClear(true)}>
          Clear All Application Data
        </Button>
        <p className="settings__note">
          Saved data: about {formatUsage(usage.usedCharacters)} of the roughly{' '}
          {formatUsage(usage.approximateLimit)} your browser allows.
        </p>
      </div>

      <section className="setup-group settings__privacy" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="settings__heading">
          Privacy
        </h2>
        <p>
          This app does not ask for your name or any personal information, has no accounts, no
          tracking and no ads. Your practice history and settings are saved only in this browser on
          this device and are never sent anywhere.
        </p>
        <p>
          Clearing your browser data (or using a private window) removes your progress. You can also
          erase it yourself with the button above.
        </p>
      </section>

      <p className="settings__back">
        <ButtonLink to="/" variant="secondary">
          Back to Home
        </ButtonLink>
      </p>

      {confirmingClear && (
        <ConfirmDialog
          title="Clear all application data?"
          message="This permanently erases your settings, practice sessions, answers and statistics. It cannot be undone."
          confirmLabel="Yes, Erase Everything"
          cancelLabel="Keep My Data"
          onConfirm={handleClear}
          onCancel={() => setConfirmingClear(false)}
        />
      )}
    </section>
  )
}
