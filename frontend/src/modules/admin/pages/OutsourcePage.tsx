import { useState } from "react";
import {
  Search, Filter, Star, ExternalLink, CheckCircle2, XCircle,
  Clock, AlertTriangle, Crown, Shield, FileText, CreditCard,
  Banknote, ChevronDown, Plus, Camera, Edit3, Mic, Scissors,
  Sparkles, UserX, Briefcase, DollarSign, X, Eye,
} from "lucide-react";

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TALENT_POOL: OutsourcePerson[] = [
  {
    id:1, name:"Trịnh Minh Tuấn", avatar:"TT", role:"Cameraman / DP", category:"Camera",
    status:"available", stars:5, rateDaily:2_500_000, rateProject:8_000_000,
    portfolio:"https://drive.google.com", tags:["VIP","Ưu tiên","Đang rảnh"],
    phone:"0901 234 567", taxId:"012345678901", bankName:"VCB", bankAccount:"103xxxx789",
    cccdDone:true, contractSigned:true, ndaSigned:true, tncnConsent:true,
    projects:[
      { name:"Vingroup TVC Q2",    date:"10/06/2026", paid:true,  rating:5 },
      { name:"Highlands Rebranding",date:"28/04/2026", paid:true,  rating:5 },
      { name:"F88 Social Q1",      date:"15/02/2026", paid:true,  rating:4 },
    ],
  },
  {
    id:2, name:"Lê Phương Anh", avatar:"LA", role:"Editor / Post-prod", category:"Edit",
    status:"busy", stars:4, rateDaily:1_800_000,
    portfolio:"https://behance.net", tags:["Ưu tiên"],
    phone:"0912 345 678", taxId:"098765432109", bankName:"Techcombank", bankAccount:"190xxxx321",
    cccdDone:true, contractSigned:true, ndaSigned:false, tncnConsent:true,
    projects:[
      { name:"MediaPro KOL Campaign", date:"20/06/2026", paid:false, rating:4 },
      { name:"StartupX Launch Kit",   date:"05/05/2026", paid:true,  rating:4 },
    ],
    note:"NDA chưa ký — cần gửi lại trước dự án tới",
  },
  {
    id:3, name:"Nguyễn Bảo Châu", avatar:"NC", role:"Makeup Artist", category:"Makeup",
    status:"available", stars:5, rateDaily:1_500_000, rateProject:4_000_000,
    tags:["VIP","Đang rảnh"],
    phone:"0933 456 789", bankName:"ACB", bankAccount:"217xxxx654",
    cccdDone:true, contractSigned:true, ndaSigned:true, tncnConsent:false,
    projects:[
      { name:"Vingroup TVC Q2",    date:"08/06/2026", paid:true,  rating:5 },
      { name:"Highlands Rebranding",date:"30/04/2026", paid:true,  rating:5 },
    ],
  },
  {
    id:4, name:"Vũ Thanh Hùng", avatar:"VH", role:"Stylist / Wardrobe", category:"Stylist",
    status:"available", stars:3, rateDaily:1_200_000,
    tags:["Hay trễ"],
    phone:"0944 567 890",
    cccdDone:true, contractSigned:false, ndaSigned:false, tncnConsent:false,
    projects:[
      { name:"Highlands Rebranding", date:"02/05/2026", paid:true, rating:3 },
    ],
    note:"Trễ hẹn 2 lần — cần báo trước 48h",
  },
  {
    id:5, name:"Phan Thị Mỹ Duyên", avatar:"PD", role:"Voice Talent", category:"Voice",
    status:"available", stars:5, rateDaily:800_000, rateProject:2_500_000,
    portfolio:"https://soundcloud.com", tags:["VIP","Đang rảnh"],
    phone:"0955 678 901", taxId:"056789012345", bankName:"MB Bank", bankAccount:"091xxxx432",
    cccdDone:true, contractSigned:true, ndaSigned:true, tncnConsent:true,
    projects:[
      { name:"F88 Social Q2",      date:"18/06/2026", paid:false, rating:5 },
      { name:"Vingroup TVC Q2",    date:"12/06/2026", paid:true,  rating:5 },
    ],
  },
  {
    id:6, name:"Cao Duy Khang", avatar:"CK", role:"Diễn viên", category:"Actor",
    status:"blacklist", stars:1, rateDaily:3_000_000,
    tags:["Blacklist"],
    phone:"0966 789 012",
    cccdDone:true, contractSigned:true, ndaSigned:false, tncnConsent:false,
    projects:[
      { name:"F88 Social Q1", date:"20/01/2026", paid:true, rating:1 },
    ],
    note:"Bỏ set giữ chừng không báo trước — đã đưa vào blacklist",
  },
  {
    id:7, name:"Đinh Anh Kiệt", avatar:"DK", role:"Drone Pilot", category:"Camera",
    status:"available", stars:4, rateDaily:2_000_000, rateProject:5_500_000,
    portfolio:"https://youtube.com", tags:["Đang rảnh"],
    phone:"0977 890 123", taxId:"034567890123", bankName:"VPBank", bankAccount:"145xxxx876",
    cccdDone:true, contractSigned:true, ndaSigned:true, tncnConsent:true,
    projects:[
      { name:"Vingroup TVC Q2", date:"09/06/2026", paid:true, rating:4 },
    ],
  },
  {
    id:8, name:"Trần Khánh Linh", avatar:"KL", role:"Copywriter / Script", category:"Content",
    status:"busy", stars:4, rateDaily:900_000, rateProject:2_000_000,
    tags:["Ưu tiên"],
    phone:"0988 901 234",
    cccdDone:false, contractSigned:false, ndaSigned:false, tncnConsent:false,
    projects:[
      { name:"MediaPro KOL Campaign", date:"15/06/2026", paid:false, rating:4 },
    ],
    note:"Freelancer mới — chưa hoàn thiện hồ sơ pháp lý",
  },
];

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

function DetailDrawer({ person, onClose }: { person: OutsourcePerson; onClose: () => void }) {
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
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-black"
            style={{
              background: person.status === "blacklist" ? "#7f1d1d" : "#8E1616",
              color: "#EEEEEE",
              border: `2px solid ${s.border}`,
            }}
          >
            {person.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700 }}>{person.name}</p>
              {person.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: tagCfg[t].bg, color: tagCfg[t].color }}>
                  {t === "VIP" ? "👑 VIP" : t}
                </span>
              ))}
            </div>
            <p style={{ color: "#888", fontSize: "12px" }}>{person.role}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
              <span style={{ color: s.dot, fontSize: "11px", fontWeight: 600 }}>{s.label}</span>
              <StarRow count={person.stars} size={11} />
            </div>
          </div>
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
  const s = statusCfg[person.status];
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
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-black"
            style={{
              background: isBlacklist ? "#2A1F1F" : "#8E1616",
              color: isBlacklist ? "#555" : "#EEEEEE",
            }}
          >
            {person.avatar}
          </div>
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
              style={{ background: tagCfg[t].bg, color: tagCfg[t].color }}>
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

export function OutsourcePage() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [statusFilter, setStatus] = useState<"all" | AvailStatus>("all");
  const [selected, setSelected] = useState<OutsourcePerson | null>(null);
  const [sortBy, setSortBy]     = useState<"name" | "stars" | "rate">("stars");

  const filtered = TALENT_POOL
    .filter((p) => {
      const matchCat    = category === "Tất cả" || p.category === category;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        || p.role.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "stars") return b.stars - a.stars;
      if (sortBy === "rate")  return b.rateDaily - a.rateDaily;
      return a.name.localeCompare(b.name);
    });

  const available  = TALENT_POOL.filter((p) => p.status === "available").length;
  const busy       = TALENT_POOL.filter((p) => p.status === "busy").length;
  const blacklisted = TALENT_POOL.filter((p) => p.status === "blacklist").length;
  const docIssues  = TALENT_POOL.filter((p) => !p.cccdDone || !p.contractSigned || !p.ndaSigned).length;

  return (
    <>
      <div className="p-8 space-y-7">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#D8404022", border: "1px solid #D8404044" }}>
              <DollarSign size={22} style={{ color: "#D84040" }} />
            </div>
            <div>
              <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>HR</p>
              <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Outsource</h1>
              <p style={{ color: "#555", fontSize: "12px" }}>Talent Pool · {TALENT_POOL.length} freelancer</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
          >
            <Plus size={15} /> Thêm Freelancer
          </button>
        </div>

        {/* KPI strip */}
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
        </div>

        {/* Count */}
        <div className="flex items-center gap-2">
          <span style={{ color: "#555", fontSize: "12px" }}>
            Hiển thị <strong style={{ color: "#EEEEEE" }}>{filtered.length}</strong> / {TALENT_POOL.length} freelancer
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

      {selected && <DetailDrawer person={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
