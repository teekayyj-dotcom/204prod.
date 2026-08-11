import { useState, useEffect } from "react";
import { Search, Grid3X3, List, FileText, ImageIcon, Video, Archive, Figma, Download, Eye, Loader2, X, Folder, ChevronRight, Lock } from "lucide-react";
import { API_BASE_URL, fetchApi } from "../../admin/utils/apiClient";

const typeIcons = { document: FileText, image: ImageIcon, video: Video, archive: Archive, design: Figma };
const typeColors = { document: "#6B8FD6", image: "#4CAF50", video: "#E8A838", archive: "#888", design: "#D84040" };

const getImagePreviewUrl = (asset) => {
    if (asset.kind !== "image" && asset.type !== "image") return asset.url;
    return `${API_BASE_URL}/media/${asset.id}/proxy?width=420`;
};

export function CrewMediaLibraryPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [view, setView] = useState("grid");
    
    const [assets, setAssets] = useState([]);
    const [folders, setFolders] = useState([]);
    const [clients, setClients] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    
    // Navigation state: array of {id, name, type: 'client'|'project'|'folder'}
    const [pathStack, setPathStack] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [previewAsset, setPreviewAsset] = useState<any>(null);
    const [dragTarget, setDragTarget] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<any>(null);

    const handleDropMove = async (item: any, targetFolderId: string | null) => {
        // Handle logic here or mock it for now to prevent crashes
        console.log("Moved item", item.id, "to", targetFolderId);
    };

    const loadLibraryData = () => {
        setLoading(true);
        Promise.all([
            fetchApi('/media'),
            fetchApi('/media/folders'),
            fetchApi('/projects/clients/all'),
            fetchApi('/projects/all')
        ]).then(([mediaData, foldersData, clientsData, projectsData]) => {
            const mapped = mediaData.map(m => ({
                id: m.id,
                name: (m.kind === 'video' && m.caption) ? m.caption : (m.url.split('/').pop() || m.id),
                type: m.kind,
                clientSlug: m.client_slug,
                projectSlug: m.project_slug,
                folderId: m.folder_id,
                folderStr: m.folder,
                isPublished: m.is_published,
                size: m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : "1.2 MB",
                uploaded: m.created_at ? new Date(m.created_at).toLocaleDateString() : "2026-05-18",
                image: m.url,
                previewImage: (m.kind === 'video' && m.url?.includes('/play_1080p.mp4')) ? m.url.replace('/play_1080p.mp4', '/thumbnail.jpg') : (m.thumbnail_url || getImagePreviewUrl(m))
            }));
            setAssets(mapped);
            setFolders(foldersData);
            setClients(clientsData);
            setAllProjects(projectsData);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load media data:", err);
            setLoading(false);
        });
    };

    useEffect(() => { loadLibraryData(); }, []);

    const getCurrentContext = () => {
        let currentClient = null;
        let currentProject = null;
        let currentParent = null;
        
        pathStack.forEach(item => {
            if (item.type === 'client') currentClient = item.id;
            else if (item.type === 'project') currentProject = item.id;
            else if (item.type === 'folder') currentParent = item.id;
        });

        return { clientSlug: currentClient, projectSlug: currentProject, parentId: currentParent };
    };

    let foldersToRender = [];
    let filesToRender = [];
    const { clientSlug, projectSlug, parentId } = getCurrentContext();

    if (search.trim()) {
        filesToRender = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) && (typeFilter === "All" || a.type === typeFilter));
        foldersToRender = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f => ({ ...f, type: 'folder' }));
    } else {
        if (pathStack.length === 0) {
            foldersToRender = [
                ...clients.map(c => ({ id: c.slug, name: c.name, type: "client" })),
                ...folders.filter(f => !f.client_slug && !f.project_slug && !f.parent_id).map(f => ({ ...f, type: 'folder' }))
            ];
            filesToRender = assets.filter(a => !a.clientSlug && !a.projectSlug && !a.folderId && !a.folderStr);
        } else if (pathStack.length === 1 && pathStack[0].type === 'client') {
            const projList = allProjects.filter(p => p.client_slug === clientSlug);
            foldersToRender = [
                ...projList.map(p => ({ id: p.slug, name: p.title, type: "project" })),
                ...folders.filter(f => f.client_slug === clientSlug && !f.project_slug && !f.parent_id).map(f => ({ ...f, type: 'folder' }))
            ];
            filesToRender = assets.filter(a => a.clientSlug === clientSlug && !a.projectSlug && !a.folderId && !a.folderStr);
        } else {
            foldersToRender = folders.filter(f => f.client_slug === clientSlug && f.project_slug === projectSlug && f.parent_id === parentId).map(f => ({ ...f, type: 'folder' }));
            filesToRender = assets.filter(a => {
                if (parentId) return a.folderId === parentId;
                return a.clientSlug === clientSlug && a.projectSlug === projectSlug && !a.folderId && !a.folderStr;
            });
        }
        
        if (typeFilter !== "All") filesToRender = filesToRender.filter(a => a.type === typeFilter);
    }

    const getFileCount = (folderId) => {
        return assets.filter(a => a.folderId === folderId).length;
    };

    return (
        <div className="px-8 py-7 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>Thư viện Tài nguyên</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Lock size={12} style={{ color: "#777" }} />
                        <p style={{ color: "#777", fontSize: "13px" }}>Read-only — Liên hệ Admin để cập nhật file/thư mục</p>
                    </div>
                </div>
            </div>

            {!search.trim() && (
                <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg border border-[#2E2020]/60 bg-[#1D1616]/30 text-xs text-gray-400 font-medium overflow-x-auto">
                    <button 
                                onClick={() => setPathStack([])} 
                                onDragOver={(e) => { e.preventDefault(); setDragTarget('root'); }}
                                onDragLeave={() => setDragTarget(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragTarget(null);
                                    if (draggedItem) handleDropMove(draggedItem, null);
                                }}
                                className={`hover:text-white transition-colors ${dragTarget === 'root' ? 'text-white underline' : ''}`}
                            >Tất cả tệp (Root)</button>
                    {pathStack.map((pathItem, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <ChevronRight size={12} className="text-gray-600" />
                            <button 
                                onClick={() => setPathStack(pathStack.slice(0, index + 1))} 
                                onDragOver={(e) => { e.preventDefault(); setDragTarget(pathItem.id); }}
                                onDragLeave={() => setDragTarget(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragTarget(null);
                                    if (draggedItem) handleDropMove(draggedItem, pathItem.id);
                                }}
                                className={`hover:text-white transition-colors font-semibold truncate max-w-[180px] ${dragTarget === pathItem.id ? 'text-white underline' : ''}`}
                            >
                                {pathItem.name}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                    <Search size={14} color="#666"/>
                    <input placeholder="Search files globally..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent flex-1" style={{ color: "#EEEEEE", fontSize: "13px" }}/>
                </div>
                <div className="flex gap-1">
                    {["All", "image", "video", "document", "design"].map(type => (
                        <button key={type} onClick={() => setTypeFilter(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === type ? 'bg-[#D84040] text-white' : 'bg-[#1D1616] text-gray-400 hover:text-white'}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {!search.trim() && foldersToRender.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {foldersToRender.map((folder) => (
                        <div 
                            key={folder.id} 
                            onClick={() => setPathStack(prev => [...prev, { id: folder.id, name: folder.name, type: folder.type }])}
                            className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all border border-[#2E2020] bg-[#1D1616]/40 hover:border-[#D84040]/70 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#D84040]/10 text-[#D84040]">
                                    <Folder size={20} fill="rgba(216,64,64,0.2)" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="truncate">
                                        {folder.name}
                                    </p>
                                    <p style={{ color: "#777", fontSize: "11px" }}>
                                        {folder.type === 'folder' ? `${getFileCount(folder.id)} tệp` : folder.type === 'client' ? 'Khách hàng' : 'Dự án'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filesToRender.length > 0 && !search.trim() && (
                <h3 className="text-sm tracking-wider text-gray-400 font-bold mb-4 flex items-center gap-2">
                    <FileText size={16}/> CÁC TỆP TIN
                </h3>
            )}

            {filesToRender.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filesToRender.map((asset) => {
                        const IconComp = typeIcons[asset.type] || FileText;
                        return (
                            <div 
                                key={asset.id} 
                                className="rounded-xl overflow-hidden group cursor-pointer flex flex-col" 
                                style={{ background: "rgba(36, 28, 28, 0.6)", border: "1px solid rgba(46, 32, 32, 0.6)" }}
                                onClick={() => {
                                    if (asset.type === "video") {
                                        const projSlug = asset.projectSlug || "media-library-video";
                                        window.open(`/crew-dashboard/projects/${projSlug}/playback?video=${encodeURIComponent(asset.slug || asset.image)}`, '_blank');
                                    } else {
                                        setPreviewAsset(asset);
                                    }
                                }}
                            >
                                <div className="relative w-full pt-[75%] overflow-hidden bg-[#1D1616]">
                                    {asset.type === "video" || asset.type === "image" ? (
                                        <div className="absolute inset-0 w-full h-full">
                                            <img src={asset.previewImage || asset.image} alt={asset.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            {asset.type === "video" && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                        <Video size={16} color="#fff" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: `${typeColors[asset.type]}10` }}>
                                            <IconComp size={48} color={typeColors[asset.type]}/>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex items-start justify-between gap-2 border-t border-[#2E2020]">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <IconComp size={14} color={typeColors[asset.type]} className="flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{asset.name}</p>
                                            <p style={{ color: "#777", fontSize: "11px" }}>{asset.size}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {filesToRender.length === 0 && foldersToRender.length === 0 && !loading && (
                <div className="text-center py-32 rounded-xl border border-dashed border-[#2E2020] bg-[#1D1616]/30">
                    <Folder size={48} color="#4A3A3A" className="mx-auto mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Thư mục trống</p>
                </div>
            )}

            {previewAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={() => setPreviewAsset(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreviewAsset(null)} className="absolute -top-12 right-0 p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                            <X size={24} />
                        </button>
                        {previewAsset.type === "image" ? (
                            <img src={previewAsset.image} alt={previewAsset.name} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                        ) : previewAsset.type === "video" ? (
                            <div className="w-64 h-64 flex flex-col items-center justify-center gap-4 rounded-xl bg-[#1D1616] border border-[#2E2020]">
                                <FileText size={64} style={{ color: typeColors[previewAsset.type] || "#888" }} />
                                <p className="text-white text-sm text-center px-4 truncate w-full">Đang mở video trong tab mới...</p>
                            </div>
                        ) : (
                            <div className="w-64 h-64 flex flex-col items-center justify-center gap-4 rounded-xl bg-[#1D1616] border border-[#2E2020]">
                                <FileText size={64} style={{ color: typeColors[previewAsset.type] || "#888" }} />
                                <p className="text-white text-sm text-center px-4 truncate w-full">{previewAsset.name}</p>
                                <button onClick={() => window.open(previewAsset.image, '_blank')} className="px-4 py-2 rounded-lg bg-[#D84040] text-white text-sm flex items-center gap-2">
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
