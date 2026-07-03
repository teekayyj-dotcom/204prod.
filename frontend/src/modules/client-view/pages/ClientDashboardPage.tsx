// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    CheckCircle2,
    Clock,
    AlertCircle,
    Play,
    CreditCard,
    ArrowRight,
    Loader2
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

interface StatItem {
    label: string;
    value: string;
    sub: string;
    icon: any;
    color: string;
    bg: string;
}

interface ActionItem {
    id: string;
    title: string;
    desc: string;
    type: "review" | "billing";
    link: string;
    actionLabel: string;
    icon: any;
}

export function ClientDashboardPage() {
    const navigate = useNavigate();
    const [projectCount, setProjectCount] = useState(0);
    const [pendingDemosCount, setPendingDemosCount] = useState(0);
    const [unpaidAmount, setUnpaidAmount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const clientSlug = localStorage.getItem("client_slug") || localStorage.getItem("slug") || null;

    useEffect(() => {
        // Query projects and finance stats in parallel
        const promises = [
            fetchApi<any[]>('/projects'),
            clientSlug 
                ? fetchApi<{ pending: number }>(`/finance/client-summary?client_slug=${encodeURIComponent(clientSlug)}`)
                : fetchApi<{ pending: number }>('/finance/client-summary?client_slug=')
        ];

        Promise.all(promises)
            .then(([projects, billingSummary]) => {
                // Filter projects belonging to this client if clientSlug is set, or just use all
                const clientProjects = clientSlug 
                    ? projects.filter(p => p.client_slug === clientSlug)
                    : projects;

                setProjectCount(clientProjects.length);

                // Compute pending demos count matching ClientDemosPage logic
                let demosCount = 0;
                clientProjects.forEach((proj, idx) => {
                    if (proj.video_url && proj.status === "Review") {
                        demosCount++;
                    }
                    // Storyboard concept simulator (matching ClientDemosPage: idx % 3 === 1 is Pending Review)
                    if (idx % 3 === 1) {
                        demosCount++;
                    }
                });
                
                // Fallback matching ClientDemosPage if empty
                if (clientProjects.length === 0) {
                    demosCount = 1; // 1 pending review mock demo
                }

                setPendingDemosCount(demosCount);

                if (billingSummary) {
                    setUnpaidAmount(billingSummary.pending || 0);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading dashboard data:", err);
                setLoading(false);
            });
    }, [clientSlug]);

    const formatCurrency = (val: number) => {
        return val.toLocaleString("vi-VN") + " đ";
    };

    const stats: StatItem[] = [
        { label: "Dự án đang chạy", value: String(projectCount), sub: "Tất cả các dự án sản xuất & hậu kỳ", icon: Briefcase, color: "#60a5fa", bg: "rgba(96,165,250,0.05)" },
        { label: "Demo chờ duyệt", value: String(pendingDemosCount), sub: "Yêu cầu phản hồi từ phía đối tác", icon: Play, color: "#fbbf24", bg: "rgba(251,191,36,0.05)" },
        { label: "Dư nợ chưa thanh toán", value: formatCurrency(unpaidAmount), sub: "Hóa đơn đợt 2 & chi phí phát sinh", icon: CreditCard, color: "#f87171", bg: "rgba(248,113,113,0.05)" },
    ];

    const actions: ActionItem[] = [
        {
            id: "act-1",
            title: "Xem & Duyệt Bản dựng Video TVC",
            desc: "Các video demo hoặc storyboard của dự án đang chờ bạn cho ý kiến phản hồi hoặc phê duyệt thiết kế.",
            type: "review",
            link: "/client/demos",
            actionLabel: "Xem Video & Phản hồi",
            icon: Play
        },
        {
            id: "act-2",
            title: "Thanh toán hóa đơn đến hạn",
            desc: "Danh sách hóa đơn tạm ứng hoặc thanh toán đợt tiếp theo đang chờ xử lý.",
            type: "billing",
            link: "/client/billing",
            actionLabel: "Đến trang Thanh toán",
            icon: CreditCard
        }
    ];

    const activities = [
        { id: 1, user: "Sarah Kim (AM)", project: "Viva Musica — TVC Q2", action: "đã cập nhật trạng thái video demo lên Chờ duyệt", time: "2 giờ trước" },
        { id: 2, user: "Jake Torres (Editor)", project: "Viva Musica — Rebranding", action: "đã đăng tải Storyboard & Logo Concept 2", time: "5 giờ trước" },
        { id: 3, user: "Alex (Director)", project: "Viva Musica — TVC Q2", action: "đã phản hồi bình luận kịch bản phân cảnh", time: "1 ngày trước" },
        { id: 4, user: "Hệ thống", project: "Viva Musica — Social Retainer Q2", action: "dự án đã được thiết lập thành công", time: "3 ngày trước" },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
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
                    <LayoutDashboard size={22} style={{ color: "#D84040" }} />
                </div>
                <div>
                    <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CLIENT PORTAL</p>
                    <h1 style={{ color: "#EEEEEE", fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Chào mừng trở lại!</h1>
                </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl p-5 flex flex-col gap-3 border border-[#2A1F1F]"
                        style={{ background: stat.bg }}
                    >
                        <div className="flex items-center justify-between">
                            <span style={{ color: "#888", fontSize: "12px", fontWeight: 500 }}>{stat.label}</span>
                            <stat.icon size={14} style={{ color: stat.color }} />
                        </div>
                        <p style={{ color: stat.color, fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{stat.value}</p>
                        <p style={{ color: "#666", fontSize: "11px" }}>{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid: Actions (Left 2 cols) vs Updates (Right 1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Actions Section */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-[#D84040]" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Yêu cầu hành động gấp (Action Required)</h2>
                    </div>

                    <div className="space-y-4">
                        {actions.map((act) => (
                            <div
                                key={act.id}
                                className="rounded-xl p-5 border border-[#2E2020]/60 bg-[#1D1616]/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:border-[#D84040]/70 hover:bg-[#1D1616]/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]"
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: "rgba(216,64,64,0.12)", border: "1px solid rgba(216,64,64,0.2)" }}
                                    >
                                        <act.icon size={16} className="text-[#D84040]" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-200">{act.title}</h3>
                                        <p className="text-xs text-gray-400 leading-relaxed max-w-lg">{act.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(act.link)}
                                    className="px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold bg-[#D84040] hover:bg-[#c03030] text-white transition-all self-end md:self-auto flex-shrink-0 shadow-lg shadow-[#D84040]/10"
                                >
                                    <span>{act.actionLabel}</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Updates Section */}
                <div className="lg:col-span-1 space-y-5">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#D84040]" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">Hoạt động mới nhất</h2>
                    </div>

                    <div className="rounded-xl p-5 border border-[#2E2020]/60 bg-[#1D1616]/30 backdrop-blur-md space-y-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                        <div className="relative border-l border-[#2E2020]/60 pl-4 space-y-6">
                            {activities.map((item) => (
                                <div key={item.id} className="relative">
                                    {/* Timeline point */}
                                    <span
                                        className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#D84040] border-2 border-[#1E1212]"
                                        style={{ boxShadow: "0 0 0 4px rgba(216,64,64,0.1)" }}
                                    />
                                    
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 leading-normal">
                                            <span className="font-semibold text-gray-200">{item.user}</span>{" "}
                                            {item.action}{" "}
                                            <span className="font-medium text-[#D84040]">@{item.project}</span>
                                        </p>
                                        <span className="block text-[10px] text-gray-500">{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
