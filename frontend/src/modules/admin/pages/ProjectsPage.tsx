// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    const [allProjects, setAllProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [view, setView] = useState("grid");
    const [featuredIds, setFeaturedIds] = useState(new Set());
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

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
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (<div className="px-8 py-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
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
            <div className="flex items-center justify-between mb-6">
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
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 rounded-lg outline-none appearance-none" style={{ background: "#241C1C", color: "#888", border: "1px solid #2E2020", fontSize: "12px" }}>
                        <option value="All">All Categories</option>
                        {categories.map((c) => (<option key={c.slug} value={c.name}>{c.name}</option>))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <Search size={14} color="#666"/>
                        <input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "13px", width: "160px" }}/>
                    </div>
                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                        {["grid", "list"].map((v) => (<button key={v} onClick={() => setView(v)} className="w-9 h-9 flex items-center justify-center" style={{ background: view === v ? "#D84040" : "#241C1C", color: view === v ? "#fff" : "#888" }}>
                                {v === "grid" ? <Grid3X3 size={15}/> : <List size={15}/>}
                            </button>))}
                    </div>
                </div>
            </div>

            {/* Grid View */}
            {view === "grid" && (<div className="grid grid-cols-3 gap-5">
                    {filtered.map((project) => (<div key={project.slug} className="rounded-xl overflow-hidden group cursor-pointer relative" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onClick={() => navigate(`/admin/projects/${project.slug}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
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
            {view === "list" && (<div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
                                {["Project", "Client", "Category", "Status", "Due Date", "Budget", "Progress", "★"].map((h) => (<th key={h} className="px-5 py-3 text-left" style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        {h}
                                    </th>))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, i) => (<tr key={p.slug} className="cursor-pointer transition-colors" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2A1F1F" : "none" }} onClick={() => navigate(`/admin/projects/${p.slug}`)} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <img src={p.cover_image} alt={p.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
                                            <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{p.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span style={{ color: "#999", fontSize: "13px" }}>{p.client}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span style={{ color: "#888", fontSize: "12px" }}>{p.format}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="px-2 py-0.5 rounded-full" style={{
                    background: statusColors[p.status]?.bg,
                    color: statusColors[p.status]?.text,
                    fontSize: "11px",
                    fontWeight: 500,
                }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span style={{ color: "#888", fontSize: "12px" }}>{p.year}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span style={{ color: "#D84040", fontSize: "13px", fontWeight: 600 }}>{p.budget}</span>
                                    </td>
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
                </div>)}

            {filtered.length === 0 && (<div className="text-center py-16">
                    <Star size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>No projects found</p>
                </div>)}
        </div>);
}
