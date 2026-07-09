import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Briefcase,
    Search,
    Grid3X3,
    List,
    Calendar,
    Coins,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

const statusColors: Record<string, { bg: string; text: string }> = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
};

const statusLabels: Record<string, string> = {
    "All": "Tất cả",
    "Planning": "Lên kế hoạch",
    "In Progress": "Đang thực hiện",
    "Review": "Đang đánh giá",
    "Completed": "Hoàn thành"
};

interface Project {
    title: string;
    slug: string;
    client: string;
    format: string;
    status: string;
    year: number;
    budget: string;
    progress: number;
    cover_image?: string;
}

interface Category {
    slug: string;
    name: string;
}

export function ClientProjectsPage() {
    const navigate = useNavigate();
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [view, setView] = useState("grid");

    useEffect(() => {
        Promise.all([
            fetchApi<Project[]>('/projects/all'),
            fetchApi<Category[]>('/categories')
        ]).then(([projectsData, categoriesData]) => {
            setAllProjects(projectsData);
            setCategories(categoriesData);
            setLoading(false);
        }).catch(err => {
            console.error("Error loading project list data:", err);
            setLoading(false);
        });
    }, []);

    const statuses = ["All", "Planning", "In Progress", "Review", "Completed"];

    const filtered = allProjects.filter((p) => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.client.toLowerCase().includes(search.toLowerCase()) ||
            p.format.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || p.status === statusFilter;
        const matchCat = categoryFilter === "All" || p.format === categoryFilter;
        return matchSearch && matchStatus && matchCat;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (
        <div className="px-8 py-7" style={{ color: "#EEEEEE" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "#D8404022", border: "1px solid #D8404044" }}
                    >
                        <Briefcase size={22} style={{ color: "#D84040" }} />
                    </div>
                    <div>
                        <p style={{ color: "#8E1616", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em" }}>CLIENT</p>
                        <h1 style={{ fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}>Dự án của tôi</h1>
                    </div>
                </div>
                <p style={{ color: "#666", fontSize: "14px" }}>
                    {allProjects.length} tổng số · {allProjects.filter((p) => p.status === "In Progress").length} đang thực hiện
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {statuses.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className="px-3 py-1.5 rounded-lg transition-all text-xs"
                            style={{
                                background: statusFilter === s ? "#D84040" : "rgba(36, 28, 28, 0.4)",
                                color: statusFilter === s ? "#fff" : "#888",
                                border: `1px solid ${statusFilter === s ? "#D84040" : "rgba(46, 32, 32, 0.6)"}`,
                                fontWeight: statusFilter === s ? 600 : 400,
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)"
                            }}
                        >
                            {statusLabels[s] || s}
                        </button>
                    ))}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg outline-none appearance-none text-xs cursor-pointer backdrop-blur-md"
                        style={{ background: "rgba(36, 28, 28, 0.4)", color: "#888", border: "1px solid rgba(46, 32, 32, 0.6)" }}
                    >
                        <option value="All">Tất cả thể loại</option>
                        {categories.map((c) => (
                            <option key={c.slug} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                        <Search size={14} color="#666" />
                        <input
                            placeholder="Tìm kiếm dự án..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="outline-none bg-transparent text-xs"
                            style={{ color: "#EEEEEE", width: "160px" }}
                        />
                    </div>
                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-white/5 backdrop-blur-md">
                        {(["grid", "list"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className="w-9 h-9 flex items-center justify-center transition-colors"
                                style={{
                                    background: view === v ? "#D84040" : "rgba(36, 28, 28, 0.4)",
                                    color: view === v ? "#fff" : "#888"
                                }}
                            >
                                {v === "grid" ? <Grid3X3 size={15} /> : <List size={15} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid View */}
            {view === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((project) => (
                        <div
                            key={project.slug}
                            className="rounded-xl overflow-hidden group cursor-pointer relative transition-all duration-300 backdrop-blur-md"
                            style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}
                            onClick={() => navigate(`/client/projects/${project.slug}`)}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(46, 32, 32, 0.6)")}
                        >
                            <div className="relative h-44 overflow-hidden bg-black/40">
                                {project.cover_image ? (
                                    <img
                                        src={project.cover_image}
                                        alt={project.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Briefcase size={36} className="text-white/10" />
                                    </div>
                                )}
                                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(36, 28, 28, 0.7) 0%, transparent 60%)" }} />
                                {/* Status badge */}
                                <div className="absolute top-3 left-3">
                                    <span
                                        className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur"
                                        style={{
                                            background: statusColors[project.status]?.bg || "rgba(0,0,0,0.4)",
                                            color: statusColors[project.status]?.text || "#fff",
                                        }}
                                    >
                                        {statusLabels[project.status] || project.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{project.title}</h3>
                                    <p style={{ color: "#888", fontSize: "12px" }} className="mt-0.5">
                                        {project.client} · {project.format}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} color="#666" />
                                        <span style={{ color: "#666", fontSize: "11px" }}>{project.year}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Coins size={12} color="#D84040" />
                                        <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{project.budget}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1 text-[11px]">
                                        <span style={{ color: "#666" }}>Tiến độ</span>
                                        <span style={{ color: "#D84040", fontWeight: 600 }}>{project.progress}%</span>
                                    </div>
                                    <div className="rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${project.progress}%`,
                                                background: project.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {view === "list" && (
                <div className="rounded-xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
                                    {["Dự án", "Đối tác", "Thể loại", "Trạng thái", "Năm", "Ngân sách", "Tiến độ", ""].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left" style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <tr
                                        key={p.slug}
                                        className="cursor-pointer transition-colors"
                                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2A1F1F" : "none" }}
                                        onClick={() => navigate(`/client/projects/${p.slug}`)}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42, 31, 31, 0.5)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                {p.cover_image ? (
                                                    <img src={p.cover_image} alt={p.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 flex-shrink-0">
                                                        <Briefcase size={12} className="text-white/20" />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: "13px", fontWeight: 500 }}>{p.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#999", fontSize: "13px" }}>{p.client}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#888", fontSize: "12px" }}>{p.format}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{
                                                    background: statusColors[p.status]?.bg,
                                                    color: statusColors[p.status]?.text,
                                                }}
                                            >
                                                {statusLabels[p.status] || p.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#888", fontSize: "12px" }}>{p.year}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#D84040", fontSize: "13px", fontWeight: 600 }}>{p.budget}</span>
                                        </td>
                                        <td className="px-5 py-3.5" style={{ minWidth: "120px" }}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${p.progress}%`,
                                                            background: p.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)",
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ color: "#666", fontSize: "11px", flexShrink: 0 }}>{p.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button style={{ color: "#555" }} className="hover:text-white transition-colors">
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-16">
                    <Briefcase size={40} color="#3A2A2A" className="mx-auto mb-3" />
                    <p style={{ color: "#666", fontSize: "14px" }}>Không tìm thấy dự án nào</p>
                </div>
            )}
        </div>
    );
}
