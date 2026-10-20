import { Outlet } from 'react-router-dom'
import StorageWarning from '../common/StorageWarning'
import Header from './Header'
import PageContainer from './PageContainer'

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <PageContainer>
          <StorageWarning />
          <Outlet />
        </PageContainer>
      </main>
    </>
  )
}
