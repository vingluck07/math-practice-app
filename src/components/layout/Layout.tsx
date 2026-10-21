import { Outlet } from 'react-router-dom'
import StorageWarning from '../common/StorageWarning'
import Header from './Header'
import PageContainer from './PageContainer'

export default function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <PageContainer>
          <StorageWarning />
          <Outlet />
        </PageContainer>
      </main>
    </>
  )
}
