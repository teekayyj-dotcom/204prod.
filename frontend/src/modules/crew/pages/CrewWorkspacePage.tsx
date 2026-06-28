// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckSquare,
  Square,
  AlertTriangle,
  Bell,
  Play,
  Pause,
  Coffee,
  Flame,
  Calendar,
  ChevronRight,
  MessageSquareWarning,
  Timer,
  TrendingUp,
  Star,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockTasks = [
  { id: 1, label: "Dựng xong Draft 1 — Clip TVC Mùa Hè", project: "Brand X TVC", due: "Hôm nay, 17:00", priority: "high", done: false },
  { id: 2, label: "Export file 4K theo chuẩn H.264", project: "Brand X TVC", due: "Hôm nay, 18:30", priority: "medium", done: false },
  { id: 3, label: "Color grade cảnh outdoor — Scene 3", project: "Agency Reel Q3", due: "Hôm nay, 20:00", priority: "medium", done: false },
  { id: 4, label: "Upload asset moodboard cho PM review", project: "Client ABC Launch", due: "Ngày mai, 09:00", priority: "low", done: true },
  { id: 5, label: "Sync âm thanh Track 2 với timeline", project: "Agency Reel Q3", due: "Hôm nay, 15:00", priority: "high", done: true },
];

const mockAlerts = [
  {
    id: 1,
    type: "overdue",
    title: "Task bị quá hạn!",
    desc: "Scene 5 SFX Mix — dự án \"Brand X TVC\" đã trễ 2 giờ.",
    time: "2 giờ trước",
    icon: AlertTriangle,
  },
  {
    id: 2,
    type: "feedback",
    title: "Yêu cầu sửa khẩn — Khách hàng phản hồi",
    desc: "Client ABC gắn pin tại 00:34 — \"Chỉnh lại màu nền, quá sáng so với brief.\"",
    time: "15 phút trước",
    icon: MessageSquareWarning,
  },
];

const mockStats = [
  { label: "Tasks hoàn thành", value: "12", sub: "tuần này", icon: CheckSquare, color: "#10B981" },
  { label: "Giờ làm việc", value: "38.5h", sub: "tuần này", icon: Timer, color: "#D84040" },
  { label: "Dự án đang chạy", value: "3", sub: "được phân công", icon: TrendingUp, color: "#D4A843" },
  { label: "Điểm hiệu suất", value: "94", sub: "tháng 6", icon: Star, color: "#8B5CF6" },
];

// ─── Check-in timer ───────────────────────────────────────────────────────────
function useCheckinTimer() {
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    return localStorage.getItem("crew_checkin_active") === "true";
  });
  const [startTime, setStartTime] = useState<number | null>(() => {
    const s = localStorage.getItem("crew_checkin_start");
    return s ? parseInt(s) : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isCheckedIn && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCheckedIn, startTime]);

  const checkIn = () => {
    const now = Date.now();
    setIsCheckedIn(true);
    setStartTime(now);
    setElapsed(0);
    localStorage.setItem("crew_checkin_active", "true");
    localStorage.setItem("crew_checkin_start", String(now));
  };

  const checkOut = () => {
    setIsCheckedIn(false);
    setStartTime(null);
    setElapsed(0);
    localStorage.removeItem("crew_checkin_active");
    localStorage.removeItem("crew_checkin_start");
  };

  const format = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return { isCheckedIn, elapsed, checkIn, checkOut, format };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CrewWorkspacePage() {
  const { isCheckedIn, elapsed, checkIn, checkOut, format } = useCheckinTimer();
  const [tasks, setTasks] = useState(mockTasks);

  const getUserName = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.display_name || u.username || "Crew";
    } catch {
      return "Crew";
    }
  };

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  const priorityColor = (p: string) => {
    if (p === "high") return "#D84040";
    if (p === "medium") return "#D4A843";
    return "#555";
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Chào buổi sáng" : now.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
            {greeting}, {getUserName()} 👋
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: "#1D1616", border: "1px solid #2A1F1F", color: "#888", fontSize: "13px" }}
        >
          <Bell size={15} />
          <span>Thông báo</span>
          {mockAlerts.length > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ background: "#D84040", fontSize: "10px", fontWeight: 700 }}
            >
              {mockAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {mockStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-5 py-4"
            style={{ background: "#141010", border: "1px solid #2A1F1F" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {stat.label}
              </span>
              <stat.icon size={14} style={{ color: stat.color }} />
            </div>
            <p style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1 }}>
              {stat.value}
            </p>
            <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT: Check-in + Tasks */}
        <div className="col-span-2 space-y-5">
          {/* Check-in Block */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: isCheckedIn
                ? "linear-gradient(135deg, #1a0f0f 0%, #1D1616 100%)"
                : "#141010",
              border: isCheckedIn ? "1px solid #D84040" : "1px solid #2A1F1F",
              transition: "all 0.4s ease",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isCheckedIn ? (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: "#10B981",
                        boxShadow: "0 0 8px #10B981",
                        animation: "pulse 2s infinite",
                      }}
                    />
                  ) : (
                    <Coffee size={14} style={{ color: "#555" }} />
                  )}
                  <span
                    style={{
                      color: isCheckedIn ? "#10B981" : "#555",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {isCheckedIn ? "Đang làm việc" : "Chưa check-in"}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "52px",
                    fontWeight: 700,
                    color: isCheckedIn ? "#EEEEEE" : "#333",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                >
                  {isCheckedIn ? format(elapsed) : "00:00:00"}
                </div>
                {isCheckedIn && (
                  <p style={{ color: "#666", fontSize: "12px", marginTop: "6px" }}>
                    Check-in lúc{" "}
                    {new Date(Date.now() - elapsed * 1000).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 items-end">
                <button
                  onClick={isCheckedIn ? checkOut : checkIn}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200"
                  style={{
                    background: isCheckedIn ? "#1D1616" : "#D84040",
                    color: isCheckedIn ? "#D84040" : "#EEEEEE",
                    border: isCheckedIn ? "2px solid #D84040" : "2px solid transparent",
                    fontSize: "15px",
                    fontWeight: 700,
                    minWidth: "160px",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {isCheckedIn ? (
                    <>
                      <Pause size={18} /> Check-out
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Check-in
                    </>
                  )}
                </button>
                {isCheckedIn && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: "#0A0707", border: "1px solid #2A1F1F" }}
                  >
                    <Flame size={12} style={{ color: "#D4A843" }} />
                    <span style={{ color: "#D4A843", fontSize: "11px", fontWeight: 600 }}>
                      Focus Mode ON
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Today's Tasks */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#141010", border: "1px solid #2A1F1F" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700 }}>
                  Việc cần làm hôm nay
                </h2>
                <p style={{ color: "#555", fontSize: "12px", marginTop: "2px" }}>
                  {pendingTasks.length} việc còn lại · {doneTasks.length} hoàn thành
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: "#0A0707", border: "1px solid #2A1F1F" }}
              >
                <Calendar size={12} style={{ color: "#D84040" }} />
                <span style={{ color: "#888", fontSize: "11px" }}>
                  {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: "#2A1F1F" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(doneTasks.length / tasks.length) * 100}%`,
                    background: "linear-gradient(90deg, #8E1616, #D84040)",
                  }}
                />
              </div>
              <p style={{ color: "#555", fontSize: "11px", marginTop: "4px", textAlign: "right" }}>
                {Math.round((doneTasks.length / tasks.length) * 100)}% hoàn thành
              </p>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: task.done ? "#0A0707" : "#1D1616",
                    border: `1px solid ${task.done ? "#1D1616" : "#2A1F1F"}`,
                    opacity: task.done ? 0.55 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!task.done) (e.currentTarget as HTMLElement).style.borderColor = "#D84040";
                  }}
                  onMouseLeave={(e) => {
                    if (!task.done) (e.currentTarget as HTMLElement).style.borderColor = "#2A1F1F";
                  }}
                >
                  {task.done ? (
                    <CheckSquare size={17} style={{ color: "#10B981", flexShrink: 0, marginTop: "1px" }} />
                  ) : (
                    <Square size={17} style={{ color: "#555", flexShrink: 0, marginTop: "1px" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: task.done ? "#555" : "#EEEEEE",
                        fontSize: "13px",
                        fontWeight: task.done ? 400 : 500,
                        textDecoration: task.done ? "line-through" : "none",
                        lineHeight: 1.4,
                      }}
                    >
                      {task.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ color: "#555", fontSize: "11px" }}>{task.project}</span>
                      <span style={{ color: "#333", fontSize: "11px" }}>·</span>
                      <span style={{ color: "#666", fontSize: "11px" }}>{task.due}</span>
                    </div>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: priorityColor(task.priority) }}
                    title={task.priority}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Alerts */}
        <div className="space-y-5">
          <div
            className="rounded-2xl p-5"
            style={{ background: "#141010", border: "1px solid #2A1F1F" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} style={{ color: "#D84040" }} />
              <h2 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>
                Thông báo khẩn
              </h2>
              {mockAlerts.length > 0 && (
                <span
                  className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#D84040", color: "#fff", fontSize: "10px", fontWeight: 700 }}
                >
                  {mockAlerts.length}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "linear-gradient(135deg, #1a0808 0%, #1D0F0F 100%)",
                    border: "1px solid rgba(216, 64, 64, 0.4)",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <alert.icon size={14} style={{ color: "#D84040", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600, lineHeight: 1.4 }}>
                        {alert.title}
                      </p>
                      <p style={{ color: "#888", fontSize: "11px", marginTop: "4px", lineHeight: 1.5 }}>
                        {alert.desc}
                      </p>
                      <p style={{ color: "#D84040", fontSize: "10px", marginTop: "6px", fontWeight: 600 }}>
                        {alert.time}
                      </p>
                    </div>
                  </div>
                  <button
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all"
                    style={{
                      background: "rgba(216,64,64,0.1)",
                      border: "1px solid rgba(216,64,64,0.3)",
                      color: "#D84040",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(216,64,64,0.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(216,64,64,0.1)")}
                  >
                    Xử lý ngay <ChevronRight size={12} />
                  </button>
                </div>
              ))}

              {mockAlerts.length === 0 && (
                <div className="py-8 text-center">
                  <p style={{ color: "#333", fontSize: "13px" }}>Không có thông báo khẩn</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick schedule */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#141010", border: "1px solid #2A1F1F" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} style={{ color: "#D4A843" }} />
              <h2 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>Lịch hôm nay</h2>
            </div>
            {[
              { time: "09:00", label: "Morning sync với PM", tag: "Meeting" },
              { time: "11:00", label: "Dựng draft 1 — Brand X TVC", tag: "Production" },
              { time: "14:00", label: "Color grading session", tag: "Production" },
              { time: "17:00", label: "Bàn giao draft cho review", tag: "Deadline" },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < 3 ? "1px solid #1D1616" : "none" }}>
                <span style={{ color: "#555", fontSize: "11px", minWidth: "36px", fontFamily: "monospace" }}>
                  {ev.time}
                </span>
                <div className="flex-1">
                  <p style={{ color: "#EEEEEE", fontSize: "12px" }}>{ev.label}</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: ev.tag === "Deadline" ? "rgba(216,64,64,0.15)" : "rgba(212,168,67,0.1)",
                    color: ev.tag === "Deadline" ? "#D84040" : "#D4A843",
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    border: `1px solid ${ev.tag === "Deadline" ? "rgba(216,64,64,0.3)" : "rgba(212,168,67,0.2)"}`,
                  }}
                >
                  {ev.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
