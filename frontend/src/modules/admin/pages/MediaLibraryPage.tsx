// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Upload, Grid3X3, List, FileText, Image, Video, Archive, Figma, Download, Trash2, Eye, Loader2, X, Folder, ChevronRight, Link, FolderPlus, Video as VideoIcon, Move, Share2, MoreVertical, Edit2, Plus } from "lucide-react";
import { API_BASE_URL, fetchApi } from "../utils/apiClient";
import { useNavigate } from "react-router-dom";
import { ContextMenu, ContextMenuItem } from "../../../shared/components/ContextMenu";

const typeIcons = { document: FileText, image: Image, video: Video, archive: Archive, design: Figma };
const typeColors = { document: "#6B8FD6", image: "#4CAF50", video: "#E8A838", archive: "#888", design: "#D84040" };

const getImagePreviewUrl = (asset) => {
    if (asset.kind !== "image" && asset.type !== "image") return asset.url;
    return `${API_BASE_URL}/media/${asset.id}/proxy?width=420`;
};

export function MediaLibraryPage({ isComponent = false, projectSlug = "", clientSlug = "" }: { isComponent?: boolean, projectSlug?: string, clientSlug?: string }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [view, setView] = useState("grid");
    
    // Data
    const [assets, setAssets] = useState([]);
    const [folders, setFolders] = useState([]);
    const [clients, setClients] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    
    // Navigation state: array of {id, name, type: 'client'|'project'|'folder'}
    const [pathStack, setPathStack] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewAsset, setPreviewAsset] = useState<any>(null);
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, items: ContextMenuItem[]} | null>(null);
    const [newMenuOpen, setNewMenuOpen] = useState(false);
    
    // Modals
    const [createFolderModal, setCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [createAlbumModal, setCreateAlbumModal] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState("");
    const [newAlbumLink, setNewAlbumLink] = useState("");
    const [newAlbumBg, setNewAlbumBg] = useState("");
    const [albums, setAlbums] = useState<any[]>([]);

    
    const [renameModal, setRenameModal] = useState<{id: string, name: string, isFolder: boolean} | null>(null);
    const [deleteModal, setDeleteModal] = useState<{id: string, name: string, isFolder: boolean} | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    
    const [moveModal, setMoveModal] = useState<{id: string, isFolder: boolean} | null>(null);
    const [shareModal, setShareModal] = useState<{id: string, isPublished: boolean, isFolder: boolean} | null>(null);

    const loadLibraryData = () => {
        setLoading(true);
        const mediaUrl = projectSlug ? `/media?project_slug=${projectSlug}${clientSlug ? `&client_slug=${clientSlug}` : ''}` : '/media';
        const foldersUrl = projectSlug ? `/media/folders?project_slug=${projectSlug}${clientSlug ? `&client_slug=${clientSlug}` : ''}` : '/media/folders';
        
        Promise.all([
            fetchApi(mediaUrl),
            fetchApi(foldersUrl),
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

    useEffect(() => {
        const { projectSlug } = getCurrentContext();
        if (projectSlug) {
            fetchApi(`/projects/${projectSlug}/albums`).then(res => setAlbums(res)).catch(() => {});
        } else {
            setAlbums([]);
        }
    }, [pathStack, projectSlug, clientSlug]);


    // Helper to get current location context
    const getCurrentContext = () => {
        let currentClient = clientSlug || "";
        let currentProject = projectSlug || "";
        let parentId = null;
        
        if (pathStack.length > 0) {
            const last = pathStack[pathStack.length - 1];
            if (last.type === 'client') currentClient = last.id;
            else if (last.type === 'project') currentProject = last.id;
            else if (last.type === 'folder') parentId = last.id;
        }
        return { clientSlug: currentClient, projectSlug: currentProject, parentId };
    };

    // Upload
    const handleMediaUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const { clientSlug, projectSlug, parentId } = getCurrentContext();
            const { uploadMediaPipeline } = await import("../../../utils/imagePipeline");
            
            // Note: imagePipeline might need to be updated to accept folderId, but for now we fallback to folder string if needed.
            // Assuming uploadMediaPipeline passes folder string. If backend accepts folder_id as Form data, we need to adapt it.
            // For now, we'll let it use the old way, but since we are refactoring, we might need to patch uploadMediaPipeline in real implementation to support folder_id.
            
            // Mocking for the UI plan
            const formData = new FormData();
            formData.append("file", file);
            if (clientSlug) formData.append("client_slug", clientSlug);
            if (projectSlug) formData.append("project_slug", projectSlug);
            if (parentId) formData.append("folder", parentId); // Legacy fallback, we should add folder_id if supported

            const res = await fetchApi('/media/upload', {
                method: 'POST',
                body: formData
            });

            loadLibraryData();
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // Derived view data
    let foldersToRender = [];
    let filesToRender = [];
    const { clientSlug: ctxClientSlug, projectSlug: ctxProjectSlug, parentId: ctxParentId } = getCurrentContext();

    if (search.trim()) {
        filesToRender = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) && (typeFilter === "All" || a.type === typeFilter));
        foldersToRender = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f => ({ ...f, type: 'folder' }));
    } else {
        if (pathStack.length === 0 && !isComponent) {
            // Global Root
            foldersToRender = [
                ...clients.map(c => ({ id: c.slug, name: c.name, type: "client" })),
                ...folders.filter(f => !f.client_slug && !f.project_slug && !f.parent_id).map(f => ({ ...f, type: 'folder' }))
            ];
            filesToRender = assets.filter(a => !a.clientSlug && !a.projectSlug && !a.folderId && !a.folderStr);
        } else if (pathStack.length === 1 && pathStack[0].type === 'client' && !isComponent) {
            // Client Root
            const projList = allProjects.filter(p => p.client_slug === ctxClientSlug);
            foldersToRender = [
                ...projList.map(p => ({ id: p.slug, name: p.title, type: "project" })),
                ...folders.filter(f => f.client_slug === ctxClientSlug && !f.project_slug && !f.parent_id).map(f => ({ ...f, type: 'folder' }))
            ];
            filesToRender = assets.filter(a => a.clientSlug === ctxClientSlug && !a.projectSlug && !a.folderId && !a.folderStr);
        } else {
            // Inside a Project or Folder (or Component Mode Root)
            foldersToRender = folders.filter(f => f.parent_id === ctxParentId).map(f => ({ ...f, type: 'folder' }));
            
            filesToRender = assets.filter(a => a.folderId === ctxParentId &&
                (!ctxClientSlug || a.clientSlug === ctxClientSlug) &&
                (!ctxProjectSlug || a.projectSlug === ctxProjectSlug) &&
                (typeFilter === "All" || a.type === typeFilter)
            );
        }
        
        if (typeFilter !== "All") filesToRender = filesToRender.filter(a => a.type === typeFilter);

        // Add albums if we are at the project root
        if ((!isComponent && pathStack.length === 2) || (isComponent && pathStack.length === 0)) {
            const albumsToRender = albums.map(a => ({
                id: a.id,
                name: a.title,
                type: 'album',
                short_token: a.short_token,
                photosCount: a.photos?.length || 0
            }));
            foldersToRender = [...foldersToRender, ...albumsToRender];
        }

    }

    // Context Menu Handlers
    const handleBackgroundContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
                { id: "new-folder", label: "Tạo folder mới", icon: <FolderPlus size={16}/>, onClick: () => setCreateFolderModal(true) },
                { id: "new-album", label: "Tạo album mới", icon: <Image size={16}/>, onClick: () => { const { projectSlug } = getCurrentContext(); if (projectSlug) setCreateAlbumModal(true); else alert("Vui lòng vào bên trong một Dự án để tạo album."); } },
                { id: "upload-video", label: "Upload video", icon: <VideoIcon size={16}/>, onClick: () => document.getElementById("media-library-upload")?.click() },
            ]
        });
    };

    const handleItemContextMenu = (e: React.MouseEvent, item: any, isFolder: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent context menu on virtual client/project folders
        if (isFolder && (item.type === 'client' || item.type === 'project')) return;

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
                { id: "rename", label: "Đổi tên", icon: <Edit2 size={16}/>, onClick: () => setRenameModal({id: item.id, name: item.name, isFolder}) },
                { id: "share", label: "Phân quyền (Share)", icon: <Share2 size={16}/>, onClick: () => setShareModal({id: item.id, isPublished: item.is_published || item.isPublished, isFolder}) },
                { id: "move", label: "Di chuyển tới...", icon: <Move size={16}/>, onClick: () => setMoveModal({id: item.id, isFolder}) },
                { id: "delete", label: "Xóa", danger: true, icon: <Trash2 size={16}/>, onClick: () => setDeleteModal({id: item.id, name: item.name, isFolder}) },
            ]
        });
    };

    // Actions
    
    const handleCreateAlbum = async () => {
        if (!newAlbumTitle || !newAlbumLink) {
            alert("Vui lòng nhập Tên Album và Link Google Drive");
            return;
        }
        try {
            const { projectSlug: ctxProjectSlug } = getCurrentContext();
            if (!ctxProjectSlug) return;
            const res = await fetchApi(`/projects/${ctxProjectSlug}/albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newAlbumTitle,
                    gdrive_folder_id: newAlbumLink,
                    background_url: newAlbumBg || null
                })
            });
            setAlbums(prev => [...prev, res]);
            setCreateAlbumModal(false);
            setNewAlbumTitle("");
            setNewAlbumLink("");
            setNewAlbumBg("");
            alert("Tạo Album thành công!");
        } catch (err) { alert("Lỗi khi tạo album"); }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const { clientSlug, projectSlug, parentId } = getCurrentContext();
            const res = await fetchApi('/media/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFolderName,
                    client_slug: clientSlug,
                    project_slug: projectSlug,
                    parent_id: parentId,
                    is_published: false
                })
            });
            setFolders([...folders, res]);
            setCreateFolderModal(false);
            setNewFolderName("");
        } catch (err) { alert("Lỗi khi tạo folder"); }
    };

    const handleDelete = async () => {
        if (!deleteModal || deleteConfirmText !== deleteModal.name) return;
        try {
            if (deleteModal.isFolder) {
                await fetchApi(`/media/folders/${deleteModal.id}`, { method: 'DELETE' });
                setFolders(folders.filter(f => f.id !== deleteModal.id));
            } else {
                await fetchApi(`/media/${deleteModal.id}`, { method: 'DELETE' });
                setAssets(assets.filter(a => a.id !== deleteModal.id));
            }
            setDeleteModal(null);
            setDeleteConfirmText("");
        } catch (err) { alert("Lỗi khi xóa"); }
    };

    // Drag and drop zone (simplified)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        // implement drop upload if needed
    };

    const handleRename = async () => {
        if (!renameModal || !renameModal.name.trim()) return;
        try {
            if (renameModal.isFolder) {
                await fetchApi(`/media/folders/${renameModal.id}`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name: renameModal.name })
                });
                setFolders(folders.map(f => f.id === renameModal.id ? {...f, name: renameModal.name} : f));
            } else {
                await fetchApi(`/media/${renameModal.id}/rename`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ title: renameModal.name })
                });
                setAssets(assets.map(a => a.id === renameModal.id ? {...a, name: renameModal.name} : a));
            }
            setRenameModal(null);
        } catch(err) { alert("Lỗi khi đổi tên"); }
    };

    const handleMove = async (targetFolderId: string | null) => {
        if (!moveModal) return;
        try {
            if (moveModal.isFolder) {
                await fetchApi(`/media/folders/${moveModal.id}`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ parent_id: targetFolderId })
                });
                setFolders(folders.map(f => f.id === moveModal.id ? {...f, parent_id: targetFolderId} : f));
            } else {
                await fetchApi(`/media/${moveModal.id}/move`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ folder_id: targetFolderId })
                });
                setAssets(assets.map(a => a.id === moveModal.id ? {...a, folderId: targetFolderId} : a));
            }
            setMoveModal(null);
        } catch(err) { alert("Lỗi khi di chuyển"); }
    };

    const handleShare = async (isPublished: boolean) => {
        if (!shareModal) return;
        try {
            if (shareModal.isFolder) {
                await fetchApi(`/media/folders/${shareModal.id}`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ is_published: isPublished })
                });
                setFolders(folders.map(f => f.id === shareModal.id ? {...f, is_published: isPublished} : f));
                setShareModal({...shareModal, isPublished});
            } else {
                await fetchApi(`/media/${shareModal.id}/publish`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ is_published: isPublished })
                });
                setAssets(assets.map(a => a.id === shareModal.id ? {...a, isPublished: isPublished} : a));
                setShareModal({...shareModal, isPublished});
            }
            // Do not close immediately so user can copy the link
        } catch(err) { alert("Lỗi phân quyền"); }
    };

    const getFileCount = (folderId) => {
        return assets.filter(a => a.folderId === folderId).length;
    };

    return (
        <div 
            className={isComponent ? "py-4 min-h-[500px]" : "px-8 py-7 min-h-screen"} 
            onContextMenu={handleBackgroundContextMenu}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
            
            {/* Header */}
            {!isComponent && (
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>Media Library (Drive Mode)</h1>
                        <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">Quản lý file thông minh bằng Chuột phải & Kéo thả</p>
                    </div>
                    <input type="file" id="media-library-upload" className="hidden" onChange={handleMediaUpload}/>
                    <div style={{ position: "relative" }}>
                        <button 
                            onClick={() => setNewMenuOpen(!newMenuOpen)} 
                            disabled={uploading} 
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all" 
                            style={{ background: uploading ? "#555" : "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Mới
                        </button>
                        {newMenuOpen && (
                            <div 
                                style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "10px", overflow: "hidden", zIndex: 100, minWidth: "180px", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                            >
                                <button 
                                    onClick={() => { setNewMenuOpen(false); setCreateFolderModal(true); }}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                    style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500, borderBottom: "1px solid #2A1F1F" }}
                                >
                                    <FolderPlus size={16} color="#6B8FD6" /> Thư mục mới
                                </button>
                                <button 
                                    onClick={() => { setNewMenuOpen(false); document.getElementById("media-library-upload")?.click(); }}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                    style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}
                                >
                                    <Upload size={16} color="#4CAF50" /> Tải lên File
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Click outside to close menu */}
            {!isComponent && newMenuOpen && <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setNewMenuOpen(false)} />}
            
            {isComponent && (
                <div className="flex items-center justify-between mb-4">
                    <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Thư mục & Tệp</h3>
                    <input type="file" id="media-library-upload" className="hidden" onChange={handleMediaUpload}/>
                    <div style={{ position: "relative" }}>
                        <button 
                            onClick={() => setNewMenuOpen(!newMenuOpen)} 
                            disabled={uploading} 
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" 
                            style={{ background: uploading ? "#555" : "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Mới
                        </button>
                        {newMenuOpen && (
                            <div 
                                style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#1D1616", border: "1px solid #2A1F1F", borderRadius: "10px", overflow: "hidden", zIndex: 100, minWidth: "160px", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                            >
                                <button 
                                    onClick={() => { setNewMenuOpen(false); setCreateFolderModal(true); }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
                                    style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500, borderBottom: "1px solid #2A1F1F" }}
                                >
                                    <FolderPlus size={14} color="#6B8FD6" /> Thư mục mới
                                </button>
                                <button 
                                    onClick={() => { setNewMenuOpen(false); document.getElementById("media-library-upload")?.click(); }}
                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors text-left"
                                    style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}
                                >
                                    <Upload size={14} color="#4CAF50" /> Tải lên File
                                </button>
                            </div>
                        )}
                        {newMenuOpen && <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setNewMenuOpen(false)} />}
                    </div>
                </div>
            )}

            {/* Breadcrumbs */}
            {!search.trim() && (
                <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg border border-[#2E2020]/60 bg-[#1D1616]/30 text-xs text-gray-400 font-medium overflow-x-auto">
                    <button onClick={() => setPathStack([])} className="hover:text-white transition-colors">Tất cả tệp (Root)</button>
                    {pathStack.map((pathItem, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <ChevronRight size={12} className="text-gray-600" />
                            <button onClick={() => setPathStack(pathStack.slice(0, index + 1))} className="hover:text-white transition-colors font-semibold truncate max-w-[180px]">
                                {pathItem.name}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter Bar */}
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

            {/* Folders */}
            {!search.trim() && foldersToRender.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {foldersToRender.map((folder) => (
                        <div 
                            key={folder.id} 
                            onClick={() => folder.type === 'album' ? window.open(`/album/${folder.short_token}`, '_blank') : setPathStack(prev => [...prev, { id: folder.id, name: folder.name, type: folder.type }])}
                            onContextMenu={(e) => handleItemContextMenu(e, folder, true)}
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
                                        {folder.type === 'folder' ? `${getFileCount(folder.id)} tệp` : folder.type === 'album' ? `${folder.photosCount} ảnh (Drive)` : folder.type === 'client' ? 'Khách hàng' : 'Dự án'}
                                    </p>
                                </div>
                            </div>
                            
                            {folder.type === 'folder' && (
                                <button 
                                    className="p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleItemContextMenu(e, folder, true); }}
                                >
                                    <MoreVertical size={16} color="#aaa" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Files List Header */}
            {filesToRender.length > 0 && !search.trim() && (
                <h3 className="text-sm tracking-wider text-gray-400 font-bold mb-4 flex items-center gap-2">
                    <FileText size={16}/> CÁC TỆP TIN
                </h3>
            )}

            {/* Files Grid View */}
            {filesToRender.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filesToRender.map((asset) => {
                        const IconComp = typeIcons[asset.type] || FileText;
                        return (
                            <div 
                                key={asset.id} 
                                className="rounded-xl overflow-hidden group cursor-pointer flex flex-col" 
                                style={{ background: "rgba(36, 28, 28, 0.6)", border: "1px solid rgba(46, 32, 32, 0.6)" }}
                                onContextMenu={(e) => handleItemContextMenu(e, asset, false)}
                                onClick={() => setPreviewAsset(asset)}
                            >
                                {/* Preview / Thumbnail - Fixed aspect ratio 1:1 or 16:9 like drive */}
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
                                
                                {/* Info Footer */}
                                <div className="p-3 flex items-start justify-between gap-2 border-t border-[#2E2020]">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <IconComp size={14} color={typeColors[asset.type]} className="flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{asset.name}</p>
                                            <p style={{ color: "#777", fontSize: "11px" }}>{asset.size}</p>
                                        </div>
                                    </div>
                                    <button 
                                        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white"
                                        onClick={(e) => { e.stopPropagation(); handleItemContextMenu(e, asset, false); }}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
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
                    <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>Click chuột phải hoặc kéo thả file vào đây để upload</p>
                </div>
            )}
            
            {/* Modals */}
            
            {createAlbumModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white text-lg font-bold mb-4">Tạo Album Ảnh Mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Tên Album *</label>
                                <input autoFocus value={newAlbumTitle} onChange={e => setNewAlbumTitle(e.target.value)} placeholder="VD: Behind The Scenes" className="w-full bg-[#241C1C] border border-[#2E2020] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#D84040]" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Link Google Drive *</label>
                                <input value={newAlbumLink} onChange={e => setNewAlbumLink(e.target.value)} placeholder="Paste link thư mục GDrive..." className="w-full bg-[#241C1C] border border-[#2E2020] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#D84040]" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Link Ảnh Bìa (Tùy chọn)</label>
                                <input value={newAlbumBg} onChange={e => setNewAlbumBg(e.target.value)} placeholder="URL ảnh bìa..." className="w-full bg-[#241C1C] border border-[#2E2020] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#D84040]" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setCreateAlbumModal(false)} className="flex-1 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 font-medium">Hủy</button>
                            <button onClick={handleCreateAlbum} className="flex-1 py-2.5 rounded-xl bg-[#D84040] text-white font-medium hover:bg-[#c03030]">Tạo Album</button>
                        </div>
                    </div>
                </div>
            )}

            {createFolderModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white text-lg font-bold mb-4">Tạo Thư mục mới</h3>
                        <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Tên thư mục" className="w-full bg-[#241C1C] border border-[#2E2020] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D84040]" />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setCreateFolderModal(false)} className="flex-1 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 font-medium">Hủy</button>
                            <button onClick={handleCreateFolder} className="flex-1 py-2.5 rounded-xl bg-[#D84040] text-white font-medium hover:bg-[#c03030]">Tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-red-400 text-lg font-bold mb-2">Xác nhận Xóa</h3>
                        <p className="text-gray-400 text-sm mb-4">Hành động này không thể hoàn tác. Vui lòng gõ lại tên <strong>{deleteModal.name}</strong> để xác nhận.</p>
                        <input autoFocus value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={deleteModal.name} className="w-full bg-[#241C1C] border border-[#2E2020] rounded-xl px-4 py-3 text-white outline-none focus:border-red-500" />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 font-medium">Hủy</button>
                            <button onClick={handleDelete} disabled={deleteConfirmText !== deleteModal.name} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">Xóa vĩnh viễn</button>
                        </div>
                    </div>
                </div>
            )}
            {renameModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white text-lg font-bold mb-4">Đổi Tên</h3>
                        <input autoFocus value={renameModal.name} onChange={e => setRenameModal({...renameModal, name: e.target.value})} placeholder="Tên mới" className="w-full bg-[#241C1C] border border-[#2E2020] rounded-xl px-4 py-3 text-white outline-none focus:border-[#D84040]" />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setRenameModal(null)} className="flex-1 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 font-medium">Hủy</button>
                            <button onClick={handleRename} className="flex-1 py-2.5 rounded-xl bg-[#D84040] text-white font-medium hover:bg-[#c03030]">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {shareModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-white text-lg font-bold mb-4">Phân quyền (Share)</h3>
                        <p className="text-gray-400 text-sm mb-4">Mục này hiện đang: <strong>{shareModal.isPublished ? "Đã Publish (Công khai)" : "Nội bộ (Internal)"}</strong></p>
                        
                        {shareModal.isPublished && (
                            <div className="mb-4 bg-[#2A1F1F] p-3 rounded-lg border border-[#3A2A2A]">
                                <p className="text-xs text-gray-400 mb-2">Tất cả user có link này đều có thể xem được:</p>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={`${window.location.origin}/media/${shareModal.id}`} 
                                        className="flex-1 bg-transparent text-white text-xs outline-none"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/media/${shareModal.id}`);
                                            alert("Đã copy link!");
                                        }}
                                        className="text-[#D84040] text-xs font-bold whitespace-nowrap hover:text-white"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-4">
                            <button onClick={() => handleShare(false)} className={`flex-1 py-2.5 rounded-xl border ${!shareModal.isPublished ? 'border-[#D84040] text-[#D84040]' : 'border-[#2E2020] text-gray-400 hover:border-gray-500'} transition-colors font-medium`}>Chỉ Nội Bộ</button>
                            <button onClick={() => handleShare(true)} className={`flex-1 py-2.5 rounded-xl border ${shareModal.isPublished ? 'border-[#D84040] text-[#D84040]' : 'border-[#2E2020] text-gray-400 hover:border-gray-500'} transition-colors font-medium`}>Công Khai</button>
                        </div>
                        <div className="mt-4 text-center">
                            <button onClick={() => setShareModal(null)} className="text-sm text-gray-500 hover:text-white">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {moveModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1D1616] border border-[#2E2020] rounded-2xl p-6 w-full max-w-sm max-h-[80vh] flex flex-col">
                        <h3 className="text-white text-lg font-bold mb-4">Di chuyển tới...</h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            <button 
                                onClick={() => handleMove(null)} 
                                className="w-full text-left p-3 rounded-lg border border-[#2E2020] hover:border-[#D84040] text-white flex items-center gap-3 transition-colors"
                            >
                                <Folder size={16} className="text-gray-400" />
                                <span>Thư mục gốc (Root)</span>
                            </button>
                            
                            {folders.filter(f => f.id !== moveModal.id).map(folder => (
                                <button 
                                    key={folder.id}
                                    onClick={() => handleMove(folder.id)} 
                                    className="w-full text-left p-3 rounded-lg border border-[#2E2020] hover:border-[#D84040] text-white flex items-center gap-3 transition-colors"
                                >
                                    <Folder size={16} className="text-[#D84040]" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{folder.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {folder.project_slug ? `Dự án: ${folder.project_slug}` : 'Thư mục cấp 1'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-[#2E2020]">
                            <button onClick={() => setMoveModal(null)} className="w-full py-2.5 rounded-xl bg-[#241C1C] text-gray-400 hover:text-white font-medium">Hủy</button>
                        </div>
                    </div>
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
                            <div className="w-full h-full min-w-[60vw] min-h-[60vh] relative bg-black rounded-lg overflow-hidden shadow-2xl">
                                {previewAsset.image?.includes("iframe.mediadelivery.net") ? (
                                    <iframe src={previewAsset.image} className="absolute inset-0 w-full h-full" allowFullScreen={true} />
                                ) : (
                                    <video src={previewAsset.image} controls autoPlay className="absolute inset-0 w-full h-full object-contain" />
                                )}
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
