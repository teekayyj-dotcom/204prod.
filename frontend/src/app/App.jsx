import { AdminDashboardPage } from '../pages/admin-dashboard/AdminDashboardPage'
import { HomePage } from '../pages/client-site/HomePage'
import { NotFound } from '../pages/NotFound'

function resolvePage(pathname) {
  if (pathname === '/' || pathname === '') {
    return <HomePage />
  }

  if (pathname.startsWith('/admin')) {
    return <AdminDashboardPage />
  }

  return <NotFound />
}

export default function App() {
  return resolvePage(window.location.pathname)
}
