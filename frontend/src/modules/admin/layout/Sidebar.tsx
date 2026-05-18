import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Briefcase,
  UserCheck,
  ImageIcon,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Categories", icon: FolderOpen, path: "/admin/categories" },
  { label: "Clients", icon: Users, path: "/admin/clients" },
  { label: "Projects", icon: Briefcase, path: "/admin/projects" },
  { label: "Crew", icon: UserCheck, path: "/admin/crew" },
  { label: "Media Library", icon: ImageIcon, path: "/admin/media" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{ background: "#141010", borderRight: "1px solid #2A1F1F" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#D84040" }}
        >
          <Zap size={18} color="#EEEEEE" fill="#EEEEEE" />
        </div>
        <div>
          <span
            className="tracking-widest uppercase"
            style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700, letterSpacing: "0.15em" }}
          >
            FRAME
          </span>
          <span
            className="tracking-widest uppercase"
            style={{ color: "#D84040", fontSize: "15px", fontWeight: 700, letterSpacing: "0.15em" }}
          >
            CRAFT
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p
          className="px-3 mb-3 uppercase tracking-widest"
          style={{ color: "#8E1616", fontSize: "10px", fontWeight: 600 }}
        >
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            item.path === "/admin"
              ? location.pathname === "/admin"
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
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: "#1D1616" }}>
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
              admin@framecraft.io
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
