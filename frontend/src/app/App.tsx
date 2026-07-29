import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { InAppBrowserWarning } from '../shared/components/InAppBrowserWarning'

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
  { path: '/messaging', lazy: () => import('../modules/messaging/MessagingPage').then(m => ({ Component: m.MessagingPage })) },
  { path: '/review/:token', lazy: () => import('../modules/client-view/pages/PublicReviewPage').then(m => ({ Component: m.PublicReviewPage })) },
  clientSiteRoute,
  adminRoute,
  crewRoute,
  clientRoute,
  { path: '*', Component: NotFound },
])

export default function App() {
  return (
    <>
      <InAppBrowserWarning />
      <RouterProvider 
        router={router} 
        fallbackElement={<div className="flex items-center justify-center min-h-screen bg-[#0A0707] text-white">Loading...</div>} 
      />
    </>
  );
}