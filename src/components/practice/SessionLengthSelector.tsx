import type { SessionLength } from '../../types/session'
import { SESSION_LENGTH_OPTIONS } from '../../utils/practiceConfig'
import ChoiceCard from '../common/ChoiceCard'
import './SetupGroup.css'

interface SessionLengthSelectorProps {
  value: SessionLength
  onChange: (length: SessionLength) => void
}

export default function SessionLengthSelector({ value, onChange }: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">How many questions?</legend>
      <div className="setup-group__options setup-group__options--two">
        {SESSION_LENGTH_OPTIONS.map((option) => (
          <ChoiceCard
            key={String(option.value)}
            type="radio"
            name="sessionLength"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
            description={option.description}
          />
        ))}
      </div>
    </fieldset>
  )
}
