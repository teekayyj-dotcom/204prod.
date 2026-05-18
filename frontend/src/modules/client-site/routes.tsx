import { ClientLayout } from "./components/ClientLayout";
import { LandingPage } from "./pages/LandingPage";
import { WorksPage } from "./pages/WorksPage";
import { CrewPage } from "./pages/CrewPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";

export const clientSiteRoute = {
  path: "/",
  Component: ClientLayout,
  children: [
    { index: true, Component: LandingPage },
    { path: "works", Component: WorksPage },
    { path: "crew", Component: CrewPage },
    { path: "about", Component: AboutPage },
    { path: "contact", Component: ContactPage },
  ],
};
