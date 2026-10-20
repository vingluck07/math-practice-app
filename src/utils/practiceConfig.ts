import type { DifficultyLevel, MathOperation } from '../types/question'
import type { PracticeConfig, SessionLength } from '../types/session'

export interface OperationOption {
  value: MathOperation
  label: string
  symbol: string
}

export const OPERATION_OPTIONS: OperationOption[] = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
]

export const ALL_OPERATIONS: MathOperation[] = OPERATION_OPTIONS.map((o) => o.value)

export interface DifficultyOption {
  value: DifficultyLevel
  label: string
  description: string
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 1, label: 'Beginner', description: 'Small numbers up to 10, times tables up to 5.' },
  { value: 2, label: 'Easy', description: 'Numbers up to 50, times tables up to 10.' },
  {
    value: 3,
    label: 'Intermediate',
    description: 'Numbers up to 100, bigger multiplying and dividing.',
  },
  { value: 4, label: 'Advanced', description: 'Numbers up to 1,000 and two-digit multiplying.' },
]

export interface SessionLengthOption {
  value: SessionLength
  label: string
  description: string
}

export const SESSION_LENGTH_OPTIONS: SessionLengthOption[] = [
  { value: 5, label: '5 questions', description: 'A quick warm-up' },
  { value: 10, label: '10 questions', description: 'A good workout' },
  { value: 20, label: '20 questions', description: 'A long challenge' },
  { value: 'continuous', label: 'Continuous', description: 'Keep going until you stop' },
]

export const DEFAULT_PRACTICE_CONFIG: PracticeConfig = {
  operations: ['addition'],
  difficulty: 1,
  sessionLength: 10,
}
