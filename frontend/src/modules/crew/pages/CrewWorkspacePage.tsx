import { useState, useEffect, useRef } from "react";
import { fetchApi } from "../../admin/utils/apiClient";
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
} from "lucide-react";

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

  const checkIn = async () => {
    const now = Date.now();
    setIsCheckedIn(true);
    setStartTime(now);
    setElapsed(0);
    localStorage.setItem("crew_checkin_active", "true");
    localStorage.setItem("crew_checkin_start", String(now));
    
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const avatarUrl = u.avatar_url || u.avatar || u.photo_url || u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username || "Crew")}&background=8E1616&color=fff`;
      await fetchApi("/hr/attendance-logs", {
        method: "POST",
        body: JSON.stringify({
          employee_name: u.display_name || u.username || "Crew",
          avatar: avatarUrl,
          action: "check-in",
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          date: new Date().toISOString().split("T")[0],
          status: "on-time",
          note: "Office"
        })
      });
    } catch (err) {
      console.error("Failed to check in to API", err);
    }
  };

  const checkOut = async () => {
    setIsCheckedIn(false);
    setStartTime(null);
    setElapsed(0);
    localStorage.removeItem("crew_checkin_active");
    localStorage.removeItem("crew_checkin_start");
    
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const avatarUrl = u.avatar_url || u.avatar || u.photo_url || u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username || "Crew")}&background=8E1616&color=fff`;
      await fetchApi("/hr/attendance-logs", {
        method: "POST",
        body: JSON.stringify({
          employee_name: u.display_name || u.username || "Crew",
          avatar: avatarUrl,
          action: "check-out",
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          date: new Date().toISOString().split("T")[0],
          status: "on-time"
        })
      });
    } catch (err) {
      console.error("Failed to check out to API", err);
    }
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [workHours, setWorkHours] = useState(0);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  const getUserName = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.display_name || u.username || "Crew";
    } catch {
      return "Crew";
    }
  };

  useEffect(() => {
    fetchApi("/projects/tasks/all").then(data => {
      // Keep all tasks or filter by user
      const mappedTasks = Array.isArray(data) ? data : [];
      setTasks(mappedTasks);
      
      const now = Date.now();
      const overdue = mappedTasks.filter(t => t.status !== "done" && t.deadline && new Date(t.deadline).getTime() < now);
      
      setAlerts(overdue.map(t => ({
        id: t.id,
        type: "overdue",
        title: "Task bị quá hạn!",
        desc: `${t.title} đã trễ deadline.`,
        time: new Date(t.deadline).toLocaleDateString("vi-VN"),
        icon: AlertTriangle,
      })));
    }).catch(console.error);

    fetchApi("/crew/members").then(data => {
      const me = data.find((m: any) => m.name === getUserName() || m.email === JSON.parse(localStorage.getItem("user") || "{}").email);
      if (me) {
        setActiveProjectsCount(me.projects_count || 0);
      }
    }).catch(console.error);
    
    // Fallback hours logic
    setWorkHours(Math.floor(elapsed / 3600));
  }, [elapsed]);

  const toggleTask = (id: string | number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : "done";

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    fetchApi(`/projects/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    }).catch(console.error);
  };

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const priorityColor = (p: string) => {
    if (p === "high") return "#D84040";
    if (p === "medium") return "#D4A843";
    return "#555";
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Chào buổi sáng" : now.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const dynamicStats = [
    { label: "Tasks hoàn thành", value: String(doneTasks.length), sub: "tổng cộng", icon: CheckSquare, color: "#10B981" },
    { label: "Giờ làm việc", value: `${workHours}h`, sub: "phiên này", icon: Timer, color: "#D84040" },
    { label: "Dự án đang chạy", value: String(activeProjectsCount), sub: "được phân công", icon: TrendingUp, color: "#D4A843" },
  ];

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
            {greeting}, {getUserName()}
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
          {alerts.length > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
              style={{ background: "#D84040", fontSize: "10px", fontWeight: 700 }}
            >
              {alerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {dynamicStats.map((stat) => (
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
                    cursor: "pointer",
                    background: task.status === "done" ? "#0A0707" : "#1D1616",
                    border: `1px solid ${task.status === "done" ? "#1D1616" : "#2A1F1F"}`,
                    opacity: task.status === "done" ? 0.55 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (task.status !== "done") (e.currentTarget as HTMLElement).style.borderColor = "#D84040";
                  }}
                  onMouseLeave={(e) => {
                    if (task.status !== "done") (e.currentTarget as HTMLElement).style.borderColor = "#2A1F1F";
                  }}
                >
                  {task.status === "done" ? (
                    <CheckSquare size={20} color="#D84040" />
                  ) : (
                    <Square size={20} color="#555" />
                  )}
                  <div className="flex-1">
                    <p
                      style={{
                        color: task.status === "done" ? "#555" : "#EEEEEE",
                        fontSize: "14px",
                        fontWeight: task.status === "done" ? 400 : 500,
                        textDecoration: task.status === "done" ? "line-through" : "none",
                        marginBottom: "4px",
                      }}
                    >
                      {task.title || task.label}
                    </p>
                    <div className="flex items-center gap-3">
                      <span style={{ color: "#555", fontSize: "11px" }}>
                        {task.project_title || (task.project && typeof task.project === 'object' ? task.project.title : task.project)}
                      </span>
                      {task.deadline && (
                        <span style={{ color: "#666", fontSize: "11px" }}>{task.deadline}</span>
                      )}
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
              {alerts.length > 0 && (
                <span
                  className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#D84040", color: "#fff", fontSize: "10px", fontWeight: 700 }}
                >
                  {alerts.length}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
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

              {alerts.length === 0 && (
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
              <h2 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>Lịch công việc</h2>
            </div>
            {pendingTasks
              .filter(t => t.deadline)
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .slice(0, 5)
              .map((t, i) => {
                const d = new Date(t.deadline);
                const isToday = d.toDateString() === new Date().toDateString();
                const tag = isToday ? "Deadline" : "Upcoming";
                const time = isToday ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : d.toLocaleDateString("vi-VN");
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid #1D1616" }}>
                    <span style={{ color: "#555", fontSize: "11px", minWidth: "36px", fontFamily: "monospace" }}>
                      {time}
                    </span>
                    <div className="flex-1">
                      <p style={{ color: "#EEEEEE", fontSize: "12px" }}>{t.title}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: tag === "Deadline" ? "rgba(216,64,64,0.15)" : "rgba(212,168,67,0.1)",
                        color: tag === "Deadline" ? "#D84040" : "#D4A843",
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        border: `1px solid ${tag === "Deadline" ? "rgba(216,64,64,0.3)" : "rgba(212,168,67,0.2)"}`,
                      }}
                    >
                      {tag}
                    </span>
                  </div>
                );
              })}
            {pendingTasks.filter(t => t.deadline).length === 0 && (
               <div className="py-4 text-center">
                 <p style={{ color: "#555", fontSize: "12px" }}>Không có lịch trình sắp tới</p>
               </div>
            )}
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
