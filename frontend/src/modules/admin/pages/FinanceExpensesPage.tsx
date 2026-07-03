import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  TrendingDown, Users, Building2, Cpu, Plane, UtensilsCrossed,
  UserCheck, Camera, Shirt, Coffee, Megaphone, Plus, X,
  AlertTriangle, ChevronDown, Search, Filter, CheckCircle2,
  Briefcase, DollarSign, BarChart2, Loader2,
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseGroup = "opex" | "cogs" | "misc";
type ExpenseStatus = "ok" | "warning" | "over";

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  group: ExpenseGroup;
  amount: number;
  budget?: number;
  project?: string;
  submitter: string;
  avatar: string;
  status: ExpenseStatus;
  note?: string;
}

// Data will be loaded via API

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Nhân sự nội bộ": Users,
  "Văn phòng & Hành chính": Building2,
  "Phần mềm & Bản quyền": Cpu,
  "Logistics & Đi lại": Plane,
  "Lưu trú & Ăn uống": UtensilsCrossed,
  "Thuê ngoài & Talent": UserCheck,
  "Thiết bị & Trường quay": Camera,
  "Đạo cụ & Bối cảnh": Shirt,
  "Tiếp khách": Coffee,
  "Marketing & Sales": Megaphone,
};

const GROUP_COLORS: Record<ExpenseGroup, string> = {
  opex: "#60a5fa",
  cogs: "#D84040",
  misc: "#fbbf24",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M ₫`;
  return `${v.toLocaleString()} ₫`;
}

function statusStyle(s: ExpenseStatus): { color: string; bg: string; label: string } {
  return {
    ok:      { color: "#4ade80", bg: "#14532d22", label: "Trong ngân sách" },
    warning: { color: "#fbbf24", bg: "#78350f33", label: "Gần vượt" },
    over:    { color: "#f87171", bg: "#7f1d1d33", label: "Vượt ngân sách" },
  }[s];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg" style={{ background: "#1A1010", border: "1px solid #2A1F1F" }}>
      {label && <p style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>
            {p.name}: {fmtM(p.value * 1_000_000)}
          </span>
        </div>
      ))}
    </div>
  );
}

const mapDbToFreelancer = (m: any) => ({
  id: m.id,
  name: m.name,
  avatar: m.avatar,
  role: m.role,
  category: m.category,
  status: m.status,
  stars: m.stars,
  rateDaily: m.rate_daily,
  rateProject: m.rate_project,
  portfolio: m.portfolio,
  phone: m.phone,
  taxId: m.tax_id,
  bankName: m.bank_name,
  bankAccount: m.bank_account,
  cccdDone: m.cccd_done,
  contractSigned: m.contract_signed,
  ndaSigned: m.nda_signed,
  tncnConsent: m.tncn_consent,
  projects: Array.isArray(m.projects) ? m.projects : (typeof m.projects === "string" ? JSON.parse(m.projects) : []),
  note: m.note
});

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

// ─── Slide-over Add Expense ───────────────────────────────────────────────────

interface AddExpensePanelProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  talents: any[];
  projects: any[];
  crew: any[];
}

function AddExpensePanel({ open, onClose, onRefresh, talents, projects, crew }: AddExpensePanelProps) {
  const [group, setGroup] = useState<ExpenseGroup>("cogs");
  const [form, setForm] = useState({
    description: "", category: "", grossAmount: "", project: "", date: "", submitter: "", note: "", payeeId: "",
    payee: "", bankName: "", bankAccount: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const opexCategories = ["Nhân sự nội bộ", "Văn phòng & Hành chính", "Phần mềm & Bản quyền"];
  const cogsCategories = ["Logistics & Đi lại", "Lưu trú & Ăn uống", "Thuê ngoài & Talent", "Thiết bị & Trường quay", "Đạo cụ & Bối cảnh"];
  const miscCategories = ["Tiếp khách", "Marketing & Sales"];
  const categories = group === "opex" ? opexCategories : group === "cogs" ? cogsCategories : miscCategories;
  const projectList = projects.map(p => p.title || p.name);

  const isOutsource = group === "cogs" && form.category === "Thuê ngoài & Talent";
  const selectedTalent = isOutsource && form.payeeId
    ? talents.find((t) => t.name === form.payeeId) ?? null
    : null;
  const selectedCrew = !isOutsource && form.submitter
    ? crew.find((c) => c.name === form.submitter)
    : null;

  const gross = parseFloat(form.grossAmount.replace(/,/g, "")) || 0;
  const tax   = selectedTalent?.tncnConsent ? Math.round(gross * 0.1) : 0;
  const net   = gross - tax;

  const docBlocked = selectedTalent && (!selectedTalent.cccdDone || !selectedTalent.taxId);

  function field(v: string, key: keyof typeof form) {
    setForm((f) => ({ ...f, [key]: v }));
  }
  function resetGroup(k: ExpenseGroup) {
    setGroup(k);
    setForm((f) => ({ ...f, category: "", payeeId: "", grossAmount: "", payee: "", bankName: "", bankAccount: "" }));
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        description: isOutsource ? `Cát-xê ${form.payeeId} — ${form.category}` : form.description,
        category: form.category,
        group: group,
        amount: gross,
        budget: group === "opex" ? (gross * 1.05) : gross,
        project: group === "cogs" ? form.project : null,
        submitter: isOutsource ? form.payeeId : form.submitter,
        avatar: isOutsource 
          ? (selectedTalent?.avatar || "FL")
          : (selectedCrew?.avatar || form.submitter.split(" ").map((n: string) => n[0]).join("").toUpperCase()),
        status: "ok",
        note: form.note || null,
        payee: isOutsource ? undefined : form.payee || undefined,
        bank_name: isOutsource ? undefined : form.bankName || undefined,
        bank_account: isOutsource ? undefined : form.bankAccount || undefined,
      };

      await fetchApi("/finance/expenses", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Failed to submit expense:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "#141010", border: "1px solid #2A1F1F", color: "#EEEEEE",
    fontSize: "13px", borderRadius: "8px", padding: "8px 12px", width: "100%", outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    color: "#888", fontSize: "11px", fontWeight: 600, marginBottom: "4px", display: "block",
  } as React.CSSProperties;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "#000", opacity: open ? 0.55 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "440px", background: "#141010", borderLeft: "1px solid #2A1F1F",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #2A1F1F" }}>
          <div>
            <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>Tạo phiếu chi</p>
            <p style={{ color: "#555", fontSize: "11px" }}>Khai báo khoản chi phí mới</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#2A1F1F", color: "#888" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#EEEEEE")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#888")}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Group */}
          <div>
            <span style={labelStyle}>Nhóm chi phí *</span>
            <div className="flex gap-2">
              {([["opex","Vận hành"],["cogs","Dự án (COGS)"],["misc","Misc"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => resetGroup(k)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: group === k ? GROUP_COLORS[k] + "33" : "#1D1616",
                    color: group === k ? GROUP_COLORS[k] : "#666",
                    border: `1px solid ${group === k ? GROUP_COLORS[k] + "55" : "#2A1F1F"}`,
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <span style={labelStyle}>Danh mục *</span>
            <select value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, payeeId: "", grossAmount: "" }))}
              style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Chọn danh mục...</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── OUTSOURCE MODE ── */}
          {isOutsource && (
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid #D8404033" }}
            >
              <p style={{ color: "#D84040", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
                OUTSOURCE · Liên kết HR
              </p>

              {/* Payee dropdown */}
              <div>
                <span style={labelStyle}>Người nhận (Payee) * <span style={{ color: "#555", fontWeight: 400 }}>— từ hồ sơ HR</span></span>
                <select value={form.payeeId} onChange={(e) => field(e.target.value, "payeeId")}
                  style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Chọn freelancer từ HR...</option>
                  {talents.map((t) => (
                    <option key={t.name} value={t.name}>{t.name} — {t.role}</option>
                  ))}
                </select>
              </div>

              {/* Auto-filled bank info */}
              {selectedTalent && (
                <div className="rounded-lg px-3 py-2.5 space-y-1" style={{ background: "#141010", border: "1px solid #2A1F1F" }}>
                  <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }}>THÔNG TIN NGÂN HÀNG (TỰ ĐỘNG ĐIỀN)</p>
                  <p style={{ color: "#EEEEEE", fontSize: "12px" }}>
                    {selectedTalent.bankName} · {selectedTalent.bankAccount}
                  </p>
                  <p style={{ color: selectedTalent.tncnConsent ? "#4ade80" : "#fbbf24", fontSize: "10px" }}>
                    {selectedTalent.tncnConsent ? "✓ Đồng ý khấu trừ TNCN 10%" : "⚠ Chưa đồng ý TNCN — sẽ không khấu trừ"}
                  </p>
                </div>
              )}

              {/* Doc blocked warning */}
              {docBlocked && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                  style={{ background: "#7f1d1d22", border: "1px solid #f8717144" }}>
                  <AlertTriangle size={13} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ color: "#f87171", fontSize: "11px", fontWeight: 700 }}>
                      Hồ sơ pháp lý chưa đầy đủ — Phiếu chi bị chặn
                    </p>
                    <p style={{ color: "#888", fontSize: "10px" }}>
                      {!selectedTalent?.cccdDone && "· Thiếu CCCD/CMND  "}
                      {!selectedTalent?.taxId    && "· Thiếu mã số thuế cá nhân"}
                    </p>
                    <p style={{ color: "#666", fontSize: "10px" }}>Yêu cầu HR hoàn thiện trước khi xuất quỹ.</p>
                  </div>
                </div>
              )}

              {/* Gross amount + tax calc */}
              <div>
                <span style={labelStyle}>Tổng cát-xê (Gross) *</span>
                <input type="number" placeholder="0" value={form.grossAmount}
                  onChange={(e) => field(e.target.value, "grossAmount")}
                  style={inputStyle} />
              </div>

              {gross > 0 && (
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #2A1F1F" }}>
                  <div className="px-4 py-2.5" style={{ background: "#1A1010", borderBottom: "1px solid #2A1F1F" }}>
                    <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }}>TÍNH TOÁN THUẾ TNCN TỰ ĐỘNG</p>
                  </div>
                  <div className="px-4 py-3 space-y-2" style={{ background: "#141010" }}>
                    {[
                      { label: "Tổng cát-xê (Gross)", value: gross, color: "#EEEEEE" },
                      { label: `Khấu trừ TNCN (${selectedTalent?.tncnConsent ? "10%" : "0% — chưa đồng ý"})`, value: -tax, color: tax > 0 ? "#f87171" : "#444" },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between">
                        <span style={{ color: "#666", fontSize: "11px" }}>{r.label}</span>
                        <span style={{ color: r.color, fontSize: "11px", fontWeight: 600 }}>
                          {r.value >= 0 ? "" : "-"}{Math.abs(r.value).toLocaleString()} ₫
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2" style={{ borderTop: "1px solid #2A1F1F" }}>
                      <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>Thực nhận (Net)</span>
                      <span style={{ color: "#4ade80", fontSize: "13px", fontWeight: 800 }}>{net.toLocaleString()} ₫</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description (non-outsource) */}
          {!isOutsource && (
            <div>
              <span style={labelStyle}>Mô tả chi phí *</span>
              <input placeholder="VD: Thuê Sony FX6 + lens set 2 ngày"
                value={form.description} onChange={(e) => field(e.target.value, "description")}
                style={inputStyle} />
            </div>
          )}

          {/* Amount + Date (non-outsource) */}
          {!isOutsource && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span style={labelStyle}>Số tiền (₫) *</span>
                <input type="number" placeholder="0"
                  value={form.grossAmount} onChange={(e) => field(e.target.value, "grossAmount")}
                  style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>Ngày phát sinh *</span>
                <input type="date" value={form.date} onChange={(e) => field(e.target.value, "date")}
                  style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>
          )}

          {/* Payee Details (non-outsource) */}
          {!isOutsource && (
            <div className="rounded-xl p-4 space-y-4 animate-fadeIn" style={{ background: "rgba(29, 22, 22, 0.3)", border: "1px solid rgba(46, 32, 32, 0.3)" }}>
              <p style={{ color: "#D84040", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
                THÔNG TIN THANH TOÁN (TÙY CHỌN)
              </p>
              <div>
                <span style={labelStyle}>Người nhận (Payee)</span>
                <input placeholder="VD: Lộc Phát Real Estate / Tên nhân viên"
                  value={form.payee} onChange={(e) => field(e.target.value, "payee")}
                  style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span style={labelStyle}>Ngân hàng</span>
                  <input placeholder="VD: Techcombank, VCB..."
                    value={form.bankName} onChange={(e) => field(e.target.value, "bankName")}
                    style={inputStyle} />
                </div>
                <div>
                  <span style={labelStyle}>Số tài khoản</span>
                  <input placeholder="VD: 1913000..."
                    value={form.bankAccount} onChange={(e) => field(e.target.value, "bankAccount")}
                    style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* Date (outsource mode has separate date) */}
          {isOutsource && (
            <div>
              <span style={labelStyle}>Ngày phát sinh *</span>
              <input type="date" value={form.date} onChange={(e) => field(e.target.value, "date")}
                style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
          )}

          {/* Project */}
          <div>
            <span style={labelStyle}>
              Dự án liên quan {group === "cogs" ? <span style={{ color: "#f87171" }}>*</span> : <span style={{ color: "#444" }}>(tùy chọn)</span>}
            </span>
            <select value={form.project} onChange={(e) => field(e.target.value, "project")}
              style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Chọn dự án...</option>
              {projectList.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {group === "cogs" && !form.project && (
              <p style={{ color: "#f87171", fontSize: "10px", marginTop: "4px" }}>
                Chi phí dự án phải được gắn vào một Project cụ thể
              </p>
            )}
          </div>

          {/* Submitter */}
          <div>
            <span style={labelStyle}>Người khai báo *</span>
            <select value={form.submitter} onChange={(e) => field(e.target.value, "submitter")}
              style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Chọn nhân viên...</option>
              {crew.map((c) => (
                <option key={c.id || c.name} value={c.name}>{c.name} — {c.role}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <span style={labelStyle}>Ghi chú</span>
            <textarea rows={3} placeholder="Lý do, ngữ cảnh phát sinh chi phí..."
              value={form.note} onChange={(e) => field(e.target.value, "note")}
              style={{ ...inputStyle, resize: "none" }} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: "1px solid #2A1F1F" }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "#2A1F1F", color: "#888" }}>
            Hủy
          </button>
          <button
            disabled={!!docBlocked || submitting}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity"
            style={{
              background: docBlocked ? "#2A1F1F" : "#D84040",
              color: docBlocked ? "#444" : "#EEEEEE",
              cursor: docBlocked ? "not-allowed" : "pointer",
            }}>
            {submitting ? <Loader2 size={15} className="animate-spin mx-auto" /> : (docBlocked ? "Bị chặn — Hoàn thiện HR" : "Lưu phiếu chi")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Category summary row ─────────────────────────────────────────────────────

function CategorySummaryCard({
  category, expenses,
}: {
  category: string;
  expenses: Expense[];
}) {
  const Icon = CATEGORY_ICONS[category] ?? DollarSign;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = expenses.reduce((s, e) => s + (e.budget ?? e.amount), 0);
  const pct = Math.round((total / budget) * 100);
  const overCount = expenses.filter((e) => e.status === "over").length;
  const [open, setOpen] = useState(false);

  const barColor = pct > 100 ? "#f87171" : pct > 85 ? "#fbbf24" : "#4ade80";

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#1A1010")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#2A1F1F" }}
        >
          <Icon size={16} style={{ color: "#8E1616" }} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{category}</span>
            <div className="flex items-center gap-3">
              {overCount > 0 && (
                <span className="flex items-center gap-1" style={{ color: "#f87171", fontSize: "11px" }}>
                  <AlertTriangle size={10} /> {overCount} vượt ngân sách
                </span>
              )}
              <span style={{ color: barColor, fontSize: "13px", fontWeight: 700 }}>{fmtM(total)}</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: barColor + "22", color: barColor }}
              >
                {pct}%
              </span>
              <ChevronDown
                size={13}
                style={{ color: "#555", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              />
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "#444", fontSize: "10px" }}>{expenses.length} khoản chi</span>
            <span style={{ color: "#444", fontSize: "10px" }}>Ngân sách: {fmtM(budget)}</span>
          </div>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #2A1F1F" }}>
          {expenses.map((exp, i) => (
            <ExpenseRow key={exp.id} exp={exp} last={i === expenses.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Expense row ──────────────────────────────────────────────────────────────

function ExpenseRow({ exp, last }: { exp: Expense; last: boolean }) {
  const s = statusStyle(exp.status);
  return (
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{ borderBottom: last ? "none" : "1px solid #2A1F1F" }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold overflow-hidden"
        style={{ background: "#8E1616", color: "#EEEEEE" }}
      >
        {exp.avatar && (exp.avatar.startsWith("http") || exp.avatar.startsWith("/")) ? (
          <img src={exp.avatar} alt="Payee" className="w-full h-full object-cover" />
        ) : (
          exp.avatar
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{exp.description}</span>
          {exp.project && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs"
              style={{ background: "#D8404022", color: "#D84040" }}
            >
              {exp.project.split("—")[0].trim()}
            </span>
          )}
        </div>
        {exp.note && <p style={{ color: "#555", fontSize: "10px" }}>{exp.note}</p>}
        <p style={{ color: "#444", fontSize: "10px" }}>{formatDate(exp.date)} · {exp.submitter}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p style={{ color: s.color, fontSize: "13px", fontWeight: 700 }}>{fmtM(exp.amount)}</p>
        {exp.budget && exp.status !== "ok" && (
          <p style={{ color: "#444", fontSize: "10px" }}>Ngân sách: {fmtM(exp.budget)}</p>
        )}
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: s.bg, color: s.color }}
        >
          {s.label}
        </span>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface OverviewTabProps {
  expenses: Expense[];
  monthlyTrend: any[];
}

function OverviewTab({ expenses, monthlyTrend }: OverviewTabProps) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const opexTotal = expenses.filter((e) => e.group === "opex").reduce((s, e) => s + e.amount, 0);
  const cogsTotal = expenses.filter((e) => e.group === "cogs").reduce((s, e) => s + e.amount, 0);
  const miscTotal = expenses.filter((e) => e.group === "misc").reduce((s, e) => s + e.amount, 0);

  const pieData = [
    { name: "Vận hành (OPEX)", value: opexTotal, color: "#60a5fa" },
    { name: "Chi phí Dự án (COGS)", value: cogsTotal, color: "#D84040" },
    { name: "Misc", value: miscTotal, color: "#fbbf24" },
  ];

  const overCount = expenses.filter((e) => e.status === "over").length;

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng chi tháng 6", value: fmtM(total), color: "#EEEEEE", icon: TrendingDown },
          { label: "Chi phí Vận hành", value: fmtM(opexTotal), color: "#60a5fa", icon: Building2 },
          { label: "Chi phí Dự án",    value: fmtM(cogsTotal), color: "#D84040", icon: Briefcase },
          { label: "Vượt ngân sách",   value: `${overCount} khoản`, color: "#f87171", icon: AlertTriangle },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: "#666", fontSize: "12px" }}>{kpi.label}</span>
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>
            <p style={{ color: kpi.color, fontSize: "22px", fontWeight: 700, lineHeight: 1 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <p style={{ color: "#666", fontSize: "12px", fontWeight: 600 }} className="mb-4">Cơ cấu chi phí tháng 6</p>
          <div className="flex items-center gap-4">
            <div style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <ReTooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg px-3 py-2" style={{ background: "#1A1010", border: "1px solid #2A1F1F" }}>
                          <p style={{ color: d.payload.color, fontSize: "11px", fontWeight: 700 }}>{d.name}</p>
                          <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>{fmtM(d.value)}</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {pieData.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                      <span style={{ color: "#EEEEEE", fontSize: "11px" }}>{d.name}</span>
                    </div>
                    <span style={{ color: d.color, fontSize: "12px", fontWeight: 700 }}>
                      {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                    <div className="h-full rounded-full" style={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%`, background: d.color }} />
                  </div>
                  <p style={{ color: "#444", fontSize: "10px" }}>{fmtM(d.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly trend */}
        <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <p style={{ color: "#666", fontSize: "12px", fontWeight: 600 }} className="mb-4">Xu hướng chi phí · Triệu ₫</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyTrend} barSize={14}>
              <CartesianGrid vertical={false} stroke="#2A1F1F" />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <ReTooltip content={<ChartTooltip />} cursor={{ fill: "#2A1F1F55" }} />
              <Bar dataKey="opex"  name="Vận hành" stackId="a" fill="#60a5fa" radius={[0,0,0,0]} />
              <Bar dataKey="cogs"  name="Dự án"     stackId="a" fill="#D84040" radius={[0,0,0,0]} />
              <Bar dataKey="misc"  name="Misc"       stackId="a" fill="#fbbf24" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            {[["#60a5fa","Vận hành"],["#D84040","Dự án"],["#fbbf24","Misc"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                <span style={{ color: "#555", fontSize: "10px" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Over-budget alert list */}
      {overCount > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid #7f1d1d55" }}>
          <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
            <AlertTriangle size={14} style={{ color: "#f87171" }} />
            <span style={{ color: "#f87171", fontSize: "13px", fontWeight: 700 }}>
              Cảnh báo vượt ngân sách ({overCount} khoản)
            </span>
          </div>
          {expenses.filter((e) => e.status === "over").map((e, i, arr) => (
            <ExpenseRow key={e.id} exp={e} last={i === arr.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ExpenseGroupTabProps {
  group: ExpenseGroup;
  expenses: Expense[];
  projects: any[];
}

function ExpenseGroupTab({ group, expenses, projects }: ExpenseGroupTabProps) {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const initialProject = searchParams.get("project") || "Tất cả";
  const [project, setProject] = useState(initialProject);

  const filtered = expenses.filter((e) => {
    const matchGroup = e.group === group;
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchProject = project === "Tất cả" || e.project === project;
    return matchGroup && matchSearch && matchProject;
  });

  const categories = [...new Set(filtered.map((e) => e.category))];
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const overCount = filtered.filter((e) => e.status === "over").length;

  const projectList = ["Tất cả", ...projects.map((p) => p.title || p.name)];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <Search size={13} style={{ color: "#555" }} />
          <input
            placeholder="Tìm kiếm mô tả, danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ color: "#EEEEEE", fontSize: "13px" }}
          />
        </div>
        {group === "cogs" && (
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="px-3 py-2 rounded-lg"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", fontSize: "13px", outline: "none" }}
          >
            {projectList.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg flex-shrink-0"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <span style={{ color: "#666", fontSize: "12px" }}>Tổng:</span>
          <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>{fmtM(total)}</span>
          {overCount > 0 && (
            <span style={{ color: "#f87171", fontSize: "11px", fontWeight: 600 }}>
              · {overCount} vượt NS
            </span>
          )}
        </div>
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <CategorySummaryCard
            key={cat}
            category={cat}
            expenses={filtered.filter((e) => e.category === cat)}
          />
        ))}
        {categories.length === 0 && (
          <div className="rounded-xl py-16 flex items-center justify-center" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <p style={{ color: "#555", fontSize: "14px" }}>Không có kết quả phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "overview" | "opex" | "cogs" | "misc";

const TABS: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { key: "overview", label: "Tổng quan",      icon: BarChart2,    color: "#EEEEEE" },
  { key: "opex",     label: "Vận hành (OPEX)", icon: Building2,    color: "#60a5fa" },
  { key: "cogs",     label: "Chi phí Dự án",   icon: Briefcase,    color: "#D84040" },
  { key: "misc",     label: "Misc",             icon: Coffee,       color: "#fbbf24" },
];

export function FinanceExpensesPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab]         = useState<Tab>(initialTab);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [talents, setTalents] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [expensesData, talentsData, projectsData, revenueData, crewData] = await Promise.all([
        fetchApi<any>("/finance/expenses"),
        fetchApi<any>("/hr/freelancers"),
        fetchApi<any>("/projects"),
        fetchApi<any>("/finance/revenue"),
        fetchApi<any>("/crew")
      ]);

      setExpenses(expensesData || []);
      setTalents((talentsData || []).map(mapDbToFreelancer));
      setProjects(projectsData || []);
      setCrew(crewData || []);
      if (revenueData && revenueData.monthly_expenses_trend) {
        setMonthlyTrend(revenueData.monthly_expenses_trend);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load finance expenses data:", err);
      setError("Không thể tải thông tin chi phí");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
        <button onClick={loadData} className="px-4 py-2 rounded-lg bg-[#D84040] text-white">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#f8717122", border: "1px solid #f8717144" }}
            >
              <TrendingDown size={22} style={{ color: "#f87171" }} />
            </div>
            <div>
              <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
              <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Chi Phí</h1>
            </div>
          </div>

          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
          >
            <Plus size={15} />
            Tạo phiếu chi
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: tab === t.key ? t.color + "22" : "transparent",
                color: tab === t.key ? t.color : "#666",
                border: tab === t.key ? `1px solid ${t.color}44` : "1px solid transparent",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && <OverviewTab expenses={expenses} monthlyTrend={monthlyTrend} />}
        {tab === "opex"     && <ExpenseGroupTab group="opex" expenses={expenses} projects={projects} />}
        {tab === "cogs"     && <ExpenseGroupTab group="cogs" expenses={expenses} projects={projects} />}
        {tab === "misc"     && <ExpenseGroupTab group="misc" expenses={expenses} projects={projects} />}
      </div>

      <AddExpensePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onRefresh={loadData}
        talents={talents}
        projects={projects}
        crew={crew}
      />
    </>
  );
}
