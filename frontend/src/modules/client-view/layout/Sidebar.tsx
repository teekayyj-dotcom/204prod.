import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    MonitorPlay,
    Receipt,
    Headphones,
    LogOut,
    ChevronRight,
    MessageCircle,
} from "lucide-react";
import { NotificationBell } from "../../../shared/components/NotificationBell";

const navItems = [
    { label: "Tổng quan", icon: LayoutDashboard, path: "/client" },
    { label: "Dự án của tôi", icon: Briefcase, path: "/client/projects" },
    { label: "Kho Demo / Xét duyệt", icon: MonitorPlay, path: "/client/demos" },
    { label: "Hóa đơn & Thanh toán", icon: Receipt, path: "/client/billing" },
    { label: "Hỗ trợ", icon: Headphones, path: "/client/support" },
];

const bottomNavItems = [
    { label: "Tin nhắn", icon: MessageCircle, path: "/client/messages" },
];

import { X, ChevronLeft } from "lucide-react";

export function Sidebar({ 
    isOpen, 
    onClose,
    isCollapsed,
    onToggleCollapse
}: { 
    isOpen?: boolean; 
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}) {
    const location = useLocation();

    return (
        <aside
            className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "w-20" : "w-64"}`}
            style={{ background: "#141010", borderRight: "1px solid #2A1F1F" }}
        >
            {/* Desktop Toggle */}
            <button
                onClick={onToggleCollapse}
                className="hidden lg:flex absolute -right-3 top-8 p-1 rounded-full bg-[#141010] border border-[#2A1F1F] text-white hover:bg-[#2A1F1F] hover:text-[#EEEEEE] transition-colors z-50"
                title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`flex items-center gap-2.5 py-5 overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'px-4'}`} style={{ borderBottom: "1px solid #2A1F1F", minHeight: "89px" }}>
                <img src="/favicon/204-logo.png" alt="204 Logo" className="h-12 w-12 object-contain flex-shrink-0" />
                {!isCollapsed && <span className="tracking-widest uppercase font-extrabold text-xl transition-opacity duration-300" style={{ color: "#EEEEEE", letterSpacing: "0.1rem" }}>CLIENT</span>}
                
                {/* Mobile Close */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-1.5 rounded-lg bg-[#2A1F1F] text-white hover:bg-[#3A2A2A] transition-colors ml-auto"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                {!isCollapsed && (
                    <p
                        className="px-3 mb-3 uppercase tracking-widest"
                        style={{ color: "#8E1616", fontSize: "10px", fontWeight: 600 }}
                    >
                        Main Menu
                    </p>
                )}

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
                            onClick={onClose}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg group transition-all duration-200`}
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
                            <div className="flex items-center gap-3" title={isCollapsed ? item.label : undefined}>
                                <item.icon size={17} className="flex-shrink-0" />
                                {!isCollapsed && (
                                    <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 400 }} className="truncate">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && isActive && <ChevronRight size={14} className="flex-shrink-0" />}
                        </NavLink>
                    );
                })}

                {/* Divider */}
                <div style={{ margin: "16px 12px", borderTop: "1px solid #2A1F1F" }} />

                {/* Bottom flat items */}
                {bottomNavItems.map((item) => {
                    const isActive =
                        item.path === "/client"
                            ? location.pathname === "/client"
                            : location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg group transition-all duration-200`}
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
                            <div className="flex items-center gap-3" title={isCollapsed ? item.label : undefined}>
                                <item.icon size={17} className="flex-shrink-0" />
                                {!isCollapsed && (
                                    <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 400 }} className="truncate">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && isActive && <ChevronRight size={14} className="flex-shrink-0" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className={`py-5 ${isCollapsed ? 'px-2' : 'px-4'}`} style={{ borderTop: "1px solid #2A1F1F" }}>
                <div
                    className={`flex items-center gap-3 py-2 rounded-lg ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}
                    style={{ background: "#1D1616" }}
                >
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}
                    >
                        {(() => {
                            try {
                                const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                                const avatar = userObj.avatar_url || userObj.avatar || userObj.photo_url || userObj.photoURL;
                                const name = userObj.display_name || userObj.username || "Client";
                                const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

                                if (avatar && avatar !== "null" && avatar !== "undefined") {
                                    return (
                                        <>
                                            <img 
                                                src={avatar} 
                                                alt="User Avatar" 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                                    if (fallback) {
                                                        (fallback as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                            <div className="w-full h-full items-center justify-center hidden" style={{ display: 'none' }}>
                                                {initials}
                                            </div>
                                        </>
                                    );
                                }
                                return initials;
                            } catch {
                                return "CL";
                            }
                        })()}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                                {(() => {
                                    try {
                                        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                                        return userObj.display_name || userObj.username || "Client User";
                                    } catch {
                                        return "Client User";
                                    }
                                })()}
                            </p>
                            <p className="truncate" style={{ color: "#666", fontSize: "11px" }}>
                                {(() => {
                                    try {
                                        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                                        return userObj.email || "client@204prod.io";
                                    } catch {
                                        return "client@204prod.io";
                                    }
                                })()}
                            </p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <NotificationBell placement="top-left" userId={(() => {
                            try {
                                const u = JSON.parse(localStorage.getItem("user") || "{}");
                                return u.display_name || u.username || "Client User";
                            } catch { return "Client User"; }
                        })()} />
                    )}
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("role");
                            localStorage.removeItem("user");
                            window.location.href = "/login";
                        }}
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
