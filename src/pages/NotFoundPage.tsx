import { ButtonLink } from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'

export default function NotFoundPage() {
  return (
    <ErrorMessage
      title="Oops! Page not found"
      message="We couldn't find the page you were looking for."
    >
      <ButtonLink to="/" variant="accent">
        Back to Home
      </ButtonLink>
    </ErrorMessage>
  )
}
