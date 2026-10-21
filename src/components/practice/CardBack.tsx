import { useEffect, useRef, useState } from 'react'
import type { Question } from '../../types/question'
import { useSettings } from '../../app/settingsContext'
import { nextFeedback } from '../../utils/feedback'
import { formatAnswerText, spokenQuestionText } from '../../utils/math'
import { Button } from '../common/Button'

interface CardBackProps {
  question: Question
  selectedAnswer: number | null
  /** Called once per attempt with whether the student says they got it right. */
  onResult: (gotItRight: boolean) => void
  /** Called when the student is ready for the next question. */
  onNext: () => void
  /** Label for the button shown after the answer is revealed. */
  nextLabel?: string
}

/**
 * Two steps: first a confidence check ("Do you think you got it right?") that
 * does not show the answer, then the correct answer is revealed.
 */
export default function CardBack({
  question,
  selectedAnswer,
  onResult,
  onNext,
  nextLabel = 'Next Question',
}: CardBackProps) {
  const { settings } = useSettings()
  const [gotItRight, setGotItRight] = useState<boolean | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const revealed = gotItRight !== null
  const pickedCorrect = selectedAnswer === question.correctAnswer
  // Chosen once, when the answer is revealed, so it does not change when the card re-renders.
  const [cheer, setCheer] = useState('')
  const cheering = settings.feedbackEffectsEnabled

  function record(value: boolean) {
    if (revealed) return
    setCheer(nextFeedback(pickedCorrect ? 'correct' : 'incorrect'))
    setGotItRight(value)
    onResult(value)
  }

  // The buttons disappear when the answer is revealed, so move focus to the new heading.
  useEffect(() => {
    if (revealed) heading.current?.focus({ preventScroll: true })
  }, [revealed])

  return (
    <div className="card-face__content">
      {/* Announces the answer when it is revealed (focus also moves to the answer heading). */}
      <p className="sr-only" role="status">
        {revealed
          ? `Answer revealed. ${spokenQuestionText(
              question.operation,
              question.firstOperand,
              question.secondOperand,
            )} equals ${question.correctAnswer}. You picked ${selectedAnswer}.`
          : ''}
      </p>
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
          {settings.showExplanations && (
            <p
              className={
                cheering && pickedCorrect && settings.cardAnimationEnabled
                  ? 'card__feedback card__feedback--celebrate'
                  : 'card__feedback'
              }
            >
              {pickedCorrect
                ? `✓ You picked the correct answer.${cheering ? ` ${cheer}` : ''}`
                : `${cheering ? `${cheer} ` : ''}The correct answer is ${question.correctAnswer}.`}
            </p>
          )}
          <Button variant="accent" onClick={onNext}>
            {nextLabel}
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
