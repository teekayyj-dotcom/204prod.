import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { adminRoute } from '../modules/admin/routes'
import { clientSiteRoute } from '../modules/client-site/routes'
import { NotFound } from '../shared/components/NotFound'


const router = createBrowserRouter([
  clientSiteRoute,
  adminRoute,
  { path: '*', Component: NotFound },
])

export default function App() {
  return <RouterProvider router={router} />;
}