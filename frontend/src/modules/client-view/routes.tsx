import { MainLayout } from "./layout/MainLayout";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import { ClientProjectsPage } from "./pages/ClientProjectsPage";
import { ClientProjectDetailPage } from "./pages/ClientProjectDetailPage";
import { ClientPlaybackPage } from "./pages/ClientPlaybackPage";
import { ClientDemosPage } from "./pages/ClientDemosPage";
import { ClientBillingPage } from "./pages/ClientBillingPage";
import { ClientSupportPage } from "./pages/ClientSupportPage";
import { ClientSettingsPage } from "./pages/ClientSettingsPage";

import { ProtectedRoute } from "../../shared/components/ProtectedRoute";

export const clientRoute = {
    path: "/client",
    element: (
        <ProtectedRoute allowedRoles={["client"]}>
            <MainLayout />
        </ProtectedRoute>
    ),
    children: [
        { index: true, Component: ClientDashboardPage },
        { path: "projects", Component: ClientProjectsPage },
        { path: "projects/:id", Component: ClientProjectDetailPage },
        { path: "projects/:id/playback", Component: ClientPlaybackPage },
        { path: "demos", Component: ClientDemosPage },
        { path: "billing", Component: ClientBillingPage },
        { path: "support", Component: ClientSupportPage },
        { path: "settings", Component: ClientSettingsPage },
    ],
};
