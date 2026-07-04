// @ts-nocheck
import { useState, useEffect } from "react";
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
  Edit3,
  Save,
  X,
  Loader2,
  Mail,
  Briefcase,
  User,
  Tag,
  Star,
  Camera,
} from "lucide-react";
import { fetchApi } from "../../admin/utils/apiClient";
import { allProjects } from "../../admin/data/mockData";

// ─── Mock attendance data ─────────────────────────────────────────────────────
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

// Real attendance data is fetched dynamically



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

const mapDbToFrontendRequest = (r: any) => {
  const dates = (r.date || "").split(" → ");
  const from = dates[0] || "";
  const to = dates[1] || from;
  return {
    id: r.id,
    type: r.type,
    from: from,
    to: to,
    reason: r.reason,
    status: r.status,
    created: r.submitted_at
  };
};

// ─── Main component ───────────────────────────────────────────────────────────
export function CrewHRPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "requests" | "settings">("attendance");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "leave", from: "", to: "", reason: "" });
  const [requests, setRequests] = useState<any[]>([]);

  // Settings tab states
  const [member, setMember] = useState<any>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");

  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserEmail = userObj.email || "";

  const [attendanceData, setAttendanceData] = useState<Record<number, { in: string; out: string; hours: number; type: string }>>({});
  const [realProjects, setRealProjects] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Crew Info
    fetchApi<any[]>("/crew")
      .then((crewList) => {
        const found = crewList.find((c) => c.email === currentUserEmail);
        let officialName = "";
        if (found) {
          setMember(found);
          officialName = found.name || "";
          const memberSkills = found.skills_expertise ? found.skills_expertise.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
          setSkills(memberSkills);
          const memberRoles = found.role ? found.role.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
          setSelectedRoles(memberRoles);
          setAvatarPreview(found.avatar || null);
          setEditName(found.name || "");
          setEditEmail(found.email || "");
          setEditBio(found.bio || "");
        }
        setLoadingMember(false);

        // 2. Fetch Attendance Logs sequentially
        return fetchApi<any[]>("/hr/attendance-logs")
          .then((logs) => {
            const userName = userObj.display_name || userObj.username || "Crew";
            const myLogs = logs.filter((l) => {
              const logName = l.employee_name;
              return logName === officialName || logName === userName || logName === userObj.username;
            });
            
            const grouped: Record<number, any> = {};
            myLogs.forEach((log) => {
              const d = new Date(log.date);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const day = d.getDate();
                if (!grouped[day]) grouped[day] = { in: "", out: "", hours: 0, type: "normal" };
                
                if (log.action === "check-in") grouped[day].in = log.time;
                if (log.action === "check-out") grouped[day].out = log.time;
                
                if (log.note === "WFH") grouped[day].type = "wfh";
                if (log.status === "late") grouped[day].type = "late";
              }
            });

            // Compute hours
            Object.keys(grouped).forEach((key) => {
              const day = parseInt(key);
              const g = grouped[day];
              if (g.in && g.out) {
                const [h1, m1] = g.in.split(":").map(Number);
                const [h2, m2] = g.out.split(":").map(Number);
                g.hours = Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
              }
            });
            
            setAttendanceData(grouped);
          });

        // 3. Fetch Leave Requests sequentially
        fetchApi<any[]>("/hr/leave-requests")
          .then((data) => {
            const userName = userObj.display_name || userObj.username || "Crew";
            const myRequests = data.filter((r) => {
              const emp = r.employee_name;
              return emp === officialName || emp === userName || emp === userObj.username;
            });
            setRequests(myRequests.map(mapDbToFrontendRequest));
          })
          .catch((err) => {
            console.error("Error fetching leave requests:", err);
          });
      })
      .catch((err) => {
        console.error("Error loading HR page data:", err);
        setLoadingMember(false);
      });

    // Fetch Real Projects
    fetchApi<any[]>("/projects")
      .then((data) => setRealProjects(data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, [currentUserEmail, userObj.display_name, userObj.username]);

  const handleCancel = () => {
    if (member) {
      setEditName(member.name || "");
      setEditEmail(member.email || "");
      setEditBio(member.bio || "");
      const memberSkills = member.skills_expertise ? member.skills_expertise.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      setSkills(memberSkills);
      const memberRoles = member.role ? member.role.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      setSelectedRoles(memberRoles);
      setAvatarPreview(member.avatar || null);
      setAvatarFile(null);
    }
    setIsEditing(false);
  };

  const onSave = async () => {
    if (!member) return;
    setSaving(true);
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("alt", `${editName} Avatar`);
        formData.append("folder", "avatar/crew");
        const mediaAsset = await fetchApi<any>("/media/upload", {
          method: "POST",
          body: formData,
        });
        avatarUrl = mediaAsset.url;
      }
      const payload = {
        name: editName,
        email: editEmail,
        phone: member.phone || "",
        role: selectedRoles.join(", "),
        avatar: avatarUrl || "",
        bio: editBio || "",
        skills_expertise: skills.join(","),
        assigned_projects: member.assigned_projects || member.projects || 0,
        status: member.status || "Active",
        created_at: member.created_at || null,
      };
      const updatedMember = await fetchApi<any>(`/crew/${member.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Update local storage user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.display_name = editName;
      user.email = editEmail;
      user.avatar_url = avatarUrl || "";
      localStorage.setItem("user", JSON.stringify(user));

      setMember(updatedMember);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setIsEditing(false);
      }, 1400);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

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
    
    const officialName = member?.name || userObj.display_name || userObj.username || "Crew";
    const dateStr = form.to && form.to !== form.from ? `${form.from} → ${form.to}` : form.from;
    const submittedStr = new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
    
    const avatarUrl = userObj.avatar_url || userObj.avatar || userObj.photo_url || userObj.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(officialName)}&background=8E1616&color=fff`;

    const payload = {
      employee_name: officialName,
      avatar: avatarUrl,
      type: form.type,
      status: "pending",
      date: dateStr,
      reason: form.reason,
      submitted_at: submittedStr,
      urgent: false
    };
    
    fetchApi("/hr/leave-requests", {
      method: "POST",
      body: JSON.stringify(payload)
    })
    .then((newReq: any) => {
      setRequests((prev) => [mapDbToFrontendRequest(newReq), ...prev]);
      setForm({ type: "leave", from: "", to: "", reason: "" });
      setShowForm(false);
    })
    .catch((err) => {
      console.error("Error submitting leave request:", err);
      alert("Không thể gửi đơn, vui lòng thử lại!");
    });
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
        {(["attendance", "requests", "settings"] as const).map((tab) => (
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
            {tab === "attendance" ? "Lịch sử Chấm công" : tab === "requests" ? "Quản lý Đơn từ" : "Thiết lập & Dự án"}
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
                  title={att ? `${att.in} – ${att.out} (${Number(att.hours).toFixed(2)}h)` : ""}
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
                        {Number(att.hours).toFixed(2)}h
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
            const sc = statusConfig[req.status as keyof typeof statusConfig] || { label: req.status || "Chờ duyệt", color: "#D4A843", icon: AlertCircle };
            const lt = leaveTypes.find((t) => t.id === req.type || t.label === req.type);
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
                    <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{lt ? lt.label : req.type}</p>
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
      {/* TAB: Settings & Projects */}
      {activeTab === "settings" && (
        <div>
          {loadingMember ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
          ) : !member ? (
            <div className="flex flex-col items-center justify-center py-24">
              <AlertCircle size={48} color="#3A2A2A" className="mb-4" />
              <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Không tìm thấy thông tin nhân sự</p>
            </div>
          ) : (
            <div>
              {/* Profile header row with Edit/Discard/Save actions */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700 }}>
                    Hồ sơ của bạn
                  </h3>
                  <p style={{ color: "#666", fontSize: "12px" }} className="mt-0.5">
                    Xem và chỉnh sửa thông tin cá nhân của bạn trong hệ thống
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all border text-xs font-semibold cursor-pointer"
                        style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", color: "#888", borderColor: "#2E2020" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
                      >
                        <X size={14} /> Hủy bỏ
                      </button>
                      <button
                        onClick={onSave}
                        disabled={saving || saved}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-semibold cursor-pointer"
                        style={{ background: saved ? "#4CAF50" : "#D84040", color: "#fff" }}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Đang lưu...
                          </>
                        ) : saved ? (
                          <>
                            <CheckCircle2 size={13} /> Đã lưu!
                          </>
                        ) : (
                          <>
                            <Save size={13} /> Lưu thay đổi
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-semibold cursor-pointer"
                      style={{ background: "#D84040", color: "#fff" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}
                    >
                      <Edit3 size={13} /> Chỉnh sửa hồ sơ
                    </button>
                  )}
                </div>
              </div>

              {/* Main Layout Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Left side: Profile Summary, Bio, Skills (2/3 width) */}
                <div className="col-span-2 space-y-5">
                  
                  {/* Hero Card */}
                  <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                    {/* Banner */}
                    <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #1D1616 0%, #8E1616 55%, #D84040 100%)" }}>
                      <span className="absolute top-3 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: member.status === "Active" ? "rgba(76,175,80,0.2)" : "rgba(232,168,56,0.2)", color: member.status === "Active" ? "#4CAF50" : "#E8A838" }}>
                        {member.status === "Active" ? "Đang hoạt động" : "Nghỉ phép"}
                      </span>
                    </div>

                    <div className="px-6 pb-6 relative z-10">
                      {/* Avatar & Info */}
                      <div className="flex items-end gap-4 -mt-10 mb-4">
                        <div className="relative group">
                          <input
                            id="crew-profile-avatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAvatarFile(file);
                                setAvatarPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                          <img
                            src={avatarPreview || member.avatar || "/favicon/204-logo.png"}
                            alt={member.name}
                            className="w-20 h-20 rounded-full object-cover"
                            style={{ border: "3px solid #241C1C" }}
                          />
                          {isEditing && (
                            <>
                              <div
                                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                style={{ background: "rgba(0,0,0,0.6)" }}
                                onClick={() => document.getElementById("crew-profile-avatar")?.click()}
                              >
                                <Camera size={22} color="#EEEEEE" />
                              </div>
                              <div
                                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                                style={{ background: "#D84040", border: "2px solid #241C1C" }}
                                onClick={() => document.getElementById("crew-profile-avatar")?.click()}
                              >
                                <Camera size={11} color="#fff" />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="pb-1 flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div>
                                <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Họ và Tên</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-3 py-2 rounded-lg outline-none w-full text-sm"
                                  style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE" }}
                                />
                              </div>
                              <div>
                                <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Vai trò / Chức danh (nhập ngăn cách bằng dấu phẩy)</label>
                                <input
                                  type="text"
                                  value={selectedRoles.join(", ")}
                                  onChange={(e) => setSelectedRoles(e.target.value.split(",").map(r => r.trim()).filter(Boolean))}
                                  className="px-3 py-2 rounded-lg outline-none w-full text-sm"
                                  style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE" }}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <h2 style={{ color: "#EEEEEE", fontSize: "20px", fontWeight: 700 }}>{member.name}</h2>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedRoles.map((r) => (
                                  <span key={r} className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.2)" }}>
                                    {r}
                                  </span>
                                ))}
                                {selectedRoles.length === 0 && (
                                  <span style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>Chưa phân vai trò</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Detail contact info */}
                      <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: "1px solid #2A1F1F" }}>
                        <div>
                          <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                            <Mail size={10} color="#D84040" /> Email liên hệ
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="px-3 py-2 rounded-lg outline-none w-full text-sm"
                              style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE" }}
                            />
                          ) : (
                            <p style={{ color: "#EEEEEE", fontSize: "13px" }}>{member.email || "—"}</p>
                          )}
                        </div>
                        <div>
                          <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                            <Calendar size={10} color="#D84040" /> Ngày tham gia
                          </label>
                          <p style={{ color: "#EEEEEE", fontSize: "13px" }}>
                            {member.created_at ? new Date(member.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : "Tháng 5, 2026"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio Card */}
                  <div className="rounded-xl p-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                    <label style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="flex items-center gap-2 mb-3">
                      <User size={14} color="#D84040" /> Tiểu sử & Giới thiệu
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={4}
                        placeholder="Giới thiệu phong cách làm việc, kinh nghiệm và chuyên môn của bạn..."
                        className="px-3 py-2.5 rounded-lg outline-none resize-none w-full text-sm"
                        style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE" }}
                      />
                    ) : (
                      <p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.8" }}>
                        {member.bio || "Chưa có giới thiệu."}
                      </p>
                    )}
                  </div>

                  {/* Skills Card */}
                  <div className="rounded-xl p-5" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                    <label style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="flex items-center gap-2 mb-4">
                      <Tag size={14} color="#D84040" /> Kỹ năng chuyên môn
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)" }}>
                          {skill}
                          {isEditing && (
                            <button type="button" onClick={() => setSkills(skills.filter(s => s !== skill))} className="ml-0.5 hover:opacity-70 cursor-pointer">
                              <X size={11} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = skillInput.trim();
                              if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
                              setSkillInput("");
                            }
                          }}
                          placeholder="Thêm kỹ năng mới và nhấn Enter..."
                          className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
                          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid #3A2A2A", color: "#EEEEEE" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = skillInput.trim();
                            if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
                            setSkillInput("");
                          }}
                          className="px-3 py-2 rounded-lg flex items-center cursor-pointer"
                          style={{ background: "rgba(216,64,64,0.15)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)" }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Projects List & Stats (1/3 width) */}
                <div className="col-span-1 space-y-5">
                  {/* Stats Card */}
                  <div className="rounded-xl p-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                    <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Thống kê nhân sự</p>
                    {[
                      { icon: Briefcase, label: "Dự án đã tham gia", value: member.projects || 0, color: "#D84040" },
                      { icon: Tag, label: "Số lượng kỹ năng", value: skills.length },
                      { icon: Star, label: "Số năm gắn bó", value: (new Date().getFullYear() - (member.created_at ? new Date(member.created_at).getFullYear() : 2026)) || "< 1 năm" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #2A1F1F" }}>
                        <div className="flex items-center gap-2">
                          <Icon size={13} color="#8E1616" />
                          <span style={{ color: "#888", fontSize: "12px" }}>{label}</span>
                        </div>
                        <span style={{ color: color || "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                      <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Dự án được phân công</p>
                      <span style={{ color: "#D84040", fontSize: "12px" }}>{member.assigned_projects || 0} dự án</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
                      {realProjects.filter(p => p.credits?.some((c: string) => c.includes(member.name || ""))).length === 0 && (
                        <div className="px-5 py-4 text-center">
                          <p style={{ color: "#666", fontSize: "12px" }}>Chưa có dự án nào được phân công</p>
                        </div>
                      )}
                      {realProjects.filter(p => p.credits?.some((c: string) => c.includes(member.name || ""))).map((p) => (
                        <div key={p.slug} className="flex items-center gap-4 px-5 py-3.5 transition-colors">
                          <img src={p.thumbnail_url || p.cover_image || "https://placehold.co/100x100"} alt={p.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{p.title || p.name}</p>
                            <p style={{ color: "#666", fontSize: "11px" }}>{p.client_slug || "Client"} · {p.format_slug || "Format"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(216,64,64,0.15)", color: "#D84040", textTransform: "capitalize" }}>
                              {p.status || "In Progress"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
