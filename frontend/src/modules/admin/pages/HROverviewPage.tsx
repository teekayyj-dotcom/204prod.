import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import {
  Users, UserCheck, UserX, Briefcase, MapPin, Home, Monitor,
  Clock, Calendar, FileText, AlertTriangle, CheckCircle2, XCircle,
  Gift, Star, Cake, Milestone, ClipboardList, RefreshCcw,
  ChevronRight, Check, X, Bell, TrendingUp, Circle,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEAM = [
  { id:1,  name:"Nguyễn Minh Anh",  avatar:"MA", role:"Designer",    dept:"Design",      type:"inhouse",    status:"office",     checkin:"08:02" },
  { id:2,  name:"Trần Quốc Bảo",    avatar:"QB", role:"Developer",   dept:"Tech",        type:"inhouse",    status:"wfh",        checkin:"08:31" },
  { id:3,  name:"Lê Thị Cẩm",       avatar:"TC", role:"PM",          dept:"Account",     type:"inhouse",    status:"office",     checkin:"07:58" },
  { id:4,  name:"Phạm Đức Dũng",    avatar:"DD", role:"Developer",   dept:"Tech",        type:"inhouse",    status:"onsite",     checkin:"09:10" },
  { id:5,  name:"Hoàng Thị Em",     avatar:"TE", role:"QA",          dept:"Tech",        type:"inhouse",    status:"wfh",        checkin:"08:00" },
  { id:6,  name:"Vũ Văn Phúc",      avatar:"VP", role:"Videographer",dept:"Production",  type:"inhouse",    status:"onsite",     checkin:"07:45" },
  { id:7,  name:"Đinh Thị Hoa",     avatar:"DH", role:"Copywriter",  dept:"Content",     type:"inhouse",    status:"wfh",        checkin:"09:00" },
  { id:8,  name:"Ngô Văn Khải",     avatar:"NK", role:"Editor",      dept:"Production",  type:"freelancer", status:"wfh",        checkin:"10:15" },
  { id:9,  name:"Bùi Thị Lan",      avatar:"BL", role:"Account Exec",dept:"Account",     type:"inhouse",    status:"office",     checkin:"08:05" },
  { id:10, name:"Cao Minh Phúc",    avatar:"CP", role:"Motion",      dept:"Design",      type:"freelancer", status:"absent",     checkin:null },
];

type ReqStatus = "pending" | "approved" | "rejected";
type ReqType   = "leave" | "sick" | "ot" | "wfh" | "business";

const REQUESTS: {
  id: number; employee: string; avatar: string; type: ReqType;
  date: string; reason: string; submitted: string; status: ReqStatus; urgent?: boolean;
}[] = [
  { id:1, employee:"Phạm Đức Dũng",   avatar:"DD", type:"ot",       date:"23–24/06",     reason:"Chạy deadline TVC Vingroup xuyên đêm",            submitted:"Hôm nay, 11:30",  status:"pending", urgent:true },
  { id:2, employee:"Hoàng Thị Em",    avatar:"TE", type:"wfh",      date:"24/06/2026",   reason:"Làm từ xa — ổn định internet",                    submitted:"Hôm nay, 09:00",  status:"pending" },
  { id:3, employee:"Ngô Văn Khải",    avatar:"NK", type:"leave",    date:"25–27/06",     reason:"Nghỉ phép năm",                                   submitted:"22/06, 17:00",    status:"pending" },
  { id:4, employee:"Đinh Thị Hoa",    avatar:"DH", type:"sick",     date:"23/06/2026",   reason:"Nghỉ ốm — có đơn bác sĩ",                        submitted:"Hôm nay, 07:45",  status:"pending", urgent:true },
  { id:5, employee:"Bùi Thị Lan",     avatar:"BL", type:"business", date:"26–27/06",     reason:"Đi công tác Đà Nẵng gặp khách hàng",             submitted:"21/06, 16:00",    status:"pending" },
];

type AlertLevel = "error" | "warning" | "gold";

const HR_ALERTS: {
  id: number; level: AlertLevel; icon: React.ElementType;
  title: string; sub: string; action?: string; daysLeft?: number;
}[] = [
  { id:1, level:"error",   icon:AlertTriangle,  title:"Trần Quốc Bảo — Hết hạn thử việc",        sub:"Cần ra quyết định ký HĐ chính thức",   action:"Xử lý ngay", daysLeft:2 },
  { id:2, level:"error",   icon:FileText,       title:"HĐ cộng tác Ngô Văn Khải hết hạn",        sub:"Hết hạn 30/06 — Cần gia hạn hoặc kết thúc", action:"Gia hạn",   daysLeft:7 },
  { id:3, level:"warning", icon:RefreshCcw,     title:"Hoàng Thị Em — Đến kỳ đánh giá Q2",       sub:"Đánh giá năng lực 6 tháng đầu 2026",   action:"Lên lịch",   daysLeft:10 },
  { id:4, level:"warning", icon:Clock,          title:"3 nhân viên chưa nộp báo cáo tháng 5",    sub:"MA, VP, DH — Hạn nộp đã qua 8 ngày",   action:"Nhắc nhở" },
  { id:5, level:"gold",    icon:Cake,           title:"🎂 Sinh nhật Lê Thị Cẩm",                 sub:"Ngày mai 24/06 — 4 năm đồng hành 🎉",  action:"Gửi lời chúc" },
  { id:6, level:"gold",    icon:Star,           title:"🏆 Vũ Văn Phúc — Nhân viên xuất sắc T6", sub:"Hoàn thành 3 dự án đúng deadline",      action:"Vinh danh" },
  { id:7, level:"gold",    icon:Gift,           title:"🎉 Kỷ niệm 2 năm — Nguyễn Minh Anh",      sub:"Gia nhập FRAMECRAFT tháng 6/2024",      action:"Gửi thiệp" },
];

const DEPT_CHART = [
  { name:"Production", value:30, color:"#D84040" },
  { name:"Account",    value:25, color:"#60a5fa" },
  { name:"Design",     value:22, color:"#c084fc" },
  { name:"Tech",       value:15, color:"#fbbf24" },
  { name:"Content",    value:  8, color:"#888" },
];

const OPEN_ROLES = [
  { title:"Senior Videographer", dept:"Production", priority:"urgent", since:"10/06" },
  { title:"Social Media Manager", dept:"Account",   priority:"normal", since:"15/06" },
  { title:"Motion Designer",      dept:"Design",    priority:"urgent", since:"18/06" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const reqTypeCfg: Record<ReqType, { label: string; color: string; icon: React.ElementType }> = {
  leave:    { label: "Nghỉ phép",   color: "#f87171", icon: Calendar },
  sick:     { label: "Nghỉ ốm",     color: "#f87171", icon: UserX },
  ot:       { label: "Làm thêm giờ",color: "#fbbf24", icon: Clock },
  wfh:      { label: "WFH",         color: "#60a5fa", icon: Home },
  business: { label: "Công tác",    color: "#c084fc", icon: MapPin },
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

function KpiCards() {
  const total     = TEAM.length;
  const inhouse   = TEAM.filter((t) => t.type === "inhouse").length;
  const freelance = TEAM.filter((t) => t.type === "freelancer").length;
  const present   = TEAM.filter((t) => t.status !== "absent").length;
  const absent    = TEAM.filter((t) => t.status === "absent").length;
  const late      = 2; // mock
  const urgent    = OPEN_ROLES.filter((r) => r.priority === "urgent").length;

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
          bar: { value: Math.round((present / total) * 100), color: "#4ade80" },
        },
        {
          label: "Chờ duyệt",
          value: String(REQUESTS.filter((r) => r.status === "pending").length),
          icon: ClipboardList,
          color: REQUESTS.some((r) => r.urgent && r.status === "pending") ? "#f87171" : "#fbbf24",
          detail: `${REQUESTS.filter((r) => r.urgent && r.status === "pending").length} khẩn cần xử lý`,
          bar: null,
        },
        {
          label: "Vị trí đang tuyển",
          value: String(OPEN_ROLES.length),
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

function TodayStatus() {
  const groups = [
    { key: "office",  label: "Tại văn phòng",    members: TEAM.filter((t) => t.status === "office") },
    { key: "onsite",  label: "Hiện trường / Quay", members: TEAM.filter((t) => t.status === "onsite") },
    { key: "wfh",     label: "Làm từ xa (WFH)",  members: TEAM.filter((t) => t.status === "wfh") },
    { key: "absent",  label: "Vắng mặt",         members: TEAM.filter((t) => t.status === "absent") },
  ].filter((g) => g.members.length > 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Trạng thái hôm nay</p>
          <p style={{ color: "#555", fontSize: "11px" }}>Thứ Ba, 23/06/2026 · Cập nhật lúc 10:32</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>LIVE</span>
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
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: "#2A1F1F", color: "#EEEEEE", fontSize: "9px" }}
                    >
                      {m.avatar}
                    </div>
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

// ─── 3. Pending Requests ──────────────────────────────────────────────────────

function PendingRequests() {
  const [requests, setRequests] = useState(REQUESTS);

  function act(id: number, status: ReqStatus) {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
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
          const cfg = reqTypeCfg[req.type];
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
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "#8E1616", color: "#EEEEEE" }}>
                {req.avatar}
              </div>

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
                <button onClick={() => act(req.id, "approved")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#14532d33", color: "#4ade80" }}>
                  <Check size={11} /> Duyệt
                </button>
                <button onClick={() => act(req.id, "rejected")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#7f1d1d33", color: "#f87171" }}>
                  <X size={11} /> Từ chối
                </button>
              </div>
            </div>
          );
        })}

        {/* Processed */}
        {done.map((req) => {
          const cfg = reqTypeCfg[req.type];
          const approved = req.status === "approved";
          return (
            <div key={req.id} className="flex items-center gap-4 px-6 py-3" style={{ opacity: 0.45 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#2A1F1F" }}>
                <cfg.icon size={15} style={{ color: "#555" }} />
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "#2A1F1F", color: "#555" }}>
                {req.avatar}
              </div>
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

function HRAlerts() {
  const errors   = HR_ALERTS.filter((a) => a.level === "error");
  const warnings = HR_ALERTS.filter((a) => a.level === "warning");
  const gold     = HR_ALERTS.filter((a) => a.level === "gold");

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
        {HR_ALERTS.map((alert) => {
          const s = alertStyle[alert.level];
          const isGold = alert.level === "gold";
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
                <alert.icon size={16} style={{ color: s.icon }} />
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

function ResourceAllocation() {
  const maxVal = Math.max(...DEPT_CHART.map((d) => d.value));

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Phân bổ Nguồn lực</p>
        <p style={{ color: "#555", fontSize: "11px" }}>Resource Allocation · Cơ cấu phòng ban</p>
      </div>

      <div className="px-6 py-5 flex items-center gap-6">
        {/* Donut */}
        <div style={{ width: 150, height: 150, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DEPT_CHART}
                cx="50%" cy="50%"
                innerRadius={42} outerRadius={68}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {DEPT_CHART.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <ReTooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bars */}
        <div className="flex-1 space-y-3">
          {DEPT_CHART.map((d) => {
            const count = Math.round((d.value / 100) * TEAM.length);
            return (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    <span style={{ color: "#888", fontSize: "12px" }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#555", fontSize: "10px" }}>{count} người</span>
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
        {OPEN_ROLES.map((r) => (
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
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#D8404022", border: "1px solid #D8404044" }}>
            <Users size={22} style={{ color: "#D84040" }} />
          </div>
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>HR</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Tổng quan</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>Xem:</span>
          <select className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", border: "1px solid #2A1F1F" }}
            defaultValue="jun-2026">
            <option value="jun-2026">Tháng 6/2026</option>
            <option value="q2-2026">Q2 2026</option>
            <option value="h1-2026">H1 2026</option>
          </select>
        </div>
      </div>

      {/* 1 – KPI */}
      <KpiCards />

      {/* 2 – Today's Status */}
      <TodayStatus />

      {/* 3+5 – Requests + Resource */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PendingRequests />
        </div>
        <div className="lg:col-span-2">
          <ResourceAllocation />
        </div>
      </div>

      {/* 4 – HR Alerts */}
      <HRAlerts />
    </div>
  );
}
