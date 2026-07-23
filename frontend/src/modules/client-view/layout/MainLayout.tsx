import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { NotificationBell } from "../../../shared/components/NotificationBell";
import { ChatWidget } from "../../messaging/components/ChatWidget";

export function MainLayout() {
    const location = useLocation();
    const isPlaybackPage = location.pathname.endsWith("/playback");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("clientSidebarCollapsed") === "true");

    useEffect(() => {
        localStorage.setItem("clientSidebarCollapsed", String(isCollapsed));
    }, [isCollapsed]);

    return (
        <div className="flex min-h-screen relative overflow-hidden bg-[#0A0707]">
            {!isPlaybackPage && (
                <>
                    {/* Ambient Glows */}
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D84040]/5 rounded-full blur-[120px] pointer-events-none z-0" />
                    <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#8E1616]/4 rounded-full blur-[150px] pointer-events-none z-0" />
                </>
            )}
            {!isPlaybackPage && (
                <>
                    {/* Mobile overlay backdrop */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                    <Sidebar 
                        isOpen={sidebarOpen} 
                        onClose={() => setSidebarOpen(false)}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                    />
                </>
            )}
            <div className={`flex-1 flex flex-col min-h-screen z-10 transition-all duration-300 ${!isPlaybackPage ? (isCollapsed ? "lg:ml-20" : "lg:ml-64") : ""}`}>
                {/* Mobile Header */}
                {!isPlaybackPage && (
                    <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#141010] border-b border-[#2A1F1F] sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <img src="/favicon/204-logo.png" alt="204 Logo" className="h-10 w-10 object-contain" />
                            <span className="tracking-widest uppercase text-white font-extrabold text-lg">204 PROD</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationBell userId={(() => {
                                try {
                                    const u = JSON.parse(localStorage.getItem("user") || "{}");
                                    return u.display_name || u.username || "Client User";
                                } catch { return "Client User"; }
                            })()} />
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-lg bg-[#2A1F1F] text-white hover:bg-[#3A2A2A] transition-colors"
                            >
                                <Menu size={20} />
                            </button>
                        </div>
                    </header>
                )}
                <main className="flex-1 overflow-y-auto min-h-screen">
                    <Outlet />
                </main>
            </div>
            <ChatWidget />
        </div>
    );
}
