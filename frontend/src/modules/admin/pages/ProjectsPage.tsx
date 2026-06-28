// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Grid3X3, List, Calendar, DollarSign, Star, Loader2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";
const statusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
};
export function ProjectsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [allProjects, setAllProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get("type") || "All");
    const [sortBy, setSortBy] = useState("default");
    const [view, setView] = useState("grid");
    const [featuredIds, setFeaturedIds] = useState(new Set());
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

    // Sync query parameter changes to categoryFilter state
    useEffect(() => {
        const typeParam = searchParams.get("type");
        setCategoryFilter(typeParam || "All");
    }, [searchParams]);

    useEffect(() => {
        Promise.all([
            fetchApi('/projects'),
            fetchApi('/categories')
        ]).then(([projectsData, categoriesData]) => {
            setAllProjects(projectsData);
            setCategories(categoriesData);
            setFeaturedIds(new Set(projectsData.filter((p) => p.featured).map((p) => p.slug)));
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);
    const statuses = ["All", "In Progress", "Review", "Planning", "Completed"];
    const toggleFeatured = async (e, slug) => {
        e.stopPropagation();
        const isFeatured = featuredIds.has(slug);
        const nextFeatured = !isFeatured;

        // Optimistically update UI
        setFeaturedIds((prev) => {
            const next = new Set(prev);
            next.has(slug) ? next.delete(slug) : next.add(slug);
            return next;
        });

        try {
            await fetchApi(`/projects/${slug}`, {
                method: "PUT",
                body: JSON.stringify({ featured: nextFeatured }),
            });
        } catch (err) {
            console.error("Failed to toggle project featured state:", err);
            // Revert state on error
            setFeaturedIds((prev) => {
                const next = new Set(prev);
                isFeatured ? next.add(slug) : next.delete(slug);
                return next;
            });
        }
    };
    const filtered = allProjects.filter((p) => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.client.toLowerCase().includes(search.toLowerCase()) ||
            p.format.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || p.status === statusFilter;
        const matchCat = categoryFilter === "All" || p.format === categoryFilter;
        const matchFeatured = !showFeaturedOnly || featuredIds.has(p.slug);
        return matchSearch && matchStatus && matchCat && matchFeatured;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "name") {
            return a.title.localeCompare(b.title);
        }
        if (sortBy === "budget") {
            const valA = parseFloat(a.budget.replace(/[$,]/g, "")) || 0;
            const valB = parseFloat(b.budget.replace(/[$,]/g, "")) || 0;
            return valB - valA;
        }
        if (sortBy === "progress") {
            return b.progress - a.progress;
        }
        if (sortBy === "format") {
            return a.format.localeCompare(b.format);
        }
        return 0;
    });
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (<div className="px-8 py-7">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>Projects</h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        {allProjects.length} total · {allProjects.filter((p) => p.status === "In Progress").length} in progress · {featuredIds.size} highlighted
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Featured filter toggle */}
                    <button onClick={() => setShowFeaturedOnly((v) => !v)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all" style={{
            background: showFeaturedOnly ? "rgba(255,193,7,0.12)" : "#241C1C",
            color: showFeaturedOnly ? "#FFC107" : "#888",
            border: `1px solid ${showFeaturedOnly ? "rgba(255,193,7,0.4)" : "#2E2020"}`,
            fontSize: "13px",
            fontWeight: showFeaturedOnly ? 600 : 400,
        }}>
                        <Star size={14} fill={showFeaturedOnly ? "#FFC107" : "none"}/>
                        Featured
                    </button>
                    <button onClick={() => navigate("/admin/projects/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                        <Plus size={16}/>
                        New Project
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {statuses.map((s) => (<button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-lg transition-all" style={{
                background: statusFilter === s ? "#D84040" : "#241C1C",
                color: statusFilter === s ? "#fff" : "#888",
                border: `1px solid ${statusFilter === s ? "#D84040" : "#2E2020"}`,
                fontSize: "12px",
                fontWeight: statusFilter === s ? 600 : 400,
            }}>
                            {s}
                        </button>))}
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 rounded-lg outline-none appearance-none cursor-pointer" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888", border: "1px solid #2E2020", fontSize: "12px" }}>
                        <option value="All">Loại hình: Tất cả</option>
                        {categories
                            .filter((c) => c.type === "project_type" || c.type === "format")
                            .map((c) => (<option key={c.slug} value={c.name}>{c.name}</option>))
                        }
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 rounded-lg outline-none appearance-none cursor-pointer" style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#888", border: "1px solid #2E2020", fontSize: "12px" }}>
                        <option value="default">Sắp xếp: Mặc định</option>
                        <option value="format">Sắp xếp: Loại hình dự án</option>
                        <option value="name">Sắp xếp: Tên dự án</option>
                        <option value="budget">Sắp xếp: Ngân sách</option>
                        <option value="progress">Sắp xếp: Tiến độ</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 justify-between md:justify-end">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 md:flex-initial" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <Search size={14} color="#666"/>
                        <input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent w-full md:w-[160px]" style={{ color: "#EEEEEE", fontSize: "13px" }}/>
                    </div>
                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #2E2020" }}>
                        {["grid", "list"].map((v) => (<button key={v} onClick={() => setView(v)} className="w-9 h-9 flex items-center justify-center" style={{ background: view === v ? "#D84040" : "#241C1C", color: view === v ? "#fff" : "#888" }}>
                                {v === "grid" ? <Grid3X3 size={15}/> : <List size={15}/>}
                            </button>))}
                    </div>
                </div>
            </div>

            {/* Grid View */}
            {view === "grid" && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sorted.map((project) => (<div key={project.slug} className="rounded-xl overflow-hidden group cursor-pointer relative" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={() => navigate(`/admin/projects/${project.slug}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
                            <div className="relative h-40 overflow-hidden">
                                <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #241C1C 0%, transparent 60%)" }}/>
                                {/* Status badge */}
                                <div className="absolute top-3 left-3">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                    background: statusColors[project.status]?.bg || "rgba(0,0,0,0.4)",
                    color: statusColors[project.status]?.text || "#fff",
                    backdropFilter: "blur(6px)",
                }}>
                                        {project.status}
                                    </span>
                                </div>
                                {/* Featured star */}
                                <button className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{
                    background: featuredIds.has(project.slug) ? "rgba(255,193,7,0.2)" : "rgba(29,22,22,0.7)",
                    border: `1px solid ${featuredIds.has(project.slug) ? "rgba(255,193,7,0.6)" : "rgba(255,255,255,0.1)"}`,
                    backdropFilter: "blur(6px)",
                }} onClick={(e) => toggleFeatured(e, project.slug)} title={featuredIds.has(project.slug) ? "Remove from featured" : "Mark as featured"}>
                                    <Star size={13} fill={featuredIds.has(project.slug) ? "#FFC107" : "none"} color={featuredIds.has(project.slug) ? "#FFC107" : "#888"}/>
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{project.title}</h3>
                                    {featuredIds.has(project.slug) && (<span className="flex items-center gap-1 px-1.5 py-0.5 rounded ml-2 flex-shrink-0" style={{ background: "rgba(255,193,7,0.1)", color: "#FFC107", fontSize: "10px", border: "1px solid rgba(255,193,7,0.25)" }}>
                                            <Star size={9} fill="#FFC107"/> Featured
                                        </span>)}
                                </div>
                                <p style={{ color: "#888", fontSize: "12px" }} className="mb-3">
                                    {project.client} · {project.format}
                                </p>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={12} color="#666"/>
                                        <span style={{ color: "#666", fontSize: "11px" }}>{project.year}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DollarSign size={12} color="#D84040"/>
                                        <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{project.budget}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span style={{ color: "#666", fontSize: "11px" }}>Progress</span>
                                        <span style={{ color: "#D84040", fontSize: "11px", fontWeight: 600 }}>{project.progress}%</span>
                                    </div>
                                    <div className="rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                        <div className="h-full rounded-full" style={{
                    width: `${project.progress}%`,
                    background: project.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)",
                }}/>
                                    </div>
                                </div>
                            </div>
                        </div>))}
                </div>)}

            {/* List View */}
            {view === "list" && (<div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
                                    {["Project", "Client", "Category", "Status", "Due Date", "Budget", "Progress", "★"].map((h) => (<th key={h} className="px-5 py-3 text-left" style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            {h}
                                        </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p) => (<tr key={p.slug} className="hover:bg-white/5 transition-colors cursor-pointer" style={{ borderBottom: "1px solid #2A1F1F" }} onClick={() => navigate(`/admin/projects/${p.slug}`)}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <img src={p.cover_image} alt={p.title} className="w-10 h-7 rounded object-cover" />
                                                <div>
                                                    <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{p.title}</p>
                                                    <p style={{ color: "#666", fontSize: "11px" }}>{p.year}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5" style={{ color: "#999", fontSize: "13px" }}>{p.client}</td>
                                        <td className="px-5 py-3.5" style={{ color: "#999", fontSize: "13px" }}>{p.format}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                        background: statusColors[p.status]?.bg || "rgba(0,0,0,0.4)",
                        color: statusColors[p.status]?.text || "#fff",
                    }}>{p.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5" style={{ color: "#999", fontSize: "13px" }}>{p.dueDate}</td>
                                        <td className="px-5 py-3.5" style={{ color: "#D84040", fontSize: "13px", fontWeight: 600 }}>{p.budget}</td>
                                        <td className="px-5 py-3.5" style={{ minWidth: "100px" }}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                                    <div className="h-full rounded-full" style={{
                        width: `${p.progress}%`,
                        background: p.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)",
                    }}/>
                                                </div>
                                                <span style={{ color: "#666", fontSize: "11px", flexShrink: 0 }}>{p.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button onClick={(e) => toggleFeatured(e, p.slug)} className="w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{
                        background: featuredIds.has(p.slug) ? "rgba(255,193,7,0.12)" : "transparent",
                    }}>
                                                <Star size={14} fill={featuredIds.has(p.slug) ? "#FFC107" : "none"} color={featuredIds.has(p.slug) ? "#FFC107" : "#444"}/>
                                            </button>
                                        </td>
                                    </tr>))}
                            </tbody>
                        </table>
                    </div>
                </div>)}

            {sorted.length === 0 && (<div className="text-center py-16">
                    <Star size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>No projects found</p>
                </div>)}
        </div>);
}
