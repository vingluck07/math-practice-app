import { Link } from 'react-router-dom'
import Navigation from './Navigation'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__title">
          <span aria-hidden="true">➕</span> Math Practice App
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
