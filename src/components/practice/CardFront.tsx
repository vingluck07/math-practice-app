import type { Ref } from 'react'
import type { Question } from '../../types/question'
import type { SessionLength } from '../../types/session'
import { spokenQuestionText } from '../../utils/math'
import { Button } from '../common/Button'
import AnswerChoice from './AnswerChoice'

interface CardFrontProps {
  question: Question
  questionNumber: number
  total: SessionLength
  selectedAnswer: number | null
  locked: boolean
  onSelect: (value: number) => void
  onFlip: () => void
  headingRef?: Ref<HTMLHeadingElement>
}

export default function CardFront({
  question,
  questionNumber,
  total,
  selectedAnswer,
  locked,
  onSelect,
  onFlip,
  headingRef,
}: CardFrontProps) {
  const progress =
    total === 'continuous' ? `Question ${questionNumber}` : `Question ${questionNumber} of ${total}`

  return (
    <div className="card-face__content">
      <p className="card__progress">{progress}</p>
      <h2 className="card__question" tabIndex={-1} ref={headingRef}>
        <span aria-hidden="true">{question.displayText}</span>
        <span className="sr-only">
          {spokenQuestionText(question.operation, question.firstOperand, question.secondOperand)}{' '}
          equals what?
        </span>
      </h2>
      <div className="card__choices" role="group" aria-label="Answer choices">
        {question.choices.map((choice, index) => (
          <AnswerChoice
            key={choice}
            value={choice}
            position={index + 1}
            selected={selectedAnswer === choice}
            locked={locked}
            onSelect={onSelect}
          />
        ))}
      </div>
      <Button variant="accent" disabled={selectedAnswer === null} onClick={onFlip}>
        Flip Card
      </Button>
      {selectedAnswer === null && <p className="card__hint">Pick an answer to flip the card.</p>}
    </div>
  )
}
