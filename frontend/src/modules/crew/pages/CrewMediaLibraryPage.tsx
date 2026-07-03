import { useState, useEffect } from "react";
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
import { fetchApi } from "../../admin/utils/apiClient";

type Tab = "brand" | "stock" | "guidelines";

export function CrewMediaLibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("brand");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any[]>("/media")
      .then((data) => setMediaAssets(data))
      .catch(console.error);
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "brand", label: "Brand Assets", icon: Palette },
    { id: "stock", label: "Kho Stock & Templates", icon: Library },
    { id: "guidelines", label: "Quy trình", icon: BookOpen },
  ];

  // Map backend assets to frontend tabs based on folder
  const filterByFolder = (folder: string) => {
    return mediaAssets.filter(
      (m) => (m.folder || "").toLowerCase() === folder && m.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const brandItems = filterByFolder("brand");
  const stockItems = filterByFolder("stock");
  const guidelinesItems = filterByFolder("guidelines");

  const getExt = (url: string) => {
    if (!url) return "FILE";
    const parts = url.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) return (mb / 1024).toFixed(2) + " GB";
    if (mb >= 1) return mb.toFixed(1) + " MB";
    return Math.round(bytes / 1024) + " KB";
  };

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
          <div className="grid grid-cols-4 gap-3">
            {brandItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{ border: "1px solid #2A1F1F" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
              >
                <div
                  className="h-16 flex items-center justify-center bg-[#2A1F1F]"
                >
                  {item.thumbnail_url || item.url ? (
                    <img src={item.thumbnail_url || item.url} alt={item.caption} className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <Image size={20} style={{ color: "rgba(255,255,255,0.2)" }} />
                  )}
                </div>
                <div className="px-3 py-2.5" style={{ background: "#141010" }}>
                  <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500, lineHeight: 1.3 }} className="truncate">
                    {item.caption || "Untitled"}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded uppercase"
                      style={{ background: "#1D1616", color: "#666", fontSize: "9px", fontWeight: 700 }}
                    >
                      {getExt(item.url)}
                    </span>
                    <span style={{ color: "#444", fontSize: "9px" }}>{formatSize(item.file_size)}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      className="flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all"
                      style={{ background: "#1D1616", border: "1px solid #2A1F1F", color: "#888", fontSize: "10px" }}
                      onClick={() => window.open(item.url, "_blank")}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#EEEEEE")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
                    >
                      <Eye size={10} /> Xem
                    </button>
                    <button
                      className="flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all"
                      style={{ background: "#D84040", color: "#EEEEEE", fontSize: "10px" }}
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = item.url;
                        a.download = item.caption || "download";
                        a.click();
                      }}
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
          {brandItems.length === 0 && (
            <div className="py-10 text-center text-[#555] text-sm">Chưa có tài nguyên Brand.</div>
          )}
        </div>
      )}

      {/* Tab: Stock & Templates */}
      {activeTab === "stock" && (
        <div className="grid grid-cols-3 gap-4">
          {stockItems.map((asset) => (
            <div
              key={asset.id}
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ background: "#141010", border: "1px solid #2A1F1F" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(216, 64, 64, 0.1)", border: `1px solid rgba(216, 64, 64, 0.2)` }}
              >
                <Layers size={22} style={{ color: "#D84040" }} />
              </div>
              <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }} className="truncate">
                {asset.caption || "Untitled"}
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(216, 64, 64, 0.1)",
                    border: `1px solid rgba(216, 64, 64, 0.2)`,
                    color: "#D84040",
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {getExt(asset.url)}
                </span>
                <span style={{ color: "#555", fontSize: "10px" }}>{formatSize(asset.file_size)}</span>
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
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = asset.url;
                  a.download = asset.caption || "download";
                  a.click();
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(216, 64, 64, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(216, 64, 64, 0.2)";
                  e.currentTarget.style.color = "#D84040";
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
          {stockItems.length === 0 && (
            <div className="col-span-3 py-10 text-center text-[#555] text-sm">Chưa có tài nguyên Stock & Templates.</div>
          )}
        </div>
      )}

      {/* Tab: Guidelines */}
      {activeTab === "guidelines" && (
        <div className="grid grid-cols-2 gap-5">
          {guidelinesItems.map((guide) => (
            <div
              key={guide.id}
              className="rounded-2xl p-6 cursor-pointer transition-all duration-200 group"
              style={{ background: "#141010", border: "1px solid #2A1F1F" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8B5CF6")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A1F1F")}
              onClick={() => window.open(guide.url, "_blank")}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(139, 92, 246, 0.1)", border: `1px solid rgba(139, 92, 246, 0.2)` }}
                >
                  <FileText size={20} style={{ color: "#8B5CF6" }} />
                </div>
                <ChevronRight
                  size={16}
                  style={{ color: "#333", transition: "color 0.2s" }}
                  className="group-hover:text-[#888]"
                />
              </div>
              <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>
                {guide.caption || "Tài liệu"}
              </h3>
              <p style={{ color: "#444", fontSize: "10px", marginTop: "12px" }}>
                Cập nhật: {new Date(guide.created_at || Date.now()).toLocaleDateString("vi-VN")}
              </p>
            </div>
          ))}
          {guidelinesItems.length === 0 && (
            <div className="col-span-2 py-10 text-center text-[#555] text-sm">Chưa có tài liệu Guidelines.</div>
          )}
        </div>
      )}
    </div>
  );
}
