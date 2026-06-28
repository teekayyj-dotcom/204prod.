import { useState, useEffect } from "react";
import {
  Banknote, AlertTriangle, CheckCircle2, XCircle, Clock,
  Lock, Unlock, Bell, X, ChevronDown, Filter, Search,
  ArrowRight, FileText, Shield, ExternalLink, Loader2,
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayoutStatus = "pending" | "blocked" | "overdue" | "paid";

interface Payout {
  id: string;
  payee: string;
  avatar: string;
  category: string;
  project: string;
  gross: number;
  tax: number;
  net: number;
  dueDate: string;
  status: PayoutStatus;
  clientInvoicePaid: boolean;
  docComplete: boolean;
  bankName: string;
  bankAccount: string;
  tncnConsent?: boolean;
  isFreelancer: boolean;
  expenseGroup: "opex" | "cogs";
  note?: string;
  autoCreated?: boolean;
}

// Data will be loaded via API

const mapDbToPayout = (m: any): Payout => ({
  id: m.id,
  payee: m.payee,
  avatar: m.avatar,
  category: m.category,
  project: m.project,
  gross: m.gross,
  tax: m.tax,
  net: m.net,
  dueDate: formatDate(m.due_date),
  status: m.status as PayoutStatus,
  clientInvoicePaid: m.client_invoice_paid,
  docComplete: m.doc_complete,
  bankName: m.bank_name,
  bankAccount: m.bank_account,
  tncnConsent: m.tncn_consent,
  isFreelancer: m.is_freelancer,
  expenseGroup: m.expense_group as "opex" | "cogs",
  note: m.note,
  autoCreated: m.auto_created
});

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ₫`;
  return `${(v / 1_000).toFixed(0)}K ₫`;
}

const statusCfg: Record<PayoutStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: "Chờ thanh toán", color: "#60a5fa", bg: "#1e3a5f33", icon: Clock },
  blocked:  { label: "Đang bị khóa",   color: "#fbbf24", bg: "#78350f33", icon: Lock },
  overdue:  { label: "Quá hạn",        color: "#f87171", bg: "#7f1d1d33", icon: AlertTriangle },
  paid:     { label: "Đã thanh toán",  color: "#4ade80", bg: "#14532d22", icon: CheckCircle2 },
};

// ─── Payout Row ───────────────────────────────────────────────────────────────

interface PayoutRowProps {
  payout: Payout;
  onPay: (id: string) => void;
  isPaying?: boolean;
}

function PayoutRow({ payout, onPay, isPaying }: PayoutRowProps) {
  const [expanded, setExpanded] = useState(false);
  const s = statusCfg[payout.status];
  const canPay = (payout.status === "pending" || payout.status === "overdue") && payout.docComplete;
  
  const blockReasons: string[] = [];
  if (!payout.clientInvoicePaid) blockReasons.push("Khách hàng chưa thanh toán (Pay-when-paid)");
  if (!payout.docComplete) {
    blockReasons.push(payout.isFreelancer ? "Hồ sơ pháp lý chưa đầy đủ" : "Chưa nhận đủ hóa đơn tài chính GTGT / Chứng từ đối tác");
  }
  if (payout.isFreelancer && !payout.tncnConsent) {
    blockReasons.push("Chưa xác nhận khấu trừ TNCN");
  }

  return (
    <div
      style={{
        borderBottom: "1px solid #1A1010",
        background: payout.status === "overdue" ? "#7f1d1d08" : "transparent",
      }}
    >
      {/* Auto-created badge */}
      {payout.autoCreated && (
        <div className="flex items-center gap-1.5 px-5 pt-2">
          <Bell size={10} style={{ color: "#c084fc" }} />
          <span style={{ color: "#c084fc", fontSize: "10px", fontWeight: 600 }}>
            Tự động tạo từ hệ thống · Cần xem xét
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: "#8E1616", color: "#EEEEEE" }}
        >
          {payout.avatar}
        </div>

        {/* Partner + project */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{payout.payee}</span>
            <span style={{ color: "#888", fontSize: "11px", background: "rgba(216, 64, 64, 0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(216, 64, 64, 0.2)" }}>
              {payout.category}
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: "3px",
                background: payout.expenseGroup === "opex" ? "rgba(96, 165, 250, 0.15)" : "rgba(168, 85, 247, 0.15)",
                color: payout.expenseGroup === "opex" ? "#60a5fa" : "#a855f7",
                border: `1px solid ${payout.expenseGroup === "opex" ? "rgba(96, 165, 250, 0.3)" : "rgba(168, 85, 247, 0.3)"}`,
              }}
            >
              {payout.expenseGroup === "opex" ? "OPEX (Vận hành)" : "COGS (Dự án)"}
            </span>
          </div>
          <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>{payout.project}</p>
        </div>

        {/* Money */}
        <div className="text-right flex-shrink-0" style={{ minWidth: "140px" }}>
          <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>{fmtM(payout.net)}</p>
          <p style={{ color: "#555", fontSize: "10px" }}>
            {payout.isFreelancer 
              ? `Gross ${fmtM(payout.gross)} · TNCN -${fmtM(payout.tax)}`
              : `Trước thuế ${fmtM(payout.gross)} · Thuế +${fmtM(payout.tax)}`
            }
          </p>
        </div>

        {/* Due date */}
        <div className="text-right flex-shrink-0" style={{ minWidth: "80px" }}>
          <p style={{ color: payout.status === "overdue" ? "#f87171" : "#888", fontSize: "12px", fontWeight: 600 }}>
            {payout.dueDate}
          </p>
          <p style={{ color: "#444", fontSize: "10px" }}>Hạn trả</p>
        </div>

        {/* Status badge */}
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: s.bg, color: s.color }}
        >
          <s.icon size={10} />
          {s.label}
        </span>

        {/* Pay-when-paid lock */}
        {!payout.clientInvoicePaid && (
          <div title="Pay-when-paid: Chờ khách hàng thanh toán">
            <Lock size={14} style={{ color: "#fbbf24" }} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canPay && (
            <button
              onClick={() => onPay(payout.id)}
              disabled={isPaying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "#14532d33", color: "#4ade80" }}
            >
              {isPaying ? <Loader2 size={11} className="animate-spin" /> : <Banknote size={11} />} Xuất lệnh chi
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{ color: "#555" }}
          >
            <ChevronDown
              size={14}
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
            />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="mx-5 mb-4 rounded-xl overflow-hidden"
          style={{ background: "#141010", border: "1px solid #2A1F1F" }}
        >
          <div className="grid grid-cols-2 gap-0 divide-x divide-y" style={{ borderColor: "#2A1F1F" }}>
            {/* Bank info */}
            <div className="px-4 py-3">
              <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }} className="mb-2">THÔNG TIN THANH TOÁN</p>
              <p style={{ color: "#EEEEEE", fontSize: "12px" }}>{payout.bankName} · {payout.bankAccount}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {payout.isFreelancer ? (
                  <>
                    {payout.tncnConsent
                      ? <CheckCircle2 size={10} style={{ color: "#4ade80" }} />
                      : <XCircle     size={10} style={{ color: "#f87171" }} />}
                    <span style={{ color: payout.tncnConsent ? "#4ade80" : "#f87171", fontSize: "10px" }}>
                      {payout.tncnConsent ? "Đồng ý khấu trừ TNCN" : "Chưa xác nhận khấu trừ TNCN"}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={10} style={{ color: "#4ade80" }} />
                    <span style={{ color: "#4ade80", fontSize: "10px" }}>
                      Thanh toán đối tác doanh nghiệp / NCC
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Tax breakdown */}
            <div className="px-4 py-3">
              <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }} className="mb-2">
                {payout.isFreelancer ? "TÍNH TOÁN THUẾ TNCN (10%)" : "CƠ CẤU CHI PHÍ"}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span style={{ color: "#666", fontSize: "11px" }}>
                    {payout.isFreelancer ? "Tổng cát-xê (Gross)" : "Giá trị trước thuế"}
                  </span>
                  <span style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 600 }}>{fmtM(payout.gross)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: payout.isFreelancer ? "#f87171" : "#60a5fa", fontSize: "11px" }}>
                    {payout.isFreelancer ? "Khấu trừ TNCN 10%" : "Thuế VAT / Khác"}
                  </span>
                  <span style={{ color: payout.isFreelancer ? "#f87171" : "#60a5fa", fontSize: "11px", fontWeight: 600 }}>
                    {payout.isFreelancer ? `-${fmtM(payout.tax)}` : `+${fmtM(payout.tax)}`}
                  </span>
                </div>
                <div className="flex justify-between pt-1" style={{ borderTop: "1px solid #2A1F1F" }}>
                  <span style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>
                    {payout.isFreelancer ? "Thực nhận (Net)" : "Tổng thanh toán (Net)"}
                  </span>
                  <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: 700 }}>{fmtM(payout.net)}</span>
                </div>
              </div>
            </div>

            {/* Doc status */}
            <div className="px-4 py-3">
              <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }} className="mb-2">
                {payout.isFreelancer ? "HỒ SƠ PHÁP LÝ" : "HÓA ĐƠN & CHỨNG TỪ"}
              </p>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: payout.docComplete ? "#14532d22" : "#7f1d1d33",
                  color: payout.docComplete ? "#4ade80" : "#f87171",
                }}
              >
                {payout.isFreelancer
                  ? (payout.docComplete ? "✓ Hoàn thiện" : "✗ Thiếu giấy tờ — Kiểm tra HR")
                  : (payout.docComplete ? "✓ Đã nhận hóa đơn VAT" : "✗ Chưa nhận hóa đơn / Hợp đồng")
                }
              </span>
            </div>

            {/* Client invoice */}
            <div className="px-4 py-3">
              <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }} className="mb-2">TRẠNG THÁI HÓA ĐƠN KHÁCH</p>
              <div className="flex items-center gap-2">
                {payout.clientInvoicePaid
                  ? <><Unlock size={12} style={{ color: "#4ade80" }} /><span style={{ color: "#4ade80", fontSize: "11px" }}>Đã thu tiền — Có thể thanh toán</span></>
                  : <><Lock   size={12} style={{ color: "#fbbf24" }} /><span style={{ color: "#fbbf24", fontSize: "11px" }}>Chưa thu — Pay-when-paid locked</span></>}
              </div>
            </div>
          </div>

          {/* Block reasons */}
          {blockReasons.length > 0 && payout.status !== "paid" && (
            <div className="px-4 py-3 space-y-1" style={{ borderTop: "1px solid #2A1F1F" }}>
              {blockReasons.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <AlertTriangle size={10} style={{ color: "#f87171" }} />
                  <span style={{ color: "#f87171", fontSize: "10px" }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {payout.note && (
            <div className="px-4 py-2.5 flex items-start gap-2" style={{ borderTop: "1px solid #2A1F1F" }}>
              <FileText size={11} style={{ color: "#555", flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "#666", fontSize: "11px" }}>{payout.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterTab = "all" | PayoutStatus;

export function FinancePayablesPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [groupFilter, setGroupFilter] = useState<"all" | "cogs" | "opex">("all");
  const [search, setSearch] = useState("");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const autoCreatedCount = payouts.filter((p) => p.autoCreated).length;

  async function loadPayouts() {
    setLoading(true);
    try {
      const res = await fetchApi<any>("/finance/payables");
      if (res) {
        setPayouts(res.map(mapDbToPayout));
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách phải trả / lệnh chi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  async function handlePay(id: string) {
    setPayingId(id);
    try {
      await fetchApi(`/finance/payables/${id}/pay`, {
        method: "PUT"
      });
      await loadPayouts();
    } catch (err) {
      console.error(err);
    } finally {
      setPayingId(null);
    }
  }

  const filtered = payouts.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchGroup = groupFilter === "all" || p.expenseGroup === groupFilter;
    const matchSearch = p.payee.toLowerCase().includes(search.toLowerCase()) ||
      p.project.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchGroup && matchSearch;
  });

  const totalPending  = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.net, 0);
  const totalBlocked  = payouts.filter((p) => p.status === "blocked").reduce((s, p) => s + p.net, 0);
  const totalOverdue  = payouts.filter((p) => p.status === "overdue").reduce((s, p) => s + p.net, 0);
  const totalPaid     = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.net, 0);

  const filterCounts = {
    all:     payouts.length,
    pending: payouts.filter((p) => p.status === "pending").length,
    blocked: payouts.filter((p) => p.status === "blocked").length,
    overdue: payouts.filter((p) => p.status === "overdue").length,
    paid:    payouts.filter((p) => p.status === "paid").length,
  };

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
        <button onClick={loadPayouts} className="px-4 py-2 rounded-lg bg-[#D84040] text-white">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#60a5fa22", border: "1px solid #60a5fa44" }}
          >
            <Banknote size={22} style={{ color: "#60a5fa" }} />
          </div>
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>
              Công nợ phải trả
            </h1>
            <p style={{ color: "#555", fontSize: "12px" }}>Accounts Payable · Partner Expenses & Freelancer Payouts</p>
          </div>
        </div>
      </div>

      {/* Auto-created notification */}
      {!notifDismissed && autoCreatedCount > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-xl"
          style={{ background: "#c084fc18", border: "1px solid #c084fc44" }}
        >
          <Bell size={16} style={{ color: "#c084fc", flexShrink: 0 }} />
          <p style={{ color: "#c084fc", fontSize: "13px", fontWeight: 600, flex: 1 }}>
            {autoCreatedCount} phiếu chi nháp được tạo tự động từ hệ thống — Cần xem xét & duyệt
          </p>
          <button onClick={() => setNotifDismissed(true)}>
            <X size={14} style={{ color: "#c084fc" }} />
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chờ thanh toán", value: totalPending,  color: "#60a5fa", count: filterCounts.pending },
          { label: "Đang bị khóa",   value: totalBlocked,  color: "#fbbf24", count: filterCounts.blocked },
          { label: "Quá hạn",        value: totalOverdue,  color: "#f87171", count: filterCounts.overdue },
          { label: "Đã thanh toán tháng này", value: totalPaid, color: "#4ade80", count: filterCounts.paid },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1px solid ${k.label === "Quá hạn" && k.count > 0 ? "#f8717133" : "#2A1F1F"}` }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: "#555", fontSize: "11px" }}>{k.label}</span>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: k.color + "22", color: k.color }}
              >
                {k.count}
              </span>
            </div>
            <p style={{ color: k.color, fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{fmtM(k.value)}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1 min-w-[200px]"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <Search size={13} style={{ color: "#555" }} />
          <input
            placeholder="Tìm đối tác, nhà cung cấp, dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ color: "#EEEEEE", fontSize: "13px" }}
          />
        </div>

        {/* Group Filter */}
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl outline-none cursor-pointer text-xs font-semibold"
          style={{
            background: "rgba(29, 22, 22, 0.4)",
            border: "1px solid rgba(46, 32, 32, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#EEEEEE",
          }}
        >
          <option value="all" style={{ background: "#141010", color: "#EEEEEE" }}>Tất cả nhóm chi</option>
          <option value="cogs" style={{ background: "#141010", color: "#EEEEEE" }}>Chi phí Dự án (COGS)</option>
          <option value="opex" style={{ background: "#141010", color: "#EEEEEE" }}>Chi phí Vận hành (OPEX)</option>
        </select>

        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {(["all","pending","blocked","overdue","paid"] as FilterTab[]).map((f) => {
            const labels: Record<FilterTab, string> = {
              all: "Tất cả", pending: "Chờ TT", blocked: "Bị khóa", overdue: "Quá hạn", paid: "Đã TT",
            };
            const colors: Record<FilterTab, string> = {
              all: "#EEEEEE", pending: "#60a5fa", blocked: "#fbbf24", overdue: "#f87171", paid: "#4ade80",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: filter === f ? colors[f] + "22" : "transparent",
                  color: filter === f ? colors[f] : "#555",
                  border: filter === f ? `1px solid ${colors[f]}44` : "1px solid transparent",
                }}
              >
                {labels[f]} ({filterCounts[f]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div
          className="hidden lg:grid px-5 py-2.5"
          style={{
            gridTemplateColumns: "40px 1fr 130px 90px 130px 120px 100px",
            borderBottom: "1px solid #2A1F1F",
          }}
        >
          {["","Đối tác / Hạng mục & Dự án","Thực chi (Net)","Hạn trả","Trạng thái","",""].map((h, i) => (
            <span key={i} style={{ color: "#444", fontSize: "10px", fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: "#444", fontSize: "13px" }}>Không có kết quả</p>
          </div>
        ) : (
          filtered.map((p) => (
            <PayoutRow key={p.id} payout={p} onPay={handlePay} isPaying={payingId === p.id} />
          ))
        )}
      </div>

      {/* Pay-when-paid info box */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-xl"
        style={{ background: "#78350f18", border: "1px solid #fbbf2433" }}
      >
        <Lock size={15} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ color: "#fbbf24", fontSize: "12px", fontWeight: 700 }}>Pay-when-paid</p>
          <p style={{ color: "#888", fontSize: "11px" }}>
            Các khoản thanh toán bị khóa sẽ tự động mở khi hóa đơn của khách hàng liên kết được xác nhận thanh toán trong module Doanh thu.
            Kế toán sẽ nhận thông báo tức thì để xuất lệnh chi.
          </p>
        </div>
      </div>
    </div>
  );
}
