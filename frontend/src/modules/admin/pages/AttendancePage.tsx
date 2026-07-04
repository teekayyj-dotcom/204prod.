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
  Loader2
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

// Mock data removed

type LogStatus = "on-time" | "late" | "absent" | "wfh";

interface CheckInLog {
  id: number;
  employee: string;
  avatar: string;
  action: "check-in" | "check-out";
  time: string;
  date: string;
  status: LogStatus;
  note?: string;
}

const mapDbToLog = (m: any): CheckInLog => ({
  id: m.id,
  employee: m.employee_name,
  avatar: m.avatar,
  action: m.action,
  time: m.time,
  date: m.date,
  status: m.status,
  note: m.note
});

type DayStatus = "on-time" | "late" | "absent" | "wfh" | "holiday" | "weekend" | "-";

export interface TimesheetData {
  employee: { name: string; avatar: string; role: string };
  days: DayStatus[];
  totalDays: number;
  ot: string;
  lateMin: number;
}

type RequestStatus = "pending" | "approved" | "rejected";
type RequestType = "leave" | "wfh" | "business" | "explain" | "sick" | "ot";

interface LeaveRequest {
  id: number;
  employee: string;
  avatar: string;
  type: RequestType;
  status: RequestStatus;
  date: string;
  reason: string;
  submittedAt: string;
  urgent?: boolean;
}

const mapDbToRequest = (m: any): LeaveRequest => ({
  id: m.id,
  employee: m.employee_name,
  avatar: m.avatar,
  type: m.type,
  status: m.status,
  date: m.date,
  reason: m.reason,
  submittedAt: m.submitted_at,
  urgent: m.urgent
});


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
  const isUrl = initials && (initials.startsWith("http") || initials.startsWith("/") || initials.includes(".") || initials.includes("uploads"));
  if (isUrl) {
    return (
      <img
        src={initials}
        alt="avatar"
        className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
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

interface OverviewTabProps {
  liveLog: CheckInLog[];
  stats: any;
}

function OverviewTab({ liveLog, stats }: OverviewTabProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const visibleLogs = liveLog
    .filter(log => log.date === new Date().toISOString().split("T")[0])
    .slice(0, 5 + (tick % 4));

  const workingCount = stats?.workingCount || 0;
  const wfhCount = stats?.wfhCount || 0;
  const lateCount = stats?.lateCount || 0;
  const absentCount = stats?.absentCount || 0;
  const totalEmployees = stats?.totalEmployees || 0;
  const attendanceRate = stats?.attendanceRate || "0%";

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Nhân viên đang làm việc", value: `${workingCount} / ${totalEmployees}`, sub: `${wfhCount} WFH`, icon: Users,     color: "#4ade80" },
          { label: "Đi làm muộn",             value: String(lateCount),     sub: "Hôm nay", icon: Clock,   color: "#fbbf24" },
          { label: "Vắng mặt",                value: String(absentCount),     sub: "Hôm nay", icon: UserX,   color: "#f87171" },
          { label: "Tỉ lệ chuyên cần",        value: attendanceRate, sub: "Tháng này", icon: TrendingUp, color: "#60a5fa" },
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
            <span style={{ color: "#555", fontSize: "12px" }}>— Hôm nay, {new Date().toLocaleDateString("vi-VN")}</span>
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
          {visibleLogs.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p style={{ color: "#444", fontSize: "13px" }}>Chưa có hoạt động check-in nào hôm nay</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Tab: Bảng chấm công ───────────────────────────────────────────────────────

function TimesheetTab() {
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
  const [year, setYear] = useState(new Date().getFullYear());
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([]);
  const [loading, setLoading] = useState(false);

  const monthNames = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = daysInMonth;
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  useEffect(() => {
    const fetchTimesheet = async () => {
      setLoading(true);
      try {
        const data = await fetchApi<TimesheetData[]>(`/hr/timesheet?year=${year}&month=${month + 1}`);
        setTimesheetData(data);
      } catch (err) {
        console.error("Failed to load timesheet", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheet();
  }, [year, month]);

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const sumDays = timesheetData.reduce((acc, r) => acc + r.totalDays, 0);
  const sumLate = timesheetData.reduce((acc, r) => acc + r.lateMin, 0);

  return (
    <div className="space-y-5">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => changeMonth(-1)}
            className="transition-colors"
            style={{ color: "#666" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#EEEEEE")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#666")}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600, minWidth: "80px", textAlign: "center" }}>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
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
            {loading ? (
              <tr>
                <td colSpan={days + 4} className="py-8 text-center">
                  <Loader2 className="animate-spin inline-block text-[#D84040]" size={20} />
                </td>
              </tr>
            ) : timesheetData.length === 0 ? (
              <tr>
                <td colSpan={days + 4} className="py-8 text-center" style={{ color: "#666" }}>
                  Chưa có dữ liệu chấm công
                </td>
              </tr>
            ) : timesheetData.map((row, ri) => (
              <tr
                key={ri}
                style={{ borderBottom: ri < timesheetData.length - 1 ? "1px solid #2A1F1F" : undefined }}
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
          { label: "Tổng ngày công hợp lệ", value: `${sumDays} ngày`, color: "#4ade80" },
          { label: "Tổng giờ OT", value: "0h", color: "#60a5fa" }, // Placeholder for now
          { label: "Tổng phút đi muộn", value: `${sumLate} phút`, color: "#fbbf24" },
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

// ─── Create Request Modal ──────────────────────────────────────────────────────

function CreateRequestModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [form, setForm] = useState({
    type: "leave",
    date: "",
    reason: "",
    urgent: false
  });
  const [submitting, setSubmitting] = useState(false);
  const typeOptions = [
    { value: "leave", label: "Nghỉ phép" },
    { value: "sick", label: "Nghỉ ốm" },
    { value: "ot", label: "Làm thêm giờ" },
    { value: "wfh", label: "WFH" },
    { value: "business", label: "Công tác" },
    { value: "explain", label: "Giải trình" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.reason) {
      alert("Vui lòng điền ngày và lý do!");
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString("vi-VN").slice(0, 5); // DD/MM
      const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      const payload = {
        employee_name: user?.display_name || user?.email || "Unknown",
        avatar: user?.avatar_url || (user?.display_name ? user.display_name.substring(0,2) : "??"),
        type: form.type,
        status: "pending",
        date: form.date,
        reason: form.reason,
        submitted_at: `${dateStr} ${timeStr}`,
        urgent: form.urgent
      };

      await fetchApi("/hr/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onSave();
      onClose();
    } catch (err) {
      alert("Lỗi khi gửi đơn: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: "#141010", border: "1px solid #2A1F1F", color: "#EEEEEE",
    fontSize: "13px", borderRadius: "8px", padding: "8px 12px", width: "100%", outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    color: "#888", fontSize: "11px", fontWeight: 600, marginBottom: "4px", display: "block",
  } as React.CSSProperties;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "#141010", border: "1px solid #2A1F1F" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
          <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>Tạo đơn từ mới</h3>
          <button onClick={onClose} style={{ color: "#888" }} className="hover:opacity-70">
            <X size={16}/>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <span style={labelStyle}>Nhân viên *</span>
            <div style={{ ...inputStyle, background: "#1D1616", color: "#888" }}>
              {user?.display_name || user?.email || "Unknown"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span style={labelStyle}>Loại đơn từ *</span>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
                {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>Thời gian *</span>
              <input placeholder="VD: 25-27/06/2026" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} required />
            </div>
          </div>

          <div>
            <span style={labelStyle}>Lý do chi tiết *</span>
            <textarea rows={3} placeholder="VD: Nghỉ phép năm..." value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, resize: "none" }} required />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#EEEEEE] cursor-pointer">
            <input type="checkbox" checked={form.urgent} onChange={(e) => setForm(f => ({ ...f, urgent: e.target.checked }))} className="rounded accent-[#D84040]" />
            Đơn khẩn cấp (Cần duyệt gấp)
          </label>

          <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid #2A1F1F" }}>
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: "#2A1F1F", color: "#888" }}>Hủy</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: "#D84040", color: "#EEEEEE" }}>
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Gửi đơn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab: Đơn từ ──────────────────────────────────────────────────────────────

interface RequestsTabProps {
  requests: LeaveRequest[];
  onRefresh: () => void;
}

function RequestsTab({ requests, onRefresh }: RequestsTabProps) {
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const typeIcon: Record<RequestType, React.ElementType> = {
    leave: Calendar, wfh: Home, business: Plane, explain: PenLine, sick: UserX, ot: Clock
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  async function updateStatus(id: number, status: RequestStatus) {
    try {
      await fetchApi(`/hr/leave-requests/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      onRefresh();
    } catch (err) {
      alert("Lỗi khi duyệt đơn: " + err.message);
    }
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
          onClick={() => setCreateOpen(true)}
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
          const Icon = typeIcon[req.type] || FileText;
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
                  {req.urgent && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7f1d1d33] color-[#f87171]" style={{ color: "#f87171", background: "rgba(127, 29, 29, 0.2)" }}>KHẨN</span>
                  )}
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
      <CreateRequestModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={onRefresh} />
    </div>
  );
}

// ─── Tab: Cài đặt ─────────────────────────────────────────────────────────────

interface SettingsTabProps {
  shifts: any[];
  holidays: any[];
  onRefresh: () => void;
}

function SettingsTab({ shifts, holidays, onRefresh }: SettingsTabProps) {
  const [gps, setGps] = useState(true);
  const [qr, setQr] = useState(true);
  const [face, setFace] = useState(false);
  const [ip, setIp] = useState(false);

  // Modals state
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);

  // Form states
  const [shiftForm, setShiftForm] = useState({ name: "", start_time: "", end_time: "", break_time: "", days: "" });
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "" });

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

  // Shift logic
  function openAddShift() {
    setSelectedShift(null);
    setShiftForm({ name: "", start_time: "", end_time: "", break_time: "", days: "" });
    setShiftModalOpen(true);
  }

  function openEditShift(shift: any) {
    setSelectedShift(shift);
    setShiftForm({
      name: shift.name,
      start_time: shift.start || shift.start_time,
      end_time: shift.end || shift.end_time,
      break_time: shift.break || shift.break_time,
      days: shift.days
    });
    setShiftModalOpen(true);
  }

  async function handleSaveShift() {
    try {
      if (selectedShift) {
        await fetchApi(`/hr/shifts/${selectedShift.id}`, {
          method: "PUT",
          body: JSON.stringify(shiftForm)
        });
      } else {
        await fetchApi("/hr/shifts", {
          method: "POST",
          body: JSON.stringify(shiftForm)
        });
      }
      setShiftModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteShift(id: number) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ca làm việc này?")) return;
    try {
      await fetchApi(`/hr/shifts/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  // Holiday logic
  function openAddHoliday() {
    setSelectedHoliday(null);
    setHolidayForm({ name: "", date: "" });
    setHolidayModalOpen(true);
  }

  function openEditHoliday(holiday: any) {
    setSelectedHoliday(holiday);
    setHolidayForm({ name: holiday.name, date: holiday.date });
    setHolidayModalOpen(true);
  }

  async function handleSaveHoliday() {
    try {
      if (selectedHoliday) {
        await fetchApi(`/hr/holidays/${selectedHoliday.id}`, {
          method: "PUT",
          body: JSON.stringify(holidayForm)
        });
      } else {
        await fetchApi("/hr/holidays", {
          method: "POST",
          body: JSON.stringify(holidayForm)
        });
      }
      setHolidayModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteHoliday(id: number) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngày lễ này?")) return;
    try {
      await fetchApi(`/hr/holidays/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  const inputStyle = {
    background: "#141010",
    border: "1px solid #2A1F1F",
    color: "#EEEEEE",
    fontSize: "13px",
    borderRadius: "8px",
    padding: "8px 12px",
    width: "100%",
    outline: "none",
    marginTop: "4px",
  } as React.CSSProperties;

  const labelStyle = {
    color: "#888",
    fontSize: "11px",
    fontWeight: 600,
  } as React.CSSProperties;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Shifts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Ca làm việc</h3>
          <button
            onClick={openAddShift}
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
          {shifts.map((shift, i) => (
            <div
              key={shift.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: i < shifts.length - 1 ? "1px solid #2A1F1F" : undefined }}
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
                  {shift.start || shift.start_time} – {shift.end || shift.end_time} · Nghỉ trưa {shift.break || shift.break_time} · {shift.days}
                </p>
              </div>
              <button
                onClick={() => openEditShift(shift)}
                className="px-2.5 py-1 rounded text-xs transition-colors"
                style={{ border: "1px solid #2A1F1F", background: "#1D1616", color: "#888" }}
              >
                Sửa
              </button>
            </div>
          ))}
          {shifts.length === 0 && (
            <div className="px-5 py-8 text-center text-[#555] text-xs">Chưa có ca làm việc</div>
          )}
        </div>
      </section>

      {/* Holidays */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Ngày nghỉ lễ</h3>
          <button
            onClick={openAddHoliday}
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
          {holidays.map((h, i) => (
            <div
              key={h.id || h.date}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < holidays.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div className="flex items-center gap-3">
                <Coffee size={14} style={{ color: "#c084fc" }} />
                <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{h.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ color: "#666", fontSize: "12px" }}>{h.date}</span>
                <button
                  onClick={() => openEditHoliday(h)}
                  className="px-2 py-0.5 rounded border border-[#2A1F1F] bg-[#1D1616] text-[#666] text-[10px]"
                >
                  Sửa
                </button>
              </div>
            </div>
          ))}
          {holidays.length === 0 && (
            <div className="px-5 py-8 text-center text-[#555] text-xs">Chưa có ngày nghỉ lễ</div>
          )}
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

      {/* Shift Modal */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative rounded-xl p-6 w-full max-w-md border border-[#2A1F1F] space-y-4 shadow-2xl" style={{ background: "#141010" }}>
            <div>
              <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>{selectedShift ? "Sửa ca làm việc" : "Thêm ca làm việc"}</h3>
              <p style={{ color: "#555", fontSize: "11px" }}>Nhập cấu hình ca làm việc cho nhân viên</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <span style={labelStyle}>Tên ca làm việc *</span>
                <input placeholder="VD: Ca Hành Chính" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span style={labelStyle}>Giờ bắt đầu *</span>
                  <input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>Giờ kết thúc *</span>
                  <input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span style={labelStyle}>Nghỉ trưa *</span>
                  <input placeholder="VD: 12:00–13:00" value={shiftForm.break_time} onChange={(e) => setShiftForm({ ...shiftForm, break_time: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>Ngày làm việc *</span>
                  <input placeholder="VD: T2–T6" value={shiftForm.days} onChange={(e) => setShiftForm({ ...shiftForm, days: e.target.value })} style={inputStyle} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selectedShift && (
                <button
                  onClick={() => {
                    handleDeleteShift(selectedShift.id);
                    setShiftModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                >
                  Xóa
                </button>
              )}
              <button
                onClick={() => setShiftModalOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ background: "#2A1F1F", color: "#888" }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveShift}
                disabled={!shiftForm.name || !shiftForm.start_time || !shiftForm.end_time}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all text-white"
                style={{ background: "#D84040" }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative rounded-xl p-6 w-full max-w-md border border-[#2A1F1F] space-y-4 shadow-2xl" style={{ background: "#141010" }}>
            <div>
              <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>{selectedHoliday ? "Sửa ngày nghỉ lễ" : "Thêm ngày nghỉ lễ"}</h3>
              <p style={{ color: "#555", fontSize: "11px" }}>Nhập ngày nghỉ lễ chung</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <span style={labelStyle}>Tên ngày lễ *</span>
                <input placeholder="VD: Quốc khánh" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>Ngày nghỉ lễ (DD/MM/YYYY) *</span>
                <input placeholder="VD: 02/09/2026" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selectedHoliday && (
                <button
                  onClick={() => {
                    handleDeleteHoliday(selectedHoliday.id);
                    setHolidayModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                >
                  Xóa
                </button>
              )}
              <button
                onClick={() => setHolidayModalOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ background: "#2A1F1F", color: "#888" }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveHoliday}
                disabled={!holidayForm.name || !holidayForm.date}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all text-white"
                style={{ background: "#D84040" }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "timesheet" | "requests" | "settings";

export function AttendancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [liveLog, setLiveLog] = useState<CheckInLog[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview",   label: "Tổng quan",     icon: TrendingUp },
    { key: "timesheet",  label: "Bảng chấm công", icon: Calendar },
    { key: "requests",   label: "Đơn từ",         icon: FileText },
    { key: "settings",   label: "Cài đặt",        icon: Settings },
  ];

  const loadData = async () => {
    try {
      const [logsData, reqsData, shiftsData, holidaysData, statsData] = await Promise.all([
        fetchApi<any[]>("/hr/attendance-logs"),
        fetchApi<any[]>("/hr/leave-requests"),
        fetchApi<any[]>("/hr/shifts"),
        fetchApi<any[]>("/hr/holidays"),
        fetchApi<any>("/hr/attendance-stats")
      ]);
      setLiveLog(logsData.map(mapDbToLog));
      setRequests(reqsData.map(mapDbToRequest));
      setShifts(shiftsData);
      setHolidays(holidaysData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load attendance page data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#D84040]" size={32} />
      </div>
    );
  }

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
      {tab === "overview"  && <OverviewTab liveLog={liveLog} stats={stats} />}
      {tab === "timesheet" && <TimesheetTab />}
      {tab === "requests"  && <RequestsTab requests={requests} onRefresh={loadData} />}
      {tab === "settings"  && <SettingsTab shifts={shifts} holidays={holidays} onRefresh={loadData} />}
    </div>
  );
}
