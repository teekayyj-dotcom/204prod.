import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Briefcase,
  UserCheck,
  ImageIcon,
  LogOut,
  ChevronRight,
  ChevronDown,
  DollarSign,
  BarChart2,
  Target,
  TrendingUp,
  TrendingDown,
  ContactRound,
  HardHat,
  ClipboardCheck,
  Network,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Projects", icon: Briefcase, path: "/admin/projects" },
];

const bottomNavItems = [
  { label: "Media Library", icon: ImageIcon, path: "/admin/media" },
];

const crmSubItems = [
  { label: "Tổng quan", icon: BarChart2, path: "/admin/crm/overview" },
  { label: "Categories", icon: FolderOpen, path: "/admin/categories" },
  { label: "Clients", icon: Users, path: "/admin/clients" },
];

const financeSubItems = [
  { label: "Tổng quan",   icon: BarChart2,    path: "/admin/finance/overview" },
  { label: "Mục tiêu",    icon: Target,       path: "/admin/finance/goals" },
  { label: "Doanh thu",   icon: TrendingUp,   path: "/admin/finance/revenue" },
  { label: "Chi Phí",     icon: TrendingDown, path: "/admin/finance/expenses" },
  { label: "Công nợ",     icon: DollarSign,   path: "/admin/finance/payables" },
];

const hrSubItems = [
  { label: "Tổng quan", icon: BarChart2, path: "/admin/hr/overview" },
  { label: "Chấm Công", icon: ClipboardCheck, path: "/admin/hr/attendance" },
  { label: "Crew", icon: UserCheck, path: "/admin/crew" },
  { label: "Outsource", icon: Network, path: "/admin/hr/outsource" },
];

function DropdownSection({
  label,
  icon: Icon,
  subItems,
  isGroupActive,
}: {
  label: string;
  icon: React.ElementType;
  subItems: { label: string; icon: React.ElementType; path: string }[];
  isGroupActive: boolean;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200"
        style={{
          background: isGroupActive && !open ? "#D84040" : open ? "#2A1F1F" : "transparent",
          color: isGroupActive || open ? "#EEEEEE" : "#999",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = "#2A1F1F";
            (e.currentTarget as HTMLElement).style.color = "#EEEEEE";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background =
              isGroupActive && !open ? "#D84040" : "transparent";
            (e.currentTarget as HTMLElement).style.color =
              isGroupActive || open ? "#EEEEEE" : "#999";
          }
        }}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} />
          <span style={{ fontSize: "14px", fontWeight: isGroupActive ? 600 : 400 }}>{label}</span>
        </div>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div
          className="mt-1 ml-3 pl-3 space-y-0.5"
          style={{ borderLeft: "1px solid #2A1F1F" }}
        >
          {subItems.map((sub) => {
            const isSubActive = location.pathname === sub.path ||
              (sub.path !== "/admin" && location.pathname.startsWith(sub.path));
            return (
              <NavLink
                key={sub.path}
                to={sub.path}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
                style={{
                  background: isSubActive ? "#8E1616" : "transparent",
                  color: isSubActive ? "#EEEEEE" : "#888",
                }}
                onMouseEnter={(e) => {
                  if (!isSubActive) {
                    (e.currentTarget as HTMLElement).style.background = "#2A1F1F";
                    (e.currentTarget as HTMLElement).style.color = "#EEEEEE";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#888";
                  }
                }}
              >
                <sub.icon size={15} />
                <span style={{ fontSize: "13px", fontWeight: isSubActive ? 600 : 400 }}>
                  {sub.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();

  const isCrmActive =
    location.pathname.startsWith("/admin/categories") ||
    location.pathname.startsWith("/admin/clients") ||
    location.pathname.startsWith("/admin/crm");

  const isFinanceActive = location.pathname.startsWith("/admin/finance");

  const isHrActive =
    location.pathname.startsWith("/admin/hr") ||
    location.pathname.startsWith("/admin/crew") ||
    location.pathname.startsWith("/admin/hr/outsource");

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
      style={{ background: "#141010", borderRight: "1px solid #2A1F1F" }}
    >
      <div className="flex items-center justify-center gap-2.5 px-4 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <img src="/favicon/204-logo.png" alt="204 Logo" className="h-16 w-16 object-contain" />
        <span className="tracking-widest uppercase" style={{ color: "#EEEEEE", fontWeight: 800, fontSize: "24px", letterSpacing: "0.1rem" }}>ADMIN</span>
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

        {/* CRM Dropdown */}
        <DropdownSection
          label="CRM"
          icon={ContactRound}
          subItems={crmSubItems}
          isGroupActive={isCrmActive}
        />

        {/* HR Dropdown */}
        <DropdownSection
          label="HR"
          icon={HardHat}
          subItems={hrSubItems}
          isGroupActive={isHrActive}
        />

        {/* Finance Dropdown */}
        <DropdownSection
          label="Finance"
          icon={DollarSign}
          subItems={financeSubItems}
          isGroupActive={isFinanceActive}
        />

        {/* Bottom flat items */}
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200"
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
              admin@204prod.io
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
