import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, Clock,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Zap,
  DollarSign, Banknote, Target, Briefcase, ChevronRight,
  Circle,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PL_MONTHLY = [
  { month: "T1", revenue: 380, expenses: 268, profit: 112 },
  { month: "T2", revenue: 304, expenses: 243, profit:  61 },
  { month: "T3", revenue: 492, expenses: 310, profit: 182 },
  { month: "T4", revenue: 438, expenses: 290, profit: 148 },
  { month: "T5", revenue: 530, expenses: 348, profit: 182 },
  { month: "T6", revenue: 516, expenses: 376, profit: 140 },
];

const OVERDUE_INVOICES = [
  { client: "MediaPro Vietnam",   invoice: "INV-044", amount: 120_000_000, days: 31 },
  { client: "Công ty Ánh Dương", invoice: "INV-038", amount:  45_000_000, days: 18 },
  { client: "StartupX HN",        invoice: "INV-051", amount:  22_000_000, days:  9 },
];

const UPCOMING_PAYOUTS = [
  { description: "Cát-xê Trịnh Minh Tuấn — TVC Q2",  amount: 7_200_000, dueDate: "30/06", daysLeft: 7, type: "outsource" },
  { description: "Cát-xê Nguyễn Bảo Châu — TVC Q2",  amount: 3_600_000, dueDate: "30/06", daysLeft: 7, type: "outsource" },
  { description: "Adobe Creative Cloud — 6 seat",     amount: 8_400_000, dueDate: "02/07", daysLeft: 9, type: "software" },
  { description: "Lương tháng 7 — 6 nhân sự",         amount:138_000_000,dueDate: "05/07", daysLeft:12, type: "salary"    },
  { description: "Server hosting & domain renewal",   amount: 3_600_000, dueDate: "10/07", daysLeft:17, type: "software" },
];

const GOALS = [
  { label: "Doanh thu tháng 6",    current: 516, target: 600,  unit: "M ₫", color: "#D84040" },
  { label: "Tỷ lệ chốt hợp đồng", current: 42,  target: 55,   unit: "%",   color: "#fbbf24" },
  { label: "Chi phí / Doanh thu",  current: 73,  target: 80,   unit: "%",   color: "#60a5fa", lowerIsBetter: true },
  { label: "Gross Margin",         current: 38,  target: 45,   unit: "%",   color: "#4ade80" },
];

const TOP_PROJECTS = [
  { name: "Vingroup — TVC Q2",        revenue: 320_000_000, expenses: 185_000_000, margin: 42, status: "collecting",  pct: 80 },
  { name: "Highlands — Rebranding",   revenue: 180_000_000, expenses:  92_000_000, margin: 49, status: "complete",    pct: 100 },
  { name: "F88 — Social Retainer Q2", revenue: 120_000_000, expenses:  54_000_000, margin: 55, status: "in-progress", pct: 60 },
  { name: "MediaPro — KOL Campaign",  revenue:  96_000_000, expenses:  62_000_000, margin: 35, status: "overdue",     pct: 100 },
  { name: "StartupX — Launch Kit",    revenue:  75_000_000, expenses:  38_000_000, margin: 49, status: "complete",    pct: 100 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtB(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M`;
  return `${(v / 1_000).toFixed(0)}K`;
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

function KpiStrip() {
  const cards = [
    {
      label: "Tiền mặt khả dụng",
      value: "2.14B ₫",
      sub: "Số dư tài khoản ngân hàng",
      color: "#4ade80",
      icon: Wallet,
      trend: "+12M so với tuần trước",
      trendUp: true,
      accent: "#4ade8033",
    },
    {
      label: "Tổng phải thu (AR)",
      value: "336M ₫",
      sub: "3 hóa đơn chưa thanh toán",
      color: "#60a5fa",
      icon: TrendingUp,
      trend: "187M đến hạn trong 14 ngày",
      trendUp: true,
      accent: "#60a5fa22",
    },
    {
      label: "Tổng phải trả (AP)",
      value: "420M ₫",
      sub: "Lương + outsource + OPEX",
      color: "#fbbf24",
      icon: TrendingDown,
      trend: "149M đến hạn tuần này",
      trendUp: false,
      accent: "#fbbf2422",
    },
    {
      label: "Dòng tiền ròng",
      value: "+1.72B ₫",
      sub: "Khả dụng − Phải trả sắp tới",
      color: "#EEEEEE",
      icon: Zap,
      trend: "Dòng tiền khỏe mạnh",
      trendUp: true,
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

function PLSnapshot() {
  const currentMonth = PL_MONTHLY[PL_MONTHLY.length - 1];
  const grossMargin  = Math.round((currentMonth.profit / currentMonth.revenue) * 100);
  const prevMonth    = PL_MONTHLY[PL_MONTHLY.length - 2];
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
            <span style={{ color: "#555", fontSize: "12px" }}>Lợi nhuận tháng 6</span>
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
            <p style={{ color: "#444", fontSize: "10px" }}>vs T5</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={PL_MONTHLY} barGap={3} barSize={16}>
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

function FinancialAlerts() {
  const totalOverdue = OVERDUE_INVOICES.reduce((s, i) => s + i.amount, 0);
  const urgentPayouts = UPCOMING_PAYOUTS.filter((p) => p.daysLeft <= 10);

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
            {OVERDUE_INVOICES.map((inv, i) => (
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

// ─── 4. Goal Progress ─────────────────────────────────────────────────────────

function GoalProgress() {
  return (
    <GlassCard>
      <SectionTitle>Tiến độ Mục tiêu</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {GOALS.map((g) => {
          const pct     = Math.min(Math.round((g.current / g.target) * 100), 100);
          const over    = g.current > g.target;
          const good    = g.lowerIsBetter ? g.current <= g.target : over || pct >= 85;
          const barColor = over && !g.lowerIsBetter ? "#4ade80"
            : pct < 70 ? "#f87171"
            : pct < 85 ? "#fbbf24"
            : "#4ade80";
          const overTarget = g.lowerIsBetter && g.current > g.target;

          return (
            <div key={g.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: "#666", fontSize: "11px" }}>{g.label}</span>
                <span style={{ color: barColor, fontSize: "11px", fontWeight: 700 }}>{pct}%</span>
              </div>

              {/* Circular progress */}
              <div className="relative w-16 h-16 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1A1010" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={overTarget ? "#f87171" : barColor} strokeWidth="3"
                    strokeDasharray={`${(Math.min(pct, 100) / 100) * 87.96} 87.96`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ color: overTarget ? "#f87171" : barColor, fontSize: "11px", fontWeight: 800 }}>
                    {g.current}{g.unit === "%" ? "%" : ""}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>
                  {g.current}{g.unit}
                </p>
                <p style={{ color: "#444", fontSize: "10px" }}>/ {g.target}{g.unit}</p>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1A1010" }}>
                <div className="h-full rounded-full transition-all"
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

function TopProjects() {
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
        {TOP_PROJECTS.map((p, i) => {
          const s = projectStatusCfg[p.status];
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
        <span style={{ color: "#555", fontSize: "12px" }}>Tổng 5 dự án nổi bật</span>
        <div className="flex items-center gap-6">
          <div>
            <span style={{ color: "#444", fontSize: "10px" }}>Doanh thu: </span>
            <span style={{ color: "#4ade80", fontSize: "13px", fontWeight: 700 }}>
              {fmtFull(TOP_PROJECTS.reduce((s, p) => s + p.revenue, 0))}
            </span>
          </div>
          <div>
            <span style={{ color: "#444", fontSize: "10px" }}>Lợi nhuận: </span>
            <span style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 700 }}>
              {fmtFull(TOP_PROJECTS.reduce((s, p) => s + p.revenue - p.expenses, 0))}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FinanceOverviewPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(216,64,64,0.12)",
              border: "1px solid rgba(216,64,64,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <DollarSign size={22} style={{ color: "#D84040" }} />
          </div>
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>
              Tổng quan
            </h1>
            <p style={{ color: "#555", fontSize: "12px" }}>Command Center · Cập nhật 23/06/2026, 14:00</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>Kỳ:</span>
          <select className="px-3 py-1.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(29,22,22,0.8)", color: "#EEEEEE", border: "1px solid #2A1F1F", backdropFilter: "blur(8px)" }}
            defaultValue="jun-2026">
            <option value="jun-2026">Tháng 6/2026</option>
            <option value="q2-2026">Q2 2026</option>
            <option value="h1-2026">H1 2026</option>
          </select>
        </div>
      </div>

      {/* 1 – Cash flow KPI */}
      <KpiStrip />

      {/* 2 – P&L + Goal Progress side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PLSnapshot />
        </div>
        <div className="lg:col-span-1">
          <GoalProgress />
        </div>
      </div>

      {/* 3 – Financial Alerts */}
      <FinancialAlerts />

      {/* 5 – Top Projects */}
      <TopProjects />
    </div>
  );
}
