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
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { fetchApi } from "../utils/apiClient";

const currentYear = new Date().getFullYear();

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
  period?: string;
}

// Data will be loaded via API

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

function calculateStatus(item: any): GoalItem {
  const higherIsBetter = item.lowerIsBetter !== true;
  let status: GoalStatus = "on-track";
  
  if (item.target > 0) {
    const ratio = item.current / item.target;
    if (higherIsBetter) {
      if (ratio < 0.8) status = "behind";
      else if (ratio < 1) status = "at-risk";
    } else {
      if (ratio > 1.15) status = "behind";
      else if (ratio > 1) status = "at-risk";
    }
  }
  return { ...item, status, higherIsBetter };
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
      className="flex items-center gap-1.5 group p-1"
    >
      <span style={{ color: "#888", fontSize: "13px" }}>{fmt(value, prefix, unit)}</span>
      <Edit2 size={14} className="text-white opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" />
    </button>
  );
}

// ─── Add Goal Modal ────────────────────────────────────────────────────────────
function AddGoalModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (payload: any) => void }) {
  const [category, setCategory] = useState("revenue");
  const [label, setLabel] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("M");
  const [lowerIsBetter, setLowerIsBetter] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl w-[400px] shadow-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-white font-bold text-lg">Thêm Mục tiêu mới</h2>
          <button onClick={onClose}><X size={18} className="text-[#888] hover:text-white" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#888] mb-1">Nhóm</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#2A1F1F] text-white text-sm border border-[#3E2E2E] rounded-lg px-3 py-2 outline-none">
              <option value="revenue">Doanh thu</option>
              <option value="profit">Lợi nhuận</option>
              <option value="cost">Chi phí</option>
              <option value="cash">Dòng tiền</option>
              <option value="admin">Vận hành (Admin)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#888] mb-1">Chu kỳ (Cycle)</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-[#2A1F1F] text-white text-sm border border-[#3E2E2E] rounded-lg px-3 py-2 outline-none">
              <option value={`${currentYear}-q1`}>Q1 {currentYear}</option>
              <option value={`${currentYear}-q2`}>Q2 {currentYear}</option>
              <option value={`${currentYear}-h1`}>H1 {currentYear}</option>
              <option value={`${currentYear}-q3`}>Q3 {currentYear}</option>
              <option value={`${currentYear}-q4`}>Q4 {currentYear}</option>
              <option value={`${currentYear}-h2`}>H2 {currentYear}</option>
              <option value={`${currentYear}-annual`}>Cả năm {currentYear}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#888] mb-1">Tên Mục tiêu</label>
            <input value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-[#2A1F1F] text-white text-sm border border-[#3E2E2E] rounded-lg px-3 py-2 outline-none" placeholder="VD: Doanh thu Q4" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[#888] mb-1">Chỉ tiêu (Target)</label>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-[#2A1F1F] text-white text-sm border border-[#3E2E2E] rounded-lg px-3 py-2 outline-none" placeholder="0" />
            </div>
            <div className="w-24">
              <label className="block text-xs text-[#888] mb-1">Đơn vị</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-[#2A1F1F] text-white text-sm border border-[#3E2E2E] rounded-lg px-3 py-2 outline-none" placeholder="M, %, ..." />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="lower" checked={lowerIsBetter} onChange={e => setLowerIsBetter(e.target.checked)} className="rounded bg-[#2A1F1F] border-[#3E2E2E]" />
            <label htmlFor="lower" className="text-sm text-[#888]">Số càng thấp càng tốt (VD: Chi phí)</label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors">Hủy</button>
            <button onClick={() => { onAdd({ category, label, target: parseFloat(target), unit, lowerIsBetter, period }); onClose(); }} className="px-4 py-2 text-sm font-semibold text-white bg-[#D84040] rounded-lg hover:bg-[#ff6b6b] transition-colors">Thêm Mục tiêu</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Goal Row ─────────────────────────────────────────────────────────────────

function GoalRow({ item, onUpdateTarget, onDelete }: { item: GoalItem; onUpdateTarget: (id: string, v: number) => void; onDelete?: (id: string) => void }) {
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

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Delta pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
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
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Bạn có chắc chắn muốn xoá mục tiêu "${item.label}"?`)) {
                  onDelete(item.id);
                }
              }}
              className="p-1.5 rounded-lg text-[#888] hover:text-[#f87171] hover:bg-[#7f1d1d22] transition-all"
              title="Xoá mục tiêu"
            >
              <Trash2 size={13} />
            </button>
          )}
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
  onDeleteGoal,
  summary,
}: {
  title: string;
  sub: string;
  icon: React.ElementType;
  accentColor: string;
  goals: GoalItem[];
  onUpdateTarget: (id: string, v: number) => void;
  onDeleteGoal?: (id: string) => void;
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
              <GoalRow key={g.id} item={g} onUpdateTarget={onUpdateTarget} onDelete={onDeleteGoal} />
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
  const [revenue, setRevenue] = useState<GoalItem[]>([]);
  const [profit,  setProfit]  = useState<GoalItem[]>([]);
  const [cost,    setCost]    = useState<GoalItem[]>([]);
  const [cash,    setCash]    = useState<GoalItem[]>([]);
  const [admin,   setAdmin]   = useState<GoalItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(`${currentYear}-h1`);
  const [isExpanded, setIsExpanded] = useState(false);

  const PERIODS = [
    { id: `${currentYear}-q1`, label: `Q1 ${currentYear}` },
    { id: `${currentYear}-q2`, label: `Q2 ${currentYear}` },
    { id: `${currentYear}-h1`, label: `H1 ${currentYear}` },
    { id: `${currentYear}-q3`, label: `Q3 ${currentYear}` },
    { id: `${currentYear}-q4`, label: `Q4 ${currentYear}` },
    { id: `${currentYear}-h2`, label: `H2 ${currentYear}` },
    { id: `${currentYear}-annual`, label: `Cả năm ${currentYear}` },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<any>("/finance/goals");
      setRevenue((res.revenue || []).map(calculateStatus));
      setProfit((res.profit || []).map(calculateStatus));
      setCost((res.cost || []).map(calculateStatus));
      setCash((res.cash || []).map(calculateStatus));
      setAdmin((res.admin || []).map(calculateStatus));
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu Goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpdateTarget(id: string, v: number, section: "revenue" | "profit" | "cost" | "cash" | "admin") {
    try {
      await fetchApi(`/finance/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify({ target: v })
      });
      // Local optimistic update
      const setter = section === "revenue" ? setRevenue : section === "profit" ? setProfit : section === "cost" ? setCost : section === "cash" ? setCash : setAdmin;
      setter((prev: GoalItem[]) => prev.map((g) => g.id === id ? calculateStatus({ ...g, target: v }) : g));
    } catch (err: any) {
      alert("Lỗi khi cập nhật mục tiêu: " + err.message);
    }
  }

  async function handleAddGoal(payload: any) {
    try {
      await fetchApi("/finance/goals", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      loadData();
    } catch (err: any) {
      alert("Lỗi khi thêm mục tiêu: " + err.message);
    }
  }

  async function handleDeleteGoal(id: string) {
    try {
      await fetchApi(`/finance/goals/${id}`, {
        method: "DELETE"
      });
      loadData();
    } catch (err: any) {
      alert("Lỗi khi xoá mục tiêu: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D84040]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-[#D84040] text-white">Thử lại</button>
      </div>
    );
  }

  const filterByPeriod = (goalsList: GoalItem[]) => {
    return goalsList.filter((g) => {
      const gPeriod = g.period || `${currentYear}-h1`;
      if (selectedPeriod === `${currentYear}-annual`) return true;
      if (selectedPeriod === `${currentYear}-h1`) {
        return gPeriod === `${currentYear}-h1` || gPeriod === `${currentYear}-q2` || gPeriod === `${currentYear}-q1`;
      }
      if (selectedPeriod === `${currentYear}-h2`) {
        return gPeriod === `${currentYear}-h2` || gPeriod === `${currentYear}-q3` || gPeriod === `${currentYear}-q4`;
      }
      return gPeriod === selectedPeriod;
    });
  };

  const filteredRevenue = filterByPeriod(revenue);
  const filteredProfit = filterByPeriod(profit);
  const filteredCost = filterByPeriod(cost);
  const filteredCash = filterByPeriod(cash);
  const filteredAdmin = filterByPeriod(admin);

  const allGoals = [...filteredRevenue, ...filteredProfit, ...filteredCost, ...filteredCash];
  const onTrack  = allGoals.filter((g) => g.status === "on-track").length;
  const atRisk   = allGoals.filter((g) => g.status === "at-risk").length;
  const behind   = allGoals.filter((g) => g.status === "behind").length;

  // Revenue total progress
  const totalRevActual = filteredRevenue.reduce((s, g) => s + g.current, 0);
  const totalRevTarget = filteredRevenue.reduce((s, g) => s + g.target, 0);
  const revPct = totalRevTarget > 0 ? pct(totalRevActual, totalRevTarget) : 0;

  return (
    <div className="p-8 space-y-7">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Mục tiêu</h1>
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
              const isSelected = selectedPeriod === p.id;
              const show = isExpanded || isSelected;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!isExpanded) {
                      setIsExpanded(true);
                    } else {
                      setSelectedPeriod(p.id);
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D84040] hover:bg-[#ff6b6b] text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-900/20"
          >
            <Plus size={16} />
            Thêm mục tiêu
          </button>
        </div>
      </div>

      <AddGoalModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddGoal} 
      />

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
              Tổng doanh thu {selectedPeriod.includes('h1') ? `H1 ${currentYear}` : selectedPeriod.includes('h2') ? `H2 ${currentYear}` : selectedPeriod.includes('annual') ? `Cả năm ${currentYear}` : selectedPeriod.replace(`${currentYear}-`, '').toUpperCase() + ` ${currentYear}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: "#4ade80", fontSize: "14px", fontWeight: 700 }}>
              {fmt(totalRevActual, "", "M")}
            </span>
            <span style={{ color: "#444", fontSize: "12px" }}>/</span>
            <span style={{ color: "#666", fontSize: "13px" }}>
              {fmt(totalRevTarget, "", "M")}
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
            Còn {fmt(totalRevTarget - totalRevActual, "", "M")} để đạt mục tiêu
          </span>
          <span style={{ color: "#444", fontSize: "10px" }}>{fmt(totalRevTarget, "", "M")}</span>
        </div>
      </div>

      {/* Section 1 – Revenue Targets */}
      <SectionCard
        title="Mục tiêu Doanh thu"
        sub="Revenue Targets — Theo mảng dịch vụ & Tỷ lệ chốt"
        icon={TrendingUp}
        accentColor="#4ade80"
        goals={filteredRevenue}
        onUpdateTarget={(id, v) => handleUpdateTarget(id, v, "revenue")}
        onDeleteGoal={handleDeleteGoal}
        summary={
          filteredRevenue.length > 0 ? (
          <div className="px-5 py-3 grid grid-cols-3 gap-4">
            {filteredRevenue.slice(0, 3).map((r, i) => {
              const icons = [Layers, RefreshCcw, Megaphone];
              const Icon = icons[i % icons.length];
              return (
                <div key={r.id} className="flex items-center gap-2">
                  <Icon size={13} style={{ color: "#8E1616" }} />
                  <span style={{ color: "#555", fontSize: "11px" }}>{r.label}:</span>
                  <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{fmt(r.current, r.prefix, r.unit)}</span>
                </div>
              );
            })}
          </div>
          ) : <p className="text-[#555] text-xs px-5 py-3">Không có dữ liệu</p>
        }
      />

      {/* Section 2 – Profit Margins */}
      <SectionCard
        title="Mục tiêu Lợi nhuận"
        sub="Profit Margins — Gộp & Ròng"
        icon={BarChart2}
        accentColor="#60a5fa"
        goals={filteredProfit}
        onUpdateTarget={(id, v) => handleUpdateTarget(id, v, "profit")}
        onDeleteGoal={handleDeleteGoal}
        summary={null}
      />

      {/* Section 3 – Cost Control */}
      <SectionCard
        title="Mục tiêu Kiểm soát Chi phí"
        sub="Cost Control — Production Budget & OPEX"
        icon={Wallet}
        accentColor="#fbbf24"
        goals={filteredCost}
        onUpdateTarget={(id, v) => handleUpdateTarget(id, v, "cost")}
        onDeleteGoal={handleDeleteGoal}
        summary={null}
      />

      {/* Section 4 – Cash Flow */}
      <SectionCard
        title="Mục tiêu Dòng tiền"
        sub="Cash Flow — Kỳ hạn thu hồi công nợ (AR Days)"
        icon={Clock}
        accentColor="#c084fc"
        goals={filteredCash}
        onUpdateTarget={(id, v) => handleUpdateTarget(id, v, "cash")}
        onDeleteGoal={handleDeleteGoal}
        summary={null}
      />
      
      {/* Section 5 – Admin */}
      <SectionCard
        title="Mục tiêu Admin"
        sub="Admin & Operations — Vận hành & Nhân sự"
        icon={Target}
        accentColor="#f43f5e"
        goals={filteredAdmin}
        onUpdateTarget={(id, v) => handleUpdateTarget(id, v, "admin")}
        onDeleteGoal={handleDeleteGoal}
      />
    </div>
  );
}
