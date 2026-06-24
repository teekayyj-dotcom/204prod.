import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, UserCheck, TrendingUp, UserMinus, Crown, Star,
  Calendar, Phone, FileText, Clock, AlertTriangle,
  ChevronRight, ArrowUpRight, ArrowDownRight, Circle,
  Briefcase, RefreshCcw, CheckCircle2, XCircle,
  Building2, ShoppingBag, Home, Cpu, Utensils, Shirt,
  Filter,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: {
  key: string;
  label: string;
  count: number;
  value: number;
  color: string;
  icon: React.ElementType;
}[] = [
  { key: "new",         label: "Mới tiếp cận",        count: 18, value: 2_340_000_000, color: "#888",    icon: Circle },
  { key: "contacted",   label: "Đã liên hệ / Brief",  count: 11, value: 1_650_000_000, color: "#60a5fa", icon: Phone },
  { key: "proposal",    label: "Đang Proposal/Pitch",  count:  7, value: 1_120_000_000, color: "#c084fc", icon: FileText },
  { key: "negotiation", label: "Thương lượng / HĐ",   count:  4, value:   740_000_000, color: "#fbbf24", icon: Briefcase },
  { key: "won",         label: "Thành công (Won)",     count:  9, value: 1_313_000_000, color: "#4ade80", icon: CheckCircle2 },
  { key: "lost",        label: "Thất bại (Lost)",      count:  3, value:   285_000_000, color: "#f87171", icon: XCircle },
];

const INDUSTRY_DATA = [
  { name: "F&B",          value: 32, color: "#D84040", icon: Utensils },
  { name: "Thời trang",   value: 21, color: "#c084fc", icon: Shirt },
  { name: "Bất động sản", value: 18, color: "#fbbf24", icon: Home },
  { name: "Công nghệ",    value: 15, color: "#60a5fa", icon: Cpu },
  { name: "Bán lẻ",       value:  9, color: "#888",    icon: ShoppingBag },
  { name: "Khác",         value:  5, color: "#444",    icon: Building2 },
];

const SERVICE_DATA = [
  { name: "Production",  value: 44, color: "#D84040" },
  { name: "Retainer",    value: 31, color: "#60a5fa" },
  { name: "Media/Ads",   value: 17, color: "#fbbf24" },
  { name: "Branding",    value:  8, color: "#c084fc" },
];

type ActivityType = "meeting" | "followup" | "contract" | "pitch";
type ActivityUrgency = "normal" | "warning" | "overdue";

const ACTIVITIES: {
  id: number;
  type: ActivityType;
  client: string;
  avatar: string;
  title: string;
  time: string;
  urgency: ActivityUrgency;
  assigned: string;
}[] = [
  { id:1, type:"meeting",   client:"Vingroup Digital",  avatar:"VD", title:"Họp kickoff dự án TVC Q3",                    time:"Hôm nay, 14:00",    urgency:"normal",  assigned:"Lê Thị Cẩm" },
  { id:2, type:"followup",  client:"FPT Retail",         avatar:"FR", title:"Đã 3 ngày kể từ khi gửi báo giá — cần gọi", time:"Quá hạn 1 ngày",    urgency:"overdue", assigned:"Alex Johnson" },
  { id:3, type:"pitch",     client:"Masan Consumer",     avatar:"MC", title:"Pitching chiến dịch Tết 2027",               time:"Ngày mai, 09:30",   urgency:"warning", assigned:"Lê Thị Cẩm" },
  { id:4, type:"contract",  client:"F88 Finance",        avatar:"FF", title:"Hợp đồng Retainer hết hạn 30/06 — gia hạn", time:"Còn 7 ngày",        urgency:"warning", assigned:"Alex Johnson" },
  { id:5, type:"followup",  client:"Highlands Coffee",   avatar:"HC", title:"Gửi báo giá bổ sung gói Social Q3",         time:"Hôm nay, 17:00",    urgency:"normal",  assigned:"Nguyễn Minh Anh" },
  { id:6, type:"meeting",   client:"Lotte Vietnam",      avatar:"LV", title:"Lấy brief chiến dịch mùa thu",              time:"25/06, 10:00",      urgency:"normal",  assigned:"Lê Thị Cẩm" },
  { id:7, type:"followup",  client:"StartupX HN",        avatar:"SX", title:"Chưa phản hồi proposal gửi 18/06",          time:"Quá hạn 4 ngày",    urgency:"overdue", assigned:"Trần Quốc Bảo" },
];

const KEY_ACCOUNTS: {
  name: string;
  avatar: string;
  industry: string;
  totalSpend: number;
  activeProjects: number;
  status: "active" | "at-risk" | "vip";
  since: string;
  type: string;
}[] = [
  { name:"Vingroup Digital",  avatar:"VD", industry:"Bất động sản", totalSpend:850_000_000, activeProjects:2, status:"vip",    since:"2024", type:"Retainer + Project" },
  { name:"Highlands Coffee",  avatar:"HC", industry:"F&B",          totalSpend:620_000_000, activeProjects:1, status:"vip",    since:"2023", type:"Project-based" },
  { name:"F88 Finance",       avatar:"FF", industry:"Fintech",       totalSpend:430_000_000, activeProjects:1, status:"active", since:"2025", type:"Retainer" },
  { name:"Masan Consumer",    avatar:"MC", industry:"F&B",          totalSpend:310_000_000, activeProjects:0, status:"active", since:"2025", type:"Project-based" },
  { name:"MediaPro Vietnam",  avatar:"MP", industry:"Media",         totalSpend:260_000_000, activeProjects:3, status:"active", since:"2024", type:"Media Booking" },
  { name:"Lotte Vietnam",     avatar:"LV", industry:"Bán lẻ",       totalSpend:185_000_000, activeProjects:1, status:"active", since:"2026", type:"Project-based" },
  { name:"FPT Retail",        avatar:"FP", industry:"Công nghệ",    totalSpend:  0,          activeProjects:0, status:"at-risk",since:"—",    type:"Prospect" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtB(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M ₫`;
  return "—";
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: "#1A1010", border: "1px solid #2A1F1F" }}>
      <p style={{ color: d.payload.color, fontSize: "12px", fontWeight: 700 }}>{d.name}</p>
      <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>{d.value}%</p>
    </div>
  );
}

// ─── 1. KPI Cards ─────────────────────────────────────────────────────────────

function KpiCards() {
  const cards = [
    {
      label: "Leads mới",
      value: "18",
      sub: "+4 so với tháng trước",
      trend: "up",
      color: "#60a5fa",
      icon: Users,
      detail: "Tháng 6/2026",
    },
    {
      label: "Khách hàng Active",
      value: "24",
      sub: "Đang có dự án hoặc retainer",
      trend: "up",
      color: "#4ade80",
      icon: UserCheck,
      detail: "3 hợp đồng mới tháng này",
    },
    {
      label: "Tỷ lệ chuyển đổi",
      value: "42%",
      sub: "9 won / 21 leads đã xử lý",
      trend: "down",
      color: "#fbbf24",
      icon: TrendingUp,
      detail: "Mục tiêu: 55%",
    },
    {
      label: "Churn / Inactive",
      value: "5",
      sub: "Chưa tương tác > 90 ngày",
      trend: "warning",
      color: "#f87171",
      icon: UserMinus,
      detail: "Cần remarketing",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: "#555", fontSize: "12px", fontWeight: 500 }}>{c.label}</span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: c.color + "18" }}
            >
              <c.icon size={15} style={{ color: c.color }} />
            </div>
          </div>

          <div>
            <p style={{ color: c.color, fontSize: "34px", fontWeight: 800, lineHeight: 1, letterSpacing: "-1px" }}>
              {c.value}
            </p>
            <p style={{ color: "#444", fontSize: "11px" }} className="mt-1">{c.sub}</p>
          </div>

          <div
            className="flex items-center gap-1.5 pt-3"
            style={{ borderTop: "1px solid #2A1F1F" }}
          >
            {c.trend === "up"      && <ArrowUpRight  size={11} style={{ color: "#4ade80" }} />}
            {c.trend === "down"    && <ArrowDownRight size={11} style={{ color: "#f87171" }} />}
            {c.trend === "warning" && <AlertTriangle  size={11} style={{ color: "#f87171" }} />}
            <span style={{ color: "#555", fontSize: "11px" }}>{c.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 2. Sales Pipeline ────────────────────────────────────────────────────────

function SalesPipeline() {
  const active = PIPELINE_STAGES.filter((s) => !["won","lost"].includes(s.key));
  const closedWon  = PIPELINE_STAGES.find((s) => s.key === "won")!;
  const closedLost = PIPELINE_STAGES.find((s) => s.key === "lost")!;
  const maxCount = Math.max(...active.map((s) => s.count));
  const totalActive = active.reduce((s, p) => s + p.count, 0);
  const winRate = Math.round((closedWon.count / (closedWon.count + closedLost.count)) * 100);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid #2A1F1F" }}
      >
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Phễu Bán hàng</p>
          <p style={{ color: "#555", fontSize: "11px" }}>Sales Pipeline · Tháng 6/2026</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p style={{ color: "#4ade80", fontSize: "18px", fontWeight: 700 }}>{winRate}%</p>
            <p style={{ color: "#555", fontSize: "10px" }}>Win Rate</p>
          </div>
          <div className="text-right">
            <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 700 }}>{totalActive}</p>
            <p style={{ color: "#555", fontSize: "10px" }}>Leads đang chạy</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-3">
        {/* Active stages funnel */}
        {active.map((stage, i) => {
          const barW = Math.round((stage.count / maxCount) * 100);
          return (
            <div key={stage.key} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                <stage.icon size={13} style={{ color: stage.color }} />
                <span style={{ color: "#888", fontSize: "12px", minWidth: "180px" }}>{stage.label}</span>
                <div className="flex-1 relative h-8 rounded-lg overflow-hidden" style={{ background: "#141010" }}>
                  {/* Bar */}
                  <div
                    className="h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                    style={{
                      width: `${barW}%`,
                      background: `linear-gradient(90deg, ${stage.color}22, ${stage.color}44)`,
                      borderRight: `2px solid ${stage.color}`,
                    }}
                  >
                    <span style={{ color: stage.color, fontSize: "12px", fontWeight: 700 }}>
                      {stage.count}
                    </span>
                  </div>
                </div>
                <span style={{ color: "#555", fontSize: "11px", minWidth: "72px", textAlign: "right" }}>
                  {fmtB(stage.value)}
                </span>
              </div>
              {/* Conversion arrow */}
              {i < active.length - 1 && (
                <div className="flex items-center gap-3 mb-1">
                  <div style={{ minWidth: "13px" }} />
                  <div style={{ minWidth: "180px" }} />
                  <div className="flex-1 flex items-center gap-2">
                    <ChevronRight size={11} style={{ color: "#333" }} />
                    <span style={{ color: "#333", fontSize: "10px" }}>
                      {Math.round((active[i + 1].count / stage.count) * 100)}% chuyển tiếp
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Won / Lost row */}
        <div
          className="flex items-center gap-4 pt-4 mt-1"
          style={{ borderTop: "1px solid #2A1F1F" }}
        >
          {[closedWon, closedLost].map((s) => (
            <div
              key={s.key}
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: s.color + "12", border: `1px solid ${s.color}33` }}
            >
              <s.icon size={16} style={{ color: s.color }} />
              <div>
                <p style={{ color: s.color, fontSize: "18px", fontWeight: 800, lineHeight: 1 }}>{s.count}</p>
                <p style={{ color: "#555", fontSize: "11px" }}>{s.label}</p>
              </div>
              <div className="ml-auto text-right">
                <p style={{ color: s.color, fontSize: "13px", fontWeight: 700 }}>{fmtB(s.value)}</p>
                <p style={{ color: "#444", fontSize: "10px" }}>Tổng giá trị</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. Segmentation ──────────────────────────────────────────────────────────

function Segmentation() {
  const [view, setView] = useState<"industry" | "service">("industry");
  const data = view === "industry" ? INDUSTRY_DATA : SERVICE_DATA;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid #2A1F1F" }}
      >
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Phân khúc Khách hàng</p>
          <p style={{ color: "#555", fontSize: "11px" }}>Customer Segmentation</p>
        </div>
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "#141010" }}
        >
          {([["industry","Ngành hàng"],["service","Dịch vụ"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: view === k ? "#D84040" : "transparent",
                color: view === k ? "#EEEEEE" : "#555",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div style={{ width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={62}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <ReTooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span style={{ color: "#888", fontSize: "12px", flex: 1 }}>{d.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                    <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                  </div>
                  <span style={{ color: d.color, fontSize: "12px", fontWeight: 700, minWidth: "30px", textAlign: "right" }}>
                    {d.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Upcoming Activities ───────────────────────────────────────────────────

const activityIcon: Record<ActivityType, React.ElementType> = {
  meeting:  Calendar,
  followup: Phone,
  pitch:    FileText,
  contract: RefreshCcw,
};

const activityColor: Record<ActivityType, string> = {
  meeting:  "#60a5fa",
  followup: "#c084fc",
  pitch:    "#fbbf24",
  contract: "#4ade80",
};

const urgencyStyle: Record<ActivityUrgency, { dot: string; time: string }> = {
  normal:  { dot: "#555",    time: "#666" },
  warning: { dot: "#fbbf24", time: "#fbbf24" },
  overdue: { dot: "#f87171", time: "#f87171" },
};

function Activities() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid #2A1F1F" }}
      >
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Lịch trình & Nhắc việc</p>
          <p style={{ color: "#555", fontSize: "11px" }}>
            {ACTIVITIES.filter((a) => a.urgency === "overdue").length} quá hạn ·
            {" "}{ACTIVITIES.filter((a) => a.urgency === "warning").length} cần chú ý
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ACTIVITIES.filter((a) => a.urgency === "overdue").length > 0 && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "#7f1d1d33", color: "#f87171" }}
            >
              <AlertTriangle size={10} />
              {ACTIVITIES.filter((a) => a.urgency === "overdue").length} quá hạn
            </span>
          )}
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
        {ACTIVITIES.map((act) => {
          const Icon  = activityIcon[act.type];
          const color = activityColor[act.type];
          const ust   = urgencyStyle[act.urgency];

          return (
            <div
              key={act.id}
              className="flex items-center gap-4 px-6 py-4 transition-colors"
              style={{
                background: act.urgency === "overdue" ? "#7f1d1d0a" : "transparent",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = act.urgency === "overdue" ? "#7f1d1d18" : "#1A1010")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = act.urgency === "overdue" ? "#7f1d1d0a" : "transparent")}
            >
              {/* Type icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + "18", border: `1px solid ${color}33` }}
              >
                <Icon size={15} style={{ color }} />
              </div>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "#8E1616", color: "#EEEEEE" }}
              >
                {act.avatar}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                    {act.client}
                  </span>
                  {act.urgency !== "normal" && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: act.urgency === "overdue" ? "#7f1d1d33" : "#78350f33",
                        color: act.urgency === "overdue" ? "#f87171" : "#fbbf24",
                      }}
                    >
                      {act.urgency === "overdue" ? "Quá hạn" : "Cần chú ý"}
                    </span>
                  )}
                </div>
                <p style={{ color: "#666", fontSize: "12px" }} className="mt-0.5">{act.title}</p>
                <p style={{ color: "#444", fontSize: "10px" }} className="mt-0.5">Phụ trách: {act.assigned}</p>
              </div>

              {/* Time + urgency dot */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ust.dot }} />
                <span style={{ color: ust.time, fontSize: "11px", fontWeight: 600 }}>
                  {act.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 5. Key Accounts ─────────────────────────────────────────────────────────

function KeyAccounts() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid #2A1F1F" }}
      >
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>Top Khách hàng Trọng điểm</p>
          <p style={{ color: "#555", fontSize: "11px" }}>Key Accounts — Xếp hạng theo ngân sách</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#2A1F1F", color: "#888", border: "1px solid #3A2A2A" }}
        >
          <Filter size={11} />
          Lọc
        </button>
      </div>

      {/* Table header */}
      <div
        className="grid px-6 py-2"
        style={{
          gridTemplateColumns: "32px 1fr 110px 100px 80px 90px",
          borderBottom: "1px solid #2A1F1F",
        }}
      >
        {["#","Khách hàng","Ngành","Tổng ngân sách","Dự án","Trạng thái"].map((h) => (
          <span key={h} style={{ color: "#444", fontSize: "10px", fontWeight: 600 }}>{h}</span>
        ))}
      </div>

      {KEY_ACCOUNTS.map((client, i) => {
        const statusCfg = {
          vip:      { label: "VIP",       color: "#fbbf24", bg: "#78350f33" },
          active:   { label: "Active",    color: "#4ade80", bg: "#14532d22" },
          "at-risk":{ label: "Tiềm năng", color: "#60a5fa", bg: "#1e3a5f33" },
        }[client.status];

        return (
          <div
            key={client.name}
            className="grid items-center px-6 py-3.5 transition-colors cursor-pointer"
            style={{
              gridTemplateColumns: "32px 1fr 110px 100px 80px 90px",
              borderBottom: i < KEY_ACCOUNTS.length - 1 ? "1px solid #1A1010" : "none",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1A1010")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            {/* Rank */}
            <div className="flex items-center justify-center">
              {i === 0 ? (
                <Crown size={14} style={{ color: "#fbbf24" }} />
              ) : i === 1 || i === 2 ? (
                <Star size={12} style={{ color: "#888" }} />
              ) : (
                <span style={{ color: "#444", fontSize: "12px", fontWeight: 600 }}>{i + 1}</span>
              )}
            </div>

            {/* Client */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: i < 2 ? "#8E1616" : "#2A1F1F", color: "#EEEEEE" }}
              >
                {client.avatar}
              </div>
              <div className="min-w-0">
                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }} className="truncate">
                  {client.name}
                </p>
                <p style={{ color: "#444", fontSize: "10px" }}>{client.type} · Từ {client.since}</p>
              </div>
            </div>

            {/* Industry */}
            <span style={{ color: "#666", fontSize: "12px" }}>{client.industry}</span>

            {/* Spend */}
            <span
              style={{
                color: client.status === "vip" ? "#fbbf24" : "#EEEEEE",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {fmtB(client.totalSpend)}
            </span>

            {/* Projects */}
            <span style={{ color: client.activeProjects > 0 ? "#4ade80" : "#444", fontSize: "12px", fontWeight: 600 }}>
              {client.activeProjects > 0 ? `${client.activeProjects} đang chạy` : "—"}
            </span>

            {/* Status */}
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CRMOverviewPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#D8404022", border: "1px solid #D8404044" }}
          >
            <Users size={22} style={{ color: "#D84040" }} />
          </div>
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CRM</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Tổng quan</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>Kỳ:</span>
          <select
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", border: "1px solid #2A1F1F" }}
            defaultValue="q2-2026"
          >
            <option value="q2-2026">Q2 2026 (Tháng 4–6)</option>
            <option value="jun-2026">Tháng 6/2026</option>
            <option value="h1-2026">H1 2026</option>
          </select>
        </div>
      </div>

      {/* 1 – KPI Cards */}
      <KpiCards />

      {/* 2+3 – Pipeline + Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SalesPipeline />
        </div>
        <div className="lg:col-span-2">
          <Segmentation />
        </div>
      </div>

      {/* 4 – Activities */}
      <Activities />

      {/* 5 – Key Accounts */}
      <KeyAccounts />
    </div>
  );
}
