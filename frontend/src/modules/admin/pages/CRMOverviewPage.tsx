// @ts-nocheck
import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, UserCheck, TrendingUp, UserMinus, Crown, Star,
  Calendar, Phone, FileText, Clock, AlertTriangle,
  ChevronRight, ArrowUpRight, ArrowDownRight, Circle,
  Briefcase, RefreshCcw, CheckCircle2, XCircle,
  Building2, ShoppingBag, Home, Cpu, Utensils, Shirt,
  Filter, Loader2,
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNotes(notesStr: string | null) {
  if (!notesStr) return null;
  try {
    const trimmed = notesStr.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return JSON.parse(trimmed);
    }
  } catch (e) {
    // Return null if not JSON
  }
  return null;
}

function fmtB(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M ₫`;
  return `${v.toLocaleString()} ₫`;
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

function KpiCards({ clients }: { clients: any[] }) {
  // Leads mới: status is Lead
  const newLeads = clients.filter(c => c.status === "Lead").length;
  // Active clients: status is Active
  const activeClients = clients.filter(c => c.status === "Active").length;

  // Conversion rate: (Won/Active + Completed) vs Total Proposals
  let totalProposalsCount = 0;
  let wonProposalsCount = 0;
  clients.forEach(c => {
    const notes = parseNotes(c.notes);
    if (notes && notes.proposals) {
      notes.proposals.forEach((p: any) => {
        totalProposalsCount++;
        if (p.status === "Accepted" || p.status === "Won") {
          wonProposalsCount++;
        }
      });
    }
  });
  
  const conversionRate = totalProposalsCount > 0 
    ? Math.round((wonProposalsCount / totalProposalsCount) * 100) 
    : clients.length > 0 
      ? Math.round((clients.filter(c => c.status !== "Lead").length / clients.length) * 100)
      : 0;

  // Churn / Inactive: clients with status Completed or Paused
  const inactiveClients = clients.filter(c => c.status === "Paused" || c.status === "Completed").length;

  const cards = [
    {
      label: "Leads mới",
      value: newLeads.toString(),
      sub: "Đang trong phễu tiếp cận",
      trend: "up",
      color: "#60a5fa",
      icon: Users,
      detail: "CRM Leads",
    },
    {
      label: "Khách hàng Active",
      value: activeClients.toString(),
      sub: "Đang có hợp đồng hợp tác",
      trend: "up",
      color: "#4ade80",
      icon: UserCheck,
      detail: "Đang hợp tác",
    },
    {
      label: "Tỷ lệ chuyển đổi",
      value: `${conversionRate}%`,
      sub: totalProposalsCount > 0 ? `${wonProposalsCount} won / ${totalProposalsCount} proposals` : "Số lượng khách hàng chính thức",
      trend: "up",
      color: "#fbbf24",
      icon: TrendingUp,
      detail: "Tỷ lệ chốt deal",
    },
    {
      label: "Churn / Inactive",
      value: inactiveClients.toString(),
      sub: "Tạm dừng hoặc đã nghiệm thu",
      trend: "warning",
      color: "#f87171",
      icon: UserMinus,
      detail: "Tạm dừng/Hoàn thành",
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

function SalesPipeline({ clients }: { clients: any[] }) {
  const stageCounts: Record<string, number> = { new: 0, contacted: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
  const stageValues: Record<string, number> = { new: 0, contacted: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };

  clients.forEach(c => {
    const notes = parseNotes(c.notes);
    const budget = c.total_budget || notes?.ltv || 0;
    
    let stage = "new";
    if (c.status === "Active" || c.status === "Completed") {
      stage = "won";
    } else if (c.status === "Paused") {
      stage = "negotiation";
    } else if (c.status === "Lead") {
      const proposals = notes?.proposals || [];
      if (proposals.some((p: any) => p.status === "Accepted" || p.status === "Won")) {
        stage = "won";
      } else if (proposals.some((p: any) => p.status === "Negotiating")) {
        stage = "negotiation";
      } else if (proposals.some((p: any) => p.status === "Pending")) {
        stage = "proposal";
      } else if (notes?.activity_logs?.length > 0 || c.contact) {
        stage = "contacted";
      } else {
        stage = "new";
      }
    }

    stageCounts[stage]++;
    stageValues[stage] += budget;
  });

  const PIPELINE_STAGES = [
    { key: "new",         label: "Mới tiếp cận",        count: stageCounts.new, value: stageValues.new, color: "#888",    icon: Circle },
    { key: "contacted",   label: "Đã liên hệ / Brief",  count: stageCounts.contacted, value: stageValues.contacted, color: "#60a5fa", icon: Phone },
    { key: "proposal",    label: "Đang Proposal/Pitch",  count: stageCounts.proposal, value: stageValues.proposal, color: "#c084fc", icon: FileText },
    { key: "negotiation", label: "Thương lượng / HĐ",   count: stageCounts.negotiation, value: stageValues.negotiation, color: "#fbbf24", icon: Briefcase },
    { key: "won",         label: "Thành công (Won)",     count: stageCounts.won, value: stageValues.won, color: "#4ade80", icon: CheckCircle2 },
    { key: "lost",        label: "Thất bại (Lost)",      count: stageCounts.lost, value: stageValues.lost, color: "#f87171", icon: XCircle },
  ];

  const active = PIPELINE_STAGES.filter((s) => !["won","lost"].includes(s.key));
  const closedWon  = PIPELINE_STAGES.find((s) => s.key === "won")!;
  const closedLost = PIPELINE_STAGES.find((s) => s.key === "lost")!;
  const maxCount = Math.max(...active.map((s) => s.count), 1);
  const totalActive = active.reduce((s, p) => s + p.count, 0);
  const winRate = closedWon.count + closedLost.count > 0
    ? Math.round((closedWon.count / (closedWon.count + closedLost.count)) * 100)
    : 100;

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
          <p style={{ color: "#555", fontSize: "11px" }}>Sales Pipeline hoạt động</p>
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
          const barW = Math.round((stage.count / maxCount) * 100) || 5; // fallback to 5% min width if 0
          return (
            <div key={stage.key} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                <stage.icon size={13} style={{ color: stage.color }} />
                <span style={{ color: "#888", fontSize: "12px", minWidth: "160px" }} className="truncate">{stage.label}</span>
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
                  <div style={{ minWidth: "160px" }} />
                  <div className="flex-1 flex items-center gap-2">
                    <ChevronRight size={11} style={{ color: "#333" }} />
                    <span style={{ color: "#333", fontSize: "10px" }}>
                      {stage.count > 0 ? Math.round((active[i + 1].count / stage.count) * 100) : 0}% chuyển tiếp
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

function Segmentation({ clients, projects }: { clients: any[]; projects: any[] }) {
  const [view, setView] = useState<"industry" | "service">("industry");

  // Industry
  const industryCounts: Record<string, number> = {};
  clients.forEach(c => {
    const ind = c.industry?.trim() || "Khác";
    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
  });

  const totalClients = clients.length || 1;
  const industryColors = ["#D84040", "#c084fc", "#fbbf24", "#60a5fa", "#888", "#4ade80", "#f87171", "#444"];
  const industryData = Object.entries(industryCounts)
    .map(([name, count]) => ({
      name,
      count,
      value: Math.round((count / totalClients) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .map((d, index) => ({
      ...d,
      color: industryColors[index % industryColors.length]
    }));

  // Service formats
  const formatCounts: Record<string, number> = {};
  projects.forEach(p => {
    const fmt = p.format || "Khác";
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
  });

  const totalProjects = projects.length || 1;
  const serviceColors = ["#D84040", "#60a5fa", "#fbbf24", "#c084fc", "#888", "#4ade80", "#444"];
  const serviceData = Object.entries(formatCounts)
    .map(([name, count]) => ({
      name,
      count,
      value: Math.round((count / totalProjects) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .map((d, index) => ({
      ...d,
      color: serviceColors[index % serviceColors.length]
    }));

  const data = view === "industry" ? industryData : serviceData;
  const activeData = data.length > 0 ? data : [{ name: "Trống", value: 100, color: "#444" }];

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
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Donut */}
          <div style={{ width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={62}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {activeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <ReTooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5 w-full">
            {activeData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span style={{ color: "#888", fontSize: "12px", flex: 1 }} className="truncate">{d.name}</span>
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

const activityIcon: Record<string, React.ElementType> = {
  meeting:  Calendar,
  followup: Phone,
  pitching: FileText,
  contract: RefreshCcw,
};

const activityColor: Record<string, string> = {
  meeting:  "#60a5fa",
  followup: "#c084fc",
  pitching: "#fbbf24",
  contract: "#4ade80",
};

const urgencyStyle: Record<string, { dot: string; time: string }> = {
  normal:  { dot: "#555",    time: "#666" },
  warning: { dot: "#fbbf24", time: "#fbbf24" },
  overdue: { dot: "#f87171", time: "#f87171" },
};

function Activities({ clients }: { clients: any[] }) {
  const allActivities: any[] = [];
  
  clients.forEach(c => {
    const notes = parseNotes(c.notes);
    if (notes && Array.isArray(notes.appointments)) {
      notes.appointments.forEach((app: any) => {
        let urgency: "normal" | "warning" | "overdue" = "normal";
        let timeLabel = app.date || "";
        let isOverdue = false;
        
        if (app.date) {
          const appDate = new Date(app.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffTime = appDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            urgency = "overdue";
            isOverdue = true;
            timeLabel = `Quá hạn ${Math.abs(diffDays)} ngày`;
          } else if (diffDays === 0) {
            urgency = "warning";
            timeLabel = "Hôm nay";
          } else if (diffDays === 1) {
            urgency = "warning";
            timeLabel = "Ngày mai";
          } else {
            urgency = "normal";
            timeLabel = appDate.toLocaleDateString("vi-VN");
          }
        }

        allActivities.push({
          id: app.id || Math.random().toString(),
          type: (app.type || "meeting").toLowerCase(),
          client: c.name,
          avatar: c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
          title: app.content || "Lịch hẹn với khách hàng",
          time: timeLabel,
          urgency,
          assigned: notes.assignee || "Sarah Kim",
          rawDate: app.date || "9999-12-31",
          isOverdue
        });
      });
    }
  });

  // Sort: overdue first, then nearest future dates
  allActivities.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
  });

  const displayActivities = allActivities.slice(0, 8);

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
            {allActivities.filter((a) => a.urgency === "overdue").length} quá hạn ·
            {" "}{allActivities.filter((a) => a.urgency === "warning").length} cần chú ý
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allActivities.filter((a) => a.urgency === "overdue").length > 0 && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "#7f1d1d33", color: "#f87171" }}
            >
              <AlertTriangle size={10} />
              {allActivities.filter((a) => a.urgency === "overdue").length} quá hạn
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#2A1F1F]" style={{ borderColor: "#2A1F1F" }}>
        {displayActivities.map((act) => {
          const Icon  = activityIcon[act.type] || Calendar;
          const color = activityColor[act.type] || "#60a5fa";
          const ust   = urgencyStyle[act.urgency] || urgencyStyle["normal"];

          return (
            <div
              key={act.id}
              className="flex items-center gap-4 px-6 py-4 transition-colors"
              style={{
                background: act.urgency === "overdue" ? "rgba(127, 29, 29, 0.04)" : "transparent",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = act.urgency === "overdue" ? "rgba(127, 29, 29, 0.08)" : "#1A1010")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = act.urgency === "overdue" ? "rgba(127, 29, 29, 0.04)" : "transparent")}
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
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: act.urgency === "overdue" ? "rgba(127, 29, 29, 0.2)" : "rgba(120, 53, 15, 0.2)",
                        color: act.urgency === "overdue" ? "#f87171" : "#fbbf24",
                      }}
                    >
                      {act.urgency === "overdue" ? "Quá hạn" : "Cần chú ý"}
                    </span>
                  )}
                </div>
                <p style={{ color: "#888", fontSize: "12px" }} className="mt-0.5">{act.title}</p>
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
        {displayActivities.length === 0 && (
          <p style={{ color: "#555", fontSize: "13px", textAlign: "center" }} className="py-8">
            Chưa có lịch trình ghi nhận
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 5. Key Accounts ─────────────────────────────────────────────────────────

function KeyAccounts({ clients }: { clients: any[] }) {
  const keyAccountsList = [...clients]
    .map(c => {
      const notes = parseNotes(c.notes);
      const totalBudget = c.total_budget || notes?.ltv || 0;
      
      let status: "active" | "at-risk" | "vip" = "active";
      if (c.status === "Lead") {
        status = "at-risk";
      } else if (totalBudget >= 300_000_000 || notes?.tier === "VIP") {
        status = "vip";
      }

      return {
        slug: c.slug,
        name: c.name,
        avatar: c.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
        industry: c.industry || "Chưa xác định",
        totalSpend: totalBudget,
        activeProjects: c.project_count || 0,
        status,
        since: c.since || "2026",
        type: notes?.tier || "SME",
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 7);

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
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Table header */}
          <div
            className="grid px-6 py-2"
            style={{
              gridTemplateColumns: "32px 1.5fr 1fr 1.2fr 1fr 90px",
              borderBottom: "1px solid #2A1F1F",
            }}
          >
            {["#","Khách hàng","Ngành","Tổng ngân sách","Dự án","Trạng thái"].map((h) => (
              <span key={h} style={{ color: "#444", fontSize: "10px", fontWeight: 600 }}>{h}</span>
            ))}
          </div>

          {keyAccountsList.map((client, i) => {
            const statusCfg = {
              vip:      { label: "VIP",       color: "#fbbf24", bg: "#78350f33" },
              active:   { label: "Active",    color: "#4ade80", bg: "#14532d22" },
              "at-risk":{ label: "Tiềm năng", color: "#60a5fa", bg: "#1e3a5f33" },
            }[client.status] || { label: "Active", color: "#4ade80", bg: "#14532d22" };

            return (
              <div
                key={client.name}
                className="grid items-center px-6 py-3.5 transition-colors cursor-pointer"
                style={{
                  gridTemplateColumns: "32px 1.5fr 1fr 1.2fr 1fr 90px",
                  borderBottom: i < keyAccountsList.length - 1 ? "1px solid #1A1010" : "none",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1A1010")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                onClick={() => window.location.href = `/admin/clients/${client.slug}`}
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
                <span style={{ color: "#666", fontSize: "12px" }} className="truncate pr-2">{client.industry}</span>

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
                  {client.activeProjects > 0 ? `${client.activeProjects} dự án` : "—"}
                </span>

                {/* Status */}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit"
                  style={{ background: statusCfg.bg, color: statusCfg.color }}
                >
                  {statusCfg.label}
                </span>
              </div>
            );
          })}
          {keyAccountsList.length === 0 && (
            <p style={{ color: "#555", fontSize: "13px", textAlign: "center" }} className="py-8">
              Chưa có danh sách khách hàng
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CRMOverviewPage() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi("/projects/clients/all"),
      fetchApi("/projects?size=1000")
    ])
      .then(([clientsData, projectsData]) => {
        setClients(clientsData || []);
        setProjects(projectsData?.items || projectsData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading CRM overview data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-[#D84040]" size={36} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
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
      </div>

      {/* 1 – KPI Cards */}
      <KpiCards clients={clients} />

      {/* 2+3 – Pipeline + Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SalesPipeline clients={clients} />
        </div>
        <div className="lg:col-span-2">
          <Segmentation clients={clients} projects={projects} />
        </div>
      </div>

      {/* 4 – Activities */}
      <Activities clients={clients} />

      {/* 5 – Key Accounts */}
      <KeyAccounts clients={clients} />
    </div>
  );
}
