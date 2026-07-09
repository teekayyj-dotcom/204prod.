import { MainLayout } from "./layout/MainLayout";
import { ProtectedRoute } from "../../shared/components/ProtectedRoute";

export const clientRoute = {
    path: "/client",
    element: (
        <ProtectedRoute allowedRoles={["client"]}>
            <MainLayout />
        </ProtectedRoute>
    ),
    children: [
        { index: true, lazy: () => import("./pages/ClientDashboardPage").then(m => ({ Component: m.ClientDashboardPage })) },
        { path: "projects", lazy: () => import("./pages/ClientProjectsPage").then(m => ({ Component: m.ClientProjectsPage })) },
        { path: "projects/:id", lazy: () => import("./pages/ClientProjectDetailPage").then(m => ({ Component: m.ClientProjectDetailPage })) },
        { path: "projects/:id/playback", lazy: () => import("./pages/ClientPlaybackPage").then(m => ({ Component: m.ClientPlaybackPage })) },
        { path: "demos", lazy: () => import("./pages/ClientDemosPage").then(m => ({ Component: m.ClientDemosPage })) },
        { path: "billing", lazy: () => import("./pages/ClientBillingPage").then(m => ({ Component: m.ClientBillingPage })) },
        { path: "support", lazy: () => import("./pages/ClientSupportPage").then(m => ({ Component: m.ClientSupportPage })) },
        { path: "settings", lazy: () => import("./pages/ClientSettingsPage").then(m => ({ Component: m.ClientSettingsPage })) },
    ],
};
