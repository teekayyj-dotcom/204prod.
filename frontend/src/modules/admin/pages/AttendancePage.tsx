import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  UserX,
  TrendingUp,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Circle,
  Wifi,
  Calendar,
  MapPin,
  Shield,
  Sunrise,
  Coffee,
  FileText,
  Plane,
  Home,
  PenLine,
  Plus,
  Settings,
  Check,
  X,
} from "lucide-react";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  { id: 1, name: "Nguyễn Minh Anh", role: "Designer", avatar: "MA" },
  { id: 2, name: "Trần Quốc Bảo", role: "Developer", avatar: "QB" },
  { id: 3, name: "Lê Thị Cẩm", role: "PM", avatar: "TC" },
  { id: 4, name: "Phạm Đức Dũng", role: "Developer", avatar: "DD" },
  { id: 5, name: "Hoàng Thị Em", role: "QA", avatar: "TE" },
  { id: 6, name: "Vũ Văn Phúc", role: "Designer", avatar: "VP" },
];

type LogStatus = "on-time" | "late" | "absent" | "wfh";

const LIVE_LOG: {
  id: number;
  employee: string;
  avatar: string;
  action: "check-in" | "check-out";
  time: string;
  status: LogStatus;
  note?: string;
}[] = [
  { id: 1, employee: "Nguyễn Minh Anh", avatar: "MA", action: "check-in",  time: "08:02", status: "on-time" },
  { id: 2, employee: "Trần Quốc Bảo",   avatar: "QB", action: "check-in",  time: "08:31", status: "late",    note: "Muộn 31 phút" },
  { id: 3, employee: "Lê Thị Cẩm",      avatar: "TC", action: "check-in",  time: "07:58", status: "on-time" },
  { id: 4, employee: "Phạm Đức Dũng",   avatar: "DD", action: "check-in",  time: "09:10", status: "late",    note: "Muộn 1h10p" },
  { id: 5, employee: "Hoàng Thị Em",    avatar: "TE", action: "check-in",  time: "08:00", status: "wfh",     note: "WFH" },
  { id: 6, employee: "Nguyễn Minh Anh", avatar: "MA", action: "check-out", time: "17:05", status: "on-time" },
  { id: 7, employee: "Lê Thị Cẩm",      avatar: "TC", action: "check-out", time: "18:30", status: "on-time", note: "OT 1h30p" },
  { id: 8, employee: "Vũ Văn Phúc",     avatar: "VP", action: "check-in",  time: "08:05", status: "on-time" },
];

type DayStatus = "on-time" | "late" | "absent" | "wfh" | "holiday" | "weekend" | "-";

const TIMESHEET_DATA: {
  employee: { name: string; avatar: string; role: string };
  days: DayStatus[];
  totalDays: number;
  ot: string;
  lateMin: number;
}[] = [
  {
    employee: { name: "Nguyễn Minh Anh", avatar: "MA", role: "Designer" },
    days: ["on-time","on-time","late","on-time","on-time","weekend","weekend","on-time","on-time","on-time","absent","on-time","on-time","weekend","weekend","on-time","wfh","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time"],
    totalDays: 27, ot: "4h30", lateMin: 15,
  },
  {
    employee: { name: "Trần Quốc Bảo", avatar: "QB", role: "Developer" },
    days: ["on-time","late","on-time","on-time","on-time","weekend","weekend","late","on-time","on-time","on-time","on-time","late","weekend","weekend","on-time","on-time","absent","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time"],
    totalDays: 25, ot: "0h", lateMin: 95,
  },
  {
    employee: { name: "Lê Thị Cẩm", avatar: "TC", role: "PM" },
    days: ["on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time"],
    totalDays: 30, ot: "8h", lateMin: 0,
  },
  {
    employee: { name: "Phạm Đức Dũng", avatar: "DD", role: "Developer" },
    days: ["late","on-time","on-time","absent","on-time","weekend","weekend","on-time","late","on-time","on-time","on-time","on-time","weekend","weekend","absent","on-time","on-time","on-time","late","weekend","weekend","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time"],
    totalDays: 24, ot: "2h", lateMin: 130,
  },
  {
    employee: { name: "Hoàng Thị Em", avatar: "TE", role: "QA" },
    days: ["wfh","wfh","on-time","on-time","on-time","weekend","weekend","on-time","wfh","on-time","on-time","on-time","on-time","weekend","weekend","on-time","wfh","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","wfh","weekend","weekend","on-time"],
    totalDays: 28, ot: "1h", lateMin: 0,
  },
  {
    employee: { name: "Vũ Văn Phúc", avatar: "VP", role: "Designer" },
    days: ["on-time","on-time","on-time","on-time","absent","weekend","weekend","on-time","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","on-time","on-time","weekend","weekend","on-time","on-time","on-time","late","on-time","weekend","weekend","on-time"],
    totalDays: 28, ot: "3h", lateMin: 20,
  },
];

type RequestStatus = "pending" | "approved" | "rejected";
type RequestType = "leave" | "wfh" | "business" | "explain";

const REQUESTS: {
  id: number;
  employee: string;
  avatar: string;
  type: RequestType;
  status: RequestStatus;
  date: string;
  reason: string;
  submittedAt: string;
}[] = [
  { id: 1, employee: "Trần Quốc Bảo",   avatar: "QB", type: "explain",  status: "pending",  date: "20/06/2026", reason: "Quên check-in buổi sáng ngày 20/06",          submittedAt: "21/06 09:15" },
  { id: 2, employee: "Phạm Đức Dũng",   avatar: "DD", type: "leave",    status: "pending",  date: "25–27/06/2026", reason: "Nghỉ phép năm",                             submittedAt: "20/06 14:30" },
  { id: 3, employee: "Hoàng Thị Em",    avatar: "TE", type: "wfh",      status: "approved", date: "23/06/2026", reason: "Làm việc tại nhà, có kết nối đầy đủ",         submittedAt: "22/06 08:00" },
  { id: 4, employee: "Nguyễn Minh Anh", avatar: "MA", type: "business", status: "approved", date: "18–19/06/2026", reason: "Công tác Hà Nội gặp khách hàng",           submittedAt: "15/06 10:00" },
  { id: 5, employee: "Vũ Văn Phúc",     avatar: "VP", type: "leave",    status: "rejected", date: "22/06/2026", reason: "Nghỉ việc cá nhân",                           submittedAt: "19/06 16:45" },
  { id: 6, employee: "Lê Thị Cẩm",      avatar: "TC", type: "explain",  status: "approved", date: "10/06/2026", reason: "Check-out muộn do họp kéo dài ngoài văn phòng", submittedAt: "11/06 07:55" },
];

const SHIFTS = [
  { id: 1, name: "Ca Hành Chính", start: "08:00", end: "17:00", break: "12:00–13:00", days: "T2–T6" },
  { id: 2, name: "Ca Sáng Sớm",  start: "06:00", end: "14:00", break: "10:00–10:30", days: "T2–T7" },
  { id: 3, name: "Ca Chiều",     start: "13:00", end: "21:00", break: "17:00–17:30", days: "T2–T7" },
];

const HOLIDAYS = [
  { date: "30/04/2026", name: "Ngày Giải phóng miền Nam" },
  { date: "01/05/2026", name: "Quốc tế Lao động" },
  { date: "02/09/2026", name: "Quốc khánh" },
  { date: "10/03/2026 (âl)", name: "Giỗ Tổ Hùng Vương" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LogStatus | RequestStatus | RequestType }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    "on-time":  { label: "Đúng giờ",  bg: "#14532d22", color: "#4ade80" },
    late:       { label: "Đi muộn",   bg: "#78350f33", color: "#fbbf24" },
    absent:     { label: "Vắng mặt",  bg: "#7f1d1d33", color: "#f87171" },
    wfh:        { label: "WFH",       bg: "#1e3a5f33", color: "#60a5fa" },
    pending:    { label: "Chờ duyệt", bg: "#78350f33", color: "#fbbf24" },
    approved:   { label: "Đã duyệt",  bg: "#14532d22", color: "#4ade80" },
    rejected:   { label: "Từ chối",   bg: "#7f1d1d33", color: "#f87171" },
    leave:      { label: "Nghỉ phép", bg: "#7f1d1d22", color: "#f87171" },
    business:   { label: "Công tác",  bg: "#1e3a5f33", color: "#60a5fa" },
    explain:    { label: "Giải trình",bg: "#3b1f5f33", color: "#c084fc" },
  };
  const cfg = map[status] ?? { label: status, bg: "#2A1F1F", color: "#EEEEEE" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function DayCell({ status }: { status: DayStatus }) {
  const map: Record<DayStatus, { bg: string; title: string }> = {
    "on-time": { bg: "#4ade8044", title: "Đúng giờ" },
    late:      { bg: "#fbbf2444", title: "Đi muộn" },
    absent:    { bg: "#f8717144", title: "Vắng mặt" },
    wfh:       { bg: "#60a5fa44", title: "WFH" },
    holiday:   { bg: "#c084fc44", title: "Lễ" },
    weekend:   { bg: "#2A1F1F",   title: "Cuối tuần" },
    "-":       { bg: "transparent", title: "" },
  };
  const cfg = map[status];
  return (
    <td className="p-0.5" title={cfg.title}>
      <div
        className="w-5 h-5 rounded-sm mx-auto"
        style={{ background: cfg.bg }}
      />
    </td>
  );
}

function Avatar({ initials, size = 8 }: { initials: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{ background: "#8E1616", color: "#EEEEEE", fontSize: size <= 8 ? "11px" : "13px", fontWeight: 700 }}
    >
      {initials}
    </div>
  );
}

// ─── Tab: Tổng quan ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const visibleLogs = LIVE_LOG.slice(0, 5 + (tick % 4));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Nhân viên đang làm việc", value: "4 / 6", sub: "2 WFH", icon: Users,     color: "#4ade80" },
          { label: "Đi làm muộn",             value: "2",     sub: "Hôm nay", icon: Clock,   color: "#fbbf24" },
          { label: "Vắng mặt",                value: "0",     sub: "Hôm nay", icon: UserX,   color: "#f87171" },
          { label: "Tỉ lệ chuyên cần",        value: "94.2%", sub: "Tháng 6", icon: TrendingUp, color: "#60a5fa" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <div className="flex items-center justify-between">
              <p style={{ color: "#666", fontSize: "12px", fontWeight: 500 }}>{card.label}</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: card.color + "22" }}
              >
                <card.icon size={15} style={{ color: card.color }} />
              </div>
            </div>
            <div>
              <p style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1 }}>
                {card.value}
              </p>
              <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live log */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #2A1F1F" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
              Nhật ký Check-in / Check-out
            </span>
            <span style={{ color: "#555", fontSize: "12px" }}>— Hôm nay, 23/06/2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={13} style={{ color: "#4ade80" }} />
            <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>LIVE</span>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
          {visibleLogs.map((log, i) => (
            <div
              key={log.id}
              className="flex items-center gap-4 px-5 py-3 transition-all"
              style={{
                opacity: i === visibleLogs.length - 1 && tick > 0 ? 0.7 : 1,
                background: i === visibleLogs.length - 1 && tick > 0 ? "#1D1616" : "transparent",
              }}
            >
              <Avatar initials={log.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                    {log.employee}
                  </span>
                  <StatusBadge status={log.status} />
                  {log.note && (
                    <span style={{ color: "#666", fontSize: "11px" }}>{log.note}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {log.action === "check-in" ? (
                  <LogIn size={14} style={{ color: "#4ade80" }} />
                ) : (
                  <LogOut size={14} style={{ color: "#f87171" }} />
                )}
                <span style={{ color: log.action === "check-in" ? "#4ade80" : "#f87171", fontSize: "12px", fontWeight: 600 }}>
                  {log.action === "check-in" ? "Check-in" : "Check-out"}
                </span>
                <span
                  className="ml-2 tabular-nums"
                  style={{ color: "#666", fontSize: "12px" }}
                >
                  {log.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Bảng chấm công ───────────────────────────────────────────────────────

function TimesheetTab() {
  const [month, setMonth] = useState(5); // 0-indexed, June = 5
  const monthNames = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
  const days = daysInMonth[month];
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setMonth((m) => Math.max(0, m - 1))}
            className="transition-colors"
            style={{ color: "#666" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#EEEEEE")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#666")}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
            {monthNames[month]} 2026
          </span>
          <button
            onClick={() => setMonth((m) => Math.min(11, m + 1))}
            className="transition-colors"
            style={{ color: "#666" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#EEEEEE")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#666")}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {[
            { color: "#4ade8044", label: "Đúng giờ" },
            { color: "#fbbf2444", label: "Đi muộn" },
            { color: "#f8717144", label: "Vắng" },
            { color: "#60a5fa44", label: "WFH" },
            { color: "#2A1F1F",   label: "Cuối tuần" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm" style={{ background: l.color }} />
              <span style={{ color: "#666", fontSize: "11px" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        className="rounded-xl overflow-auto"
        style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
              <th
                className="px-4 py-3 text-left sticky left-0 z-10"
                style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#666", fontSize: "11px", fontWeight: 600, minWidth: "180px" }}
              >
                NHÂN VIÊN
              </th>
              {dayNumbers.map((d) => (
                <th
                  key={d}
                  className="py-3 text-center"
                  style={{ color: "#555", fontSize: "10px", fontWeight: 600, minWidth: "28px" }}
                >
                  {d}
                </th>
              ))}
              <th className="px-4 py-3 text-center" style={{ color: "#666", fontSize: "11px", fontWeight: 600, minWidth: "70px" }}>Ngày công</th>
              <th className="px-4 py-3 text-center" style={{ color: "#666", fontSize: "11px", fontWeight: 600, minWidth: "60px" }}>OT</th>
              <th className="px-4 py-3 text-center" style={{ color: "#666", fontSize: "11px", fontWeight: 600, minWidth: "80px" }}>Phút muộn</th>
            </tr>
          </thead>
          <tbody>
            {TIMESHEET_DATA.map((row, ri) => (
              <tr
                key={ri}
                style={{ borderBottom: ri < TIMESHEET_DATA.length - 1 ? "1px solid #2A1F1F" : undefined }}
              >
                <td
                  className="px-4 py-2.5 sticky left-0 z-10"
                  style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar initials={row.employee.avatar} size={7} />
                    <div>
                      <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>
                        {row.employee.name}
                      </p>
                      <p style={{ color: "#555", fontSize: "10px" }}>{row.employee.role}</p>
                    </div>
                  </div>
                </td>
                {row.days.slice(0, days).map((s, di) => (
                  <DayCell key={di} status={s} />
                ))}
                <td className="py-2.5 text-center">
                  <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>
                    {row.totalDays}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span style={{ color: row.ot === "0h" ? "#555" : "#4ade80", fontSize: "12px", fontWeight: 600 }}>
                    {row.ot}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span style={{
                    color: row.lateMin === 0 ? "#555" : row.lateMin > 60 ? "#f87171" : "#fbbf24",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}>
                    {row.lateMin === 0 ? "—" : `${row.lateMin} phút`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng ngày công hợp lệ", value: "162 ngày", color: "#4ade80" },
          { label: "Tổng giờ OT", value: "18h30", color: "#60a5fa" },
          { label: "Tổng phút đi muộn", value: "260 phút", color: "#fbbf24" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <span style={{ color: "#666", fontSize: "12px" }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: "16px", fontWeight: 700 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Đơn từ ──────────────────────────────────────────────────────────────

function RequestsTab() {
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [requests, setRequests] = useState(REQUESTS);

  const typeIcon: Record<RequestType, React.ElementType> = {
    leave: Calendar, wfh: Home, business: Plane, explain: PenLine,
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  function updateStatus(id: number, status: RequestStatus) {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs + Add */}
      <div className="flex items-center justify-between">
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {(["all","pending","approved","rejected"] as const).map((f) => {
            const labels = { all: "Tất cả", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
            const count = f === "all" ? requests.length : requests.filter((r) => r.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-md transition-all"
                style={{
                  background: filter === f ? "#D84040" : "transparent",
                  color: filter === f ? "#EEEEEE" : "#666",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {labels[f]} ({count})
              </button>
            );
          })}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
        >
          <Plus size={14} />
          Tạo đơn mới
        </button>
      </div>

      {/* List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: "#555", fontSize: "14px" }}>Không có đơn từ nào</p>
          </div>
        )}
        {filtered.map((req, i) => {
          const Icon = typeIcon[req.type];
          return (
            <div
              key={req.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#2A1F1F" }}
              >
                <Icon size={16} style={{ color: "#8E1616" }} />
              </div>
              <Avatar initials={req.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                    {req.employee}
                  </span>
                  <StatusBadge status={req.type} />
                  <StatusBadge status={req.status} />
                </div>
                <p style={{ color: "#888", fontSize: "12px" }} className="mt-0.5 truncate">
                  {req.reason}
                </p>
                <p style={{ color: "#444", fontSize: "11px" }} className="mt-0.5">
                  Ngày: {req.date} · Gửi lúc {req.submittedAt}
                </p>
              </div>
              {req.status === "pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateStatus(req.id, "approved")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: "#14532d33", color: "#4ade80", fontSize: "12px", fontWeight: 600 }}
                  >
                    <Check size={12} /> Duyệt
                  </button>
                  <button
                    onClick={() => updateStatus(req.id, "rejected")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: "#7f1d1d33", color: "#f87171", fontSize: "12px", fontWeight: 600 }}
                  >
                    <X size={12} /> Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Cài đặt ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [gps, setGps] = useState(true);
  const [qr, setQr] = useState(true);
  const [face, setFace] = useState(false);
  const [ip, setIp] = useState(false);

  function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: on ? "#D84040" : "#2A1F1F" }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{ background: "#EEEEEE", left: on ? "calc(100% - 18px)" : "2px" }}
        />
      </button>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Shifts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Ca làm việc</h3>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#D84040", color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}
          >
            <Plus size={12} /> Thêm ca
          </button>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {SHIFTS.map((shift, i) => (
            <div
              key={shift.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < SHIFTS.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#D8404022" }}
              >
                <Sunrise size={14} style={{ color: "#D84040" }} />
              </div>
              <div className="flex-1">
                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{shift.name}</p>
                <p style={{ color: "#666", fontSize: "11px" }}>
                  {shift.start} – {shift.end} · Nghỉ trưa {shift.break} · {shift.days}
                </p>
              </div>
              <button style={{ color: "#555", fontSize: "12px" }}>Sửa</button>
            </div>
          ))}
        </div>
      </section>

      {/* Holidays */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Ngày nghỉ lễ</h3>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#2A1F1F", color: "#EEEEEE", fontSize: "12px", fontWeight: 600, border: "1px solid #3A2A2A" }}
          >
            <Plus size={12} /> Thêm ngày lễ
          </button>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {HOLIDAYS.map((h, i) => (
            <div
              key={h.date}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < HOLIDAYS.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div className="flex items-center gap-3">
                <Coffee size={14} style={{ color: "#c084fc" }} />
                <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{h.name}</span>
              </div>
              <span style={{ color: "#666", fontSize: "12px" }}>{h.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Location & Method */}
      <section>
        <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="mb-3">
          Vị trí & Hình thức check-in
        </h3>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {[
            { icon: MapPin,  label: "GPS (Bán kính 100m từ văn phòng)", sub: "21.0278, 105.8342 — Hà Nội", on: gps, toggle: () => setGps(!gps) },
            { icon: FileText,label: "QR Code check-in",                sub: "Quét mã tại cổng vào",      on: qr,  toggle: () => setQr(!qr) },
            { icon: Shield,  label: "Nhận diện khuôn mặt (FaceID)",    sub: "Yêu cầu thiết bị hỗ trợ",  on: face, toggle: () => setFace(!face) },
            { icon: Wifi,    label: "Dải IP nội bộ",                   sub: "192.168.1.0/24",            on: ip,  toggle: () => setIp(!ip) },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: item.on ? "#D8404022" : "#2A1F1F" }}
              >
                <item.icon size={14} style={{ color: item.on ? "#D84040" : "#555" }} />
              </div>
              <div className="flex-1">
                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{item.label}</p>
                <p style={{ color: "#555", fontSize: "11px" }}>{item.sub}</p>
              </div>
              <Toggle on={item.on} onChange={item.toggle} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "timesheet" | "requests" | "settings";

export function AttendancePage() {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview",   label: "Tổng quan",     icon: TrendingUp },
    { key: "timesheet",  label: "Bảng chấm công", icon: Calendar },
    { key: "requests",   label: "Đơn từ",         icon: FileText },
    { key: "settings",   label: "Cài đặt",        icon: Settings },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#D8404022", border: "1px solid #D8404044" }}
        >
          <Clock size={22} style={{ color: "#D84040" }} />
        </div>
        <div>
          <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>
            HR
          </p>
          <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>
            Chấm Công
          </h1>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-7 w-fit"
        style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              background: tab === t.key ? "#D84040" : "transparent",
              color: tab === t.key ? "#EEEEEE" : "#666",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"  && <OverviewTab />}
      {tab === "timesheet" && <TimesheetTab />}
      {tab === "requests"  && <RequestsTab />}
      {tab === "settings"  && <SettingsTab />}
    </div>
  );
}
