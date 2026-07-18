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
  Download,
} from "lucide-react";
import { NotificationBell } from "../../../shared/components/NotificationBell";

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
];

import { X } from "lucide-react";

function DropdownSection({
  label,
  icon: Icon,
  subItems,
  isGroupActive,
  onClose,
}: {
  label: string;
  icon: React.ElementType;
  subItems: { label: string; icon: React.ElementType; path: string }[];
  isGroupActive: boolean;
  onClose?: () => void;
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
            const subPathBase = sub.path.split('?')[0];
            const subPathSearch = sub.path.split('?')[1] || '';
            const isSubActive = sub.path.includes('?')
              ? location.pathname === subPathBase && location.search === `?${subPathSearch}`
              : (location.pathname === sub.path || (sub.path !== "/admin" && location.pathname.startsWith(sub.path) && !location.search));
            return (
              <NavLink
                key={sub.path}
                to={sub.path}
                onClick={onClose}
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

export function Sidebar({ 
  isOpen, 
  onClose,
  installPrompt,
  onInstallClick
}: { 
  isOpen?: boolean; 
  onClose?: () => void;
  installPrompt?: any;
  onInstallClick?: () => void;
}) {
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
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      style={{ background: "#141010", borderRight: "1px solid #2A1F1F" }}
    >
      <div className="flex items-center justify-between px-4 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <div className="flex items-center gap-2.5">
          <img src="/favicon/204-logo.png" alt="204 Logo" className="h-12 w-12 object-contain" />
          <span className="tracking-widest uppercase" style={{ color: "#EEEEEE", fontWeight: 800, fontSize: "20px", letterSpacing: "0.1rem" }}>ADMIN</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg bg-[#2A1F1F] text-white hover:bg-[#3A2A2A] transition-colors"
        >
          <X size={16} />
        </button>
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
          onClose={onClose}
        />

        {/* HR Dropdown */}
        <DropdownSection
          label="HR"
          icon={HardHat}
          subItems={hrSubItems}
          isGroupActive={isHrActive}
          onClose={onClose}
        />

        {/* Finance Dropdown */}
        <DropdownSection
          label="Finance"
          icon={DollarSign}
          subItems={financeSubItems}
          isGroupActive={isFinanceActive}
          onClose={onClose}
        />

        {/* Bottom flat items */}
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
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

        {/* Install App Button (Mobile Only) */}
        {installPrompt && (
          <div className="lg:hidden mt-4 pt-4 px-2 border-t border-[#2A1F1F]">
            <button
              onClick={onInstallClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D84040] text-white text-sm font-semibold hover:bg-[#8E1616] transition-colors shadow-lg shadow-[#D84040]/20"
            >
              <Download size={16} />
              Cài đặt app
            </button>
          </div>
        )}
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
                const name = userObj.display_name || userObj.username || "Admin";
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
                return "AD";
              }
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
              {(() => {
                try {
                  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                  return userObj.display_name || userObj.username || "Admin User";
                } catch {
                  return "Admin User";
                }
              })()}
            </p>
            <p className="truncate" style={{ color: "#666", fontSize: "11px" }}>
              {(() => {
                try {
                  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                  return userObj.email || "admin@204prod.io";
                } catch {
                  return "admin@204prod.io";
                }
              })()}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex-shrink-0">
              <NotificationBell userId="Admin" />
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="flex-shrink-0 transition-colors p-1"
              style={{ color: "#666" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#D84040")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#666")}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
