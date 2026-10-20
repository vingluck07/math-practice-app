import { ButtonLink } from '../components/common/Button'
import Panel from '../components/common/Panel'
import './HomePage.css'

export default function HomePage() {
  return (
    <Panel className="home">
      <h1>Welcome to Math Practice!</h1>
      <p className="home__welcome">
        Flip the cards, solve the problems, and get better at math every day. Ready to play?
      </p>
      <div className="panel__actions">
        <ButtonLink to="/practice/setup" variant="accent">
          Start Practice
        </ButtonLink>
        <ButtonLink to="/statistics" variant="primary">
          View Statistics
        </ButtonLink>
        <ButtonLink to="/settings" variant="secondary">
          Settings
        </ButtonLink>
      </div>
    </Panel>
  )
}
