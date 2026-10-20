import type { DifficultyLevel } from '../../types/question'
import { DIFFICULTY_OPTIONS } from '../../utils/practiceConfig'
import ChoiceCard from '../common/ChoiceCard'
import './SetupGroup.css'

interface DifficultySelectorProps {
  value: DifficultyLevel
  onChange: (difficulty: DifficultyLevel) => void
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">How hard should it be?</legend>
      <div className="setup-group__options setup-group__options--two">
        {DIFFICULTY_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            type="radio"
            name="difficulty"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={`Level ${option.value}: ${option.label}`}
            description={option.description}
          />
        ))}
      </div>
    </fieldset>
  )
}
