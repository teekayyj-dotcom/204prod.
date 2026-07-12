import { MainLayout } from "./layout/MainLayout";

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

import { ProtectedRoute } from "../../shared/components/ProtectedRoute";

export const adminRoute = {
    path: "/admin",
    element: (
        <ProtectedRoute allowedRoles={["admin"]}>
            <MainLayout />
        </ProtectedRoute>
    ),
    children: [
        { index: true, lazy: () => import("./pages/DashboardPage").then(m => ({ Component: m.DashboardPage })) },
        { path: "categories", lazy: () => import("./pages/CategoriesPage").then(m => ({ Component: m.CategoriesPage })) },
        { path: "categories/new", lazy: () => import("./pages/AddCategoryPage").then(m => ({ Component: m.AddCategoryPage })) },
        { path: "categories/:id", lazy: () => import("./pages/CategoryDetailPage").then(m => ({ Component: m.CategoryDetailPage })) },
        { path: "clients", lazy: () => import("./pages/ClientsPage").then(m => ({ Component: m.ClientsPage })) },
        { path: "clients/new", lazy: () => import("./pages/AddClientPage").then(m => ({ Component: m.AddClientPage })) },
        { path: "clients/:id", lazy: () => import("./pages/ClientProfilePage").then(m => ({ Component: m.ClientProfilePage })) },
        { path: "projects", lazy: () => import("./pages/ProjectsPage").then(m => ({ Component: m.ProjectsPage })) },
        { path: "projects/new", lazy: () => import("./pages/AddProjectPage").then(m => ({ Component: m.AddProjectPage })) },
        { path: "projects/:id", lazy: () => import("./pages/ProjectDetailPage").then(m => ({ Component: m.ProjectDetailPage })) },
        { path: "projects/:id/playback", lazy: () => import("../client-view/pages/ClientPlaybackPage").then(m => ({ Component: m.ClientPlaybackPage })) },
        { path: "crew", lazy: () => import("./pages/CrewPage").then(m => ({ Component: m.CrewPage })) },
        { path: "crew/new", lazy: () => import("./pages/AddCrewMemberPage").then(m => ({ Component: m.AddCrewMemberPage })) },
        { path: "crew/:id", lazy: () => import("./pages/CrewProfilePage").then(m => ({ Component: m.CrewProfilePage })) },
        { path: "media", lazy: () => import("./pages/MediaLibraryPage").then(m => ({ Component: m.MediaLibraryPage })) },
        { path: "crm/overview", lazy: () => import("./pages/CRMOverviewPage").then(m => ({ Component: m.CRMOverviewPage })) },
        { path: "hr/overview", lazy: () => import("./pages/HROverviewPage").then(m => ({ Component: m.HROverviewPage })) },
        { path: "hr/attendance", lazy: () => import("./pages/AttendancePage").then(m => ({ Component: m.AttendancePage })) },
        { path: "hr/attendance/edit", lazy: () => import("./pages/EditSchedulePage").then(m => ({ Component: m.EditSchedulePage })) },
        { path: "finance/overview", lazy: () => import("./pages/FinanceOverviewPage").then(m => ({ Component: m.FinanceOverviewPage })) },
        { path: "finance/goals", lazy: () => import("./pages/FinanceGoalsPage").then(m => ({ Component: m.FinanceGoalsPage })) },
        { path: "finance/revenue", lazy: () => import("./pages/FinanceRevenuePage").then(m => ({ Component: m.FinanceRevenuePage })) },
        { path: "finance/expenses", lazy: () => import("./pages/FinanceExpensesPage").then(m => ({ Component: m.FinanceExpensesPage })) },
        { path: "finance/payables", lazy: () => import("./pages/FinancePayablesPage").then(m => ({ Component: m.FinancePayablesPage })) },
        { path: "*", Component: AdminNotFound },
    ],
};
