import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { adminRoute } from '../modules/admin/routes'
import { crewRoute } from '../modules/crew/routes'
import { clientRoute } from '../modules/client-view/routes'
import { clientSiteRoute } from '../modules/client-site/routes'
import { NotFound } from '../shared/components/NotFound'
const router = createBrowserRouter([
  { path: '/login', lazy: () => import('../modules/auth/AuthPage').then(m => ({ Component: m.AuthPage })) },
  { path: '/register', lazy: () => import('../modules/auth/AuthPage').then(m => ({ Component: m.AuthPage })) },
  { path: '/change-password', lazy: () => import('../modules/auth/AuthPage').then(m => ({ Component: m.AuthPage })) },
  { path: '/pending', lazy: () => import('../modules/auth/PendingApprovalPage').then(m => ({ Component: m.PendingApprovalPage })) },
  clientSiteRoute,
  adminRoute,
  crewRoute,
  clientRoute,
  { path: '*', Component: NotFound },
])

export default function App() {
  return <RouterProvider router={router} />;
}