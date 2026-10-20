import type { MathOperation } from '../../types/question'
import { ALL_OPERATIONS, OPERATION_OPTIONS } from '../../utils/practiceConfig'
import { Button } from '../common/Button'
import ChoiceCard from '../common/ChoiceCard'
import './SetupGroup.css'

interface OperationSelectorProps {
  value: MathOperation[]
  onChange: (operations: MathOperation[]) => void
}

export default function OperationSelector({ value, onChange }: OperationSelectorProps) {
  const allSelected = value.length === ALL_OPERATIONS.length

  function toggle(operation: MathOperation) {
    onChange(
      value.includes(operation) ? value.filter((o) => o !== operation) : [...value, operation],
    )
  }

  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">What do you want to practice?</legend>
      <p className="setup-group__hint">Pick one or more.</p>
      <div className="setup-group__options setup-group__options--two">
        {OPERATION_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            type="checkbox"
            name="operations"
            checked={value.includes(option.value)}
            onChange={() => toggle(option.value)}
            label={option.label}
            icon={option.symbol}
          />
        ))}
      </div>
      <div className="setup-group__extra">
        <Button
          variant="secondary"
          aria-pressed={allSelected}
          onClick={() => onChange(allSelected ? [] : [...ALL_OPERATIONS])}
        >
          {allSelected ? 'Clear all' : 'Select all (mixed)'}
        </Button>
      </div>
    </fieldset>
  )
}
