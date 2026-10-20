import { NavLink } from 'react-router-dom'
import './Navigation.css'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/practice/setup', label: 'Practice', end: false },
  { to: '/statistics', label: 'Statistics', end: false },
  { to: '/settings', label: 'Settings', end: false },
]

export default function Navigation() {
  return (
    <nav aria-label="Main">
      <ul className="nav">
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className="nav__link">
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
