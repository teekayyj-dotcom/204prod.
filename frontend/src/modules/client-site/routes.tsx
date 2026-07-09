import { MaintenancePage } from "../../shared/pages/MaintenancePage";
import { ClientLayout } from "./components/ClientLayout";
import { LandingPage } from "./pages/LandingPage";
import { WorksPage } from "./pages/WorksPage";
import { ProjectDetail } from "./pages/ProjectDetail";
import { CrewPage } from "./pages/CrewPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";

const isDev = import.meta.env.DEV;

export const clientSiteRoute = {
  path: "/",
  Component: isDev ? ClientLayout : MaintenancePage, // ClientLayout on dev, Maintenance on prod
  children: [
    { index: true, Component: LandingPage },
    { path: "works", Component: WorksPage },
    { path: "works/:id", Component: ProjectDetail },
    { path: "crew", Component: CrewPage },
    { path: "crew/:id", Component: CrewPage },
    { path: "about", Component: AboutPage },
    { path: "contact", Component: ContactPage },
  ],
};
