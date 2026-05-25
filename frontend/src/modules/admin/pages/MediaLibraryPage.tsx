// @ts-nocheck
import { useState, useEffect } from "react";
import { Search, Upload, Grid3X3, List, FileText, Image, Video, Archive, Figma, Download, Trash2, Eye, Loader2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
const typeIcons = {
    document: FileText,
    image: Image,
    video: Video,
    archive: Archive,
    design: Figma,
};
const typeColors = {
    document: "#6B8FD6",
    image: "#4CAF50",
    video: "#E8A838",
    archive: "#888",
    design: "#D84040",
};
export function MediaLibraryPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState("All");
    const [view, setView] = useState("grid");
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchApi('/media').then(data => {
            const mapped = data.map(m => ({
                id: m.id,
                name: m.url.split('/').pop() || m.id,
                type: m.kind,
                project: "N/A", // Not directly available without deep joins
                size: m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : "1.2 MB",
                uploaded: m.created_at ? new Date(m.created_at).toLocaleDateString() : "2026-05-18",
                image: m.url
            }));
            setAssets(mapped);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const types = ["All", "image", "video", "document", "design", "archive"];
    const projects = ["All", ...Array.from(new Set(assets.map((a) => a.project)))];
    const filtered = assets.filter((asset) => {
        const matchSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
            asset.project.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "All" || asset.type === typeFilter;
        const matchProject = projectFilter === "All" || asset.project === projectFilter;
        return matchSearch && matchType && matchProject;
    });
    const totalSize = assets.reduce((sum, a) => {
        const n = parseFloat(a.size.replace(" MB", "").replace(" GB", ""));
        return sum + n;
    }, 0);
    const confirmDeleteAsset = async () => {
        if (!deleteTarget)
            return;
        setIsDeleting(true);
        await new Promise((r) => setTimeout(r, 700));
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setIsDeleting(false);
        setDeleteTarget(null);
    };
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (<div className="px-8 py-7">
            <DeleteConfirmModal isOpen={deleteTarget !== null} itemType="media asset" itemName={deleteTarget?.name ?? ""} onConfirm={confirmDeleteAsset} onCancel={() => setDeleteTarget(null)} isDeleting={isDeleting}/>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Media Library
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        {assets.length} assets · {totalSize.toFixed(0)} MB total
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                    <Upload size={16}/>
                    Upload Asset
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3 mb-7">
                {Object.entries(typeIcons).map(([type, Icon]) => {
            const count = assets.filter((a) => a.type === type).length;
            return (<button key={type} onClick={() => setTypeFilter(typeFilter === type ? "All" : type)} className="rounded-xl p-3 flex flex-col items-center gap-2 transition-all" style={{
                    background: typeFilter === type ? "#2A1F1F" : "#241C1C",
                    border: `1px solid ${typeFilter === type ? "#D84040" : "#2E2020"}`,
                }}>
                            <Icon size={20} color={typeColors[type]}/>
                            <div className="text-center">
                                <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>{count}</p>
                                <p style={{ color: "#666", fontSize: "11px", textTransform: "capitalize" }}>{type}s</p>
                            </div>
                        </button>);
        })}
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: "#1D1616", border: "1px solid #2E2020" }}>
                    <Search size={14} color="#666"/>
                    <input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent flex-1" style={{ color: "#EEEEEE", fontSize: "13px" }}/>
                </div>

                <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="px-3 py-2 rounded-lg outline-none appearance-none" style={{
            background: "#1D1616",
            border: "1px solid #2E2020",
            color: "#888",
            fontSize: "13px",
        }}>
                    {projects.map((p) => (<option key={p} value={p}>
                            {p === "All" ? "All Projects" : p}
                        </option>))}
                </select>

                <div className="flex gap-1">
                    <button onClick={() => setView("grid")} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            background: view === "grid" ? "#D84040" : "#1D1616",
            color: view === "grid" ? "#fff" : "#888",
            border: `1px solid ${view === "grid" ? "#D84040" : "#2E2020"}`,
        }}>
                        <Grid3X3 size={14}/>
                    </button>
                    <button onClick={() => setView("list")} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
            background: view === "list" ? "#D84040" : "#1D1616",
            color: view === "list" ? "#fff" : "#888",
            border: `1px solid ${view === "list" ? "#D84040" : "#2E2020"}`,
        }}>
                        <List size={14}/>
                    </button>
                </div>
            </div>

            <p style={{ color: "#666", fontSize: "13px" }} className="mb-4">
                {filtered.length} file{filtered.length !== 1 ? "s" : ""} found
            </p>

            {/* Grid View */}
            {view === "grid" && (<div className="grid grid-cols-4 gap-4">
                    {filtered.map((asset) => {
                const IconComp = typeIcons[asset.type] || FileText;
                return (<div key={asset.id} className="rounded-xl overflow-hidden group cursor-pointer" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
                                {/* Preview */}
                                <div className="relative h-36 overflow-hidden" style={{ background: "#1D1616" }}>
                                    {asset.type === "image" ? (<img src={asset.image} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>) : (<div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: `${typeColors[asset.type]}10` }}>
                                            <IconComp size={36} color={typeColors[asset.type]}/>
                                            <span className="px-2 py-0.5 rounded uppercase" style={{ background: `${typeColors[asset.type]}20`, color: typeColors[asset.type], fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }}>
                                                {asset.type}
                                            </span>
                                        </div>)}
                                    {/* Overlay actions */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" style={{ background: "rgba(0,0,0,0.6)" }}>
                                        <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EEEEEE", color: "#1D1616" }}>
                                            <Eye size={14}/>
                                        </button>
                                        <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#D84040", color: "#fff" }}>
                                            <Download size={14}/>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="truncate mb-1" style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>
                                        {asset.name}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: "#666", fontSize: "11px" }}>{asset.project}</span>
                                        <span style={{ color: "#666", fontSize: "11px" }}>{asset.size}</span>
                                    </div>
                                    <p style={{ color: "#555", fontSize: "10px" }} className="mt-1">
                                        {asset.uploaded}
                                    </p>
                                </div>
                            </div>);
            })}
                </div>)}

            {/* List View */}
            {view === "list" && (<div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
                                {["File", "Type", "Project", "Size", "Uploaded", "Actions"].map((h) => (<th key={h} className="px-5 py-3 text-left" style={{
                    color: "#666",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                }}>
                                        {h}
                                    </th>))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((asset, i) => {
                const IconComp = typeIcons[asset.type] || FileText;
                return (<tr key={asset.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2A1F1F" : "none" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${typeColors[asset.type]}20` }}>
                                                    <IconComp size={15} color={typeColors[asset.type]}/>
                                                </div>
                                                <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                                    {asset.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="px-2 py-0.5 rounded capitalize" style={{
                        background: `${typeColors[asset.type]}15`,
                        color: typeColors[asset.type],
                        fontSize: "11px",
                    }}>
                                                {asset.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#999", fontSize: "13px" }}>{asset.project}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#888", fontSize: "13px" }}>{asset.size}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#666", fontSize: "12px" }}>{asset.uploaded}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1.5">
                                                <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2A1F1F", color: "#888" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#EEEEEE")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}>
                                                    <Download size={13}/>
                                                </button>
                                                <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2A1F1F", color: "#888" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#D84040")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")} onClick={() => setDeleteTarget({ id: asset.id, name: asset.name })}>
                                                    <Trash2 size={13}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>);
            })}
                        </tbody>
                    </table>
                </div>)}

            {filtered.length === 0 && (<div className="text-center py-20">
                    <Image size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>No assets found</p>
                    <button onClick={() => { setSearch(""); setTypeFilter("All"); setProjectFilter("All"); }} style={{ color: "#D84040", fontSize: "13px" }} className="mt-2">
                        Clear filters
                    </button>
                </div>)}
        </div>);
}
