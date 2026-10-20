import { useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import { formatAnswerText } from '../../utils/math'
import { Button } from '../common/Button'

interface CardBackProps {
  question: Question
  selectedAnswer: number | null
  /** Called once per attempt with whether the student says they got it right. */
  onResult: (gotItRight: boolean) => void
  /** Called when the student is ready for the next question. */
  onNext: () => void
}

/**
 * Two steps: first a confidence check ("Do you think you got it right?") that
 * does not show the answer, then the correct answer is revealed.
 */
export default function CardBack({ question, selectedAnswer, onResult, onNext }: CardBackProps) {
  const [gotItRight, setGotItRight] = useState<boolean | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const revealed = gotItRight !== null
  const pickedCorrect = selectedAnswer === question.correctAnswer

  function record(value: boolean) {
    if (revealed) return
    setGotItRight(value)
    onResult(value)
  }

  // The buttons disappear when the answer is revealed, so move focus to the new heading.
  useEffect(() => {
    if (revealed) heading.current?.focus({ preventScroll: true })
  }, [revealed])

  return (
    <div className="card-face__content">
      <p className="card__progress">{revealed ? 'The answer' : 'Your answer'}</p>
      <h2 className="card__question" tabIndex={-1} ref={heading}>
        {revealed
          ? formatAnswerText(
              question.operation,
              question.firstOperand,
              question.secondOperand,
              question.correctAnswer,
            )
          : question.displayText}
      </h2>
      <p className="card__your-answer">Your answer: {selectedAnswer}</p>

      {revealed ? (
        <>
          <p className="card__hint">You said: {gotItRight ? 'I got it right' : 'I got it wrong'}</p>
          <p className="card__feedback">
            {pickedCorrect
              ? '✓ You picked the correct answer. Great job!'
              : `Good try! The correct answer is ${question.correctAnswer}.`}
          </p>
          <Button variant="accent" onClick={onNext}>
            Next Question
          </Button>
        </>
      ) : (
        <>
          <p className="card__feedback">How do you think you did?</p>
          <div className="card__results">
            <Button variant="accent" onClick={() => record(true)}>
              I Got It Right
            </Button>
            <Button variant="secondary" onClick={() => record(false)}>
              I Got It Wrong
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
