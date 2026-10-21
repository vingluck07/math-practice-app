import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logDevError } from '../../utils/logger'
import ErrorMessage from './ErrorMessage'
import './Button.css'

interface State {
  hasError: boolean
}

/**
 * Catches unexpected crashes anywhere below it and shows a calm message instead of
 * a blank page. "Back to Home" reloads the app, which is the safest way to recover.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logDevError(`Unexpected error. ${info.componentStack ?? ''}`, error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <ErrorMessage
        title="Oops! Something went wrong"
        message="Don't worry, your saved progress is safe. Let's go back to the start."
      >
        <a className="btn btn--accent" href="/">
          Back to Home
        </a>
      </ErrorMessage>
    )
  }
}
