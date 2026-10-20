import { useSettings } from '../app/settingsContext'
import ChoiceCard from '../components/common/ChoiceCard'
import { ButtonLink } from '../components/common/Button'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()

  return (
    <section>
      <h1>Settings</h1>
      <p>More settings are coming soon.</p>
      <ChoiceCard
        type="checkbox"
        name="cardAnimationEnabled"
        checked={settings.cardAnimationEnabled}
        onChange={() => updateSettings({ cardAnimationEnabled: !settings.cardAnimationEnabled })}
        label="Card animation"
        description="Flip the practice cards with a spinning animation."
      />
      <p>
        <ButtonLink to="/" variant="secondary">
          Back to Home
        </ButtonLink>
      </p>
    </section>
  )
}
