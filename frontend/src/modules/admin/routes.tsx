import { MainLayout } from "./layout/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientProfilePage } from "./pages/ClientProfilePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { CrewPage } from "./pages/CrewPage";
import { CrewProfilePage } from "./pages/CrewProfilePage";
import { MediaLibraryPage } from "./pages/MediaLibraryPage";
import { AddProjectPage } from "./pages/AddProjectPage";
import { AddCategoryPage } from "./pages/AddCategoryPage";
import { AddClientPage } from "./pages/AddClientPage";
import { AddCrewMemberPage } from "./pages/AddCrewMemberPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";

export function AdminNotFound() {
    return (<div className="flex flex-col items-center justify-center h-full py-32" style={{ color: "#666" }}>
            <p style={{ fontSize: "64px", fontWeight: 700, color: "#2A1F1F" }}>404</p>
            <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }} className="mt-2">
                Page not found
            </p>
            <p style={{ color: "#666", fontSize: "14px" }} className="mt-1">
                This page doesn't exist in FRAMECRAFT
            </p>
        </div>);
}

export const adminRoute = {
    path: "/admin",
    Component: MainLayout,
    children: [
        { index: true, Component: DashboardPage },
        { path: "categories", Component: CategoriesPage },
        { path: "categories/new", Component: AddCategoryPage },
        { path: "categories/:id", Component: CategoryDetailPage },
        { path: "clients", Component: ClientsPage },
        { path: "clients/new", Component: AddClientPage },
        { path: "clients/:id", Component: ClientProfilePage },
        { path: "projects", Component: ProjectsPage },
        { path: "projects/new", Component: AddProjectPage },
        { path: "projects/:id", Component: ProjectDetailPage },
        { path: "crew", Component: CrewPage },
        { path: "crew/new", Component: AddCrewMemberPage },
        { path: "crew/:id", Component: CrewProfilePage },
        { path: "media", Component: MediaLibraryPage },
        { path: "*", Component: AdminNotFound },
    ],
};
