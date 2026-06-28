import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { adminRoute } from '../modules/admin/routes'
import { crewRoute } from '../modules/crew/routes'
import { clientRoute } from '../modules/client-view/routes'
import { clientSiteRoute } from '../modules/client-site/routes'
import { AuthPage } from '../modules/auth/AuthPage'
import { PendingApprovalPage } from '../modules/auth/PendingApprovalPage'
import { NotFound } from '../shared/components/NotFound'


const router = createBrowserRouter([
  { path: '/login', Component: AuthPage },
  { path: '/register', Component: AuthPage },
  { path: '/change-password', Component: AuthPage },
  { path: '/pending', Component: PendingApprovalPage },
  clientSiteRoute,
  adminRoute,
  crewRoute,
  clientRoute,
  { path: '*', Component: NotFound },
])

export default function App() {
  return <RouterProvider router={router} />;
}