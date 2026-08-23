import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import {
  Users, UserCheck, UserX, Briefcase, MapPin, Home, Monitor,
  Clock, Calendar, FileText, AlertTriangle, CheckCircle2, XCircle,
  Gift, Star, Cake, Milestone, ClipboardList, RefreshCcw,
  ChevronRight, Check, X, Bell, TrendingUp, Circle, Loader2, Search
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

type ReqStatus = "pending" | "approved" | "rejected";
type ReqType   = "leave" | "sick" | "ot" | "wfh" | "business" | "explain";

interface LeaveRequest {
  id: number;
  employee: string;
  avatar: string;
  type: ReqType;
  date: string;
  reason: string;
  submitted: string;
  status: ReqStatus;
  urgent?: boolean;
}

type AlertLevel = "error" | "warning" | "gold";

interface HRAlert {
  id: number;
  level: AlertLevel;
  title: string;
  sub: string;
  action?: string;
  daysLeft?: number;
}

interface OpenRole {
  title: string;
  dept: string;
  priority: string;
  since: string;
}

interface TeamMember {
  id: number;
  name: string;
  avatar: string;
  role: string;
  dept: string;
  type: "inhouse" | "freelancer";
  status: "office" | "onsite" | "wfh" | "absent";
  checkin?: string | null;
}

const reqTypeCfg: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  leave:    { label: "Nghỉ phép",   color: "#f87171", icon: Calendar },
  sick:     { label: "Nghỉ ốm",     color: "#f87171", icon: UserX },
  ot:       { label: "Làm thêm giờ",color: "#fbbf24", icon: Clock },
  wfh:      { label: "WFH",         color: "#60a5fa", icon: Home },
  business: { label: "Công tác",    color: "#c084fc", icon: MapPin },
  explain:  { label: "Giải trình",   color: "#c084fc", icon: FileText }
};

const statusLocation: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  office:  { label: "Văn phòng",   color: "#4ade80", bg: "#14532d22", icon: Monitor },
  onsite:  { label: "Hiện trường", color: "#fbbf24", bg: "#78350f33", icon: MapPin },
  wfh:     { label: "WFH",         color: "#60a5fa", bg: "#1e3a5f33", icon: Home },
  absent:  { label: "Vắng",        color: "#f87171", bg: "#7f1d1d33", icon: UserX },
};

const alertStyle: Record<AlertLevel, { border: string; icon: string; bg: string }> = {
  error:   { border: "#7f1d1d55", icon: "#f87171", bg: "#7f1d1d0a" },
  warning: { border: "#78350f55", icon: "#fbbf24", bg: "#78350f08" },
  gold:    { border: "#78350f44", icon: "#fbbf24", bg: "#78350f08" },
};

const alertIcons: Record<string, React.ElementType> = {
  AlertTriangle: AlertTriangle,
  FileText: FileText,
  RefreshCcw: RefreshCcw,
  Clock: Clock,
  Cake: Cake,
  Star: Star,
  Gift: Gift
};

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg px-3 py-1.5" style={{ background: "#1A1010", border: "1px solid #2A1F1F" }}>
      <p style={{ color: d.payload.color, fontSize: "11px", fontWeight: 700 }}>{d.name}</p>
      <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>{d.value}%</p>
    </div>
  );
}

// ─── 1. KPI Cards ─────────────────────────────────────────────────────────────

interface KpiCardsProps {
  team: TeamMember[];
  requests: LeaveRequest[];
  openRoles: OpenRole[];
}

function KpiCards({ team, requests, openRoles }: KpiCardsProps) {
  const total     = team.length;
  const inhouse   = team.filter((t) => t.type === "inhouse").length;
  const freelance = team.filter((t) => t.type === "freelancer").length;
  const present   = team.filter((t) => t.status !== "absent").length;
  const absent    = team.filter((t) => t.status === "absent").length;
  const late      = team.filter((t) => t.checkin && t.checkin > "08:15").length;
  const urgent    = openRoles.filter((r) => r.priority === "urgent").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          label: "Tổng nhân sự",
          value: String(total),
          icon: Users,
          color: "#EEEEEE",
          detail: `${inhouse} in-house · ${freelance} freelancer`,
          bar: null,
        },
        {
          label: "Hiện diện hôm nay",
          value: String(present),
          icon: UserCheck,
          color: "#4ade80",
          detail: `${absent} vắng · ${late} đi muộn`,
          bar: { value: total > 0 ? Math.round((present / total) * 100) : 0, color: "#4ade80" },
        },
        {
          label: "Chờ duyệt",
          value: String(requests.filter((r) => r.status === "pending").length),
          icon: ClipboardList,
          color: requests.some((r) => r.urgent && r.status === "pending") ? "#f87171" : "#fbbf24",
          detail: `${requests.filter((r) => r.urgent && r.status === "pending").length} khẩn cần xử lý`,
          bar: null,
        },
        {
          label: "Vị trí đang tuyển",
          value: String(openRoles.length),
          icon: Briefcase,
          color: "#c084fc",
          detail: `${urgent} vị trí cần gấp`,
          bar: null,
        },
      ].map((c) => (
        <div
          key={c.label}
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: "#555", fontSize: "12px", fontWeight: 500 }}>{c.label}</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.color + "18" }}>
              <c.icon size={15} style={{ color: c.color }} />
            </div>
          </div>
          <p style={{ color: c.color, fontSize: "36px", fontWeight: 800, lineHeight: 1, letterSpacing: "-1px" }}>
            {c.value}
          </p>
          {c.bar && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                <div className="h-full rounded-full" style={{ width: `${c.bar.value}%`, background: c.bar.color }} />
              </div>
              <span style={{ color: "#444", fontSize: "10px" }}>{c.bar.value}% tỉ lệ hiện diện</span>
            </div>
          )}
          <p style={{ color: "#444", fontSize: "11px", marginTop: c.bar ? 0 : "auto" }}>{c.detail}</p>
        </div>
      ))}
    </div>
  );
}

// ─── 2. Today's Status ────────────────────────────────────────────────────────

interface TodayStatusProps {
  team: TeamMember[];
}

function TodayStatus({ team }: TodayStatusProps) {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);

  const filteredTeam = team.filter((m) => {
    if (!search) return true;
    return (
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.dept.toLowerCase().includes(search.toLowerCase())
    );
  });

  const groups = [
    { key: "office",  label: "Tại văn phòng",    members: filteredTeam.filter((t) => t.status === "office") },
    { key: "onsite",  label: "Hiện trường / Quay", members: filteredTeam.filter((t) => t.status === "onsite") },
    { key: "wfh",     label: "Làm từ xa (WFH)",  members: filteredTeam.filter((t) => t.status === "wfh") },
    { key: "absent",  label: "Vắng mặt",         members: filteredTeam.filter((t) => t.status === "absent") },
  ].filter((g) => g.members.length > 0);


  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 gap-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Trạng thái hôm nay</p>
          <p style={{ color: "#555", fontSize: "11px" }}>{new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-full sm:w-60"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)" }}
          >
            <Search size={12} style={{ color: "#555" }} />
            <input
              placeholder="Lọc theo tên, vị trí, ban..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: "#EEEEEE" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: "#555" }} className="hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>LIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x" style={{ borderColor: "#2A1F1F" }}>
        {groups.map((g) => {
          const cfg = statusLocation[g.key];
          return (
            <div key={g.key} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <cfg.icon size={13} style={{ color: cfg.color }} />
                <span style={{ color: cfg.color, fontSize: "11px", fontWeight: 600 }}>{g.label}</span>
                <span
                  className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {g.members.length}
                </span>
              </div>
              <div className="space-y-2">
                {g.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    {renderAvatar(m.avatar, "w-6 h-6", { background: "#2A1F1F", color: "#EEEEEE", fontSize: "9px" })}
                    <div className="min-w-0">
                      <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500 }} className="truncate">
                        {m.name.split(" ").slice(-2).join(" ")}
                      </p>
                      <p style={{ color: "#444", fontSize: "9px" }}>{m.role}</p>
                    </div>
                    {m.checkin && (
                      <span style={{ color: "#444", fontSize: "9px", marginLeft: "auto", flexShrink: 0 }}>
                        {m.checkin}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function renderAvatar(avatar: string, sizeClass = "w-6 h-6", textStyle?: React.CSSProperties) {
  const isUrl = avatar && (avatar.startsWith("http") || avatar.startsWith("/") || avatar.includes(".") || avatar.includes("uploads"));
  if (isUrl) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold`}
      style={textStyle || { background: "#2A1F1F", color: "#EEEEEE" }}
    >
      {avatar}
    </div>
  );
}

const mapDbToRequest = (m: any): LeaveRequest => ({
  id: m.id,
  employee: m.employee_name,
  avatar: m.avatar,
  type: m.type as ReqType,
  status: m.status as ReqStatus,
  date: m.date,
  reason: m.reason,
  submitted: m.submitted_at,
  urgent: m.urgent
});

// ─── 3. Pending Requests ──────────────────────────────────────────────────────

interface PendingRequestsProps {
  requests: LeaveRequest[];
  onRefresh: () => void;
}

function PendingRequests({ requests, onRefresh }: PendingRequestsProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function act(id: number, status: ReqStatus) {
    setLoadingId(id);
    try {
      await fetchApi(`/hr/leave-requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update request status:", err);
    } finally {
      setLoadingId(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const done    = requests.filter((r) => r.status !== "pending");

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Đơn từ Chờ duyệt</p>
          <p style={{ color: "#555", fontSize: "11px" }}>
            {pending.length} chờ xử lý
            {pending.some((r) => r.urgent) && (
              <span style={{ color: "#f87171" }}> · {pending.filter((r) => r.urgent).length} khẩn</span>
            )}
          </p>
        </div>
        {pending.some((r) => r.urgent) && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#7f1d1d33", color: "#f87171" }}>
            <AlertTriangle size={11} /> Cần xử lý ngay
          </span>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
        {pending.map((req) => {
          const cfg = reqTypeCfg[req.type] || { label: req.type || "Đơn từ", color: "#888888", icon: Calendar };
          const isLoading = loadingId === req.id;
          return (
            <div
              key={req.id}
              className="flex items-center gap-4 px-6 py-4"
              style={{ background: req.urgent ? "#7f1d1d08" : "transparent" }}
            >
              {/* Type icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.color + "18", border: `1px solid ${cfg.color}33` }}>
                <cfg.icon size={15} style={{ color: cfg.color }} />
              </div>

              {/* Avatar */}
              {renderAvatar(req.avatar, "w-8 h-8", { background: "#8E1616", color: "#EEEEEE" })}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{req.employee}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: cfg.color + "18", color: cfg.color }}>
                    {cfg.label}
                  </span>
                  {req.urgent && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "#7f1d1d33", color: "#f87171" }}>
                      Khẩn
                    </span>
                  )}
                </div>
                <p style={{ color: "#666", fontSize: "12px" }} className="mt-0.5 truncate">{req.reason}</p>
                <p style={{ color: "#444", fontSize: "10px" }} className="mt-0.5">
                  Ngày: {req.date} · Gửi: {req.submitted}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => act(req.id, "approved")}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#14532d33", color: "#4ade80" }}>
                  {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Duyệt
                </button>
                <button
                  onClick={() => act(req.id, "rejected")}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#7f1d1d33", color: "#f87171" }}>
                  {isLoading ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />} Từ chối
                </button>
              </div>
            </div>
          );
        })}

        {/* Processed */}
        {done.map((req) => {
          const cfg = reqTypeCfg[req.type] || { label: req.type || "Đơn từ", color: "#888888", icon: Calendar };
          const approved = req.status === "approved";
          return (
            <div key={req.id} className="flex items-center gap-4 px-6 py-3" style={{ opacity: 0.45 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#2A1F1F" }}>
                <cfg.icon size={15} style={{ color: "#555" }} />
              </div>
              {renderAvatar(req.avatar, "w-8 h-8", { background: "#2A1F1F", color: "#555" })}
              <div className="flex-1 min-w-0">
                <span style={{ color: "#666", fontSize: "12px" }}>{req.employee} · {cfg.label} · {req.date}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                style={{
                  background: approved ? "#14532d22" : "#7f1d1d22",
                  color: approved ? "#4ade80" : "#f87171",
                }}>
                {approved ? "Đã duyệt" : "Từ chối"}
              </span>
            </div>
          );
        })}

        {pending.length === 0 && done.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p style={{ color: "#444", fontSize: "13px" }}>Không có đơn từ nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. HR Alerts ─────────────────────────────────────────────────────────────

interface HRAlertsProps {
  alerts: HRAlert[];
}

function getAlertIcon(alert: any) {
  const title = alert.title || "";
  if (alert.level === "gold") {
    if (title.includes("Sinh nhật")) return Cake;
    if (title.includes("xuất sắc")) return Star;
    if (title.includes("Kỷ niệm")) return Gift;
    return Star;
  }
  if (alert.level === "error") {
    if (title.includes("thử việc")) return AlertTriangle;
    if (title.includes("HĐ cộng tác")) return FileText;
    return AlertTriangle;
  }
  if (alert.level === "warning") {
    if (title.includes("đánh giá")) return RefreshCcw;
    if (title.includes("báo cáo")) return Clock;
    return AlertTriangle;
  }
  return AlertTriangle;
}

function HRAlerts({ alerts }: HRAlertsProps) {
  const errors   = alerts.filter((a) => a.level === "error");
  const warnings = alerts.filter((a) => a.level === "warning");
  const gold     = alerts.filter((a) => a.level === "gold");

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Cảnh báo & Nhắc nhở HR</p>
          <p style={{ color: "#555", fontSize: "11px" }}>
            {errors.length} khẩn cấp · {warnings.length} chú ý · {gold.length} sự kiện
          </p>
        </div>
        <Bell size={15} style={{ color: "#555" }} />
      </div>

      <div className="divide-y" style={{ borderColor: "#1A1010" }}>
        {alerts.map((alert) => {
          const s = alertStyle[alert.level];
          const isGold = alert.level === "gold";
          const IconComponent = getAlertIcon(alert);
          return (
            <div
              key={alert.id}
              className="flex items-center gap-4 px-6 py-4"
              style={{ background: s.bg, borderLeft: `3px solid ${isGold ? "#fbbf2444" : alert.level === "error" ? "#f8717133" : "#fbbf2433"}` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.icon + "18" }}
              >
                <IconComponent size={16} style={{ color: s.icon }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: isGold ? "#fbbf24" : "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                  {alert.title}
                </p>
                <p style={{ color: "#666", fontSize: "11px" }} className="mt-0.5">{alert.sub}</p>
              </div>
              {alert.daysLeft !== undefined && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: alert.daysLeft <= 3 ? "#7f1d1d33" : "#78350f33",
                    color: alert.daysLeft <= 3 ? "#f87171" : "#fbbf24",
                  }}
                >
                  {alert.daysLeft} ngày
                </span>
              )}
              {alert.action && (
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-80 whitespace-nowrap"
                  style={{
                    background: isGold ? "#78350f33" : alert.level === "error" ? "#7f1d1d33" : "#2A1F1F",
                    color: isGold ? "#fbbf24" : alert.level === "error" ? "#f87171" : "#EEEEEE",
                  }}
                >
                  {alert.action}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 5. Resource Allocation ───────────────────────────────────────────────────

interface ResourceAllocationProps {
  team: TeamMember[];
  openRoles: OpenRole[];
}

function ResourceAllocation({ team, openRoles }: ResourceAllocationProps) {
  const depts = ["Production", "Account", "Design", "Tech", "Content"];
  const colors: Record<string, string> = {
    Production: "#D84040",
    Account: "#60a5fa",
    Design: "#c084fc",
    Tech: "#fbbf24",
    Content: "#888",
  };

  const totalMembers = team.length || 1;
  const deptCounts = depts.map((name) => {
    const count = team.filter((t) => t.dept === name).length;
    const value = Math.round((count / totalMembers) * 100);
    return { name, value, count, color: colors[name] || "#888" };
  });

  const maxVal = Math.max(...deptCounts.map((d) => d.value)) || 1;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Phân bổ Nguồn lực</p>
        <p style={{ color: "#555", fontSize: "11px" }}>Resource Allocation · Cơ cấu phòng ban</p>
      </div>

      <div className="px-6 py-5 flex items-center gap-6">
        {/* Donut */}
        <div style={{ width: 150, height: 150, flexShrink: 0 }}>
          <ResponsiveContainer minWidth={1} minHeight={1} width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptCounts}
                cx="50%" cy="50%"
                innerRadius={42} outerRadius={68}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {deptCounts.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <ReTooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bars */}
        <div className="flex-1 space-y-3">
          {deptCounts.map((d) => {
            return (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    <span style={{ color: "#888", fontSize: "12px" }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#555", fontSize: "10px" }}>{d.count} người</span>
                    <span style={{ color: d.color, fontSize: "12px", fontWeight: 700, minWidth: "32px", textAlign: "right" }}>
                      {d.value}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(d.value / maxVal) * 100}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open roles */}
      <div className="px-6 pb-5 space-y-2">
        <p style={{ color: "#555", fontSize: "11px", fontWeight: 600 }} className="mb-2">
          Vị trí đang tuyển dụng
        </p>
        {openRoles.map((r) => (
          <div key={r.title} className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: "#141010" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: r.priority === "urgent" ? "#f87171" : "#555" }} />
              <span style={{ color: "#EEEEEE", fontSize: "12px" }}>{r.title}</span>
              <span style={{ color: "#555", fontSize: "10px" }}>{r.dept}</span>
            </div>
            <div className="flex items-center gap-2">
              {r.priority === "urgent" && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "#7f1d1d33", color: "#f87171" }}>Gấp</span>
              )}
              <span style={{ color: "#444", fontSize: "10px" }}>Từ {r.since}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function HROverviewPage() {
  const [data, setData] = useState<{
    team: TeamMember[];
    requests: LeaveRequest[];
    alerts: HRAlert[];
    openRoles: OpenRole[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchApi<any>("/hr/overview");
      if (res) {
        setData({
          team: res.team || [],
          requests: (res.requests || []).map(mapDbToRequest),
          alerts: res.alerts || [],
          openRoles: res.open_roles || []
        });
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin tổng quan nhân sự");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D84040]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 mb-4">{error || "Lỗi tải dữ liệu"}</p>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-[#D84040] text-white">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>HR</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Tổng quan</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>Xem:</span>
          <select className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", border: "1px solid #2A1F1F" }}
            defaultValue={new Date().toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}>
            <option value={new Date().toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}>
              Tháng {new Date().toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
            </option>
            <option value="q2">Q2 {new Date().getFullYear()}</option>
            <option value="h1">H1 {new Date().getFullYear()}</option>
          </select>
        </div>
      </div>

      {/* 1 – KPI */}
      <KpiCards team={data.team} requests={data.requests} openRoles={data.openRoles} />

      {/* 2 – Today's Status */}
      <TodayStatus team={data.team} />

      {/* 3+5 – Requests + Resource */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PendingRequests requests={data.requests} onRefresh={loadData} />
        </div>
        <div className="lg:col-span-2">
          <ResourceAllocation team={data.team} openRoles={data.openRoles} />
        </div>
      </div>

      {/* 4 – HR Alerts */}
      <HRAlerts alerts={data.alerts} />
    </div>
  );
}
