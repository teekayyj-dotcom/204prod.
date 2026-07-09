import { CrewMainLayout } from "./layout/CrewMainLayout";

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
    { index: true, lazy: () => import("./pages/CrewWorkspacePage").then(m => ({ Component: m.CrewWorkspacePage })) },
    { path: "projects", lazy: () => import("./pages/CrewProjectsPage").then(m => ({ Component: m.CrewProjectsPage })) },
    { path: "projects/:id/playback", lazy: () => import("../client-view/pages/ClientPlaybackPage").then(m => ({ Component: m.ClientPlaybackPage })) },
    { path: "media", lazy: () => import("./pages/CrewMediaLibraryPage").then(m => ({ Component: m.CrewMediaLibraryPage })) },
    { path: "hr", lazy: () => import("./pages/CrewHRPage").then(m => ({ Component: m.CrewHRPage })) },
    { path: "*", Component: CrewNotFound },
  ],
};
