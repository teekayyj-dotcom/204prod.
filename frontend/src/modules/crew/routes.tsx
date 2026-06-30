import { CrewMainLayout } from "./layout/CrewMainLayout";
import { CrewWorkspacePage } from "./pages/CrewWorkspacePage";
import { CrewProjectsPage } from "./pages/CrewProjectsPage";
import { CrewMediaLibraryPage } from "./pages/CrewMediaLibraryPage";
import { CrewHRPage } from "./pages/CrewHRPage";
import { ProtectedRoute } from "../../shared/components/ProtectedRoute";
import { ClientPlaybackPage } from "../client-view/pages/ClientPlaybackPage";

function CrewNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-32" style={{ color: "#666" }}>
      <p style={{ fontSize: "64px", fontWeight: 700, color: "#2A1F1F" }}>404</p>
      <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }} className="mt-2">
        Page not found
      </p>
      <p style={{ color: "#666", fontSize: "14px" }} className="mt-1">
        This page doesn't exist in Crew Dashboard
      </p>
    </div>
  );
}

export const crewRoute = {
  path: "/crew-dashboard",
  element: (
    <ProtectedRoute allowedRoles={["crew", "editor"]}>
      <CrewMainLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, Component: CrewWorkspacePage },
    { path: "projects", Component: CrewProjectsPage },
    { path: "projects/:id/playback", Component: ClientPlaybackPage },
    { path: "media", Component: CrewMediaLibraryPage },
    { path: "hr", Component: CrewHRPage },
    { path: "*", Component: CrewNotFound },
  ],
};
