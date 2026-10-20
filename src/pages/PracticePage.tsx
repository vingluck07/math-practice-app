import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettings } from '../app/settingsContext'
import { ButtonLink } from '../components/common/Button'
import QuestionCard from '../components/practice/QuestionCard'
import { generateRandomQuestion } from '../services/questionGenerator'
import type { PracticeConfig } from '../types/session'

function readConfig(state: unknown): PracticeConfig | null {
  const config = (state as { config?: PracticeConfig } | null)?.config
  return config && config.operations?.length > 0 ? config : null
}

/**
 * Card preview: shows real questions one at a time. Recording results, session
 * progress and the summary arrive with the practice-session work (Phase 7).
 */
function CardPreview({ config }: { config: PracticeConfig }) {
  const { settings } = useSettings()
  const [questionNumber, setQuestionNumber] = useState(1)
  const [question, setQuestion] = useState(() =>
    generateRandomQuestion(config.operations, config.difficulty),
  )
  const finished = config.sessionLength !== 'continuous' && questionNumber > config.sessionLength

  function handleNext() {
    setQuestionNumber((n) => n + 1)
    setQuestion(generateRandomQuestion(config.operations, config.difficulty))
  }

  if (finished) {
    return (
      <section>
        <h1>That&apos;s all the questions!</h1>
        <p>The session summary is coming soon.</p>
        <ButtonLink to="/practice/setup" variant="accent">
          Back to Practice Setup
        </ButtonLink>
      </section>
    )
  }

  return (
    <section>
      <h1 className="sr-only">Practice</h1>
      <QuestionCard
        key={question.id}
        question={question}
        questionNumber={questionNumber}
        total={config.sessionLength}
        animate={settings.cardAnimationEnabled}
        onResult={() => {}} // Recording results arrives in Phase 7.
        onNext={handleNext}
      />
    </section>
  )
}

export default function PracticePage() {
  const config = readConfig(useLocation().state)

  if (!config) {
    return (
      <section>
        <h1>Practice</h1>
        <p>Let&apos;s pick what to practice first.</p>
        <ButtonLink to="/practice/setup" variant="accent">
          Go to Practice Setup
        </ButtonLink>
      </section>
    )
  }

  return <CardPreview config={config} />
}
