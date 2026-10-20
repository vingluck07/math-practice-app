import { Outlet } from 'react-router-dom'
import Header from './Header'
import PageContainer from './PageContainer'

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </>
  )
}
