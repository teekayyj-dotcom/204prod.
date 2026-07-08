import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    Coins,
    Tag,
    User,
    Clock,
    Loader2,
    MessageSquare,
    Activity,
    ExternalLink,
    AlertCircle,
    Play,
    Video,
    Check,
    X,
    FileText,
    Download
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040", border: "rgba(216,64,64,0.3)" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6", border: "rgba(107,143,214,0.3)" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)" },
};

interface ClientData {
    name: string;
    contact?: string;
    email?: string;
}

interface ProjectData {
    title: string;
    slug: string;
    client: string;
    client_slug?: string;
    year: number;
    format: string;
    format_slug?: string;
    featured: boolean;
    cover_image?: string;
    video_url?: string;
    status: string;
    progress: number;
    budget: string;
    summary?: string;
    credits?: string[];
    gallery?: Array<{ id: string; url: string }>;
}

interface DemoDeliverable {
    id: string;
    title: string;
    type: "video" | "storyboard" | "concept" | "document";
    url: string;
    coverUrl: string;
    status: "Draft" | "Pending Review" | "Approved" | "Rejected";
}

interface ProjectDocument {
    id: string;
    name: string;
    type: string;
    url: string;
}

export function ClientProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"activity" | "comments">("comments");
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    // Dynamic state for deliverables
    const [deliverables, setDeliverables] = useState<DemoDeliverable[]>([]);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);

    const [activities, setActivities] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchApi<ProjectData>(`/projects/${id}`)
            .then(async (data) => {
                setProject(data);
                
                // Initialize dynamic client deliverables
                const filesList: DemoDeliverable[] = [];
                const docsList: ProjectDocument[] = [];
                if (data.gallery && Array.isArray(data.gallery)) {
                    const docFolders = ["tài liệu", "creative brief", "tài liệu hợp đồng", "báo giá", "hoá đơn"];
                    const folderToTypeMap: Record<string, string> = {
                        "creative brief": "Creative Brief",
                        "tài liệu hợp đồng": "Hợp đồng kinh tế",
                        "báo giá": "Báo giá chi tiết",
                        "hoá đơn": "Hoá đơn",
                        "tài liệu": "Tài liệu chung"
                    };
                    data.gallery.forEach((g: any) => {
                        if (g.published) {
                            const f = (g.folder || "").toLowerCase();
                            if (docFolders.includes(f)) {
                                docsList.push({
                                    id: g.id,
                                    name: g.name || "Tài liệu",
                                    type: folderToTypeMap[f] || "Tài liệu đính kèm",
                                    url: g.url
                                });
                            } else if (f === "demo") {
                                filesList.push({
                                    id: g.id,
                                    title: g.name || "Tài liệu bàn giao",
                                    type: g.type === "video" ? "video" : g.type === "document" ? "document" : g.type === "image" ? "concept" : "storyboard",
                                    url: g.url,
                                    coverUrl: g.type === "image" ? g.url : (g.type === "video" && g.bunny_video_id ? `https://vz-f1a07f87-b02.b-cdn.net/${g.bunny_video_id}/thumbnail.jpg` : (g.thumbnail_url && !g.thumbnail_url.includes("iframe") ? g.thumbnail_url : "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80")),
                                    status: "Pending Review"
                                });
                            }
                        }
                    });
                }
                setDocuments(docsList);
                
                // Fallback to video_url if no gallery items are uploaded yet
                if (filesList.length === 0 && data.video_url) {
                    filesList.push({
                        id: "deliv-video-main",
                        title: `${data.title} - Video`,
                        type: "video",
                        url: data.video_url,
                        coverUrl: data.cover_image || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80",
                        status: "Pending Review"
                    });
                }
                setDeliverables(filesList.reverse());

                if (data.client_slug) {
                    fetchApi<ClientData>(`/projects/clients/${data.client_slug}`)
                        .then((cData) => setClientData(cData))
                        .catch((err) => console.error("Error fetching client details:", err));
                }

                try {
                    const fbData = await fetchApi<any[]>(`/projects/${data.slug || id}/feedback`);
                    const allComments: any[] = [];
                    (fbData || []).forEach((f: any) => {
                        allComments.push({
                            id: `fb-${f.id}`,
                            user: "Khách hàng",
                            text: f.content,
                            time: f.created_at ? new Date(f.created_at).toLocaleDateString("vi-VN") : "Gần đây",
                            avatar: "KH"
                        });
                        if (f.reply_content) {
                            allComments.push({
                                id: `reply-${f.id}`,
                                user: f.reply_author || "Admin",
                                text: f.reply_content,
                                time: "Phản hồi",
                                avatar: (f.reply_author || "A").substring(0, 2).toUpperCase()
                            });
                        }
                    });
                    setComments(allComments);
                } catch (err) {
                    console.error("Error fetching feedback:", err);
                }

                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching project:", err);
                setLoading(false);
            });
    }, [id]);

    const handleUpdateStatus = (id: string, nextStatus: "Approved" | "Rejected") => {
        setDeliverables(prev => prev.map(d => d.id === id ? { ...d, status: nextStatus } : d));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="px-8 py-7" style={{ color: "#EEEEEE" }}>
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/client/projects")}
                        className="w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md"
                        style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", color: "#888" }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertCircle size={48} color="#3A2A2A" className="mb-4" />
                    <p style={{ fontSize: "18px", fontWeight: 600 }}>Không tìm thấy dự án</p>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-1 mb-4">
                        Dự án này không tồn tại hoặc đã bị gỡ bỏ.
                    </p>
                    <button
                        onClick={() => navigate("/client/projects")}
                        className="px-4 py-2 rounded-lg"
                        style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}
                    >
                        Quay lại danh sách dự án
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = statusColors[project.status] || statusColors["Planning"];
    const parsedCrew = (project.credits || []).map((credStr, idx) => {
        const parts = credStr.split(":");
        const role = parts[0]?.trim() || "Thành viên";
        const name = parts[1]?.trim() || "";
        return { id: `cred-${idx}`, name, role };
    });

    const accountLead = parsedCrew.find(c => c.role.toLowerCase().includes("account") || c.role.toLowerCase().includes("am")) || parsedCrew[0] || null;

    // Determine milestones states dynamically based on project progress
    const milestones = [
        { label: "Kịch bản", desc: "Duyệt kịch bản phân cảnh", isDone: project.progress >= 30, isActive: project.progress < 30 },
        { label: "Tiền kỳ / Đi quay", desc: "Setup bối cảnh & ghi hình", isDone: project.progress >= 60, isActive: project.progress >= 30 && project.progress < 60 },
        { label: "Hậu kỳ", desc: "Dựng hình, Kỹ xảo, Âm thanh", isDone: project.progress >= 90, isActive: project.progress >= 60 && project.progress < 90 },
        { label: "Bàn giao", desc: "Xuất file thành phẩm & chốt nghiệm thu", isDone: project.progress === 100, isActive: project.progress >= 90 && project.progress < 100 }
    ];

    return (
        <div className="px-8 py-7 w-full text-[#EEEEEE] space-y-6">
            {/* Page Header / Breadcrumbs */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/client/projects")}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 backdrop-blur-md"
                        style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", color: "#888" }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: "#666", fontSize: "13px" }}>Dự án</span>
                            <span style={{ color: "#444" }}>/</span>
                            <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{project.title}</span>
                        </div>
                        <h1 style={{ fontSize: "22px", fontWeight: 700 }} className="mt-0.5 font-bold">
                            {project.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side (2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Brief & Status Card */}
                    <div className="rounded-xl overflow-hidden border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                        <div className="relative h-48 md:h-56">
                            {project.cover_image ? (
                                <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black/30">
                                    <Video size={48} className="text-white/20" />
                                </div>
                            )}
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(36, 28, 28, 0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)" }} />
                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                                <div>
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur"
                                        style={{ background: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}` }}
                                    >
                                        {project.status}
                                    </span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-[#1D1616]/80 text-gray-400">
                                    {project.format}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Mục tiêu & Yêu cầu Brief</h3>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {project.summary || "Sản xuất chiến dịch truyền thông quảng bá thương hiệu, thể hiện tinh thần nghệ thuật và giá trị cốt lõi của doanh nghiệp."}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-1.5 text-xs">
                                    <span style={{ color: "#888" }}>Tiến độ tổng thể</span>
                                    <span style={{ color: "#D84040", fontWeight: 700 }}>{project.progress}%</span>
                                </div>
                                <div className="rounded-full" style={{ height: "6px", background: "#2A1F1F" }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${project.progress}%`,
                                            background: project.progress === 100
                                                ? "#6B8FD6"
                                                : "linear-gradient(to right, #8E1616, #D84040)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Milestones / Timeline Road-map */}
                    <div className="rounded-xl p-5 space-y-4 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                        <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Lộ trình & Cột mốc (Milestones)</h3>
                        
                        <div className="relative pt-4 pb-2">
                            {/* Horizontal Line background */}
                            <div className="absolute top-8 left-[12%] right-[12%] h-[2px] bg-[#2A1F1F]" />
                            {/* Horizontal Line active progress */}
                            <div 
                                className="absolute top-8 left-[12%] h-[2px] bg-[#D84040] transition-all duration-500"
                                style={{ 
                                    width: project.progress === 100 ? "76%" 
                                        : project.progress >= 90 ? "57%" 
                                        : project.progress >= 60 ? "38%" 
                                        : project.progress >= 30 ? "19%" : "0%" 
                                }}
                            />

                            <div className="grid grid-cols-4 relative text-center">
                                {milestones.map((m, idx) => {
                                    const dotColor = m.isDone ? "#D84040" : m.isActive ? "#FFC107" : "#2A1F1F";
                                    const labelColor = m.isDone ? "#EEEEEE" : m.isActive ? "#FFC107" : "#555";
                                    return (
                                        <div key={m.label} className="flex flex-col items-center gap-2">
                                            {/* Dot indicator */}
                                            <div 
                                                className="w-5 h-5 rounded-full z-10 flex items-center justify-center border-2"
                                                style={{ 
                                                    background: m.isDone ? "#D84040" : "#1D1616", 
                                                    borderColor: dotColor,
                                                    boxShadow: m.isActive ? "0 0 8px #FFC10755" : "none"
                                                }}
                                            >
                                                {m.isDone && <Check size={10} color="#fff" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold transition-all" style={{ color: labelColor }}>{m.label}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 hidden md:block max-w-[120px] mx-auto leading-normal">{m.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 3. Media & Demos Section (Netflix style Grid) */}
                    <div className="rounded-xl p-5 space-y-4 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Khu vực Media & Demos</h3>
                            <button
                                onClick={() => {
                                    const firstVideo = deliverables.find(d => d.type === "video");
                                    const path = firstVideo 
                                        ? `/client/projects/${project.slug}/playback?video=${encodeURIComponent(firstVideo.url)}`
                                        : `/client/projects/${project.slug}/playback`;
                                    navigate(path);
                                }}
                                className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold bg-[#D84040] hover:bg-[#c03030] text-white transition-all shadow-md shadow-[#D84040]/10 self-start sm:self-auto"
                            >
                                <Play size={12} fill="white" />
                                Mở phòng chiếu phản hồi (Cinema Review)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {deliverables.map((demo) => {
                                const statusColor = 
                                    demo.status === "Approved" ? "#4CAF50" : 
                                    demo.status === "Pending Review" ? "#FFC107" : 
                                    demo.status === "Rejected" ? "#F44336" : "#888";



                                return (
                                    <div 
                                        key={demo.id} 
                                        className="rounded-lg overflow-hidden border border-[#2E2020]/60 bg-[#1D1616]/30 backdrop-blur-md group transition-all"
                                        style={{ height: "fit-content" }}
                                    >
                                        <div className="relative aspect-video bg-black/40 overflow-hidden">
                                            <div 
                                                className="w-full h-full cursor-pointer relative"
                                                onClick={() => {
                                                    if (demo.type === "video") {
                                                        navigate(`/client/projects/${project.slug}/playback?video=${encodeURIComponent(demo.url)}`);
                                                    } else {
                                                        window.open(demo.url, "_blank");
                                                    }
                                                }}
                                            >
                                                {demo.type === "document" && demo.url.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe src={`${demo.url}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full object-cover opacity-80 pointer-events-none" title={demo.title} />
                                                ) : (
                                                    <img src={demo.coverUrl} alt={demo.title} className="w-full h-full object-cover opacity-80" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                                
                                                {demo.type === "video" && (
                                                    <div 
                                                        className="absolute inset-0 m-auto w-10 h-10 rounded-full flex items-center justify-center bg-[#D84040] text-white hover:bg-[#c03030] transition-transform transform scale-90 group-hover:scale-100 shadow-md"
                                                    >
                                                        <Play size={15} fill="white" className="ml-0.5" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute top-2 left-2 z-10">
                                                <span 
                                                    className="px-2 py-0.5 rounded text-[9px] font-bold backdrop-blur"
                                                    style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
                                                >
                                                    {demo.status === "Approved" ? "Đã chốt" : demo.status === "Pending Review" ? "Chờ duyệt" : demo.status === "Rejected" ? "Yêu cầu sửa" : "Bản nháp"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 space-y-3">
                                            <h4 className="text-xs font-semibold leading-tight line-clamp-1">{demo.title}</h4>
                                            
                                            {demo.status === "Pending Review" && (
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleUpdateStatus(demo.id, "Rejected")}
                                                        className="flex-1 py-1.5 rounded bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-600/20 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <X size={10} /> Yêu cầu sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(demo.id, "Approved")}
                                                        className="flex-1 py-1.5 rounded bg-green-600/10 border border-green-500/20 text-green-500 text-[10px] font-bold hover:bg-green-600/20 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <Check size={10} /> Đồng ý duyệt
                                                    </button>
                                                </div>
                                            )}

                                            {demo.status === "Approved" && (
                                                <div className="py-1 rounded bg-[#4CAF50]/5 border border-[#4CAF50]/15 flex items-center justify-center gap-1 text-[#4CAF50] text-[10px] font-semibold">
                                                    <Check size={10} /> Đã phê duyệt bản này
                                                </div>
                                            )}

                                            {demo.status === "Rejected" && (
                                                <div className="py-1 rounded bg-[#F44336]/5 border border-[#F44336]/15 flex items-center justify-center gap-1 text-[#F44336] text-[10px] font-semibold">
                                                    <X size={10} /> Đã gửi phản hồi yêu cầu sửa
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Tài liệu đính kèm (Documents) */}
                    <div className="rounded-xl p-5 space-y-3 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                        <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">Tài liệu dự án (Documents)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="p-3 rounded-lg bg-[#1D1616]/30 border border-[#2E2020]/45 flex items-center justify-between text-xs backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{doc.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{doc.type}</p>
                                    </div>
                                    <button 
                                        onClick={() => window.open(doc.url, "_blank")}
                                        className="p-1 rounded bg-[#2A1F1F] hover:bg-[#3A2A2A] text-white/80 transition-colors"
                                        title="Tải xuống / Xem"
                                    >
                                        <Download size={12} />
                                    </button>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="col-span-full py-4 text-center text-gray-500 text-xs italic">
                                    Chưa có tài liệu đính kèm cho dự án này.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side (1 column) */}
                <div className="space-y-5">
                    
                    {/* Quick Stats */}
                    <div className="rounded-xl p-4 space-y-3 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Thông tin thanh toán</p>
                        {[
                            { icon: Coins, label: "Ngân sách", value: project.budget, color: "#D84040" },
                            { icon: Calendar, label: "Hạn cuối", value: `${project.year}-12-31`, color: "#EEEEEE" },
                            { icon: Activity, label: "Tiến độ", value: `${project.progress}%`, color: project.progress === 100 ? "#4CAF50" : "#D84040" },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-[#2A1F1F]">
                                <div className="flex items-center gap-2">
                                    <Icon size={13} color="#8E1616" />
                                    <span style={{ color: "#888", fontSize: "12px" }}>{label}</span>
                                </div>
                                <span style={{ color, fontSize: "13px", fontWeight: 600 }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Feedback & Comments Tabbed area */}
                    <div className="rounded-xl overflow-hidden border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                        <div className="flex border-b border-[#2A1F1F]">
                            {(["activity", "comments"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 transition-all text-xs font-semibold uppercase tracking-wider"
                                    style={{
                                        color: activeTab === tab ? "#EEEEEE" : "#666",
                                        borderBottom: `2px solid ${activeTab === tab ? "#D84040" : "transparent"}`,
                                        background: "transparent",
                                    }}
                                >
                                    {tab === "activity" ? "Hoạt động" : "Trao đổi"}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 space-y-4">
                            {activeTab === "activity" && (
                                <div className="space-y-3.5">
                                    {activities.map((item) => (
                                        <div key={item.id} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#8E1616] text-[#EEEEEE] text-[10px] font-bold">
                                                {item.avatar}
                                            </div>
                                            <div className="min-w-0">
                                                <p style={{ fontSize: "12px", color: "#EEEEEE" }}>
                                                    <span className="font-semibold">{item.user}</span>{" "}
                                                    <span style={{ color: "#888" }}>{item.action}</span>
                                                </p>
                                                <span style={{ color: "#555", fontSize: "10px" }} className="block mt-0.5">{item.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "comments" && (
                                <div className="space-y-4">
                                    <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                                        {comments.map((c) => (
                                            <div key={c.id} className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#8E1616] text-[#EEEEEE] text-[10px] font-bold">
                                                    {c.avatar}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1 text-[11px]">
                                                        <span style={{ fontWeight: 600 }}>{c.user}</span>
                                                        <span style={{ color: "#555" }}>{c.time}</span>
                                                    </div>
                                                    <p className="px-3 py-2 rounded-lg bg-[#1D1616]/40 text-gray-300 text-xs border border-[#2E2020]/45 leading-relaxed backdrop-blur-sm">
                                                        {c.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-[#2A1F1F]">
                                        <input
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                                    const newComment = {
                                                        id: Date.now(),
                                                        user: "Đối tác (Bạn)",
                                                        text: e.currentTarget.value.trim(),
                                                        time: "Vừa xong",
                                                        avatar: "KH"
                                                    };
                                                    setComments((prev) => [...prev, newComment]);
                                                    e.currentTarget.value = "";
                                                }
                                            }}
                                            placeholder="Gửi phản hồi..."
                                            className="flex-1 px-3 py-2 rounded-lg outline-none bg-[#141010]/40 border border-[#2E2020]/60 text-xs transition-colors focus:border-[#D84040] focus:bg-[#141010]/60 placeholder:text-gray-600 backdrop-blur-md"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Crew Credits */}
                    {parsedCrew.length > 0 && (
                        <div className="rounded-xl p-4 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600 }} className="mb-3">Nhân sự thực hiện</p>
                            <div className="space-y-3">
                                {parsedCrew.map((c) => {
                                    const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                    return (
                                        <div key={c.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#8E1616] text-[#EEEEEE] text-[9px] font-bold">
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p style={{ fontSize: "12px", fontWeight: 500 }} className="truncate text-gray-200">{c.name}</p>
                                                <p style={{ color: "#D84040", fontSize: "11px" }} className="truncate">{c.role}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Account Manager contact card */}
                    {clientData && (
                        <div className="rounded-xl p-4 border border-[#2E2020]/60 backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600 }} className="mb-3">Account Lead</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#8E1616] text-[#EEEEEE] text-xs font-bold border border-[#2A1F1F]">
                                    {accountLead ? accountLead.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "AL"}
                                </div>
                                <div>
                                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{accountLead ? accountLead.name : "Chưa có thông tin"}</p>
                                    <p style={{ color: "#888", fontSize: "11px" }}>{accountLead ? accountLead.role : "Account Manager"}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
