import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, Clock,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Zap,
  DollarSign, Banknote, Target, Briefcase, ChevronRight,
  Circle, Loader2, Edit2, Check, X
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

// ─── Data Types ────────────────────────────────────────────────────────────────

interface OverviewData {
  kpis: {
    available_cash: number;
    cash_trend: string;
    cash_trend_up: boolean;
    total_ar: number;
    ar_trend: string;
    ar_trend_up: boolean;
    total_ap: number;
    ap_trend: string;
    ap_trend_up: boolean;
    net_cash_flow: number;
    net_cash_trend: string;
    net_cash_trend_up: boolean;
    ar_overdue_count: number;
  };
  pl_monthly: any[];
  overdue_invoices: any[];
  upcoming_payouts: any[];
  goals: any[];
  top_projects: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtB(v: number) {
  const absV = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (absV >= 1_000_000_000) return `${sign}${(absV / 1_000_000_000).toFixed(2)}B`;
  if (absV >= 1_000_000)     return `${sign}${(absV / 1_000_000).toFixed(0)}M`;
  return `${sign}${(absV / 1_000).toFixed(0)}K`;
}
function fmtFull(v: number) { return `${fmtB(v)} ₫`; }

const payoutTypeColor: Record<string, string> = {
  outsource: "#c084fc",
  software:  "#60a5fa",
  salary:    "#fbbf24",
};

const projectStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
  "complete":    { label: "Hoàn thành",      color: "#4ade80", bg: "#14532d22" },
  "collecting":  { label: "Đang thu tiền",   color: "#60a5fa", bg: "#1e3a5f33" },
  "in-progress": { label: "Đang thực hiện",  color: "#fbbf24", bg: "#78350f33" },
  "overdue":     { label: "TT quá hạn",      color: "#f87171", bg: "#7f1d1d33" },
};

function GlassCard({
  children, className = "", accent,
}: {
  children: React.ReactNode; className?: string; accent?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "rgba(29, 22, 22, 0.45)",
        border: `1px solid ${accent ?? "rgba(46, 32, 32, 0.6)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: accent ? `0 0 24px 0 ${accent}18` : "none",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "#555", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em" }}
       className="mb-4 uppercase">
      {children}
    </p>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl"
      style={{ background: "#0F0A0A", border: "1px solid #2A1F1F", backdropFilter: "blur(8px)" }}>
      {label && <p style={{ color: "#666", fontSize: "11px", marginBottom: "6px" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>
            {p.name}: {p.value}M ₫
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 1. KPI Strip ─────────────────────────────────────────────────────────────

function KpiStrip({ kpis }: { kpis?: OverviewData["kpis"] }) {
  if (!kpis) return null;

  const cards = [
    {
      label: "Tiền mặt khả dụng",
      value: fmtFull(kpis.available_cash),
      sub: "Số dư tài khoản ngân hàng",
      color: "#4ade80",
      icon: Wallet,
      trend: kpis.cash_trend,
      trendUp: kpis.cash_trend_up,
      accent: "#4ade8033",
    },
    {
      label: "Tổng phải thu (AR)",
      value: fmtFull(kpis.total_ar),
      sub: `${kpis.ar_overdue_count || 0} hóa đơn quá hạn`,
      color: "#60a5fa",
      icon: TrendingUp,
      trend: kpis.ar_trend,
      trendUp: kpis.ar_trend_up,
      accent: "#60a5fa22",
    },
    {
      label: "Tổng phải trả (AP)",
      value: fmtFull(kpis.total_ap),
      sub: "Lương + outsource + OPEX",
      color: "#fbbf24",
      icon: TrendingDown,
      trend: kpis.ap_trend,
      trendUp: kpis.ap_trend_up,
      accent: "#fbbf2422",
    },
    {
      label: "Dòng tiền ròng",
      value: (kpis.net_cash_flow > 0 ? "+" : "") + fmtFull(kpis.net_cash_flow),
      sub: "Khả dụng − Phải trả sắp tới",
      color: "#EEEEEE",
      icon: Zap,
      trend: kpis.net_cash_trend,
      trendUp: kpis.net_cash_trend_up,
      accent: "#D8404022",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <GlassCard key={c.label} accent={c.accent}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ color: "#555", fontSize: "11px", fontWeight: 600 }}>{c.label}</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: c.color + "18" }}>
              <c.icon size={15} style={{ color: c.color }} />
            </div>
          </div>
          <p style={{ color: c.color, fontSize: "26px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.5px" }}>
            {c.value}
          </p>
          <p style={{ color: "#444", fontSize: "11px" }} className="mt-1">{c.sub}</p>
          <div className="flex items-center gap-1 mt-4 pt-3" style={{ borderTop: "1px solid #1A1010" }}>
            {c.trendUp
              ? <ArrowUpRight size={11} style={{ color: "#4ade80" }} />
              : <ArrowDownRight size={11} style={{ color: "#f87171" }} />}
            <span style={{ color: c.trendUp ? "#4ade80" : "#f87171", fontSize: "10px" }}>{c.trend}</span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ─── 2. P&L Snapshot ──────────────────────────────────────────────────────────

function PLSnapshot({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <GlassCard>
        <SectionTitle>Lãi / Lỗ tạm tính</SectionTitle>
        <p className="text-[#555] text-sm">Chưa có dữ liệu</p>
      </GlassCard>
    );
  }

  const currentMonth = data[data.length - 1];
  const grossMargin  = currentMonth.revenue > 0 ? Math.round((currentMonth.profit / currentMonth.revenue) * 100) : 0;
  const prevMonth    = data.length > 1 ? data[data.length - 2] : currentMonth;
  const profitDelta  = currentMonth.profit - prevMonth.profit;

  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-5">
        <div>
          <SectionTitle>Lãi / Lỗ tạm tính</SectionTitle>
          <div className="flex items-baseline gap-3">
            <p style={{ color: "#fbbf24", fontSize: "28px", fontWeight: 800, lineHeight: 1 }}>
              {currentMonth.profit * 1_000_000 >= 0 ? "+" : ""}{currentMonth.profit}M ₫
            </p>
            <span style={{ color: "#555", fontSize: "12px" }}>Lợi nhuận tháng</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p style={{ color: "#4ade80", fontSize: "16px", fontWeight: 700 }}>{grossMargin}%</p>
            <p style={{ color: "#444", fontSize: "10px" }}>Gross Margin</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              {profitDelta >= 0
                ? <ArrowUpRight size={12} style={{ color: "#4ade80" }} />
                : <ArrowDownRight size={12} style={{ color: "#f87171" }} />}
              <p style={{ color: profitDelta >= 0 ? "#4ade80" : "#f87171", fontSize: "16px", fontWeight: 700 }}>
                {profitDelta >= 0 ? "+" : ""}{profitDelta}M
              </p>
            </div>
            <p style={{ color: "#444", fontSize: "10px" }}>vs Tháng trước</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer minWidth={1} minHeight={1} width="100%" height={200}>
        <BarChart data={data} barGap={3} barSize={16}>
          <CartesianGrid vertical={false} stroke="#1A1010" />
          <XAxis dataKey="month" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
          <ReTooltip content={<ChartTooltip />} cursor={{ fill: "#2A1F1F44" }} />
          <Bar dataKey="revenue"  name="Doanh thu" fill="#D84040" radius={[3,3,0,0]} opacity={0.7} />
          <Bar dataKey="expenses" name="Chi phí"   fill="#555"    radius={[3,3,0,0]} opacity={0.7} />
          <Bar dataKey="profit"   name="Lợi nhuận" fill="#fbbf24" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-3">
        {[["#D84040","Doanh thu"],["#555","Chi phí"],["#fbbf24","Lợi nhuận"]].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            <span style={{ color: "#444", fontSize: "10px" }}>{l} (Triệu ₫)</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── 3. Financial Alerts ──────────────────────────────────────────────────────

function FinancialAlerts({ overdueList, payouts }: { overdueList: any[], payouts: any[] }) {
  const totalOverdue = overdueList.reduce((s, i) => s + i.amount, 0);
  const urgentPayouts = payouts.filter((p) => p.daysLeft <= 10);

  return (
    <div className="space-y-4">
      <SectionTitle>Cảnh báo & Hành động tài chính</SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue invoices */}
        <GlassCard accent="#f8717133" className="space-y-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: "#f87171" }} />
              <span style={{ color: "#f87171", fontSize: "13px", fontWeight: 700 }}>
                Hóa đơn quá hạn
              </span>
            </div>
            <span style={{ color: "#f87171", fontSize: "16px", fontWeight: 800 }}>
              {fmtFull(totalOverdue)}
            </span>
          </div>
          <div className="space-y-2">
            {overdueList.length === 0 && <p className="text-[#555] text-xs">Không có dữ liệu</p>}
            {overdueList.map((inv, i) => (
              <div
                key={inv.invoice}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: inv.days > 25 ? "#7f1d1d22" : "#1A1010",
                  border: `1px solid ${inv.days > 25 ? "#f8717133" : "#1A1010"}`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: inv.days > 25 ? "#f87171" : "#fbbf24" }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }} className="truncate">
                    {inv.client}
                  </p>
                  <p style={{ color: "#555", fontSize: "10px" }}>{inv.invoice}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ color: inv.days > 25 ? "#f87171" : "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
                    {fmtFull(inv.amount)}
                  </p>
                  <p style={{ color: "#f87171", fontSize: "10px" }}>Quá hạn {inv.days} ngày</p>
                </div>
                <button
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
                  style={{ background: "#7f1d1d44", color: "#f87171" }}>
                  Đòi nợ
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Upcoming payouts */}
        <GlassCard accent="#fbbf2422" className="space-y-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "#fbbf24" }} />
              <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
                Lịch thanh toán sắp tới
              </span>
            </div>
            <span style={{ color: "#555", fontSize: "11px" }}>7 ngày tới</span>
          </div>
          <div className="space-y-2">
            {urgentPayouts.length === 0 && <p className="text-[#555] text-xs">Không có dữ liệu</p>}
            {urgentPayouts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "#1A1010", border: "1px solid #1A1010" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: payoutTypeColor[p.type] }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }} className="truncate">
                    {p.description}
                  </p>
                  <p style={{ color: "#555", fontSize: "10px" }}>Hạn {p.dueDate}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
                    {fmtFull(p.amount)}
                  </p>
                  <p style={{ color: p.daysLeft <= 3 ? "#f87171" : "#555", fontSize: "10px" }}>
                    Còn {p.daysLeft} ngày
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── EditableTarget Component ─────────────────────────────────────────────────

function EditableTarget({
  value,
  unit,
  onSave,
}: {
  value: number;
  unit: string;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function save() {
    const n = parseFloat(draft.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) onSave(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="w-16 px-1 py-0.5 rounded text-right"
          style={{ background: "#2A1F1F", color: "#EEEEEE", fontSize: "11px", border: "1px solid #D84040", outline: "none" }}
        />
        <button onClick={save}><Check size={12} style={{ color: "#4ade80" }} /></button>
        <button onClick={() => setEditing(false)}><X size={12} style={{ color: "#f87171" }} /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="flex items-center gap-1 group p-0.5"
    >
      <span style={{ color: "#666", fontSize: "12px" }}>{value}{unit}</span>
      <Edit2 size={12} className="text-white opacity-60 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" />
    </button>
  );
}

// ─── 4. Goal Progress ─────────────────────────────────────────────────────────

function GoalProgress({ goals, onUpdateTarget }: { goals: any[], onUpdateTarget: (id: string, target: number) => void }) {
  if (!goals || goals.length === 0) {
    return (
      <GlassCard>
        <SectionTitle>Tiến độ Mục tiêu</SectionTitle>
        <p className="text-[#555] text-sm">Chưa có dữ liệu</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionTitle>Tiến độ Mục tiêu</SectionTitle>
      <div className="space-y-5 mt-2">
        {goals.map((g) => {
          const pct     = Math.min(Math.round((g.current / g.target) * 100), 100);
          const over    = g.current > g.target;
          const barColor = over && !g.lowerIsBetter ? "#4ade80"
            : pct < 70 ? "#f87171"
            : pct < 85 ? "#fbbf24"
            : "#4ade80";
          const overTarget = g.lowerIsBetter && g.current > g.target;

          return (
            <div key={g.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{g.label}</span>
                  <div className="flex items-center gap-1">
                    <span style={{ color: "#666", fontSize: "12px" }}>{g.current}{g.unit} /</span>
                    {g.id ? <EditableTarget value={g.target} unit={g.unit} onSave={(v) => onUpdateTarget(g.id, v)} /> : <span style={{ color: "#666", fontSize: "12px" }}>{g.target}{g.unit}</span>}
                  </div>
                </div>
                <span style={{ color: overTarget ? "#f87171" : barColor, fontSize: "12px", fontWeight: 700 }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1A1010" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, background: overTarget ? "#f87171" : barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── 5. Top Projects ──────────────────────────────────────────────────────────

function TopProjects({ projects }: { projects: any[] }) {
  if (!projects || projects.length === 0) {
    return (
      <GlassCard>
        <SectionTitle>Dự án nổi bật</SectionTitle>
        <p className="text-[#555] text-sm">Chưa có dữ liệu</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <div>
          <SectionTitle>Dự án nổi bật</SectionTitle>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700, marginTop: "-8px" }}>
            Top Performing Projects
          </p>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: "#555" }}>
          Xem tất cả <ChevronRight size={12} />
        </button>
      </div>

      {/* Header */}
      <div className="hidden lg:grid px-3 pb-2 mb-1"
        style={{
          gridTemplateColumns: "1fr 100px 100px 70px 110px 120px",
          borderBottom: "1px solid #1A1010",
        }}>
        {["Dự án", "Doanh thu", "Chi phí", "Margin", "Giải ngân", ""].map((h) => (
          <span key={h} style={{ color: "#333", fontSize: "10px", fontWeight: 600 }}>{h}</span>
        ))}
      </div>

      <div className="space-y-1">
        {projects.map((p, i) => {
          const s = projectStatusCfg[p.status] || { label: p.status, color: "#fff", bg: "#333" };
          const profit = p.revenue - p.expenses;
          return (
            <div
              key={p.name}
              className="grid items-center px-3 py-3 rounded-xl transition-colors cursor-pointer"
              style={{ gridTemplateColumns: "1fr 100px 100px 70px 110px 120px" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1A1010")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              {/* Project name + rank */}
              <div className="flex items-center gap-3 min-w-0">
                <span style={{ color: i < 2 ? "#fbbf24" : "#333", fontSize: "11px", fontWeight: 700, minWidth: "16px" }}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }} className="truncate">{p.name}</p>
                  <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "#2A1F1F", maxWidth: "120px" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: s.color }} />
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: 700 }}>
                {fmtFull(p.revenue)}
              </span>

              {/* Expenses */}
              <span style={{ color: "#888", fontSize: "12px" }}>{fmtFull(p.expenses)}</span>

              {/* Margin */}
              <span style={{
                color: p.margin >= 45 ? "#4ade80" : p.margin >= 35 ? "#fbbf24" : "#f87171",
                fontSize: "12px", fontWeight: 700,
              }}>
                {p.margin}%
              </span>

              {/* Status */}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit"
                style={{ background: s.bg, color: s.color }}>
                {s.label}
              </span>

              {/* Profit */}
              <span style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 700, textAlign: "right" }}>
                +{fmtFull(profit)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div
        className="flex items-center justify-between mt-4 pt-4 px-3"
        style={{ borderTop: "1px solid #1A1010" }}
      >
        <span style={{ color: "#555", fontSize: "12px" }}>Tổng các dự án nổi bật</span>
        <div className="flex items-center gap-6">
          <div>
            <span style={{ color: "#444", fontSize: "10px" }}>Doanh thu: </span>
            <span style={{ color: "#4ade80", fontSize: "13px", fontWeight: 700 }}>
              {fmtFull(projects.reduce((s, p) => s + p.revenue, 0))}
            </span>
          </div>
          <div>
            <span style={{ color: "#444", fontSize: "10px" }}>Lợi nhuận: </span>
            <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
              {fmtFull(projects.reduce((s, p) => s + p.revenue - p.expenses, 0))}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FinanceOverviewPage() {
  const currentYear = new Date().getFullYear();
  const currentMonthStr = new Date().toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });
  const currentMonthLabel = `Tháng ${new Date().toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}`;

  const PERIODS = [
    { id: "q1", label: `Q1 ${currentYear}` },
    { id: "q2", label: `Q2 ${currentYear}` },
    { id: "h1", label: `H1 ${currentYear}` },
    { id: "q3", label: `Q3 ${currentYear}` },
    { id: "q4", label: `Q4 ${currentYear}` },
    { id: "h2", label: `H2 ${currentYear}` },
    { id: currentMonthStr, label: currentMonthLabel },
    { id: "annual", label: `Cả năm ${currentYear}` },
  ];

  const [period, setPeriod] = useState<string>(currentMonthStr);
  const [isExpanded, setIsExpanded] = useState(false);

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<OverviewData>("/finance/overview");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu Finance Overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateOverviewGoal = async (id: string, target: number) => {
    try {
      await fetchApi(`/finance/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify({ target })
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          goals: prev.goals.map((g: any) => g.id === id ? { ...g, target } : g)
        };
      });
    } catch (err: any) {
      alert("Lỗi khi cập nhật mục tiêu: " + err.message);
    }
  };

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
        <p className="text-red-400 mb-4">{error || "Không có dữ liệu"}</p>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-[#D84040] text-white">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>
              Tổng quan
            </h1>
            <p style={{ color: "#555", fontSize: "12px" }}>
              Command Center · Cập nhật {new Date().toLocaleDateString("vi-VN")}, {new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex gap-1 p-1 rounded-xl transition-all duration-300 ease-in-out overflow-hidden"
            style={{ 
              background: isExpanded ? "rgba(29, 22, 22, 0.4)" : "transparent", 
              border: isExpanded ? "1px solid rgba(46, 32, 32, 0.5)" : "1px solid transparent", 
              backdropFilter: isExpanded ? "blur(8px)" : "none", 
              WebkitBackdropFilter: isExpanded ? "blur(8px)" : "none" 
            }}
            onMouseLeave={() => setIsExpanded(false)}
          >
            {PERIODS.map((p) => {
              const isSelected = period === p.id;
              const show = isExpanded || isSelected;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!isExpanded) {
                      setIsExpanded(true);
                    } else {
                      setPeriod(p.id);
                      setIsExpanded(false);
                    }
                  }}
                  className={`whitespace-nowrap rounded-lg transition-all duration-300 overflow-hidden text-sm ${
                    isSelected
                      ? "bg-[#D84040] text-[#EEEEEE] font-semibold px-4 py-2 opacity-100 max-w-[200px]"
                      : show
                        ? "text-[#666] hover:text-[#EEEEEE] font-semibold px-4 py-2 opacity-100 max-w-[200px] hover:bg-[#2A1F1F]"
                        : "px-0 max-w-0 opacity-0 border-0 m-0"
                  }`}
                  style={!show ? { paddingLeft: 0, paddingRight: 0 } : {}}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1 – Cash flow KPI */}
      <KpiStrip kpis={data.kpis} />

      {/* 2 – P&L + Goal Progress side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PLSnapshot data={data.pl_monthly} />
        </div>
        <div className="lg:col-span-1">
          <GoalProgress goals={data.goals} onUpdateTarget={handleUpdateOverviewGoal} />
        </div>
      </div>

      {/* 3 – Financial Alerts */}
      <FinancialAlerts overdueList={data.overdue_invoices} payouts={data.upcoming_payouts} />

      {/* 5 – Top Projects */}
      <TopProjects projects={data.top_projects} />
    </div>
  );
}
