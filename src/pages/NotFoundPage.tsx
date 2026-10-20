import { ButtonLink } from '../components/common/Button'

export default function NotFoundPage() {
  return (
    <section>
      <h1>Oops! Page not found</h1>
      <p>We couldn&apos;t find the page you were looking for.</p>
      <ButtonLink to="/" variant="accent">
        Back to Home
      </ButtonLink>
    </section>
  )
}
