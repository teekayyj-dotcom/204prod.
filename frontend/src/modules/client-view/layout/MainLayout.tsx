import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
    const location = useLocation();
    const isPlaybackPage = location.pathname.endsWith("/playback");

    return (
        <div className="flex min-h-screen relative overflow-hidden bg-[#0A0707]">
            {!isPlaybackPage && (
                <>
                    {/* Ambient Glows */}
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D84040]/5 rounded-full blur-[120px] pointer-events-none z-0" />
                    <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#8E1616]/4 rounded-full blur-[150px] pointer-events-none z-0" />
                </>
            )}
            {!isPlaybackPage && <Sidebar />}
            <main className={`flex-1 overflow-y-auto min-h-screen z-10 ${isPlaybackPage ? "" : "ml-64"}`}>
                <Outlet />
            </main>
        </div>
    );
}
