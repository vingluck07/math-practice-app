import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { logDevError } from '../../utils/logger'
import { ButtonLink } from './Button'
import ErrorMessage from './ErrorMessage'

/** Shown when a page crashes while the router is running (instead of the router's default page). */
export default function RouteError() {
  const error = useRouteError()
  useEffect(() => logDevError('A page crashed.', error), [error])
  return (
    <ErrorMessage
      title="Oops! Something went wrong"
      message="This page ran into a problem. Your saved progress is safe."
    >
      <ButtonLink to="/" variant="accent" reloadDocument>
        Back to Home
      </ButtonLink>
    </ErrorMessage>
  )
}
