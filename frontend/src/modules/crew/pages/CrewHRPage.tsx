// @ts-nocheck
import { useState } from "react";
import {
  UserCircle2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Send,
  ChevronDown,
  Home,
  PlaneTakeoff,
  Stethoscope,
  Coffee,
} from "lucide-react";

// ─── Mock attendance data ─────────────────────────────────────────────────────
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

function generateAttendance() {
  const today = new Date();
  const data: Record<number, { in: string; out: string; hours: number; type: string }> = {};
  for (let d = 1; d < today.getDate(); d++) {
    const date = new Date(currentYear, currentMonth, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // weekend
    if (d === 5) {
      data[d] = { in: "", out: "", hours: 0, type: "leave" };
    } else if (d === 12) {
      data[d] = { in: "08:35", out: "17:45", hours: 9.2, type: "wfh" };
    } else {
      const late = d % 7 === 0;
      data[d] = {
        in: late ? "09:12" : "08:45",
        out: "18:00",
        hours: late ? 8.8 : 9.25,
        type: late ? "late" : "normal",
      };
    }
  }
  return data;
}

const attendanceData = generateAttendance();

const mockLeaveRequests = [
  { id: "lr1", type: "Nghỉ phép", from: "2025-07-05", to: "2025-07-06", reason: "Việc cá nhân", status: "pending", created: "25 Th6" },
  { id: "lr2", type: "WFH", from: "2025-07-10", to: "2025-07-10", reason: "Sức khỏe không tốt", status: "approved", created: "20 Th6" },
  { id: "lr3", type: "Nghỉ phép", from: "2025-06-15", to: "2025-06-15", reason: "Việc gia đình", status: "rejected", created: "10 Th6" },
];

const leaveTypes = [
  { id: "leave", label: "Nghỉ phép năm", icon: PlaneTakeoff, color: "#D84040" },
  { id: "sick", label: "Nghỉ bệnh", icon: Stethoscope, color: "#8B5CF6" },
  { id: "wfh", label: "Làm từ xa (WFH)", icon: Home, color: "#10B981" },
  { id: "other", label: "Nghỉ không lương", icon: Coffee, color: "#D4A843" },
];

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getWeekday0Based(d: Date) {
  return (d.getDay() + 6) % 7; // Monday = 0
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const statusConfig = {
  pending: { label: "Chờ duyệt", color: "#D4A843", icon: AlertCircle },
  approved: { label: "Đã duyệt", color: "#10B981", icon: CheckCircle2 },
  rejected: { label: "Từ chối", color: "#D84040", icon: XCircle },
};

// ─── Main component ───────────────────────────────────────────────────────────
export function CrewHRPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "requests">("attendance");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "leave", from: "", to: "", reason: "" });
  const [requests, setRequests] = useState(mockLeaveRequests);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getWeekday0Based(new Date(currentYear, currentMonth, 1));

  const totalHours = Object.values(attendanceData).reduce((s, d) => s + d.hours, 0);
  const normalDays = Object.values(attendanceData).filter((d) => d.type === "normal").length;
  const lateDays = Object.values(attendanceData).filter((d) => d.type === "late").length;
  const wfhDays = Object.values(attendanceData).filter((d) => d.type === "wfh").length;
  const leaveDays = Object.values(attendanceData).filter((d) => d.type === "leave").length;

  const dayTypeStyle = (type: string) => {
    if (type === "normal") return { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", color: "#10B981" };
    if (type === "wfh") return { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)", color: "#8B5CF6" };
    if (type === "late") return { bg: "rgba(212,168,67,0.12)", border: "rgba(212,168,67,0.3)", color: "#D4A843" };
    if (type === "leave") return { bg: "rgba(216,64,64,0.12)", border: "rgba(216,64,64,0.3)", color: "#D84040" };
    return { bg: "#141010", border: "#2A1F1F", color: "#333" };
  };

  const submitRequest = () => {
    if (!form.from || !form.reason) return;
    setRequests((prev) => [
      {
        id: `lr${Date.now()}`,
        type: leaveTypes.find((t) => t.id === form.type)?.label || form.type,
        from: form.from,
        to: form.to || form.from,
        reason: form.reason,
        status: "pending",
        created: "Hôm nay",
      },
      ...prev,
    ]);
    setForm({ type: "leave", from: "", to: "", reason: "" });
    setShowForm(false);
  };

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
            Cá nhân & HR
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
            Quản lý chấm công và đơn từ nhân sự của bạn
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
          style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}
        >
          <Plus size={15} /> Tạo đơn mới
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Tổng giờ làm", value: `${totalHours.toFixed(1)}h`, sub: "tháng này", color: "#D84040" },
          { label: "Ngày đi làm đúng giờ", value: String(normalDays), sub: "ngày", color: "#10B981" },
          { label: "Đi muộn", value: String(lateDays), sub: "ngày", color: "#D4A843" },
          { label: "WFH / Nghỉ phép", value: `${wfhDays + leaveDays}`, sub: "ngày", color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl px-5 py-4" style={{ background: "#141010", border: "1px solid #2A1F1F" }}>
            <p style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
              {s.label}
            </p>
            <p style={{ color: s.color, fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
            <p style={{ color: "#444", fontSize: "11px", marginTop: "2px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 mb-6 w-fit rounded-xl"
        style={{ background: "#141010", border: "1px solid #2A1F1F" }}
      >
        {(["attendance", "requests"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2 rounded-lg transition-all duration-200"
            style={{
              background: activeTab === tab ? "#D84040" : "transparent",
              color: activeTab === tab ? "#EEEEEE" : "#666",
              fontSize: "13px",
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === "attendance" ? "Lịch sử Chấm công" : "Quản lý Đơn từ"}
          </button>
        ))}
      </div>

      {/* TAB: Attendance calendar */}
      {activeTab === "attendance" && (
        <div className="rounded-2xl p-6" style={{ background: "#141010", border: "1px solid #2A1F1F" }}>
          {/* Month header */}
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>
              Tháng{" "}
              {new Date(currentYear, currentMonth).toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            {/* Legend */}
            <div className="flex items-center gap-4">
              {[
                { label: "Đúng giờ", color: "#10B981" },
                { label: "WFH", color: "#8B5CF6" },
                { label: "Đi muộn", color: "#D4A843" },
                { label: "Nghỉ phép", color: "#D84040" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                  <span style={{ color: "#555", fontSize: "10px" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ color: "#555", fontSize: "10px", fontWeight: 700, textAlign: "center", padding: "4px 0" }}>
                {w}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const att = attendanceData[day];
              const isToday = day === new Date().getDate();
              const isFuture = day > new Date().getDate();
              const style = att ? dayTypeStyle(att.type) : null;

              return (
                <div
                  key={day}
                  className="rounded-xl p-2 transition-all duration-150"
                  style={{
                    background: isToday ? "#D84040" : style ? style.bg : "#1D1616",
                    border: `1px solid ${isToday ? "#D84040" : style ? style.border : "#2A1F1F"}`,
                    minHeight: "70px",
                    cursor: att ? "pointer" : "default",
                    opacity: isFuture ? 0.3 : 1,
                  }}
                  title={att ? `${att.in} – ${att.out} (${att.hours}h)` : ""}
                >
                  <p
                    style={{
                      color: isToday ? "#EEEEEE" : style ? style.color : "#444",
                      fontSize: "12px",
                      fontWeight: isToday ? 700 : 600,
                      marginBottom: "4px",
                    }}
                  >
                    {day}
                  </p>
                  {att && att.type !== "leave" && (
                    <>
                      <p style={{ color: isToday ? "rgba(255,255,255,0.7)" : "#666", fontSize: "9px", lineHeight: 1.3 }}>
                        {att.in}
                      </p>
                      <p style={{ color: isToday ? "rgba(255,255,255,0.7)" : "#666", fontSize: "9px" }}>
                        {att.out}
                      </p>
                      <p style={{ color: isToday ? "#EEEEEE" : style?.color, fontSize: "9px", fontWeight: 700, marginTop: "2px" }}>
                        {att.hours}h
                      </p>
                    </>
                  )}
                  {att && att.type === "leave" && (
                    <p style={{ color: "#D84040", fontSize: "9px", fontWeight: 700 }}>Nghỉ phép</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Leave Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {requests.map((req) => {
            const sc = statusConfig[req.status as keyof typeof statusConfig];
            const lt = leaveTypes.find((t) => t.label === req.type);
            return (
              <div
                key={req.id}
                className="rounded-2xl p-5 flex items-center gap-5"
                style={{ background: "#141010", border: "1px solid #2A1F1F" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: (lt?.color || "#555") + "18",
                    border: `1px solid ${(lt?.color || "#555")}33`,
                  }}
                >
                  {lt ? <lt.icon size={18} style={{ color: lt.color }} /> : <Calendar size={18} style={{ color: "#555" }} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{req.type}</p>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{
                        background: sc.color + "15",
                        border: `1px solid ${sc.color}33`,
                        color: sc.color,
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      <sc.icon size={9} /> {sc.label}
                    </span>
                  </div>
                  <p style={{ color: "#666", fontSize: "12px", marginTop: "3px" }}>
                    {req.from === req.to ? req.from : `${req.from} → ${req.to}`} · {req.reason}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p style={{ color: "#444", fontSize: "11px" }}>Tạo lúc</p>
                  <p style={{ color: "#666", fontSize: "12px", fontWeight: 500 }}>{req.created}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create request modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
              Tạo Đơn mới
            </h2>

            {/* Leave type */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {leaveTypes.map((lt) => (
                <button
                  key={lt.id}
                  onClick={() => setForm((f) => ({ ...f, type: lt.id }))}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: form.type === lt.id ? lt.color + "18" : "#141010",
                    border: `1px solid ${form.type === lt.id ? lt.color + "55" : "#2A1F1F"}`,
                  }}
                >
                  <lt.icon size={14} style={{ color: form.type === lt.id ? lt.color : "#555" }} />
                  <span style={{ color: form.type === lt.id ? "#EEEEEE" : "#666", fontSize: "12px", fontWeight: 500 }}>
                    {lt.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={form.from}
                  onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg outline-none"
                  style={{ background: "#141010", border: "1px solid #2A1F1F", color: "#EEEEEE", fontSize: "13px" }}
                />
              </div>
              <div>
                <label style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={form.to}
                  onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg outline-none"
                  style={{ background: "#141010", border: "1px solid #2A1F1F", color: "#EEEEEE", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="mb-5">
              <label style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Lý do
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lý do xin nghỉ..."
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg outline-none resize-none"
                style={{ background: "#141010", border: "1px solid #2A1F1F", color: "#EEEEEE", fontSize: "13px" }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl transition-all"
                style={{ background: "#141010", border: "1px solid #2A1F1F", color: "#666", fontSize: "13px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#EEEEEE")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
              >
                Hủy
              </button>
              <button
                onClick={submitRequest}
                className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}
              >
                <Send size={14} /> Gửi đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
