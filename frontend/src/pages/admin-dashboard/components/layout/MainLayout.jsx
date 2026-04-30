import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
    return (
        <div className="flex min-h-screen" style={{ background: "#1D1616" }}>
            <Sidebar />
            <main className="flex-1 ml-64 overflow-y-auto min-h-screen">
                <Outlet />
            </main>
        </div>
    );
}
