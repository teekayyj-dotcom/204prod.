import { Navigate, RouterProvider, createBrowserRouter } from "react-router";
import { adminRoute } from "./routes";

const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/admin" replace /> },
    adminRoute,
]);

export default function App() {
    return <RouterProvider router={router}/>;
}
