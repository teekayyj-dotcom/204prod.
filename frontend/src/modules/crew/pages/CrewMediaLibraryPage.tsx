// @ts-nocheck
import { useState } from "react";
import {
  Library,
  Palette,
  Music2,
  FileVideo,
  BookOpen,
  Search,
  Download,
  Eye,
  ChevronRight,
  Layers,
  Headphones,
  FileText,
  Image,
  Type,
  Zap,
  Lock,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const brandAssets = [
  {
    category: "Logo variants",
    items: [
      { name: "204PROD_Logo_Primary.svg", type: "SVG", size: "12 KB", preview: "#D84040" },
      { name: "204PROD_Logo_White.png", type: "PNG", size: "340 KB", preview: "#1D1616" },
      { name: "204PROD_Logo_Mono.ai", type: "AI", size: "2.1 MB", preview: "#2A1F1F" },
      { name: "Brand_X_Logo_Pack.zip", type: "ZIP", size: "8.4 MB", preview: "#1a1030" },
    ],
  },
  {
    category: "Màu sắc — Color Palette",
    items: [
      { name: "#D84040 — Primary Red", type: "HEX", size: "", preview: "#D84040" },
      { name: "#8E1616 — Deep Red", type: "HEX", size: "", preview: "#8E1616" },
      { name: "#D4A843 — Gold", type: "HEX", size: "", preview: "#D4A843" },
      { name: "#0A0707 — Background", type: "HEX", size: "", preview: "#0A0707" },
    ],
  },
  {
    category: "Font chữ",
    items: [
      { name: "Inter — Primary UI Font", type: "OTF", size: "1.2 MB", preview: "#141010" },
      { name: "Monument Extended", type: "OTF", size: "890 KB", preview: "#141010" },
    ],
  },
];

const stockAssets = [
  { name: "Cinematic_SFX_Pack_V2.zip", type: "SFX", size: "1.8 GB", icon: Headphones, color: "#8B5CF6" },
  { name: "Royalty_Free_Music_Q3.zip", type: "Music", size: "3.2 GB", icon: Music2, color: "#10B981" },
  { name: "Premiere_Templates_2025.prproj", type: "Premiere", size: "450 MB", icon: FileVideo, color: "#D84040" },
  { name: "AE_Motion_Pack_V5.aep", type: "After Effects", size: "2.1 GB", icon: Layers, color: "#D4A843" },
  { name: "LUT_Color_Grade_Cinema.zip", type: "LUT", size: "340 MB", icon: Palette, color: "#F59E0B" },
  { name: "Transitions_Handheld.mogrt", type: "MOGRT", size: "180 MB", icon: Zap, color: "#06B6D4" },
];

const guidelines = [
  {
    title: "Quy chuẩn Đặt tên File",
    desc: "Hướng dẫn naming convention cho tất cả file dự án: video, ảnh, audio.",
    icon: FileText,
    updated: "15 Th6 2025",
    color: "#D4A843",
  },
  {
    title: "Quy chuẩn Xuất File Video",
    desc: "Thông số xuất file theo từng platform: YouTube, TikTok, Facebook, TV broadcast.",
    icon: FileVideo,
    updated: "20 Th6 2025",
    color: "#D84040",
  },
  {
    title: "Brand Voice & Tone",
    desc: "Định hướng phong cách sáng tạo và tone màu nhất quán trên tất cả sản phẩm.",
    icon: Type,
    updated: "01 Th6 2025",
    color: "#8B5CF6",
  },
  {
    title: "Quy trình Bàn giao Dự án",
    desc: "Checklist và quy trình deliver file cho PM và khách hàng.",
    icon: BookOpen,
    updated: "10 Th6 2025",
    color: "#10B981",
  },
];

type Tab = "brand" | "stock" | "guidelines";

export function CrewMediaLibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("brand");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "brand", label: "Brand Assets", icon: Palette },
    { id: "stock", label: "Kho Stock & Templates", icon: Library },
    { id: "guidelines", label: "Quy trình", icon: BookOpen },
  ];

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
            Thư viện Tài nguyên
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Lock size={11} style={{ color: "#555" }} />
            <p style={{ color: "#555", fontSize: "13px" }}>
              Read-only — Chỉ xem · Liên hệ Admin để upload tài nguyên mới
            </p>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "#1D1616", border: "1px solid #2A1F1F", width: "220px" }}
        >
          <Search size={14} style={{ color: "#555" }} />
          <input
            placeholder="Tìm kiếm tài nguyên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none flex-1"
            style={{ color: "#EEEEEE", fontSize: "12px" }}
          />
        </div>
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 mb-6 w-fit rounded-xl"
        style={{ background: "#141010", border: "1px solid #2A1F1F" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: activeTab === tab.id ? "#D84040" : "transparent",
              color: activeTab === tab.id ? "#EEEEEE" : "#666",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Brand Assets */}
      {activeTab === "brand" && (
        <div className="space-y-6">
          {brandAssets.map((section) => (
            <div key={section.category}>
              <h3
                style={{
                  color: "#888",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginBottom: "12px",
                }}
              >
                {section.category}
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl overflow-hidden transition-all duration-200"
                    style={{ border: "1px solid #2A1F1F" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
                  >
                    <div
                      className="h-16 flex items-center justify-center"
                      style={{ background: item.preview }}
                    >
                      {item.type === "HEX" ? (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", fontFamily: "monospace" }}>
                          {item.name.split(" ")[0]}
                        </span>
                      ) : (
                        <Image size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                      )}
                    </div>
                    <div className="px-3 py-2.5" style={{ background: "#141010" }}>
                      <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500, lineHeight: 1.3 }}>
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ background: "#1D1616", color: "#666", fontSize: "9px", fontWeight: 700 }}
                        >
                          {item.type}
                        </span>
                        {item.size && (
                          <span style={{ color: "#444", fontSize: "9px" }}>{item.size}</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          className="flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all"
                          style={{ background: "#1D1616", border: "1px solid #2A1F1F", color: "#888", fontSize: "10px" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EEEEEE")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                        >
                          <Eye size={10} /> Xem
                        </button>
                        <button
                          className="flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all"
                          style={{ background: "#D84040", color: "#EEEEEE", fontSize: "10px" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}
                        >
                          <Download size={10} /> Tải
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Stock & Templates */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-3 gap-4">
          {stockAssets.map((asset) => (
            <div
              key={asset.name}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ background: "#141010", border: "1px solid #2A1F1F" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = asset.color + "44")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: asset.color + "18", border: `1px solid ${asset.color}33` }}
              >
                <asset.icon size={22} style={{ color: asset.color }} />
              </div>
              <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                {asset.name}
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: asset.color + "18",
                    border: `1px solid ${asset.color}33`,
                    color: asset.color,
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {asset.type}
                </span>
                <span style={{ color: "#555", fontSize: "10px" }}>{asset.size}</span>
              </div>
              <button
                className="w-full py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "#1D1616",
                  border: "1px solid #2A1F1F",
                  color: "#888",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = asset.color + "18";
                  e.currentTarget.style.borderColor = asset.color + "44";
                  e.currentTarget.style.color = asset.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1D1616";
                  e.currentTarget.style.borderColor = "#2A1F1F";
                  e.currentTarget.style.color = "#888";
                }}
              >
                <Download size={13} /> Tải xuống
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Guidelines */}
      {activeTab === "guidelines" && (
        <div className="grid grid-cols-2 gap-5">
          {guidelines.map((guide) => (
            <div
              key={guide.title}
              className="rounded-2xl p-6 cursor-pointer transition-all duration-200 group"
              style={{ background: "#141010", border: "1px solid #2A1F1F" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = guide.color + "44")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: guide.color + "18", border: `1px solid ${guide.color}33` }}
                >
                  <guide.icon size={20} style={{ color: guide.color }} />
                </div>
                <ChevronRight
                  size={16}
                  style={{ color: "#333", transition: "color 0.2s" }}
                  className="group-hover:text-[#888]"
                />
              </div>
              <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>
                {guide.title}
              </h3>
              <p style={{ color: "#666", fontSize: "12px", lineHeight: 1.6 }}>{guide.desc}</p>
              <p style={{ color: "#444", fontSize: "10px", marginTop: "12px" }}>
                Cập nhật: {guide.updated}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
