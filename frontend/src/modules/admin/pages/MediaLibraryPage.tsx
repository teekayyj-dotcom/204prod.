// @ts-nocheck
import { useState, useEffect } from "react";
import { Search, Upload, Grid3X3, List, FileText, Image, Video, Archive, Figma, Download, Trash2, Eye, Loader2, X, Folder, ChevronRight } from "lucide-react";
import { API_BASE_URL, fetchApi } from "../utils/apiClient";
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

const getImagePreviewUrl = (asset) => {
    if (asset.kind !== "image" && asset.type !== "image")
        return asset.url;
    return `${API_BASE_URL}/media/${asset.id}/proxy?width=420`;
};

export function MediaLibraryPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [view, setView] = useState("grid");
    const [assets, setAssets] = useState([]);
    const [clients, setClients] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [currentPath, setCurrentPath] = useState([]); // Array of slugs/folder names: [client_slug, project_slug, subfolder, doc_type]
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewAsset, setPreviewAsset] = useState<any>(null);

    const getUploadParams = (path: string[]) => {
        let clientSlug = null;
        let projectSlug = null;
        let folder = null;

        if (path.length >= 1) clientSlug = path[0];
        if (path.length >= 2) projectSlug = path[1];
        
        if (path.length === 3) {
            const sub = path[2];
            if (sub === "media") folder = "media";
            else if (sub === "demo") folder = "demo";
            else if (sub === "final video") folder = "final_video";
        } else if (path.length === 4) {
            const docType = path[3];
            if (docType === "creative brief") folder = "brief";
            else if (docType === "hợp đồng") folder = "contract";
            else if (docType === "báo giá") folder = "quotation";
            else if (docType === "hóa đơn") folder = "invoice";
        }

        return { clientSlug, projectSlug, folder };
    };

    const handleMediaUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const { clientSlug, projectSlug, folder } = getUploadParams(currentPath);
            const { uploadMediaPipeline } = await import("../../../utils/imagePipeline");
            const newAsset = await uploadMediaPipeline(
                file, 
                "projects", 
                fetchApi, 
                setUploadProgress, 
                clientSlug, 
                projectSlug, 
                folder
            );

            const mapped = {
                id: newAsset.id,
                name: newAsset.url.split("/").pop() || newAsset.id,
                type: newAsset.kind,
                clientSlug: newAsset.client_slug,
                projectSlug: newAsset.project_slug,
                folder: newAsset.folder,
                size: newAsset.file_size ? `${(newAsset.file_size / 1024 / 1024).toFixed(1)} MB` : "1.2 MB",
                uploaded: newAsset.created_at ? new Date(newAsset.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                image: newAsset.url,
                previewImage: newAsset.thumbnail_url || newAsset.url,
            };
            setAssets((prev) => [mapped, ...prev]);
        }
        catch (err) {
            console.error("Failed to upload media:", err);
            alert(err instanceof Error ? err.message : "Failed to upload file.");
        }
        finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const loadLibraryData = () => {
        setLoading(true);
        Promise.all([
            fetchApi('/media'),
            fetchApi('/projects/clients/all'),
            fetchApi('/projects')
        ]).then(([mediaData, clientsData, projectsData]) => {
            const mapped = mediaData.map(m => ({
                id: m.id,
                name: m.url.split('/').pop() || m.id,
                type: m.kind,
                clientSlug: m.client_slug,
                projectSlug: m.project_slug,
                folder: m.folder,
                size: m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : "1.2 MB",
                uploaded: m.created_at ? new Date(m.created_at).toLocaleDateString() : "2026-05-18",
                image: m.url,
                previewImage: m.thumbnail_url || getImagePreviewUrl(m)
            }));
            setAssets(mapped);
            setClients(clientsData);
            setAllProjects(projectsData);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load media data:", err);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadLibraryData();
    }, []);

    const types = ["All", "image", "video", "document", "design", "archive"];

    // Directory hierarchy filtering logic
    const currentClientSlug = currentPath[0] || null;
    const currentProjectSlug = currentPath[1] || null;

    const projectSubfolders = ["media", "demo", "final video", "tài liệu"];
    const documentSubfolders = ["creative brief", "hợp đồng", "báo giá", "hóa đơn"];

    const getFolderDbValue = (path: string[]) => {
        if (path.length === 3) {
            const sub = path[2];
            if (sub === "media") return "media";
            if (sub === "demo") return "demo";
            if (sub === "final video") return "final_video";
            return null;
        }
        if (path.length === 4) {
            const docType = path[3];
            if (docType === "creative brief") return "brief";
            if (docType === "hợp đồng") return "contract";
            if (docType === "báo giá") return "quotation";
            if (docType === "hóa đơn") return "invoice";
            return null;
        }
        return null;
    };

    let foldersToRender = [];
    let filesToRender = [];

    if (search.trim()) {
        foldersToRender = [];
        filesToRender = assets.filter((asset) => {
            const matchSearch = asset.name.toLowerCase().includes(search.toLowerCase());
            const matchType = typeFilter === "All" || asset.type === typeFilter;
            return matchSearch && matchType;
        });
    } else {
        if (currentPath.length === 0) {
            // Root level: Clients as folders
            foldersToRender = clients.map((c) => ({
                id: c.slug,
                name: c.name,
                type: "client",
                slug: c.slug
            }));
            filesToRender = assets.filter((a) => !a.clientSlug);
        } else if (currentPath.length === 1) {
            // Client level: Projects as folders
            const clientProjects = allProjects.filter((p) => p.client_slug === currentClientSlug);
            foldersToRender = clientProjects.map((p) => ({
                id: p.slug,
                name: p.title,
                type: "project",
                slug: p.slug
            }));
            filesToRender = assets.filter((a) => a.clientSlug === currentClientSlug && !a.projectSlug);
        } else if (currentPath.length === 2) {
            // Project level: Default folders (media, demo, final video, documents)
            foldersToRender = projectSubfolders.map((sub) => ({
                id: sub,
                name: sub === "tài liệu" ? "Tài liệu (Documents)" : sub.charAt(0).toUpperCase() + sub.slice(1),
                type: "subfolder",
                slug: sub
            }));
            filesToRender = assets.filter((a) => a.clientSlug === currentClientSlug && a.projectSlug === currentProjectSlug && !a.folder);
        } else if (currentPath.length === 3 && currentPath[2] === "tài liệu") {
            // Documents level: brief, contract, quote, invoice
            foldersToRender = documentSubfolders.map((sub) => ({
                id: sub,
                name: sub.charAt(0).toUpperCase() + sub.slice(1),
                type: "docfolder",
                slug: sub
            }));
            filesToRender = assets.filter((a) => a.clientSlug === currentClientSlug && a.projectSlug === currentProjectSlug && a.folder === "tài liệu");
        } else {
            // Leaf level
            const dbVal = getFolderDbValue(currentPath);
            foldersToRender = [];
            filesToRender = assets.filter((a) => a.clientSlug === currentClientSlug && a.projectSlug === currentProjectSlug && a.folder === dbVal);
        }

        // Apply file type filter locally
        if (typeFilter !== "All") {
            filesToRender = filesToRender.filter((a) => a.type === typeFilter);
        }
    }

    const totalSize = assets.reduce((sum, a) => {
        const n = parseFloat(a.size.replace(" MB", "").replace(" GB", ""));
        return sum + n;
    }, 0);

    const confirmDeleteAsset = async () => {
        if (!deleteTarget)
            return;
        setIsDeleting(true);
        try {
            await fetchApi(`/media/${deleteTarget.id}`, {
                method: "DELETE"
            });
            setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        } catch (err) {
            console.error("Failed to delete media asset:", err);
            alert(err instanceof Error ? err.message : "Failed to delete asset.");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (
        <div className="px-8 py-7">
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
                <input type="file" id="media-library-upload" className="hidden" onChange={handleMediaUpload}/>
                <button onClick={() => document.getElementById("media-library-upload")?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all" style={{ background: uploading ? "#555" : "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600, opacity: uploading ? 0.7 : 1 }} onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.background = "#D84040"; }}>
                    {uploading ? (
                        <><Loader2 size={16} className="animate-spin"/> {uploadProgress > 0 ? `${uploadProgress}%` : "Uploading..."}</>
                    ) : (
                        <><Upload size={16}/> Upload Asset</>
                    )}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3 mb-7">
                {Object.entries(typeIcons).map(([type, Icon]) => {
                    const count = assets.filter((a) => a.type === type).length;
                    return (
                        <button key={type} onClick={() => setTypeFilter(typeFilter === type ? "All" : type)} className="rounded-xl p-3 flex flex-col items-center gap-2 transition-all" style={{
                            background: typeFilter === type ? "#2A1F1F" : "#241C1C",
                            border: `1px solid ${typeFilter === type ? "#D84040" : "#2E2020"}`,
                        }}>
                            <Icon size={20} color={typeColors[type]}/>
                            <div className="text-center">
                                <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 700 }}>{count}</p>
                                <p style={{ color: "#666", fontSize: "11px", textTransform: "capitalize" }}>{type}s</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Path Breadcrumbs */}
            {!search.trim() && (
                <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg border border-[#2E2020]/60 bg-[#1D1616]/30 text-xs text-gray-400 font-medium">
                    <button 
                        onClick={() => setCurrentPath([])} 
                        className="hover:text-white transition-colors"
                    >
                        Tất cả tệp (Root)
                    </button>
                    {currentPath.map((pathItem, index) => {
                        let label = pathItem;
                        if (index === 0) {
                            const client = clients.find(c => c.slug === pathItem);
                            label = client ? client.name : pathItem;
                        } else if (index === 1) {
                            const proj = allProjects.find(p => p.slug === pathItem);
                            label = proj ? proj.title : pathItem;
                        } else {
                            label = pathItem.charAt(0).toUpperCase() + pathItem.slice(1);
                        }

                        return (
                            <div key={index} className="flex items-center gap-2">
                                <ChevronRight size={12} className="text-gray-600" />
                                <button 
                                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                                    className="hover:text-white transition-colors font-semibold truncate max-w-[180px]"
                                >
                                    {label}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter Bar */}
            <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                    <Search size={14} color="#666"/>
                    <input placeholder="Search files globally..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent flex-1" style={{ color: "#EEEEEE", fontSize: "13px" }}/>
                </div>

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

            {/* Folders Section (Only in grid/list folder view when search is empty) */}
            {!search.trim() && foldersToRender.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {foldersToRender.map((folder) => (
                        <div 
                            key={folder.id} 
                            onClick={() => setCurrentPath(prev => [...prev, folder.slug])}
                            className="rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all border border-[#2E2020] bg-[#1D1616]/40 hover:border-[#D84040]/70"
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#D84040]/10 text-[#D84040]">
                                <Folder size={20} fill="rgba(216,64,64,0.2)" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }} className="truncate">
                                    {folder.name}
                                </p>
                                <p style={{ color: "#555", fontSize: "10px" }} className="capitalize mt-0.5">
                                    {folder.type === "client" ? "Thư mục khách" : folder.type === "project" ? "Thư mục dự án" : "Tài nguyên"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Files List Header */}
            {filesToRender.length > 0 && !search.trim() && (
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">Các tệp tin</h3>
            )}

            {/* Grid View */}
            {view === "grid" && filesToRender.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {filesToRender.map((asset) => {
                        const IconComp = typeIcons[asset.type] || FileText;
                        return (
                            <div key={asset.id} className="rounded-xl overflow-hidden group cursor-pointer" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")} onClick={() => setPreviewAsset(asset)}>
                                {/* Preview */}
                                <div className="relative h-36 overflow-hidden" style={{ background: "rgba(29, 22, 22, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                                    {asset.type === "video" ? (
                                        <div className="w-full h-full pointer-events-none relative overflow-hidden">
                                            <iframe
                                                src={asset.url}
                                                loading="lazy"
                                                style={{ border: "none", height: "100%", width: "100%" }}
                                                allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                                                className="pointer-events-none"
                                            />
                                            <div className="absolute inset-0 z-10" />
                                        </div>
                                    ) : asset.type === "image" ? (
                                        <img src={asset.previewImage || asset.image} alt={asset.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: `${typeColors[asset.type]}10` }}>
                                            <IconComp size={36} color={typeColors[asset.type]}/>
                                            <span className="px-2 py-0.5 rounded uppercase" style={{ background: `${typeColors[asset.type]}20`, color: typeColors[asset.type], fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }}>
                                                {asset.type}
                                            </span>
                                        </div>
                                    )}
                                    {/* Overlay actions */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" style={{ background: "rgba(0,0,0,0.6)" }}>
                                        <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EEEEEE", color: "#1D1616" }} onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }}>
                                            <Eye size={14}/>
                                        </button>
                                        <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#D84040", color: "#fff" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: asset.id, name: asset.name }); }}>
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="truncate mb-1" style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>
                                        {asset.name}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: "#666", fontSize: "11px" }}>{asset.size}</span>
                                        <span style={{ color: "#555", fontSize: "10px" }}>{asset.uploaded}</span>
                                    </div>
                                    {search.trim() && (
                                        <p style={{ color: "#D84040", fontSize: "9px" }} className="mt-1 truncate font-medium">
                                            {asset.clientSlug ? `Location: ${asset.clientSlug}` : "Location: Root"} 
                                            {asset.projectSlug ? ` > ${asset.projectSlug}` : ""}
                                            {asset.folder ? ` > ${asset.folder}` : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {view === "list" && filesToRender.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
                                {["File", "Type", "Size", "Uploaded", "Actions"].map((h) => (
                                    <th key={h} className="px-5 py-3 text-left" style={{
                                        color: "#666",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filesToRender.map((asset, i) => {
                                const IconComp = typeIcons[asset.type] || FileText;
                                return (
                                    <tr key={asset.id} className="cursor-pointer" style={{ borderBottom: i < filesToRender.length - 1 ? "1px solid #2A1F1F" : "none" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} onClick={() => setPreviewAsset(asset)}>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${typeColors[asset.type]}20` }}>
                                                    <IconComp size={15} color={typeColors[asset.type]}/>
                                                </div>
                                                <div>
                                                    <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                                        {asset.name}
                                                    </span>
                                                    {search.trim() && (
                                                        <p style={{ color: "#666", fontSize: "9px" }} className="mt-0.5 font-medium">
                                                            {asset.clientSlug ? `Location: ${asset.clientSlug}` : "Location: Root"} 
                                                            {asset.projectSlug ? ` > ${asset.projectSlug}` : ""}
                                                            {asset.folder ? ` > ${asset.folder}` : ""}
                                                        </p>
                                                    )}
                                                </div>
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
                                            <span style={{ color: "#888", fontSize: "13px" }}>{asset.size}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span style={{ color: "#666", fontSize: "12px" }}>{asset.uploaded}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1.5">
                                                <button className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2A1F1F", color: "#888" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#D84040")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")} onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: asset.id, name: asset.name }); }}>
                                                    <Trash2 size={13}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {filesToRender.length === 0 && foldersToRender.length === 0 && (
                <div className="text-center py-20">
                    <Folder size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>Thư mục này chưa có tệp tin</p>
                    <button onClick={() => { setSearch(""); setTypeFilter("All"); setCurrentPath([]); }} style={{ color: "#D84040", fontSize: "13px" }} className="mt-2 text-xs font-semibold">
                        Quay lại Root
                    </button>
                </div>
            )}

            {previewAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={() => setPreviewAsset(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreviewAsset(null)} className="absolute -top-12 right-0 p-2 rounded-full hover:bg-white/10 transition-colors" style={{ color: "#fff" }}>
                            <X size={24} />
                        </button>
                        {previewAsset.type === "image" ? (
                            <img src={previewAsset.image} alt={previewAsset.name} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                        ) : previewAsset.type === "video" ? (
                            <div className="w-full h-full min-w-[60vw] min-h-[60vh] relative bg-black rounded-lg overflow-hidden shadow-2xl">
                                <iframe
                                    src={previewAsset.image}
                                    loading="lazy"
                                    style={{ border: "none", height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
                                    allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                                    allowFullScreen={true}
                                />
                            </div>
                        ) : (
                            <div className="w-64 h-64 flex flex-col items-center justify-center gap-4 rounded-xl" style={{ background: "rgba(36, 28, 28, 0.9)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                                <FileText size={64} style={{ color: typeColors[previewAsset.type] || "#888" }} />
                                <p style={{ color: "#fff", fontSize: "14px" }} className="text-center px-4 truncate w-full">{previewAsset.name}</p>
                                <button onClick={() => window.open(previewAsset.image, '_blank')} className="px-4 py-2 rounded-lg flex items-center gap-2 mt-2" style={{ background: "#D84040", color: "#fff", fontSize: "13px" }}>
                                    <Download size={14} /> Tải xuống
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
