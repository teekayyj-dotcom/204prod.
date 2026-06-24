import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    MonitorPlay,
    Receipt,
    Headphones,
    LogOut,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { label: "Tổng quan", icon: LayoutDashboard, path: "/client" },
    { label: "Dự án của tôi", icon: Briefcase, path: "/client/projects" },
    { label: "Kho Demo / Xét duyệt", icon: MonitorPlay, path: "/client/demos" },
    { label: "Hóa đơn & Thanh toán", icon: Receipt, path: "/client/billing" },
    { label: "Hỗ trợ", icon: Headphones, path: "/client/support" },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <aside
            className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
            style={{ background: "#141010", borderRight: "1px solid #2A1F1F" }}
        >
            <div className="flex items-center justify-center gap-2.5 px-4 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
                <img src="/favicon/204-logo.png" alt="204 Logo" className="h-16 w-16 object-contain" />
                <span className="tracking-widest uppercase" style={{ color: "#EEEEEE", fontWeight: 800, fontSize: "24px", letterSpacing: "0.1rem" }}>CLIENT</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                <p
                    className="px-3 mb-3 uppercase tracking-widest"
                    style={{ color: "#8E1616", fontSize: "10px", fontWeight: 600 }}
                >
                    Main Menu
                </p>

                {/* Flat nav items */}
                {navItems.map((item) => {
                    const isActive =
                        item.path === "/client"
                            ? location.pathname === "/client"
                            : location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg group transition-all duration-200"
                            style={{
                                background: isActive ? "#D84040" : "transparent",
                                color: isActive ? "#EEEEEE" : "#999",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = "#2A1F1F";
                                    (e.currentTarget as HTMLElement).style.color = "#EEEEEE";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = "transparent";
                                    (e.currentTarget as HTMLElement).style.color = "#999";
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={17} />
                                <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 400 }}>
                                    {item.label}
                                </span>
                            </div>
                            {isActive && <ChevronRight size={14} />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="px-4 py-5" style={{ borderTop: "1px solid #2A1F1F" }}>
                <div
                    className="flex items-center gap-3 px-2 py-2 rounded-lg"
                    style={{ background: "#1D1616" }}
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}
                    >
                        AJ
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                            Alex Johnson
                        </p>
                        <p className="truncate" style={{ color: "#666", fontSize: "11px" }}>
                            client@204prod.io
                        </p>
                    </div>
                    <button
                        className="flex-shrink-0 transition-colors"
                        style={{ color: "#666" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#D84040")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#666")}
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
