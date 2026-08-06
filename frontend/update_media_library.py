import re

with open("src/modules/admin/pages/MediaLibraryPage.tsx", "r") as f:
    content = f.read()

# Add states for album
states_add = """
    const [createAlbumModal, setCreateAlbumModal] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState("");
    const [newAlbumLink, setNewAlbumLink] = useState("");
    const [newAlbumBg, setNewAlbumBg] = useState("");
    const [albums, setAlbums] = useState<any[]>([]);
"""
content = content.replace("const [newFolderName, setNewFolderName] = useState(\"\");", "const [newFolderName, setNewFolderName] = useState(\"\");\n" + states_add)

# Add useEffect for albums
effect_add = """
    useEffect(() => {
        const { projectSlug } = getCurrentContext();
        if (projectSlug) {
            fetchApi(`/projects/${projectSlug}/albums`).then(res => setAlbums(res)).catch(() => {});
        } else {
            setAlbums([]);
        }
    }, [pathStack, projectSlug, clientSlug]);
"""
content = content.replace("useEffect(() => { loadLibraryData(); }, []);", "useEffect(() => { loadLibraryData(); }, []);\n" + effect_add)

# Update foldersToRender to include albums
albums_render_add = """
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
"""
content = content.replace("if (typeFilter !== \"All\") filesToRender = filesToRender.filter(a => a.type === typeFilter);", "if (typeFilter !== \"All\") filesToRender = filesToRender.filter(a => a.type === typeFilter);\n" + albums_render_add)

# Update context menu alert
content = content.replace(
    'alert("Chức năng tạo album đang phát triển")',
    '{ const { projectSlug } = getCurrentContext(); if (projectSlug) setCreateAlbumModal(true); else alert("Vui lòng vào bên trong một Dự án để tạo album."); }'
)

# Update onClick for album
content = content.replace(
    'onClick={() => setPathStack(prev => [...prev, { id: folder.id, name: folder.name, type: folder.type }])}',
    "onClick={() => folder.type === 'album' ? window.open(`/album/${folder.short_token}`, '_blank') : setPathStack(prev => [...prev, { id: folder.id, name: folder.name, type: folder.type }])}"
)

# Update getFileCount text
content = content.replace(
    "{folder.type === 'folder' ? `${getFileCount(folder.id)} tệp` : folder.type === 'client' ? 'Khách hàng' : 'Dự án'}",
    "{folder.type === 'folder' ? `${getFileCount(folder.id)} tệp` : folder.type === 'album' ? `${folder.photosCount} ảnh (Drive)` : folder.type === 'client' ? 'Khách hàng' : 'Dự án'}"
)

# Add handleCreateAlbum function
handle_create = """
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
"""
content = content.replace("const handleCreateFolder = async () => {", handle_create + "\n    const handleCreateFolder = async () => {")

# Add Create Album Modal
album_modal = """
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
"""
content = content.replace("{createFolderModal && (", album_modal + "\n            {createFolderModal && (")


with open("src/modules/admin/pages/MediaLibraryPage.tsx", "w") as f:
    f.write(content)

print("Done")
