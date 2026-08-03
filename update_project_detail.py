import re

with open('frontend/src/modules/admin/pages/ProjectDetailPage.tsx', 'r') as f:
    content = f.read()

# Add states for albums
state_addition = """
    const [albums, setAlbums] = useState<any[]>([]);
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState("");
    const [newAlbumLink, setNewAlbumLink] = useState("");
    const [newAlbumBg, setNewAlbumBg] = useState("");

    useEffect(() => {
        if (project?.slug) {
            fetchApi(`/projects/${project.slug}/albums`).then(res => setAlbums(res)).catch(console.error);
        }
    }, [project?.slug]);

    const handleCreateAlbum = async () => {
        if (!newAlbumTitle || !newAlbumLink) {
            alert("Vui lòng nhập Tên Album và Link Google Drive");
            return;
        }
        setIsCreatingAlbum(true);
        try {
            const res = await fetchApi(`/projects/${project.slug}/albums`, {
                method: "POST",
                body: JSON.stringify({
                    title: newAlbumTitle,
                    gdrive_folder_id: newAlbumLink,
                    background_url: newAlbumBg || null
                })
            });
            setAlbums(prev => [...prev, res]);
            setNewAlbumTitle("");
            setNewAlbumLink("");
            setNewAlbumBg("");
            alert("Tạo Album thành công!");
        } catch (err: any) {
            alert("Lỗi tạo album: " + (err.message || ""));
        } finally {
            setIsCreatingAlbum(false);
        }
    };
"""

content = content.replace(
    'const [editTitle, setEditTitle] = useState("");',
    'const [editTitle, setEditTitle] = useState("");\n' + state_addition
)

# Add UI for creating album and displaying albums
ui_addition = """
            {/* Create Album Section */}
            {mediaView === "grid" && (
                <div style={{ background: "rgba(29,22,22,0.4)", borderRadius: "10px", padding: "15px", border: "1px solid rgba(46,32,32,0.5)", marginBottom: "15px" }}>
                    <h4 style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Image size={14} color="#6B8FD6" />
                        Tạo Album Ảnh (Google Drive)
                    </h4>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <input type="text" placeholder="Tên Album..." style={{...inputStyle, padding: "8px 12px", borderRadius: "6px", flex: 1, minWidth: "200px"}} value={newAlbumTitle} onChange={e => setNewAlbumTitle(e.target.value)} />
                        <input type="text" placeholder="Link Google Drive (Folder)..." style={{...inputStyle, padding: "8px 12px", borderRadius: "6px", flex: 2, minWidth: "200px"}} value={newAlbumLink} onChange={e => setNewAlbumLink(e.target.value)} />
                        <input type="text" placeholder="Link Ảnh Background (Tùy chọn)..." style={{...inputStyle, padding: "8px 12px", borderRadius: "6px", flex: 1, minWidth: "200px"}} value={newAlbumBg} onChange={e => setNewAlbumBg(e.target.value)} />
                        <button 
                            onClick={handleCreateAlbum} 
                            disabled={isCreatingAlbum}
                            style={{ padding: "8px 15px", borderRadius: "6px", background: "#D84040", color: "#fff", border: "none", cursor: isCreatingAlbum ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", opacity: isCreatingAlbum ? 0.7 : 1 }}
                        >
                            {isCreatingAlbum ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            Tạo Album
                        </button>
                    </div>
                </div>
            )}

            {mediaView === "grid" && albums.length > 0 && (
                <div style={{ marginBottom: "15px" }}>
                    <h4 style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>Album Ảnh ({albums.length})</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                        {albums.map(album => (
                            <div key={album.id} style={{ borderRadius: "10px", overflow: "hidden", background: "rgba(29,22,22,0.5)", border: "1px solid rgba(107,143,214,0.3)", position: "relative" }}>
                                <div style={{ height: "150px", backgroundImage: `url(${album.background_url})`, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end" }}>
                                    <div style={{ padding: "10px", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", width: "100%", color: "#fff" }}>
                                        <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{album.title}</p>
                                        <p style={{ fontSize: "10px", margin: 0, opacity: 0.8 }}>{album.photos?.length || 0} ảnh</p>
                                    </div>
                                </div>
                                <div style={{ padding: "10px" }}>
                                    <button 
                                        onClick={() => {
                                            const link = `${window.location.origin}/album/${album.short_token}`;
                                            navigator.clipboard.writeText(link);
                                            alert("Đã copy link Album!");
                                        }}
                                        style={{ width: "100%", padding: "6px 0", borderRadius: "6px", border: "none", background: "rgba(107,143,214,0.15)", color: "#6B8FD6", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                                    >
                                        <Link2 size={10} /> Copy Link Gửi Khách
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
"""

content = content.replace(
    '{mediaView === "grid" ? (',
    ui_addition + '\n            {mediaView === "grid" ? ('
)

with open('frontend/src/modules/admin/pages/ProjectDetailPage.tsx', 'w') as f:
    f.write(content)
