import { useState, useEffect } from "react";
import {
  Search, Filter, Star, ExternalLink, CheckCircle2, XCircle,
  Clock, AlertTriangle, Crown, Shield, FileText, CreditCard,
  Banknote, ChevronDown, Plus, Camera, Edit3, Mic, Scissors,
  Sparkles, UserX, Briefcase, DollarSign, X, Eye, Trash2, Loader2
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailStatus = "available" | "busy" | "blacklist";
type TagLabel    = "VIP" | "Ưu tiên" | "Đang rảnh" | "Hay trễ" | "Blacklist" | "Mới";

interface OutsourcePerson {
  id: number;
  name: string;
  avatar: string;
  role: string;
  category: string;
  status: AvailStatus;
  stars: number;
  rateDaily: number;
  rateProject?: number;
  portfolio?: string;
  tags: TagLabel[];
  phone: string;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  cccdDone: boolean;
  contractSigned: boolean;
  ndaSigned: boolean;
  tncnConsent: boolean;
  projects: { name: string; date: string; paid: boolean; rating: number }[];
  note?: string;
}

const mapDbToFreelancer = (m: any): OutsourcePerson => ({
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
  tags: Array.isArray(m.tags) ? m.tags : (typeof m.tags === "string" ? JSON.parse(m.tags) : []),
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

function renderAvatar(avatar: string, sizeClass = "w-14 h-14", shapeClass = "rounded-2xl", textStyle?: React.CSSProperties) {
  const isUrl = avatar && (avatar.startsWith("http") || avatar.startsWith("/") || avatar.includes(".") || avatar.includes("uploads"));
  if (isUrl) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={`${sizeClass} ${shapeClass} object-cover flex-shrink-0`}
        style={textStyle?.border ? { border: textStyle.border } : undefined}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} ${shapeClass} flex items-center justify-center flex-shrink-0 font-black`}
      style={textStyle || { background: "#8E1616", color: "#EEEEEE" }}
    >
      {avatar}
    </div>
  );
}

// ─── Slide-over Add Freelancer ───────────────────────────────────────────────

function AddFreelancerPanel({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: "", role: "", category: "Camera", phone: "", rateDaily: "", rateProject: "",
    portfolio: "", bankName: "", bankAccount: "", taxId: "", note: "",
    cccdDone: false, contractSigned: false, ndaSigned: false, tncnConsent: false
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = ["Camera", "Edit", "Makeup", "Stylist", "Voice", "Actor", "Content"];

  function field(v: any, key: keyof typeof form) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  const inputStyle = {
    background: "#141010", border: "1px solid #2A1F1F", color: "#EEEEEE",
    fontSize: "13px", borderRadius: "8px", padding: "8px 12px", width: "100%", outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    color: "#888", fontSize: "11px", fontWeight: 600, marginBottom: "4px", display: "block",
  } as React.CSSProperties;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.phone || !form.rateDaily) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    setSubmitting(true);
    try {
      const initials = form.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
      
      const tags = ["Đang rảnh"];
      if (parseInt(form.rateDaily) > 2000000) tags.push("VIP");
      if (form.cccdDone && form.contractSigned && form.ndaSigned) tags.push("Ưu tiên");

      const payload = {
        name: form.name,
        avatar: initials,
        role: form.role,
        category: form.category,
        status: "available",
        stars: 5,
        rate_daily: parseInt(form.rateDaily) || 0,
        rate_project: form.rateProject ? parseInt(form.rateProject) : null,
        portfolio: form.portfolio || null,
        phone: form.phone,
        tax_id: form.taxId || null,
        bank_name: form.bankName || null,
        bank_account: form.bankAccount || null,
        cccd_done: form.cccdDone,
        contract_signed: form.contractSigned,
        nda_signed: form.ndaSigned,
        tncn_consent: form.tncnConsent,
        projects: [],
        note: form.note || null,
        tags: tags
      };

      await fetchApi("/hr/freelancers", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onSave();
      onClose();
    } catch (err) {
      alert("Lỗi khi thêm freelancer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #2A1F1F" }}>
          <div>
            <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>Thêm Freelancer mới</p>
            <p style={{ color: "#555", fontSize: "11px" }}>Khai báo hồ sơ đối tác thuê ngoài</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#2A1F1F", color: "#888" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <span style={labelStyle}>Họ và tên *</span>
            <input placeholder="VD: Nguyễn Văn A" value={form.name} onChange={(e) => field(e.target.value, "name")} style={inputStyle} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span style={labelStyle}>Vai trò *</span>
              <input placeholder="VD: Cameraman" value={form.role} onChange={(e) => field(e.target.value, "role")} style={inputStyle} required />
            </div>
            <div>
              <span style={labelStyle}>Danh mục *</span>
              <select value={form.category} onChange={(e) => field(e.target.value, "category")} style={{ ...inputStyle, appearance: "none" }}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span style={labelStyle}>Cát-xê ngày (₫) *</span>
              <input type="number" placeholder="0" value={form.rateDaily} onChange={(e) => field(e.target.value, "rateDaily")} style={inputStyle} required />
            </div>
            <div>
              <span style={labelStyle}>Cát-xê dự án (₫)</span>
              <input type="number" placeholder="Tùy chọn" value={form.rateProject} onChange={(e) => field(e.target.value, "rateProject")} style={inputStyle} />
            </div>
          </div>

          <div>
            <span style={labelStyle}>Số điện thoại *</span>
            <input placeholder="VD: 0901 234 567" value={form.phone} onChange={(e) => field(e.target.value, "phone")} style={inputStyle} required />
          </div>

          <div>
            <span style={labelStyle}>Link Portfolio / Showreel</span>
            <input placeholder="VD: https://behance.net/..." value={form.portfolio} onChange={(e) => field(e.target.value, "portfolio")} style={inputStyle} />
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid #2A1F1F" }}>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>TÀI KHOẢN & PHÁP LÝ</p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span style={labelStyle}>Tên ngân hàng</span>
                <input placeholder="VD: VCB" value={form.bankName} onChange={(e) => field(e.target.value, "bankName")} style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>Số tài khoản</span>
                <input placeholder="VD: 103..." value={form.bankAccount} onChange={(e) => field(e.target.value, "bankAccount")} style={inputStyle} />
              </div>
            </div>

            <div>
              <span style={labelStyle}>Mã số thuế cá nhân</span>
              <input placeholder="Tùy chọn" value={form.taxId} onChange={(e) => field(e.target.value, "taxId")} style={inputStyle} />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs text-[#EEEEEE] cursor-pointer">
                <input type="checkbox" checked={form.cccdDone} onChange={(e) => field(e.target.checked, "cccdDone")} className="rounded accent-[#D84040]" />
                Đã nộp CCCD / CMND
              </label>
              <label className="flex items-center gap-2 text-xs text-[#EEEEEE] cursor-pointer">
                <input type="checkbox" checked={form.contractSigned} onChange={(e) => field(e.target.checked, "contractSigned")} className="rounded accent-[#D84040]" />
                Đã ký hợp đồng khoán việc
              </label>
              <label className="flex items-center gap-2 text-xs text-[#EEEEEE] cursor-pointer">
                <input type="checkbox" checked={form.ndaSigned} onChange={(e) => field(e.target.checked, "ndaSigned")} className="rounded accent-[#D84040]" />
                Đã ký cam kết bảo mật NDA
              </label>
              <label className="flex items-center gap-2 text-xs text-[#EEEEEE] cursor-pointer">
                <input type="checkbox" checked={form.tncnConsent} onChange={(e) => field(e.target.checked, "tncnConsent")} className="rounded accent-[#D84040]" />
                Đồng ý khấu trừ 10% TNCN
              </label>
            </div>
          </div>

          <div>
            <span style={labelStyle}>Ghi chú nội bộ</span>
            <textarea rows={3} placeholder="Ghi chú thêm về năng lực, thái độ..." value={form.note} onChange={(e) => field(e.target.value, "note")} style={{ ...inputStyle, resize: "none" }} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity" style={{ background: "#2A1F1F", color: "#888" }}>Hủy</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity flex items-center justify-center gap-1.5" style={{ background: "#D84040", color: "#EEEEEE" }}>
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </div>
    </>
  );
}


const CATEGORIES = ["Tất cả", "Camera", "Edit", "Makeup", "Stylist", "Voice", "Actor", "Content"];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Camera: Camera, Edit: Scissors, Makeup: Sparkles,
  Stylist: UserX, Voice: Mic, Actor: Star,
  Content: Edit3,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return `${(v / 1_000).toFixed(0)}K`;
}

const statusCfg: Record<AvailStatus, { dot: string; label: string; border: string }> = {
  available: { dot: "#4ade80", label: "Đang rảnh",   border: "#4ade8033" },
  busy:      { dot: "#fbbf24", label: "Đang bận",    border: "#fbbf2433" },
  blacklist: { dot: "#f87171", label: "Blacklist",    border: "#f8717155" },
};

const tagCfg: Record<TagLabel, { color: string; bg: string }> = {
  "VIP":       { color: "#fbbf24", bg: "#78350f33" },
  "Ưu tiên":   { color: "#4ade80", bg: "#14532d22" },
  "Đang rảnh": { color: "#4ade80", bg: "#14532d18" },
  "Hay trễ":   { color: "#f87171", bg: "#7f1d1d33" },
  "Blacklist":  { color: "#f87171", bg: "#7f1d1d44" },
  "Mới":        { color: "#60a5fa", bg: "#1e3a5f33" },
};

function StarRow({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star
          key={i} size={size}
          fill={i <= count ? "#fbbf24" : "none"}
          style={{ color: i <= count ? "#fbbf24" : "#2A1F1F" }}
        />
      ))}
    </div>
  );
}

function DocBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {done
        ? <CheckCircle2 size={10} style={{ color: "#4ade80" }} />
        : <XCircle     size={10} style={{ color: "#f87171" }} />}
      <span style={{ color: done ? "#4ade80" : "#f87171", fontSize: "10px" }}>{label}</span>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ person, onClose, onDelete }: { person: OutsourcePerson; onClose: () => void; onDelete: () => void }) {
  const [ratingTab, setRatingTab] = useState<"projects" | "legal">("projects");
  const s = statusCfg[person.status];
  const docComplete = person.cccdDone && person.contractSigned && person.ndaSigned && person.tncnConsent;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: "#000", opacity: 0.6 }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{ width: "480px", background: "#141010", borderLeft: "1px solid #2A1F1F" }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #2A1F1F" }}>
          {renderAvatar(person.avatar, "w-14 h-14", "rounded-2xl", {
            background: person.status === "blacklist" ? "#7f1d1d" : "#8E1616",
            color: "#EEEEEE",
            border: `2px solid ${s.border}`,
          })}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700 }}>{person.name}</p>
              {person.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: tagCfg[t]?.bg || "#2A1F1F", color: tagCfg[t]?.color || "#FFF" }}>
                  {t === "VIP" ? "👑 VIP" : t}
                </span>
              ))}
            </div>
            <p style={{ color: "#888", fontSize: "12px" }}>{person.role}</p>
            <div className="flex items-center gap-2 mt-1">
              <select 
                value={person.status} 
                onChange={async (e) => {
                  try {
                    await fetchApi(`/hr/freelancers/${person.id}`, {
                      method: "PUT",
                      body: JSON.stringify({ status: e.target.value })
                    });
                    onDelete();
                  } catch (err) {
                    alert("Lỗi khi cập nhật trạng thái: " + err.message);
                  }
                }}
                className="bg-transparent outline-none cursor-pointer text-xs font-semibold"
                style={{ color: s.dot, background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "4px", padding: "2px 4px" }}
              >
                <option value="available" style={{ color: "#4ade80" }}>Đang rảnh</option>
                <option value="busy" style={{ color: "#fbbf24" }}>Đang bận</option>
                <option value="blacklist" style={{ color: "#f87171" }}>Blacklist</option>
              </select>
              <StarRow count={person.stars} size={11} />
            </div>
          </div>
          
          <button 
            onClick={async () => {
              if (window.confirm(`Bạn có chắc chắn muốn xóa freelancer ${person.name}?`)) {
                try {
                  await fetchApi(`/hr/freelancers/${person.id}`, { method: "DELETE" });
                  onDelete();
                  onClose();
                } catch (err) {
                  alert("Lỗi khi xóa freelancer: " + err.message);
                }
              }
            }} 
            className="w-8 h-8 rounded-lg flex items-center justify-center mr-1"
            style={{ background: "#7f1d1d33", color: "#f87171" }}
            title="Xóa Freelancer"
          >
            <Trash2 size={14} />
          </button>
          
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#2A1F1F", color: "#888" }}>
            <X size={14} />
          </button>
        </div>


        {/* Rate card */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid #2A1F1F" }}>
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }}>DAILY RATE</p>
            <p style={{ color: "#fbbf24", fontSize: "20px", fontWeight: 800 }}>{fmtM(person.rateDaily)} ₫</p>
          </div>
          {person.rateProject && (
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
              <p style={{ color: "#555", fontSize: "10px", fontWeight: 600 }}>PROJECT RATE</p>
              <p style={{ color: "#60a5fa", fontSize: "20px", fontWeight: 800 }}>{fmtM(person.rateProject)} ₫</p>
            </div>
          )}
          {person.portfolio && (
            <a href={person.portfolio} target="_blank" rel="noopener noreferrer"
              className="col-span-2 flex items-center justify-between px-4 py-3 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: "#D8404022", border: "1px solid #D8404044" }}>
              <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>Xem Portfolio / Showreel</span>
              <ExternalLink size={13} style={{ color: "#D84040" }} />
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 mx-6 mt-4 rounded-xl flex-shrink-0"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          {([["projects","Dự án & Đánh giá"],["legal","Pháp lý & Tài khoản"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setRatingTab(k)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: ratingTab === k ? "#D84040" : "transparent",
                color: ratingTab === k ? "#EEEEEE" : "#555",
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {ratingTab === "projects" && (
            <>
              {person.note && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: "#78350f22", border: "1px solid #fbbf2433" }}>
                  <AlertTriangle size={13} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ color: "#fbbf24", fontSize: "11px" }}>{person.note}</p>
                </div>
              )}

              {/* Rating breakdown */}
              <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
                  <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>Lịch sử hợp tác</p>
                </div>
                {person.projects.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < person.projects.length - 1 ? "1px solid #1A1010" : "none" }}>
                    <Briefcase size={13} style={{ color: "#8E1616", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }} className="truncate">{p.name}</p>
                      <p style={{ color: "#444", fontSize: "10px" }}>{p.date}</p>
                    </div>
                    <StarRow count={p.rating} size={10} />
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: p.paid ? "#14532d22" : "#7f1d1d33",
                        color: p.paid ? "#4ade80" : "#f87171",
                      }}>
                      {p.paid ? "Đã trả" : "Chưa trả"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {ratingTab === "legal" && (
            <>
              {/* Doc status */}
              <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1px solid ${docComplete ? "#4ade8033" : "#f8717133"}` }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
                  <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>Trạng thái hồ sơ pháp lý</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: docComplete ? "#14532d22" : "#7f1d1d33",
                      color: docComplete ? "#4ade80" : "#f87171",
                    }}>
                    {docComplete ? "Hoàn thiện" : "Thiếu giấy tờ"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3">
                  <DocBadge done={person.cccdDone}         label="CCCD / CMND" />
                  <DocBadge done={person.contractSigned}   label="Hợp đồng khoán việc" />
                  <DocBadge done={person.ndaSigned}        label="NDA đã ký" />
                  <DocBadge done={person.tncnConsent}      label="Đồng ý khấu trừ TNCN" />
                </div>
              </div>

              {/* Personal info */}
              <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
                  <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>Thông tin cá nhân & Tài khoản</p>
                </div>
                <div className="px-4 py-3 space-y-3">
                  {[
                    { icon: FileText, label: "SĐT",          value: person.phone },
                    { icon: Shield,   label: "MST cá nhân",  value: person.taxId   ?? "Chưa cập nhật" },
                    { icon: Banknote, label: "Ngân hàng",    value: person.bankName ?? "Chưa cập nhật" },
                    { icon: CreditCard, label: "Số TK",      value: person.bankAccount ?? "Chưa cập nhật" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <row.icon size={13} style={{ color: "#8E1616", flexShrink: 0 }} />
                      <span style={{ color: "#555", fontSize: "11px", minWidth: "90px" }}>{row.label}</span>
                      <span style={{
                        color: row.value === "Chưa cập nhật" ? "#444" : "#EEEEEE",
                        fontSize: "12px",
                        fontStyle: row.value === "Chưa cập nhật" ? "italic" : "normal",
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Talent Card ──────────────────────────────────────────────────────────────

function TalentCard({ person, onClick }: { person: OutsourcePerson; onClick: () => void }) {
  const s = statusCfg[person.status] || { dot: "#FFF", label: person.status, border: "#2A1F1F" };
  const CatIcon = CATEGORY_ICONS[person.category] ?? Star;
  const isBlacklist = person.status === "blacklist";
  const docWarning = !person.cccdDone || !person.contractSigned || !person.ndaSigned;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 group"
      style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        border: `1px solid ${isBlacklist ? "#f8717144" : "#2A1F1F"}`,
        opacity: isBlacklist ? 0.75 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isBlacklist ? "#f87171aa" : "#3A2A2A";
        (e.currentTarget as HTMLElement).style.background = "#1A1010";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isBlacklist ? "#f8717144" : "#2A1F1F";
        (e.currentTarget as HTMLElement).style.background = "#1D1616";
      }}
    >
      {/* Avatar + status */}
      <div className="flex items-start justify-between">
        <div className="relative">
          {renderAvatar(person.avatar, "w-14 h-14", "rounded-2xl", {
            background: isBlacklist ? "#2A1F1F" : "#8E1616",
            color: isBlacklist ? "#555" : "#EEEEEE",
          })}
          {/* Status dot */}
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{ background: s.dot, borderColor: "#1D1616" }}
          />
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#2A1F1F" }}
          >
            <CatIcon size={14} style={{ color: "#8E1616" }} />
          </div>
          {docWarning && !isBlacklist && (
            <span title="Hồ sơ pháp lý chưa đầy đủ">
              <AlertTriangle size={13} style={{ color: "#fbbf24" }} />
            </span>
          )}

        </div>
      </div>

      {/* Name + role */}
      <div>
        <p style={{ color: isBlacklist ? "#666" : "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>
          {person.name}
        </p>
        <p style={{ color: "#555", fontSize: "11px" }} className="mt-0.5">{person.role}</p>
        <StarRow count={person.stars} size={11} />
      </div>

      {/* Tags */}
      {person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {person.tags.map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: tagCfg[t]?.bg || "#2A1F1F", color: tagCfg[t]?.color || "#FFF" }}>
              {t === "VIP" ? "👑 VIP" : t}
            </span>
          ))}
        </div>
      )}

      {/* Rate */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid #2A1F1F" }}
      >
        <div>
          <p style={{ color: "#444", fontSize: "10px" }}>Daily rate</p>
          <p style={{ color: "#fbbf24", fontSize: "15px", fontWeight: 700 }}>
            {fmtM(person.rateDaily)} ₫
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "#D8404022", color: "#D84040" }}
        >
          <Eye size={12} />
          <span style={{ fontSize: "11px", fontWeight: 600 }}>Chi tiết</span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OutsourcePage({ 
  showHeader = true, 
  onTalentPoolChange,
  quickFilter
}: { 
  showHeader?: boolean; 
  onTalentPoolChange?: (pool: OutsourcePerson[]) => void;
  quickFilter?: "available" | "busy" | "blacklist" | "doc-issues" | null;
}) {
  const [talentPool, setTalentPool] = useState<OutsourcePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [statusFilter, setStatus] = useState<"all" | AvailStatus>("all");
  const [docOnly, setDocOnly] = useState(false);
  const [selected, setSelected] = useState<OutsourcePerson | null>(null);
  const [sortBy, setSortBy]     = useState<"name" | "stars" | "rate">("stars");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (quickFilter === "doc-issues") {
      setStatus("all");
      setDocOnly(true);
    } else if (quickFilter) {
      setStatus(quickFilter);
      setDocOnly(false);
    } else {
      setStatus("all");
      setDocOnly(false);
    }
  }, [quickFilter]);

  const fetchFreelancers = async () => {
    try {
      const data = await fetchApi<any[]>("/hr/freelancers");
      const mapped = data.map(mapDbToFreelancer);
      setTalentPool(mapped);
      if (onTalentPoolChange) {
        onTalentPoolChange(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch freelancers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const filtered = talentPool
    .filter((p) => {
      const matchCat    = category === "Tất cả" || p.category === category;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        || p.role.toLowerCase().includes(search.toLowerCase());
      const matchDoc = !docOnly || (!p.cccdDone || !p.contractSigned || !p.ndaSigned);
      return matchCat && matchStatus && matchSearch && matchDoc;
    })
    .sort((a, b) => {
      if (sortBy === "stars") return b.stars - a.stars;
      if (sortBy === "rate")  return b.rateDaily - a.rateDaily;
      return a.name.localeCompare(b.name);
    });

  const available  = talentPool.filter((p) => p.status === "available").length;
  const busy       = talentPool.filter((p) => p.status === "busy").length;
  const blacklisted = talentPool.filter((p) => p.status === "blacklist").length;
  const docIssues  = talentPool.filter((p) => !p.cccdDone || !p.contractSigned || !p.ndaSigned).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-[#D84040]" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className={showHeader ? "p-8 space-y-7" : "space-y-7"}>
        {/* Header */}
        {showHeader && (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#D8404022", border: "1px solid #D8404044" }}>
                <DollarSign size={22} style={{ color: "#D84040" }} />
              </div>
              <div>
                <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>HR</p>
                <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Outsource</h1>
                <p style={{ color: "#555", fontSize: "12px" }}>Talent Pool · {talentPool.length} freelancer</p>
              </div>
            </div>
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
            >
              <Plus size={15} /> Thêm Freelancer
            </button>
          </div>
        )}

        {/* KPI strip */}
        {showHeader && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Đang rảnh",    value: available,   color: "#4ade80" },
              { label: "Đang bận",     value: busy,        color: "#fbbf24" },
              { label: "Blacklist",    value: blacklisted, color: "#f87171" },
              { label: "Thiếu giấy tờ",value: docIssues,  color: "#c084fc" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: k.color }} />
                <div>
                  <p style={{ color: k.color, fontSize: "24px", fontWeight: 800, lineHeight: 1 }}>{k.value}</p>
                  <p style={{ color: "#555", fontSize: "11px" }}>{k.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <Search size={13} style={{ color: "#555" }} />
            <input placeholder="Tên, vị trí..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: "#EEEEEE", fontSize: "13px" }} />
          </div>

          {/* Category filter */}
          <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs font-semibold"
                  style={{
                    background: category === cat ? "#D84040" : "transparent",
                    color: category === cat ? "#EEEEEE" : "#555",
                  }}>
                  {Icon && <Icon size={11} />}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", border: "1px solid #2A1F1F" }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Đang rảnh</option>
            <option value="busy">Đang bận</option>
            <option value="blacklist">Blacklist</option>
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", border: "1px solid #2A1F1F" }}>
            <option value="stars">Sắp xếp: Sao cao nhất</option>
            <option value="rate">Sắp xếp: Giá cao nhất</option>
            <option value="name">Sắp xếp: Tên A–Z</option>
          </select>

          {/* Add Freelancer Button */}
          {!showHeader && (
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80 ml-auto"
              style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
            >
              <Plus size={15} /> Thêm Freelancer
            </button>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>
            Hiển thị <strong style={{ color: "#EEEEEE" }}>{filtered.length}</strong> / {talentPool.length} freelancer
          </span>
          {docIssues > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#78350f33", color: "#fbbf24" }}>
              <AlertTriangle size={10} />
              {docIssues} thiếu hồ sơ pháp lý
            </span>
          )}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <TalentCard key={p.id} person={p} onClick={() => setSelected(p)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl py-20 flex flex-col items-center justify-center"
              style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
              <Search size={24} style={{ color: "#333" }} />
              <p style={{ color: "#444", fontSize: "14px" }} className="mt-3">Không tìm thấy kết quả</p>
            </div>
          )}
        </div>
      </div>

      {selected && <DetailDrawer person={selected} onClose={() => setSelected(null)} onDelete={fetchFreelancers} />}
      {panelOpen && <AddFreelancerPanel open={panelOpen} onClose={() => setPanelOpen(false)} onSave={fetchFreelancers} />}
    </>
  );
}
