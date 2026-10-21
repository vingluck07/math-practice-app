import { memo } from 'react'
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

/** Memoized: picking an answer only redraws the choices whose state changed. */
export default memo(function AnswerChoice({
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
      {/* The key number and check mark are drawn by CSS, so the button's visible text is
          just the answer, which its accessible name ("Answer 1: 4") then contains. */}
      <span className="answer__key" data-text={position} aria-hidden="true" />
      <span className="answer__value" aria-hidden="true">
        {value}
      </span>
      <span className="answer__check" data-text="✓" aria-hidden="true" />
    </button>
  )
})
