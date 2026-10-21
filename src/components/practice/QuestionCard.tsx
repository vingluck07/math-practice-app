import { useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import type { SessionLength } from '../../types/session'
import CardBack from './CardBack'
import CardFront from './CardFront'
import './QuestionCard.css'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  total: SessionLength
  /** When false, the card switches sides instantly with no animation. */
  animate?: boolean
  /** The student's confidence check (before the answer is revealed). */
  onResult: (gotItRight: boolean, selectedAnswer: number) => void
  /** The student is ready for the next question (after the answer is revealed). */
  onNext: () => void
  /** Label for the button shown after the answer is revealed. */
  nextLabel?: string
}

/** True when a key press is aimed at something the person is typing in or choosing from. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.closest('input, textarea, select') !== null
}

/**
 * One flip card. Render it with `key={question.id}` so the selection and flip
 * state reset for every new question.
 */
export default function QuestionCard({
  question,
  questionNumber,
  total,
  animate = true,
  onResult,
  onNext,
  nextLabel,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const frontHeading = useRef<HTMLHeadingElement>(null)
  const backFace = useRef<HTMLDivElement>(null)

  // Put keyboard focus on the new question, and on the answer after flipping.
  useEffect(() => {
    const target = isCardFlipped
      ? backFace.current?.querySelector<HTMLElement>('h2')
      : frontHeading.current
    target?.focus({ preventScroll: true })
  }, [isCardFlipped])

  // Number keys 1–4 pick an answer until the card is flipped.
  useEffect(() => {
    if (isCardFlipped) return
    function handleKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target) || document.querySelector('[role="dialog"]')) return
      const choice = question.choices[Number(event.key) - 1]
      if (choice !== undefined) setSelectedAnswer(choice)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isCardFlipped, question.choices])

  function handleSelect(value: number) {
    if (!isCardFlipped) setSelectedAnswer(value)
  }

  function handleFlip() {
    if (selectedAnswer !== null) setIsCardFlipped(true)
  }

  const className = [
    'flip',
    animate ? 'flip--animated' : 'flip--static',
    isCardFlipped ? 'flip--flipped' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} data-flipped={isCardFlipped}>
      <div className="flip__inner">
        <div className="flip__face flip__face--front" inert={isCardFlipped}>
          <CardFront
            question={question}
            questionNumber={questionNumber}
            total={total}
            selectedAnswer={selectedAnswer}
            locked={isCardFlipped}
            onSelect={handleSelect}
            onFlip={handleFlip}
            headingRef={frontHeading}
          />
        </div>
        <div className="flip__face flip__face--back" inert={!isCardFlipped} ref={backFace}>
          <CardBack
            question={question}
            selectedAnswer={selectedAnswer}
            onResult={(gotItRight) =>
              selectedAnswer !== null && onResult(gotItRight, selectedAnswer)
            }
            onNext={onNext}
            nextLabel={nextLabel}
          />
        </div>
      </div>
    </div>
  )
}
