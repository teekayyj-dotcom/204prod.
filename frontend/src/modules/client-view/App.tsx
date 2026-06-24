import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { clientRoute } from "./routes";

const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/client" replace /> },
    clientRoute,
]);

export default function App() {
    return <RouterProvider router={router} />;
}
