export class QuestionGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuestionGenerationError'
  }
}
