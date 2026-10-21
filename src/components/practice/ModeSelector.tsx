import type { PracticeMode } from '../../types/session'
import ChoiceCard from '../common/ChoiceCard'
import './SetupGroup.css'

interface ModeSelectorProps {
  value: PracticeMode
  onChange: (mode: PracticeMode) => void
  /** How many mistakes are still waiting to be reviewed. */
  activeMistakes: number
}

export default function ModeSelector({ value, onChange, activeMistakes }: ModeSelectorProps) {
  const canReview = activeMistakes > 0
  const reviewDescription = canReview
    ? `${activeMistakes} ${activeMistakes === 1 ? 'mistake' : 'mistakes'} to review`
    : 'Not available yet: get some questions wrong first and they will show up here.'

  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">What kind of practice?</legend>
      <div className="setup-group__options setup-group__options--two">
        <ChoiceCard
          type="radio"
          name="mode"
          checked={value === 'regular'}
          onChange={() => onChange('regular')}
          label="Regular practice"
          description="New questions from the choices below."
        />
        <ChoiceCard
          type="radio"
          name="mode"
          checked={value === 'mistake-review'}
          onChange={() => onChange('mistake-review')}
          label="Practice my mistakes"
          description={reviewDescription}
          disabled={!canReview}
        />
      </div>
    </fieldset>
  )
}
