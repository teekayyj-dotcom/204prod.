import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Clapperboard,
  Library,
  UserCircle2,
  LogOut,
  ChevronRight,
  Zap,
  X,
} from "lucide-react";

const navItems = [
  {
    label: "Tổng quan",
    sublabel: "My Workspace",
    icon: LayoutGrid,
    path: "/crew-dashboard",
    exact: true,
  },
  {
    label: "Dự án của tôi",
    sublabel: "My Projects",
    icon: Clapperboard,
    path: "/crew-dashboard/projects",
    exact: false,
  },
  {
    label: "Thư viện Tài nguyên",
    sublabel: "Media Library",
    icon: Library,
    path: "/crew-dashboard/media",
    exact: false,
  },
  {
    label: "Cá nhân & HR",
    sublabel: "My HR",
    icon: UserCircle2,
    path: "/crew-dashboard/hr",
    exact: false,
  },
];

export function CrewSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      style={{ background: "#141010", borderRight: "1px solid #2A1F1F" }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 py-5"
        style={{ borderBottom: "1px solid #2A1F1F" }}
      >
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon/204-logo.png"
            alt="204 Logo"
            className="h-12 w-12 object-contain"
          />
          <div className="flex flex-col">
            <span
              className="tracking-widest uppercase"
              style={{
                color: "#EEEEEE",
                fontWeight: 800,
                fontSize: "18px",
                letterSpacing: "0.12rem",
                lineHeight: 1,
              }}
            >
              CREW
            </span>
            <span style={{ color: "#D84040", fontSize: "10px", fontWeight: 600, letterSpacing: "0.15rem" }}>
              WORKSPACE
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg bg-[#2A1F1F] text-white hover:bg-[#3A2A2A] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p
          className="px-3 mb-3 uppercase tracking-widest"
          style={{ color: "#8E1616", fontSize: "10px", fontWeight: 600 }}
        >
          Navigation
        </p>

        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
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
                <div className="flex flex-col">
                  <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 400, lineHeight: 1.2 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: isActive ? "rgba(238,238,238,0.65)" : "#666",
                      letterSpacing: "0.05em",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.sublabel}
                  </span>
                </div>
              </div>
              {isActive && <ChevronRight size={14} />}
            </NavLink>
          );
        })}

        {/* Divider */}
        <div style={{ margin: "16px 12px", borderTop: "1px solid #2A1F1F" }} />

      </nav>

      {/* User Profile */}
      <div className="px-4 py-5" style={{ borderTop: "1px solid #2A1F1F" }}>
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-lg"
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
                if (avatar) {
                  return <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />;
                }
                const name = userObj.display_name || userObj.username || "Crew";
                return name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
              } catch {
                return "CR";
              }
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
              {(() => {
                try {
                  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                  return userObj.display_name || userObj.username || "Crew Member";
                } catch {
                  return "Crew Member";
                }
              })()}
            </p>
            <p className="truncate" style={{ color: "#666", fontSize: "11px" }}>
              {(() => {
                try {
                  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                  return userObj.email || "crew@204prod.io";
                } catch {
                  return "crew@204prod.io";
                }
              })()}
            </p>
          </div>
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
            title="Đăng xuất"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
