import './AnswerChoice.css'

interface AnswerChoiceProps {
  value: number
  /** Position in the list (1–4), used for the label and keyboard shortcut. */
  position: number
  selected: boolean
  /** Locked once the card has been flipped. */
  locked?: boolean
  onSelect: (value: number) => void
}

export default function AnswerChoice({
  value,
  position,
  selected,
  locked = false,
  onSelect,
}: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className={selected ? 'answer answer--selected' : 'answer'}
      aria-pressed={selected}
      aria-label={`Answer ${position}: ${value}`}
      aria-keyshortcuts={String(position)}
      disabled={locked}
      onClick={() => onSelect(value)}
    >
      <span className="answer__key" aria-hidden="true">
        {position}
      </span>
      <span className="answer__value" aria-hidden="true">
        {value}
      </span>
      <span className="answer__check" aria-hidden="true">
        ✓
      </span>
    </button>
  )
}
