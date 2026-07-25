import { MaintenancePage } from "../../shared/pages/MaintenancePage";
import { ClientLayout } from "./components/ClientLayout";
import { WorksTransitionProvider } from "./components/WorksTransitionContext";
import { LandingTransitionProvider } from "./components/LandingTransitionContext";

const isDev = import.meta.env.DEV;

export const clientSiteRoute = {
  path: "/",
  element: (
    <LandingTransitionProvider>
      <WorksTransitionProvider>
        <ClientLayout />
      </WorksTransitionProvider>
    </LandingTransitionProvider>
  ),
  children: [
    { index: true, lazy: () => import("./pages/LandingPage").then(m => ({ Component: m.LandingPage })) },
    { path: "works", lazy: () => import("./pages/WorksPage").then(m => ({ Component: m.WorksPage })) },
    { path: "works/:id", lazy: () => import("./pages/ProjectDetail").then(m => ({ Component: m.ProjectDetail })) },
    { path: "crew", lazy: () => import("./pages/CrewPage").then(m => ({ Component: m.CrewPage })) },
    { path: "crew/:id", lazy: () => import("./pages/CrewPage").then(m => ({ Component: m.CrewPage })) },
    { path: "about", lazy: () => import("./pages/AboutPage").then(m => ({ Component: m.AboutPage })) },
    { path: "contact", lazy: () => import("./pages/ContactPage").then(m => ({ Component: m.ContactPage })) },
  ],
};
