// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderOpen, Plus, Clock, DollarSign, CheckCircle2, Activity, ChevronRight, Star, Tag, ExternalLink, LayoutGrid, List, Search, Pencil, X, Briefcase, Palette, Code2, Camera, Film, Megaphone, LayoutTemplate, Monitor, Globe, Layers, PenTool, Scissors, Zap, Cpu, Package, MessageSquare, BookOpen, Music, Video, Box, Grid3X3, FileText, Award, Target, Compass, Sparkles, Wand2, Lightbulb, Rocket, Shield, Brush, Settings, Sliders, Shapes, Folder, Image, Newspaper, FlaskConical, Loader2, } from "lucide-react";
import { fetchApi } from "../utils/apiClient";
// ── Icon catalogue for the picker ─────────────────────────────────
const ICON_OPTIONS = [
    { name: "FolderOpen", Icon: FolderOpen },
    { name: "Folder", Icon: Folder },
    { name: "Briefcase", Icon: Briefcase },
    { name: "Palette", Icon: Palette },
    { name: "Brush", Icon: Brush },
    { name: "PenTool", Icon: PenTool },
    { name: "Wand2", Icon: Wand2 },
    { name: "Shapes", Icon: Shapes },
    { name: "Layers", Icon: Layers },
    { name: "Code2", Icon: Code2 },
    { name: "Monitor", Icon: Monitor },
    { name: "Cpu", Icon: Cpu },
    { name: "Settings", Icon: Settings },
    { name: "Sliders", Icon: Sliders },
    { name: "Camera", Icon: Camera },
    { name: "Image", Icon: Image },
    { name: "Film", Icon: Film },
    { name: "Video", Icon: Video },
    { name: "Music", Icon: Music },
    { name: "Megaphone", Icon: Megaphone },
    { name: "Newspaper", Icon: Newspaper },
    { name: "FileText", Icon: FileText },
    { name: "BookOpen", Icon: BookOpen },
    { name: "MessageSquare", Icon: MessageSquare },
    { name: "Globe", Icon: Globe },
    { name: "Compass", Icon: Compass },
    { name: "Target", Icon: Target },
    { name: "Rocket", Icon: Rocket },
    { name: "Sparkles", Icon: Sparkles },
    { name: "Lightbulb", Icon: Lightbulb },
    { name: "Zap", Icon: Zap },
    { name: "Star", Icon: Star },
    { name: "Award", Icon: Award },
    { name: "Shield", Icon: Shield },
    { name: "Package", Icon: Package },
    { name: "Box", Icon: Box },
    { name: "Grid3X3", Icon: Grid3X3 },
    { name: "LayoutTemplate", Icon: LayoutTemplate },
    { name: "DollarSign", Icon: DollarSign },
    { name: "Scissors", Icon: Scissors },
    { name: "FlaskConical", Icon: FlaskConical },
];
// ── Status / accent maps ───────────────────────────────────────────
const statusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040", border: "rgba(216,64,64,0.3)" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6", border: "rgba(107,143,214,0.3)" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)" },
};
const categoryAccents = {
    Branding: { primary: "#D84040", glow: "rgba(216,64,64,0.18)" },
    "Web Design": { primary: "#6B8FD6", glow: "rgba(107,143,214,0.18)" },
    Motion: { primary: "#9B59B6", glow: "rgba(155,89,182,0.18)" },
    Marketing: { primary: "#E8A838", glow: "rgba(232,168,56,0.18)" },
    "UI/UX": { primary: "#4CAF50", glow: "rgba(76,175,80,0.18)" },
    Photography: { primary: "#E67E22", glow: "rgba(230,126,34,0.18)" },
};
const defaultIcons = {
    Branding: "Palette",
    "Web Design": "Monitor",
    Motion: "Film",
    Marketing: "Megaphone",
    "UI/UX": "Layers",
    Photography: "Camera",
};
const STATUS_FILTERS = ["All", "In Progress", "Review", "Completed", "Planning"];
// ── Icon Picker Modal ─────────────────────────────────────────────
function IconPickerModal({ current, accent, onSelect, onClose, }) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => ICON_OPTIONS.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())), [query]);
    return (
    /* Backdrop */
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.72)", zIndex: 9999 }} onClick={onClose}>
            {/* Modal panel */}
            <div className="rounded-2xl overflow-hidden" style={{
            background: "#241C1C",
            border: "1px solid #2E2020",
            width: "520px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent.glow, border: `1px solid ${accent.primary}40` }}>
                            <Palette size={15} color={accent.primary}/>
                        </div>
                        <div>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
                                Choose Category Icon
                            </p>
                            <p style={{ color: "#666", fontSize: "11px" }}>
                                {filtered.length} icon{filtered.length !== 1 ? "s" : ""} available
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                        <X size={14}/>
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <div className="relative">
                        <Search size={13} color="#555" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
                        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons…" className="w-full pl-8 pr-4 py-2 rounded-lg outline-none" style={{
            background: "#1D1616",
            border: "1px solid #3A2A2A",
            color: "#EEEEEE",
            fontSize: "13px",
        }} onFocus={(e) => (e.target.style.borderColor = accent.primary)} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                    </div>
                </div>

                {/* Icon grid */}
                <div className="px-4 py-4 overflow-y-auto" style={{ flex: 1 }}>
                    {filtered.length === 0 ? (<div className="flex flex-col items-center py-10">
                            <Search size={28} color="#3A2A2A" className="mb-2"/>
                            <p style={{ color: "#666", fontSize: "13px" }}>No icons match "{query}"</p>
                        </div>) : (<div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                            {filtered.map(({ name, Icon }) => {
                const isActive = name === current;
                return (<button key={name} onClick={() => { onSelect(name); onClose(); }} className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all group/icon" style={{
                        background: isActive ? accent.glow : "transparent",
                        border: `1px solid ${isActive ? accent.primary + "60" : "transparent"}`,
                    }} onMouseEnter={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background = "#2A1F1F";
                            e.currentTarget.style.borderColor = "#3A2A2A";
                        }
                    }} onMouseLeave={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                        }
                    }} title={name}>
                                        <Icon size={20} color={isActive ? accent.primary : "#666"}/>
                                        <span style={{
                        color: isActive ? accent.primary : "#555",
                        fontSize: "9px",
                        maxWidth: "52px",
                        textAlign: "center",
                        lineHeight: "1.2",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        display: "block",
                        padding: "0 4px",
                    }}>
                                            {name}
                                        </span>
                                    </button>);
            })}
                        </div>)}
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                    <span style={{ color: "#555", fontSize: "11px" }}>
                        Currently: <span style={{ color: accent.primary }}>{current}</span>
                    </span>
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg transition-all" style={{ background: "#2A1F1F", color: "#888", fontSize: "12px", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>);
}
// ── Main page ─────────────────────────────────────────────────────
export function CategoryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    // Icon customisation
    const [selectedIconName, setSelectedIconName] = useState("FolderOpen");
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => {
        Promise.all([
            fetchApi(`/categories/${id}`),
            fetchApi('/projects')
        ]).then(([catData, projsData]) => {
            setCategory(catData);
            setAllProjects(projsData);
            setSelectedIconName(defaultIcons[catData?.name ?? ""] ?? "FolderOpen");
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    if (!category) {
        return (<div className="px-8 py-7">
                <button onClick={() => navigate("/admin/categories")} className="w-9 h-9 rounded-lg flex items-center justify-center mb-8" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }}>
                    <ArrowLeft size={16}/>
                </button>
                <div className="flex flex-col items-center justify-center py-24">
                    <FolderOpen size={48} color="#3A2A2A" className="mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Category not found</p>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-1 mb-4">
                        This category doesn't exist or may have been deleted.
                    </p>
                    <button onClick={() => navigate("/admin/categories")} className="px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}>
                        Back to Categories
                    </button>
                </div>
            </div>);
    }
    const accent = categoryAccents[category.name] ?? { primary: "#D84040", glow: "rgba(216,64,64,0.18)" };
    // Resolve the current icon component
    const CurrentIconEntry = ICON_OPTIONS.find((o) => o.name === selectedIconName) ?? ICON_OPTIONS[0];
    const SelectedIcon = CurrentIconEntry.Icon;
    // Projects
    const categoryProjects = allProjects.filter((p) => p.format === category.name || p.category === category.name);
    const filteredProjects = categoryProjects.filter((p) => {
        const matchesStatus = statusFilter === "All" || p.status === statusFilter;
        const matchesSearch = searchQuery === "" ||
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.client.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });
    // Stats
    const totalBudget = categoryProjects.reduce((s, p) => {
        const rawBudget = typeof p.budget === "string" ? p.budget.replace(/[$,]/g, "") : String(p.budget || "0");
        const parsed = parseInt(rawBudget) || 0;
        return s + parsed;
    }, 0);
    const activeCount = categoryProjects.filter((p) => p.status === "In Progress").length;
    const completedCount = categoryProjects.filter((p) => p.status === "Completed").length;
    const avgProgress = categoryProjects.length
        ? Math.round(categoryProjects.reduce((s, p) => s + (p.progress ?? 100), 0) / categoryProjects.length)
        : 0;
    return (<div className="px-8 py-7 w-full">

            {/* Icon picker modal */}
            {showIconPicker && (<IconPickerModal current={selectedIconName} accent={accent} onSelect={setSelectedIconName} onClose={() => setShowIconPicker(false)}/>)}

            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/categories")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent.primary; e.currentTarget.style.color = accent.primary; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                        <ArrowLeft size={16}/>
                    </button>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate("/admin/categories")} style={{ color: "#666", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; }}>
                            Categories
                        </button>
                        <ChevronRight size={13} color="#444"/>
                        <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{category.name}</span>
                    </div>
                </div>

                <button onClick={() => navigate("/admin/projects/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all" style={{ background: accent.primary, color: "#fff", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                    <Plus size={14}/> New Project
                </button>
            </div>

            {/* ── Hero Card ── */}
            <div className="rounded-2xl overflow-hidden mb-7" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                {/* ① Purely decorative gradient banner — NO content inside */}
                <div className="relative" style={{
            height: "72px",
            background: `linear-gradient(135deg, #1D1616 0%, ${accent.primary}40 55%, ${accent.primary}80 100%)`,
        }}>
                    {/* Subtle dot-grid texture */}
                    <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, ${accent.primary}22 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
        }}/>
                </div>

                {/* ② Info row — fully inside the dark area, zero overlap */}
                <div className="px-7 py-5" style={{ borderBottom: "1px solid #2A1F1F" }}>
                    <div className="flex items-start justify-between gap-6">

                        {/* Left: Icon + title block */}
                        <div className="flex items-start gap-5">
                            {/* Icon box with "Edit Icon" overlay */}
                            <div className="relative group/icon-wrap flex-shrink-0">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
            background: `linear-gradient(135deg, #1D1616, ${accent.primary}33)`,
            border: `2px solid ${accent.primary}50`,
            boxShadow: `0 0 18px ${accent.glow}`,
        }}>
                                    <SelectedIcon size={26} color={accent.primary}/>
                                </div>

                                {/* Edit-icon overlay button — appears on hover */}
                                <button onClick={() => setShowIconPicker(true)} className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover/icon-wrap:opacity-100 transition-opacity cursor-pointer" style={{ background: "rgba(0,0,0,0.6)" }} title="Change icon">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Pencil size={13} color="#EEEEEE"/>
                                        <span style={{ color: "#EEEEEE", fontSize: "9px", fontWeight: 600 }}>EDIT</span>
                                    </div>
                                </button>

                                {/* Small persistent pencil badge */}
                                <button onClick={() => setShowIconPicker(true)} className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all" style={{ background: accent.primary, border: "2px solid #241C1C" }} title="Change icon">
                                    <Pencil size={9} color="#fff"/>
                                </button>
                            </div>

                            {/* Category name + badge + description */}
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700, lineHeight: 1.1 }}>
                                        {category.name}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full flex-shrink-0" style={{
            background: accent.glow,
            color: accent.primary,
            fontSize: "11px",
            fontWeight: 600,
            border: `1px solid ${accent.primary}40`,
        }}>
                                        {categoryProjects.length} project{categoryProjects.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <p style={{ color: "#666", fontSize: "13px" }}>
                                    All creative work tagged under{" "}
                                    <span style={{ color: accent.primary }}>{category.name}</span>
                                </p>
                                {/* "Edit Icon" text link */}
                                <button onClick={() => setShowIconPicker(true)} className="flex items-center gap-1 mt-2 transition-all" style={{ color: "#555", fontSize: "11px", background: "none", border: "none", padding: 0, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.color = accent.primary; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; }}>
                                    <Pencil size={10}/>
                                    Edit icon
                                </button>
                            </div>
                        </div>

                        {/* Right: Avg progress summary */}
                        <div className="flex-shrink-0 text-right pt-0.5">
                            <p style={{ color: "#555", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }} className="mb-1">
                                Avg. Completion
                            </p>
                            <p style={{ color: accent.primary, fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>
                                {avgProgress}
                                <span style={{ fontSize: "16px", fontWeight: 500, color: "#888" }}>%</span>
                            </p>
                            <div className="w-28 ml-auto mt-2 rounded-full overflow-hidden" style={{ height: "5px", background: "#2A1F1F" }}>
                                <div className="h-full rounded-full transition-all" style={{
            width: `${avgProgress}%`,
            background: `linear-gradient(to right, #8E1616, ${accent.primary})`,
        }}/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ③ Stats strip */}
                <div className="grid grid-cols-4" style={{ borderBottom: "none" }}>
                    {[
            { Icon: FolderOpen, label: "Total Projects", value: categoryProjects.length, color: "#EEEEEE" },
            { Icon: Activity, label: "In Progress", value: activeCount, color: "#D84040" },
            { Icon: CheckCircle2, label: "Completed", value: completedCount, color: "#4CAF50" },
            { Icon: DollarSign, label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}K`, color: accent.primary },
        ].map(({ Icon, label, value, color }, idx) => (<div key={label} className="flex items-center gap-3 px-6 py-4" style={{
                borderLeft: idx > 0 ? "1px solid #2A1F1F" : "none",
            }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2A1F1F" }}>
                                <Icon size={15} color={color}/>
                            </div>
                            <div>
                                <p style={{ color: "#444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    {label}
                                </p>
                                <p style={{ color, fontSize: "18px", fontWeight: 700, lineHeight: 1.2 }}>{value}</p>
                            </div>
                        </div>))}
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between mb-5 gap-4">
                {/* Status filters */}
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    {STATUS_FILTERS.map((f) => (<button key={f} onClick={() => setStatusFilter(f)} className="px-3 py-1.5 rounded-lg transition-all" style={{
                background: statusFilter === f ? accent.primary : "transparent",
                color: statusFilter === f ? "#fff" : "#666",
                fontSize: "12px",
                fontWeight: statusFilter === f ? 600 : 400,
            }}>
                            {f}
                            {f !== "All" && (<span className="ml-1.5 px-1 py-0.5 rounded" style={{
                    background: statusFilter === f ? "rgba(255,255,255,0.2)" : "#2A1F1F",
                    color: statusFilter === f ? "#fff" : "#555",
                    fontSize: "10px",
                }}>
                                    {categoryProjects.filter((p) => p.status === f).length}
                                </span>)}
                        </button>))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={13} color="#555" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects…" className="pl-8 pr-4 py-2 rounded-lg outline-none" style={{
            background: "#241C1C",
            border: "1px solid #2E2020",
            color: "#EEEEEE",
            fontSize: "13px",
            width: "200px",
        }} onFocus={(e) => (e.target.style.borderColor = accent.primary)} onBlur={(e) => (e.target.style.borderColor = "#2E2020")}/>
                    </div>

                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                        {["grid", "list"].map((mode) => (<button key={mode} onClick={() => setViewMode(mode)} className="w-8 h-8 flex items-center justify-center transition-all" style={{
                background: viewMode === mode ? accent.primary : "#241C1C",
                color: viewMode === mode ? "#fff" : "#555",
            }}>
                                {mode === "grid" ? <LayoutGrid size={14}/> : <List size={14}/>}
                            </button>))}
                    </div>
                </div>
            </div>

            {/* ── Projects ── */}
            {filteredProjects.length === 0 ? (<div className="rounded-2xl flex flex-col items-center justify-center py-24" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: accent.glow, border: `1px solid ${accent.primary}30` }}>
                        <SelectedIcon size={28} color={accent.primary}/>
                    </div>
                    <p style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>No projects found</p>
                    <p style={{ color: "#666", fontSize: "13px" }} className="mt-1 mb-5">
                        {searchQuery
                ? `No results for "${searchQuery}" in ${category.name}`
                : `No ${statusFilter !== "All" ? statusFilter.toLowerCase() + " " : ""}projects in ${category.name} yet`}
                    </p>
                    <button onClick={() => navigate("/admin/projects/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: accent.primary, color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                        <Plus size={14}/> Add First Project
                    </button>
                </div>) : viewMode === "grid" ? (<div className="grid grid-cols-3 gap-5">
                    {filteredProjects.map((project) => {
                const sc = statusColors[project.status] ?? statusColors["Planning"];
                const projId = project.slug || project.id;
                const projImg = project.cover_image || project.image;
                return (<div key={projId} onClick={() => navigate(`/admin/projects/${projId}`)} className="rounded-xl overflow-hidden cursor-pointer group transition-all" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${accent.primary}60`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                    }} onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#2E2020";
                        e.currentTarget.style.transform = "translateY(0)";
                    }}>
                                {/* Thumbnail */}
                                <div className="relative" style={{ height: "160px" }}>
                                    <img src={projImg} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #1D1616 0%, rgba(0,0,0,0.28) 55%, transparent 100%)" }}/>
                                    {project.featured && (<div className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,193,7,0.15)", border: "1px solid rgba(255,193,7,0.4)" }}>
                                            <Star size={11} color="#FFC107" fill="#FFC107"/>
                                        </div>)}
                                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontSize: "10px", fontWeight: 600, backdropFilter: "blur(6px)" }}>
                                        {project.status}
                                    </span>
                                    <div className="absolute bottom-3 left-3 flex gap-1">
                                        {(project.tags ?? []).slice(0, 2).map((tag) => (<span key={tag} className="px-2 py-0.5 rounded" style={{ background: "rgba(29,22,22,0.85)", color: "#aaa", fontSize: "10px", backdropFilter: "blur(4px)" }}>
                                                {tag}
                                            </span>))}
                                    </div>
                                    <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: accent.primary }}>
                                        <ExternalLink size={12} color="#fff"/>
                                    </div>
                                </div>

                                {/* Card body */}
                                <div className="px-4 py-4">
                                    <h3 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="mb-1 truncate">
                                        {project.title}
                                    </h3>
                                    <p style={{ color: "#666", fontSize: "12px" }} className="mb-3">{project.client}</p>

                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span style={{ color: "#555", fontSize: "11px" }}>Progress</span>
                                            <span style={{ color: accent.primary, fontSize: "12px", fontWeight: 600 }}>{project.progress}%</span>
                                        </div>
                                        <div className="rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                            <div className="h-full rounded-full" style={{
                        width: `${project.progress}%`,
                        background: project.progress === 100 ? "#6B8FD6" : `linear-gradient(to right, #8E1616, ${accent.primary})`,
                    }}/>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} color="#555"/>
                                            <span style={{ color: "#555", fontSize: "11px" }}>{project.dueDate}</span>
                                        </div>
                                        <span style={{ color: accent.primary, fontSize: "13px", fontWeight: 600 }}>{project.budget}</span>
                                    </div>
                                </div>
                            </div>);
            })}
                </div>) : (
        /* List view */
        <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <div className="grid px-5 py-3" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", borderBottom: "1px solid #2A1F1F" }}>
                        {["Project", "Client", "Status", "Budget", "Progress"].map((h) => (<span key={h} style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                {h}
                            </span>))}
                    </div>
                    {filteredProjects.map((project, i) => {
                const sc = statusColors[project.status] ?? statusColors["Planning"];
                const projId = project.slug || project.id;
                const projImg = project.cover_image || project.image;
                return (<div key={projId} onClick={() => navigate(`/admin/projects/${projId}`)} className="grid items-center px-5 py-3.5 cursor-pointer transition-colors" style={{
                        gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
                        borderBottom: i < filteredProjects.length - 1 ? "1px solid #2A1F1F" : "none",
                    }} onMouseEnter={(e) => { e.currentTarget.style.background = "#2A1F1F"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                <div className="flex items-center gap-3">
                                    <img src={projImg} alt={project.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0"/>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{project.title}</p>
                                            {project.featured && <Star size={10} color="#FFC107" fill="#FFC107"/>}
                                        </div>
                                        <div className="flex gap-1 mt-0.5">
                                            {(project.tags ?? []).slice(0, 2).map((tag) => (<span key={tag} className="px-1.5 rounded" style={{ background: "#2A1F1F", color: "#666", fontSize: "10px", border: "1px solid #3A2A2A" }}>{tag}</span>))}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ color: "#888", fontSize: "13px" }}>{project.client}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full w-fit" style={{ background: sc.bg, color: sc.text, fontSize: "11px", fontWeight: 600 }}>
                                    {project.status}
                                </span>
                                <span style={{ color: accent.primary, fontSize: "13px", fontWeight: 600 }}>{project.budget}</span>
                                <div>
                                    <span style={{ color: accent.primary, fontSize: "11px", fontWeight: 600 }}>{project.progress}%</span>
                                    <div className="rounded-full mt-1" style={{ height: "3px", background: "#2A1F1F" }}>
                                        <div className="h-full rounded-full" style={{
                        width: `${project.progress}%`,
                        background: project.progress === 100 ? "#6B8FD6" : `linear-gradient(to right, #8E1616, ${accent.primary})`,
                    }}/>
                                    </div>
                                </div>
                            </div>);
            })}
                </div>)}

            {/* Summary footer */}
            {filteredProjects.length > 0 && (<div className="mt-5 flex items-center justify-between">
                    <p style={{ color: "#555", fontSize: "12px" }}>
                        Showing <span style={{ color: "#888" }}>{filteredProjects.length}</span> of{" "}
                        <span style={{ color: "#888" }}>{categoryProjects.length}</span> projects in{" "}
                        <span style={{ color: accent.primary }}>{category.name}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Tag size={11} color="#555"/>
                        <span style={{ color: "#555", fontSize: "12px" }}>
                            {new Set(filteredProjects.flatMap((p) => p.tags ?? [])).size} unique tags
                        </span>
                    </div>
                </div>)}
        </div>);
}
