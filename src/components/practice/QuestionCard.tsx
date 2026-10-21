import { useCallback, useEffect, useRef, useState } from 'react'
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
  /** An answer to show as already picked (used when a session is restored). */
  initialSelectedAnswer?: number | null
  /** Called whenever the student picks an answer. */
  onSelect?: (answer: number) => void
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
  initialSelectedAnswer = null,
  onSelect,
  onResult,
  onNext,
  nextLabel,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    initialSelectedAnswer !== null && question.choices.includes(initialSelectedAnswer)
      ? initialSelectedAnswer
      : null,
  )
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

  // Handlers stay the same between renders so the memoized answer buttons are not redrawn.
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  })
  const flippedRef = useRef(false)
  useEffect(() => {
    flippedRef.current = isCardFlipped
  }, [isCardFlipped])
  const select = useCallback((value: number) => {
    setSelectedAnswer(value)
    onSelectRef.current?.(value)
  }, [])

  // Number keys 1–4 pick an answer until the card is flipped.
  useEffect(() => {
    if (isCardFlipped) return
    function handleKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target) || document.querySelector('[role="dialog"]')) return
      const choice = question.choices[Number(event.key) - 1]
      if (choice !== undefined) select(choice)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isCardFlipped, question.choices, select])

  const handleSelect = useCallback(
    (value: number) => {
      if (!flippedRef.current) select(value)
    },
    [select],
  )

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
