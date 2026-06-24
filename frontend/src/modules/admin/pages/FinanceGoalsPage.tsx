import { useState } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Wallet,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart2,
  Layers,
  Megaphone,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalStatus = "on-track" | "at-risk" | "behind";

interface GoalItem {
  id: string;
  label: string;
  sub?: string;
  target: number;
  current: number;
  unit: string;
  prefix?: string;
  status: GoalStatus;
  note?: string;
  higherIsBetter?: boolean; // false for AR Days, OPEX%, etc.
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const revenueGoals: GoalItem[] = [
  {
    id: "prod",
    label: "Sản xuất nội dung",
    sub: "Production",
    target: 800_000_000,
    current: 612_000_000,
    unit: "₫",
    prefix: "₫",
    status: "on-track",
    higherIsBetter: true,
  },
  {
    id: "retainer",
    label: "Quản lý kênh / Social",
    sub: "Retainer",
    target: 500_000_000,
    current: 310_000_000,
    unit: "₫",
    prefix: "₫",
    status: "at-risk",
    higherIsBetter: true,
  },
  {
    id: "media",
    label: "Chạy quảng cáo",
    sub: "Media Booking",
    target: 350_000_000,
    current: 390_000_000,
    unit: "₫",
    prefix: "₫",
    status: "on-track",
    note: "Vượt kế hoạch",
    higherIsBetter: true,
  },
  {
    id: "winrate",
    label: "Tỷ lệ chốt dự án",
    sub: "Win Rate",
    target: 55,
    current: 42,
    unit: "%",
    status: "behind",
    note: "21 pitch, 9 thành công",
    higherIsBetter: true,
  },
];

const profitGoals: GoalItem[] = [
  {
    id: "gross",
    label: "Biên lợi nhuận gộp",
    sub: "Gross Margin",
    target: 45,
    current: 38,
    unit: "%",
    status: "at-risk",
    note: "Chi phí outsource tăng cao Q2",
    higherIsBetter: true,
  },
  {
    id: "net",
    label: "Lợi nhuận ròng",
    sub: "Net Profit",
    target: 18,
    current: 14.2,
    unit: "%",
    status: "at-risk",
    note: "Chi phí vận hành cố định chiếm 23.8%",
    higherIsBetter: true,
  },
];

const costGoals: GoalItem[] = [
  {
    id: "prodbudget",
    label: "Ngân sách sản xuất",
    sub: "Production Budget",
    target: 300_000_000,
    current: 247_000_000,
    unit: "₫",
    prefix: "₫",
    status: "on-track",
    note: "Còn 53M trong ngân sách",
    higherIsBetter: false,
  },
  {
    id: "opex",
    label: "Chi phí vận hành / Doanh thu",
    sub: "OPEX Rate",
    target: 20,
    current: 23.8,
    unit: "%",
    status: "behind",
    note: "Vượt ngưỡng an toàn 3.8%",
    higherIsBetter: false,
  },
];

const cashGoals: GoalItem[] = [
  {
    id: "ar",
    label: "Kỳ hạn thu tiền",
    sub: "AR Days",
    target: 30,
    current: 44,
    unit: "ngày",
    status: "behind",
    note: "3 khách hàng đang trễ hạn",
    higherIsBetter: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number, prefix: string | undefined, unit: string) {
  if (prefix === "₫") {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ₫`;
    if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(0)}M ₫`;
    return `${value.toLocaleString()} ₫`;
  }
  if (unit === "%") return `${value}%`;
  return `${value} ${unit}`;
}

function pct(current: number, target: number) {
  return Math.min(Math.round((current / target) * 100), 100);
}

const statusConfig: Record<GoalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "on-track": { label: "Đúng kế hoạch", color: "#4ade80", bg: "#14532d22", icon: CheckCircle2 },
  "at-risk":  { label: "Cần chú ý",     color: "#fbbf24", bg: "#78350f33", icon: AlertTriangle },
  "behind":   { label: "Dưới kế hoạch", color: "#f87171", bg: "#7f1d1d33", icon: XCircle },
};

function StatusBadge({ status }: { status: GoalStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({
  value,
  status,
  higherIsBetter = true,
}: {
  value: number;
  status: GoalStatus;
  higherIsBetter?: boolean;
}) {
  const color =
    status === "on-track" ? "#4ade80"
    : status === "at-risk" ? "#fbbf24"
    : "#f87171";

  const overTarget = value > 100;
  const displayValue = Math.min(value, 100);

  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${displayValue}%`,
          background: overTarget && higherIsBetter
            ? "linear-gradient(90deg, #4ade80, #22d3ee)"
            : color,
        }}
      />
      {/* Target marker at 100% */}
      <div
        className="absolute top-0 bottom-0 w-0.5"
        style={{ left: "100%", background: "#555", transform: "translateX(-1px)" }}
      />
    </div>
  );
}

function EditableTarget({
  value,
  prefix,
  unit,
  onSave,
}: {
  value: number;
  prefix?: string;
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
          className="w-28 px-2 py-0.5 rounded text-right"
          style={{ background: "#2A1F1F", color: "#EEEEEE", fontSize: "13px", border: "1px solid #D84040", outline: "none" }}
        />
        <button onClick={save}><Check size={12} style={{ color: "#4ade80" }} /></button>
        <button onClick={() => setEditing(false)}><X size={12} style={{ color: "#f87171" }} /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="flex items-center gap-1 group"
    >
      <span style={{ color: "#888", fontSize: "13px" }}>{fmt(value, prefix, unit)}</span>
      <Edit2 size={10} style={{ color: "#444" }} className="group-hover:text-gray-400 transition-colors" />
    </button>
  );
}

// ─── Goal Row ─────────────────────────────────────────────────────────────────

function GoalRow({ item, onUpdateTarget }: { item: GoalItem; onUpdateTarget: (id: string, v: number) => void }) {
  const progress = pct(item.current, item.target);
  const overTarget = item.current > item.target;
  const delta = item.higherIsBetter === false
    ? ((item.target - item.current) / item.target) * 100
    : ((item.current - item.target) / item.target) * 100;

  return (
    <div
      className="px-5 py-4 space-y-3"
    >
      {/* Row header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{item.label}</span>
            {item.sub && (
              <span style={{ color: "#555", fontSize: "11px" }}>{item.sub}</span>
            )}
            <StatusBadge status={item.status} />
          </div>
          {item.note && (
            <p style={{ color: "#666", fontSize: "11px" }} className="mt-0.5">{item.note}</p>
          )}
        </div>

        {/* Delta pill */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: delta >= 0 ? "#14532d22" : "#7f1d1d22",
            color: delta >= 0 ? "#4ade80" : "#f87171",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={progress} status={overTarget && item.higherIsBetter !== false ? "on-track" : item.status} higherIsBetter={item.higherIsBetter} />

      {/* Numbers row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span style={{ color: "#666", fontSize: "11px" }}>Thực tế:</span>
          <span
            style={{
              color: item.status === "on-track" ? "#4ade80" : item.status === "at-risk" ? "#fbbf24" : "#f87171",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {fmt(item.current, item.prefix, item.unit)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span style={{ color: "#444", fontSize: "10px" }}>
            {progress}% kế hoạch
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span style={{ color: "#666", fontSize: "11px" }}>Mục tiêu:</span>
          <EditableTarget
            value={item.target}
            prefix={item.prefix}
            unit={item.unit}
            onSave={(v) => onUpdateTarget(item.id, v)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  sub,
  icon: Icon,
  accentColor,
  goals,
  onUpdateTarget,
  summary,
}: {
  title: string;
  sub: string;
  icon: React.ElementType;
  accentColor: string;
  goals: GoalItem[];
  onUpdateTarget: (id: string, v: number) => void;
  summary?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const statusCounts = goals.reduce(
    (acc, g) => { acc[g.status]++; return acc; },
    { "on-track": 0, "at-risk": 0, behind: 0 } as Record<GoalStatus, number>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      {/* Section header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ borderBottom: collapsed ? "none" : "1px solid #2A1F1F" }}
        onClick={() => setCollapsed((c) => !c)}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1A1010")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: accentColor + "22", border: `1px solid ${accentColor}33` }}
          >
            <Icon size={16} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>{title}</p>
            <p style={{ color: "#555", fontSize: "11px" }}>{sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini status pills */}
          <div className="hidden sm:flex items-center gap-2">
            {statusCounts["on-track"] > 0 && (
              <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>
                ✓ {statusCounts["on-track"]} đúng kế hoạch
              </span>
            )}
            {statusCounts["at-risk"] > 0 && (
              <span style={{ color: "#fbbf24", fontSize: "11px", fontWeight: 600 }}>
                ⚠ {statusCounts["at-risk"]} cần chú ý
              </span>
            )}
            {statusCounts["behind"] > 0 && (
              <span style={{ color: "#f87171", fontSize: "11px", fontWeight: 600 }}>
                ✗ {statusCounts["behind"]} dưới kế hoạch
              </span>
            )}
          </div>
          {collapsed ? <ChevronDown size={15} style={{ color: "#555" }} /> : <ChevronUp size={15} style={{ color: "#555" }} />}
        </div>
      </button>

      {!collapsed && (
        <>
          <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
            {goals.map((g) => (
              <GoalRow key={g.id} item={g} onUpdateTarget={onUpdateTarget} />
            ))}
          </div>
          {summary && (
            <div style={{ borderTop: "1px solid #2A1F1F" }}>
              {summary}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FinanceGoalsPage() {
  const [revenue, setRevenue] = useState(revenueGoals);
  const [profit,  setProfit]  = useState(profitGoals);
  const [cost,    setCost]    = useState(costGoals);
  const [cash,    setCash]    = useState(cashGoals);

  function updater(setter: React.Dispatch<React.SetStateAction<GoalItem[]>>) {
    return (id: string, v: number) =>
      setter((prev) => prev.map((g) => g.id === id ? { ...g, target: v } : g));
  }

  const allGoals = [...revenue, ...profit, ...cost, ...cash];
  const onTrack  = allGoals.filter((g) => g.status === "on-track").length;
  const atRisk   = allGoals.filter((g) => g.status === "at-risk").length;
  const behind   = allGoals.filter((g) => g.status === "behind").length;

  // Revenue total progress
  const totalRevTarget = revenue.filter((g) => g.prefix === "₫").reduce((s, g) => s + g.target, 0);
  const totalRevActual = revenue.filter((g) => g.prefix === "₫").reduce((s, g) => s + g.current, 0);
  const revPct = pct(totalRevActual, totalRevTarget);

  return (
    <div className="p-8 space-y-7">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#D8404022", border: "1px solid #D8404044" }}
          >
            <Target size={22} style={{ color: "#D84040" }} />
          </div>
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Mục tiêu</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>Chu kỳ:</span>
          <select
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", border: "1px solid #2A1F1F", outline: "none" }}
            defaultValue="2026-h1"
          >
            <option value="2026-h1">H1 2026 (Jan–Jun)</option>
            <option value="2026-h2">H2 2026 (Jul–Dec)</option>
            <option value="2026-q2">Q2 2026</option>
            <option value="2026-annual">Cả năm 2026</option>
          </select>
        </div>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng mục tiêu",
            value: String(allGoals.length),
            sub: "chỉ tiêu đang theo dõi",
            icon: Target,
            color: "#EEEEEE",
          },
          {
            label: "Đúng kế hoạch",
            value: String(onTrack),
            sub: `${Math.round((onTrack / allGoals.length) * 100)}% tổng chỉ tiêu`,
            icon: CheckCircle2,
            color: "#4ade80",
          },
          {
            label: "Cần chú ý",
            value: String(atRisk),
            sub: "có nguy cơ lệch kế hoạch",
            icon: AlertTriangle,
            color: "#fbbf24",
          },
          {
            label: "Dưới kế hoạch",
            value: String(behind),
            sub: "cần hành động ngay",
            icon: XCircle,
            color: "#f87171",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: "#666", fontSize: "12px", fontWeight: 500 }}>{card.label}</span>
              <card.icon size={14} style={{ color: card.color }} />
            </div>
            <p style={{ color: card.color, fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{card.value}</p>
            <p style={{ color: "#444", fontSize: "11px" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue progress banner */}
      <div
        className="rounded-xl px-6 py-4"
        style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color: "#4ade80" }} />
            <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
              Tổng doanh thu H1 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 700 }}>
              {fmt(totalRevActual, "₫", "₫")}
            </span>
            <span style={{ color: "#444", fontSize: "12px" }}>/</span>
            <span style={{ color: "#666", fontSize: "13px" }}>
              {fmt(totalRevTarget, "₫", "₫")}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: revPct >= 75 ? "#14532d22" : "#78350f33", color: revPct >= 75 ? "#4ade80" : "#fbbf24" }}
            >
              {revPct}%
            </span>
          </div>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${revPct}%`,
              background: "linear-gradient(90deg, #D84040, #ff6b6b)",
              transition: "width 0.7s ease",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span style={{ color: "#444", fontSize: "10px" }}>0</span>
          <span style={{ color: "#444", fontSize: "10px" }}>
            Còn {fmt(totalRevTarget - totalRevActual, "₫", "₫")} để đạt mục tiêu
          </span>
          <span style={{ color: "#444", fontSize: "10px" }}>{fmt(totalRevTarget, "₫", "₫")}</span>
        </div>
      </div>

      {/* Section 1 – Revenue Targets */}
      <SectionCard
        title="Mục tiêu Doanh thu"
        sub="Revenue Targets — Theo mảng dịch vụ & Tỷ lệ chốt"
        icon={TrendingUp}
        accentColor="#4ade80"
        goals={revenue}
        onUpdateTarget={updater(setRevenue)}
        summary={
          <div className="px-5 py-3 grid grid-cols-3 gap-4">
            {[
              { icon: Layers,    label: "Production",    value: fmt(revenue[0].current, "₫", "₫") },
              { icon: RefreshCcw,label: "Retainer",      value: fmt(revenue[1].current, "₫", "₫") },
              { icon: Megaphone, label: "Media Booking", value: fmt(revenue[2].current, "₫", "₫") },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <s.icon size={13} style={{ color: "#8E1616" }} />
                <span style={{ color: "#555", fontSize: "11px" }}>{s.label}:</span>
                <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        }
      />

      {/* Section 2 – Profit Margins */}
      <SectionCard
        title="Mục tiêu Lợi nhuận"
        sub="Profit Margins — Gộp & Ròng"
        icon={BarChart2}
        accentColor="#60a5fa"
        goals={profit}
        onUpdateTarget={updater(setProfit)}
        summary={
          <div className="px-5 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Percent size={13} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#555", fontSize: "11px" }}>Gross Margin thực tế:</span>
              <span style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 700 }}>38%</span>
              <span style={{ color: "#444", fontSize: "11px" }}>vs mục tiêu 45%</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={13} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#555", fontSize: "11px" }}>Net Profit thực tế:</span>
              <span style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 700 }}>14.2%</span>
              <span style={{ color: "#444", fontSize: "11px" }}>vs mục tiêu 18%</span>
            </div>
          </div>
        }
      />

      {/* Section 3 – Cost Control */}
      <SectionCard
        title="Mục tiêu Kiểm soát Chi phí"
        sub="Cost Control — Production Budget & OPEX"
        icon={Wallet}
        accentColor="#fbbf24"
        goals={cost}
        onUpdateTarget={updater(setCost)}
        summary={
          <div className="px-5 py-3 flex items-center gap-2">
            <AlertTriangle size={13} style={{ color: "#fbbf24" }} />
            <span style={{ color: "#666", fontSize: "11px" }}>
              OPEX hiện tại chiếm <strong style={{ color: "#fbbf24" }}>23.8%</strong> doanh thu —
              vượt ngưỡng mục tiêu <strong style={{ color: "#EEEEEE" }}>20%</strong>.
              Cần rà soát chi phí phần mềm & nhân sự cố định.
            </span>
          </div>
        }
      />

      {/* Section 4 – Cash Flow */}
      <SectionCard
        title="Mục tiêu Dòng tiền"
        sub="Cash Flow — Kỳ hạn thu hồi công nợ (AR Days)"
        icon={Clock}
        accentColor="#c084fc"
        goals={cash}
        onUpdateTarget={updater(setCash)}
        summary={
          <div className="px-5 py-3 space-y-2">
            <p style={{ color: "#666", fontSize: "11px", fontWeight: 600 }}>
              Khách hàng đang trễ hạn thanh toán:
            </p>
            {[
              { name: "Công ty TNHH Ánh Dương", overdue: "18 ngày", amount: "45M ₫" },
              { name: "MediaPro Vietnam",        overdue: "31 ngày", amount: "120M ₫" },
              { name: "StartupX HN",             overdue: "9 ngày",  amount: "22M ₫" },
            ].map((client) => (
              <div key={client.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: client.overdue.startsWith("3") ? "#f87171" : "#fbbf24" }} />
                  <span style={{ color: "#EEEEEE", fontSize: "12px" }}>{client.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: "#f87171", fontSize: "11px" }}>Quá hạn {client.overdue}</span>
                  <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{client.amount}</span>
                </div>
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}
