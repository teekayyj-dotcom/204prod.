import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from "recharts";
import {
  TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, Star, Crown, ArrowUpRight, ArrowDownRight,
  Layers, RefreshCcw, Megaphone, Zap, Calendar, Filter,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M`;
  return `${v.toLocaleString()}`;
}
function fmtFull(v: number) { return `${fmtM(v)} ₫`; }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REVENUE_BREAKDOWN = [
  { name: "Dự án ngắn hạn", value: 784_000_000, color: "#D84040", icon: Layers },
  { name: "Hợp đồng Retainer", value: 420_000_000, color: "#60a5fa", icon: RefreshCcw },
  { name: "Quảng cáo / Media", value: 312_000_000, color: "#fbbf24", icon: Megaphone },
];

const MONTHLY_STACKED = [
  { month: "T1", project: 110, retainer: 60, media: 38 },
  { month: "T2", project: 95,  retainer: 60, media: 42 },
  { month: "T3", project: 140, retainer: 70, media: 55 },
  { month: "T4", project: 128, retainer: 65, media: 48 },
  { month: "T5", project: 160, retainer: 75, media: 62 },
  { month: "T6", project: 151, retainer: 90, media: 67 },
];

const RECEIVABLES = {
  collected: 1_180_000_000,
  pending:   336_000_000,
  overdue:   187_000_000,
};

const OVERDUE_LIST = [
  { client: "MediaPro Vietnam",    invoice: "INV-2026-044", amount: 120_000_000, days: 31, contact: "Anh Tuấn" },
  { client: "Công ty Ánh Dương",  invoice: "INV-2026-038", amount:  45_000_000, days: 18, contact: "Chị Hoa" },
  { client: "StartupX HN",         invoice: "INV-2026-051", amount:  22_000_000, days:  9, contact: "Anh Minh" },
];

const PENDING_LIST = [
  { client: "Vingroup Digital",    invoice: "INV-2026-058", amount: 180_000_000, dueIn: 5,  stage: "50% nghiệm thu" },
  { client: "F88 Finance",         invoice: "INV-2026-055", amount:  96_000_000, dueIn: 12, stage: "Đợt 2/3" },
  { client: "Highlands Coffee",    invoice: "INV-2026-052", amount:  60_000_000, dueIn: 20, stage: "Thanh toán cuối" },
];

const TOP_SERVICES = [
  { name: "Sản xuất TVC / Video",    revenue: 395_000_000, pct: 26, trend: "up" },
  { name: "Chạy Ads (Facebook/GG)",  revenue: 312_000_000, pct: 20, trend: "up" },
  { name: "Chụp ảnh sản phẩm",       revenue: 228_000_000, pct: 15, trend: "down" },
  { name: "Quản lý kênh Social",     revenue: 210_000_000, pct: 14, trend: "up" },
  { name: "Thiết kế thương hiệu",    revenue: 156_000_000, pct: 10, trend: "flat" },
  { name: "KOL / KOC Booking",       revenue: 105_000_000, pct:  7, trend: "up" },
  { name: "Sản xuất Podcast / Audio", revenue:  78_000_000, pct:  5, trend: "flat" },
  { name: "Chăm sóc Fanpage",        revenue:  32_000_000, pct:  3, trend: "down" },
];

const TOP_CLIENTS = [
  { name: "Vingroup Digital",  spend: 420_000_000, projects: 4, type: "Retainer + Project", badge: "vip" },
  { name: "Highlands Coffee",  spend: 260_000_000, projects: 3, type: "Project-based",       badge: "key" },
  { name: "F88 Finance",       spend: 215_000_000, projects: 2, type: "Retainer",            badge: "key" },
  { name: "MediaPro Vietnam",  spend: 180_000_000, projects: 5, type: "Media Booking",       badge: null },
  { name: "StartupX HN",       spend:  98_000_000, projects: 2, type: "Project-based",       badge: null },
];

const FORECAST_MONTHS = [
  { month: "T7/2026", low: 380, mid: 460, high: 540 },
  { month: "T8/2026", low: 350, mid: 430, high: 510 },
  { month: "T9/2026", low: 400, mid: 490, high: 580 },
];

const PIPELINE = [
  { name: "Vingroup — Campaign Q3",  value: 320_000_000, prob: 85, stage: "Đàm phán HĐ",    closes: "05/07" },
  { name: "New client: FPT Retail",  value: 250_000_000, prob: 60, stage: "Gửi proposal",   closes: "15/07" },
  { name: "Highlands — TVC mùa thu", value: 180_000_000, prob: 90, stage: "Đã ký WO",       closes: "01/07" },
  { name: "F88 — Retainer gia hạn",  value: 120_000_000, prob: 95, stage: "Xác nhận miệng", closes: "30/06" },
  { name: "Startup B2B SaaS",        value:  75_000_000, prob: 40, stage: "Demo sản phẩm",  closes: "20/07" },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg" style={{ background: "#1A1010", border: "1px solid #2A1F1F" }}>
      {label && <p style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 600 }}>{p.name}: {fmtFull(p.value * 1_000_000)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg" style={{ background: "#1A1010", border: "1px solid #2A1F1F" }}>
      <p style={{ color: d.payload.color, fontSize: "12px", fontWeight: 700 }}>{d.name}</p>
      <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>{fmtFull(d.value)}</p>
      <p style={{ color: "#666", fontSize: "11px" }}>{d.payload.pct}% tổng DT</p>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, sub, icon: Icon, color, children }: {
  title: string; sub: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color + "22", border: `1px solid ${color}33` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <div>
          <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>{title}</p>
          <p style={{ color: "#555", fontSize: "11px" }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── 1. Revenue Breakdown ─────────────────────────────────────────────────────

function RevenueBreakdown({ period }: { period: string }) {
  const total = REVENUE_BREAKDOWN.reduce((s, d) => s + d.value, 0);
  const enriched = REVENUE_BREAKDOWN.map((d) => ({ ...d, pct: Math.round((d.value / total) * 100) }));

  return (
    <Section title="Phân loại Nguồn Doanh thu" sub="Revenue Breakdown — Theo mô hình tính giá" icon={Layers} color="#D84040">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <p style={{ color: "#666", fontSize: "12px", fontWeight: 600 }} className="mb-4">
            Tỷ trọng nguồn thu · {period}
          </p>
          <div className="flex items-center gap-6">
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enriched}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {enriched.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {enriched.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                      <span style={{ color: "#EEEEEE", fontSize: "12px" }}>{d.name}</span>
                    </div>
                    <span style={{ color: d.color, fontSize: "12px", fontWeight: 700 }}>{d.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                  <p style={{ color: "#555", fontSize: "10px" }}>{fmtFull(d.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stacked bar – monthly */}
        <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <p style={{ color: "#666", fontSize: "12px", fontWeight: 600 }} className="mb-4">
            Doanh thu theo tháng · Triệu ₫
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_STACKED} barSize={18}>
              <CartesianGrid vertical={false} stroke="#2A1F1F" />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <ReTooltip content={<ChartTooltip />} cursor={{ fill: "#2A1F1F55" }} />
              <Bar dataKey="project" name="Dự án" stackId="a" fill="#D84040" radius={[0,0,0,0]} />
              <Bar dataKey="retainer" name="Retainer" stackId="a" fill="#60a5fa" radius={[0,0,0,0]} />
              <Bar dataKey="media" name="Media" stackId="a" fill="#fbbf24" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            {[["#D84040","Dự án"],["#60a5fa","Retainer"],["#fbbf24","Media"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                <span style={{ color: "#555", fontSize: "10px" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── 2. Cash Flow & Receivables ───────────────────────────────────────────────

function CashFlow() {
  const [tab, setTab] = useState<"overdue" | "pending">("overdue");
  const total = RECEIVABLES.collected + RECEIVABLES.pending + RECEIVABLES.overdue;

  return (
    <Section title="Trạng thái Dòng tiền & Công nợ" sub="Cash Flow & Receivables" icon={DollarSign} color="#4ade80">
      <div className="space-y-4">
        {/* Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Đã thu", value: RECEIVABLES.collected,
              pct: Math.round((RECEIVABLES.collected / total) * 100),
              color: "#4ade80", icon: CheckCircle2, sub: "Đã vào tài khoản",
            },
            {
              label: "Đang chờ thu", value: RECEIVABLES.pending,
              pct: Math.round((RECEIVABLES.pending / total) * 100),
              color: "#60a5fa", icon: Clock, sub: "Hóa đơn chưa đến hạn",
            },
            {
              label: "Quá hạn", value: RECEIVABLES.overdue,
              pct: Math.round((RECEIVABLES.overdue / total) * 100),
              color: "#f87171", icon: AlertTriangle, sub: `${OVERDUE_LIST.length} khách hàng trễ hạn`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-5"
              style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                border: `1px solid ${card.label === "Quá hạn" ? "#7f1d1d55" : "#2A1F1F"}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: "#666", fontSize: "12px", fontWeight: 500 }}>{card.label}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: card.color + "22" }}
                >
                  <card.icon size={13} style={{ color: card.color }} />
                </div>
              </div>
              <p style={{ color: card.color, fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>
                {fmtFull(card.value)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p style={{ color: "#555", fontSize: "11px" }}>{card.sub}</p>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: card.color + "22", color: card.color }}
                >
                  {card.pct}%
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                <div className="h-full rounded-full" style={{ width: `${card.pct}%`, background: card.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Detail table */}
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid #2A1F1F" }}
          >
            <div
              className="flex gap-1 p-1 rounded-lg"
              style={{ background: "#141010" }}
            >
              {([["overdue","Quá hạn","#f87171"],["pending","Đang chờ","#60a5fa"]] as const).map(([key, label, color]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "overdue" | "pending")}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: tab === key ? color + "22" : "transparent",
                    color: tab === key ? color : "#555",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <span style={{ color: "#555", fontSize: "11px" }}>
              Tổng: {fmtFull(tab === "overdue" ? RECEIVABLES.overdue : RECEIVABLES.pending)}
            </span>
          </div>

          {tab === "overdue" && OVERDUE_LIST.map((row, i) => (
            <div
              key={row.invoice}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < OVERDUE_LIST.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: row.days > 20 ? "#f87171" : "#fbbf24" }}
              />
              <div className="flex-1 min-w-0">
                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{row.client}</p>
                <p style={{ color: "#555", fontSize: "11px" }}>{row.invoice} · Liên hệ: {row.contact}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p style={{ color: "#f87171", fontSize: "14px", fontWeight: 700 }}>{fmtFull(row.amount)}</p>
                <p style={{ color: "#f87171", fontSize: "11px" }}>Quá hạn {row.days} ngày</p>
              </div>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ background: "#7f1d1d33", color: "#f87171" }}
              >
                Nhắc nợ
              </button>
            </div>
          ))}

          {tab === "pending" && PENDING_LIST.map((row, i) => (
            <div
              key={row.invoice}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < PENDING_LIST.length - 1 ? "1px solid #2A1F1F" : undefined }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#60a5fa" }} />
              <div className="flex-1 min-w-0">
                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{row.client}</p>
                <p style={{ color: "#555", fontSize: "11px" }}>{row.invoice} · {row.stage}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p style={{ color: "#60a5fa", fontSize: "14px", fontWeight: 700 }}>{fmtFull(row.amount)}</p>
                <p style={{ color: "#555", fontSize: "11px" }}>Đến hạn trong {row.dueIn} ngày</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── 3. Top Performers ────────────────────────────────────────────────────────

function TopPerformers() {
  const maxRev = TOP_SERVICES[0].revenue;
  return (
    <Section title="Bảng xếp hạng Hiệu quả" sub="Top Performers — Dịch vụ & Khách hàng" icon={Star} color="#fbbf24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Services */}
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>Top Dịch vụ</p>
            <p style={{ color: "#555", fontSize: "11px" }}>Theo doanh thu · H1 2026</p>
          </div>
          <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
            {TOP_SERVICES.map((svc, i) => (
              <div key={svc.name} className="flex items-center gap-3 px-5 py-3">
                <span
                  style={{
                    color: i < 3 ? "#fbbf24" : "#444",
                    fontSize: "12px",
                    fontWeight: 700,
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>
                      {svc.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {svc.trend === "up" && <ArrowUpRight size={11} style={{ color: "#4ade80" }} />}
                      {svc.trend === "down" && <ArrowDownRight size={11} style={{ color: "#f87171" }} />}
                      <span style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>
                        {fmtFull(svc.revenue)}
                      </span>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: i < 3 ? "#fbbf2422" : "#2A1F1F",
                          color: i < 3 ? "#fbbf24" : "#555",
                        }}
                      >
                        {svc.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(svc.revenue / maxRev) * 100}%`,
                        background: i < 3 ? "#fbbf24" : "#3A2A2A",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>Top Khách hàng</p>
            <p style={{ color: "#555", fontSize: "11px" }}>Key Accounts · H1 2026</p>
          </div>
          <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
            {TOP_CLIENTS.map((client, i) => (
              <div key={client.name} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: "#2A1F1F", color: i === 0 ? "#fbbf24" : "#888" }}
                >
                  {i === 0 ? <Crown size={14} style={{ color: "#fbbf24" }} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{client.name}</span>
                    {client.badge === "vip" && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "#fbbf2422", color: "#fbbf24" }}>VIP</span>
                    )}
                    {client.badge === "key" && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "#D8404022", color: "#D84040" }}>KEY</span>
                    )}
                  </div>
                  <p style={{ color: "#555", fontSize: "11px" }}>
                    {client.type} · {client.projects} dự án
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>{fmtFull(client.spend)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── 4. Revenue Forecast ──────────────────────────────────────────────────────

function RevenueForecast() {
  const weightedPipeline = PIPELINE.reduce((s, p) => s + p.value * (p.prob / 100), 0);
  const bestCase = PIPELINE.reduce((s, p) => s + p.value, 0);

  return (
    <Section title="Dự báo Doanh thu" sub="Revenue Forecast — Pipeline & Ước tính Q3 2026" icon={Zap} color="#c084fc">
      <div className="space-y-4">
        {/* Forecast chart */}
        <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>Dự báo Q3 2026 · Triệu ₫</p>
              <p style={{ color: "#555", fontSize: "11px" }}>Kịch bản thấp / trung bình / tốt</p>
            </div>
            <div className="flex items-center gap-4">
              {[["#4ade80","Tốt"],["#c084fc","Trung bình"],["#f87171","Thấp"]].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                  <span style={{ color: "#555", fontSize: "10px" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={FORECAST_MONTHS} barGap={4} barSize={22}>
              <CartesianGrid vertical={false} stroke="#2A1F1F" />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <ReTooltip content={<ChartTooltip />} cursor={{ fill: "#2A1F1F55" }} />
              <Bar dataKey="high"  name="Kịch bản tốt"       fill="#4ade80" radius={[3,3,0,0]} />
              <Bar dataKey="mid"   name="Kịch bản trung bình" fill="#c084fc" radius={[3,3,0,0]} />
              <Bar dataKey="low"   name="Kịch bản thấp"       fill="#f87171" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <p style={{ color: "#666", fontSize: "12px" }}>Pipeline có trọng số</p>
            <p style={{ color: "#c084fc", fontSize: "26px", fontWeight: 700, marginTop: "4px" }}>
              {fmtFull(weightedPipeline)}
            </p>
            <p style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>
              Dự kiến thu được sau xác suất chốt
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <p style={{ color: "#666", fontSize: "12px" }}>Best-case Pipeline</p>
            <p style={{ color: "#4ade80", fontSize: "26px", fontWeight: 700, marginTop: "4px" }}>
              {fmtFull(bestCase)}
            </p>
            <p style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>
              Nếu chốt toàn bộ {PIPELINE.length} deal
            </p>
          </div>
        </div>

        {/* Pipeline list */}
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid #2A1F1F" }}
          >
            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 700 }}>
              Pipeline đang theo dõi
            </p>
            <span style={{ color: "#555", fontSize: "11px" }}>{PIPELINE.length} deals · Tháng 7/2026</span>
          </div>
          {PIPELINE.map((deal, i) => {
            const probColor = deal.prob >= 80 ? "#4ade80" : deal.prob >= 60 ? "#fbbf24" : "#f87171";
            return (
              <div
                key={deal.name}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < PIPELINE.length - 1 ? "1px solid #2A1F1F" : undefined }}
              >
                {/* Probability ring */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#2A1F1F" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={probColor} strokeWidth="3"
                      strokeDasharray={`${(deal.prob / 100) * 94.2} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: probColor, fontSize: "9px", fontWeight: 700 }}
                  >
                    {deal.prob}%
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{deal.name}</p>
                  <p style={{ color: "#555", fontSize: "11px" }}>{deal.stage} · Dự kiến chốt {deal.closes}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>{fmtFull(deal.value)}</p>
                  <p style={{ color: "#555", fontSize: "11px" }}>
                    ≈ {fmtFull(deal.value * deal.prob / 100)} kỳ vọng
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PERIODS = ["H1 2026", "Q2 2026", "Tháng 6/2026", "Cả năm 2026"] as const;
type Period = typeof PERIODS[number];

export function FinanceRevenuePage() {
  const [period, setPeriod] = useState<Period>("H1 2026");

  const totalRev = REVENUE_BREAKDOWN.reduce((s, d) => s + d.value, 0);
  const prevRev  = 1_180_000_000;
  const growth   = Math.round(((totalRev - prevRev) / prevRev) * 100);

  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#4ade8022", border: "1px solid #4ade8044" }}
          >
            <TrendingUp size={22} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>FINANCE</p>
            <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Doanh thu</h1>
          </div>
        </div>

        {/* Period picker */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: period === p ? "#D84040" : "transparent",
                color: period === p ? "#EEEEEE" : "#666",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng doanh thu", value: fmtFull(totalRev), sub: period, color: "#EEEEEE", icon: DollarSign },
          {
            label: "Tăng trưởng",
            value: `+${growth}%`,
            sub: "So với kỳ trước",
            color: "#4ade80",
            icon: ArrowUpRight,
          },
          {
            label: "Đã thu thực tế",
            value: fmtFull(RECEIVABLES.collected),
            sub: `${Math.round((RECEIVABLES.collected / totalRev) * 100)}% tổng DT`,
            color: "#60a5fa",
            icon: CheckCircle2,
          },
          {
            label: "Công nợ quá hạn",
            value: fmtFull(RECEIVABLES.overdue),
            sub: `${OVERDUE_LIST.length} khách hàng`,
            color: "#f87171",
            icon: AlertTriangle,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: "#666", fontSize: "12px", fontWeight: 500 }}>{kpi.label}</span>
              <kpi.icon size={14} style={{ color: kpi.color }} />
            </div>
            <p style={{ color: kpi.color, fontSize: "22px", fontWeight: 700, lineHeight: 1 }}>{kpi.value}</p>
            <p style={{ color: "#444", fontSize: "11px" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <RevenueBreakdown period={period} />
      <CashFlow />
      <TopPerformers />
      <RevenueForecast />
    </div>
  );
}
