import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MonitorPlay, Check, X, Play, ShieldAlert, Loader2, ExternalLink } from "lucide-react";
import { fetchApi } from "../utils/apiClient";

interface DemoItem {
    id: string;
    projectTitle: string;
    projectSlug: string;
    title: string;
    type: "video" | "image";
    url: string;
    coverUrl: string;
    status: "Draft" | "Pending Review" | "Approved" | "Rejected";
    uploadedAt: string;
}

export function ClientDemosPage() {
    const navigate = useNavigate();
    const [demos, setDemos] = useState<DemoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"All" | "Pending Review" | "Approved" | "Rejected">("All");
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    useEffect(() => {
        // Fetch projects to dynamically construct some demo deliverables
        fetchApi<any[]>('/projects')
            .then((projects) => {
                // Map projects and backfill with mock review files to show a rich Netflix-like gallery
                const constructedDemos: DemoItem[] = [];

                projects.forEach((proj) => {
                    let hasDemo = false;
                    if (proj.gallery && Array.isArray(proj.gallery)) {
                        proj.gallery.forEach((g: any) => {
                            const f = (g.folder || "").toLowerCase();
                            if (f === "demo" && g.published) {
                                hasDemo = true;
                                constructedDemos.push({
                                    id: g.id,
                                    projectTitle: proj.title || "Project",
                                    projectSlug: proj.slug,
                                    title: g.name || "Bản dựng nháp (Demo)",
                                    type: g.type === "video" ? "video" : g.type === "document" ? "document" : g.type === "image" ? "image" : "storyboard",
                                    url: g.url,
                                    coverUrl: g.type === "image" ? g.url : (g.type === "video" && g.bunny_video_id ? `https://vz-f1a07f87-b02.b-cdn.net/${g.bunny_video_id}/thumbnail.jpg` : (g.thumbnail_url && !g.thumbnail_url.includes("iframe") ? g.thumbnail_url : "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80")),
                                    status: "Pending Review",
                                    uploadedAt: g.uploaded || "Gần đây"
                                });
                            }
                        });
                    }

                    if (!hasDemo && proj.video_url) {
                        constructedDemos.push({
                            id: `demo-vid-${proj.slug}`,
                            projectTitle: proj.title || "Project",
                            projectSlug: proj.slug,
                            title: "Bản dựng nháp (Demo)",
                            type: "video",
                            url: proj.video_url,
                            coverUrl: proj.video_url.includes('vz-f1a07f87-b02.b-cdn.net') ? `https://vz-f1a07f87-b02.b-cdn.net/${proj.video_url.split('/')[3]}/thumbnail.jpg` : proj.cover_image || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80",
                            status: proj.status === "Review" ? "Pending Review" : proj.status === "Completed" ? "Approved" : "Draft",
                            uploadedAt: "Gần đây"
                        });
                    }
                });

                setDemos(constructedDemos);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error constructing demos:", err);
                setLoading(false);
            });
    }, []);

    const handleApprove = (id: string) => {
        setDemos(prev => prev.map(d => d.id === id ? { ...d, status: "Approved" } : d));
    };

    const handleReject = (id: string) => {
        setDemos(prev => prev.map(d => d.id === id ? { ...d, status: "Rejected" } : d));
    };

    const filtered = demos.filter(d => filter === "All" || d.status === filter);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8" style={{ color: "#EEEEEE" }}>
            {/* Header */}
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D8404022", border: "1px solid #D8404044" }}
                >
                    <MonitorPlay size={22} style={{ color: "#D84040" }} />
                </div>
                <div>
                    <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CLIENT PORTAL</p>
                    <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Kho Demo / Xét duyệt</h1>
                </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2 flex-wrap">
                {(["All", "Pending Review", "Approved", "Rejected"] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold transition-all border"
                        style={{
                            background: filter === type ? "#D84040" : "#241C1C",
                            color: filter === type ? "#fff" : "#888",
                            borderColor: filter === type ? "#D84040" : "#2E2020",
                        }}
                    >
                        {type === "All" ? "Tất cả" : type === "Pending Review" ? "Chờ duyệt" : type === "Approved" ? "Đã chốt" : "Yêu cầu sửa"}
                    </button>
                ))}
            </div>

            {/* Netflix style Cinematic Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((demo) => {
                    const statusColor =
                        demo.status === "Approved" ? "#4CAF50" :
                        demo.status === "Pending Review" ? "#FFC107" :
                        demo.status === "Rejected" ? "#F44336" : "#888";

                    return (
                        <div
                            key={demo.id}
                            className="rounded-xl overflow-hidden group relative flex flex-col border transition-all duration-300 backdrop-blur-md"
                            style={{
                                background: "rgba(29, 22, 22, 0.4)",
                                borderColor: "rgba(46, 32, 32, 0.6)"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(46, 32, 32, 0.6)")}
                        >
                            {/* Media thumbnail */}
                            <div className="relative aspect-video bg-black/40 overflow-hidden">
                                <img
                                    src={demo.coverUrl}
                                            alt={demo.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        
                                        {/* Play icon overlay for videos */}
                                        {demo.type === "video" && (
                                            <button
                                                onClick={() => {
                                                    navigate(`/client/projects/${demo.projectSlug}/playback`);
                                                }}
                                                className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center bg-[#D84040] text-white transition-all transform scale-90 group-hover:scale-100 hover:bg-[#c03030] shadow-lg shadow-[#D84040]/30"
                                            >
                                                <Play size={18} fill="white" className="ml-0.5" />
                                            </button>
                                        )}


                                {/* Status badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span
                                        className="px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur"
                                        style={{
                                            background: `${statusColor}22`,
                                            color: statusColor,
                                            border: `1px solid ${statusColor}44`
                                        }}
                                    >
                                        {demo.status === "Approved" ? "Đã duyệt" : demo.status === "Pending Review" ? "Chờ duyệt" : demo.status === "Rejected" ? "Yêu cầu sửa" : "Nháp"}
                                    </span>
                                </div>
                            </div>

                            {/* Detail Content */}
                            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                <div>
                                    <p style={{ color: "#8E1616", fontSize: "10px", fontWeight: 600 }} className="uppercase tracking-widest">{demo.projectTitle}</p>
                                    <h3 className="font-semibold text-sm mt-1 line-clamp-1">{demo.title}</h3>
                                    <p className="text-[11px] mt-1" style={{ color: "#666" }}>{demo.uploadedAt}</p>
                                </div>

                                {/* Review Actions */}
                                {demo.status === "Pending Review" && (
                                    <div className="flex gap-2 pt-2 border-t border-[#2A1F1F]">
                                        <button
                                            onClick={() => handleReject(demo.id)}
                                            className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
                                            style={{
                                                background: "rgba(244,67,54,0.1)",
                                                color: "#F44336",
                                                border: "1px solid rgba(244,67,54,0.25)"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "rgba(244,67,54,0.2)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "rgba(244,67,54,0.1)";
                                            }}
                                        >
                                            <X size={12} />
                                            Yêu cầu sửa
                                        </button>
                                        <button
                                            onClick={() => handleApprove(demo.id)}
                                            className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
                                            style={{
                                                background: "rgba(76,175,80,0.1)",
                                                color: "#4CAF50",
                                                border: "1px solid rgba(76,175,80,0.25)"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "rgba(76,175,80,0.2)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "rgba(76,175,80,0.1)";
                                            }}
                                        >
                                            <Check size={12} />
                                            Đồng ý duyệt
                                        </button>
                                    </div>
                                )}

                                {demo.status === "Approved" && (
                                    <div className="py-1.5 rounded-lg bg-[#4CAF50]/5 border border-[#4CAF50]/20 flex items-center justify-center gap-1 text-[#4CAF50] text-[11px] font-semibold">
                                        <Check size={11} /> Đã chốt bản dựng này
                                    </div>
                                )}

                                {demo.status === "Rejected" && (
                                    <div className="py-1.5 rounded-lg bg-[#F44336]/5 border border-[#F44336]/20 flex items-center justify-center gap-1 text-[#F44336] text-[11px] font-semibold">
                                        <ShieldAlert size={11} /> Đã yêu cầu chỉnh sửa lại
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-[#1D1616]/30 backdrop-blur-md rounded-xl border border-[#2E2020]/60">
                    <MonitorPlay size={40} className="text-[#3A2A2A] mx-auto mb-3" />
                    <p style={{ color: "#666", fontSize: "14px" }}>Không có file demo nào trong danh mục này.</p>
                </div>
            )}
        </div>
    );
}
