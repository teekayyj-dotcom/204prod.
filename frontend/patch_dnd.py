import re

def apply_patch(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Add states
    if "const [draggedItem" not in content:
        states_add = """
    const [draggedItem, setDraggedItem] = useState<{id: string, isFolder: boolean} | null>(null);
    const [dragTarget, setDragTarget] = useState<string | null>(null);
"""
        content = content.replace("const [moveModal", states_add + "    const [moveModal")

    # 2. Add handleDropMove
    if "const handleDropMove" not in content:
        move_func = """
    const handleDropMove = async (dragged: {id: string, isFolder: boolean}, targetFolderId: string | null) => {
        if (dragged.id === targetFolderId) return; // Cannot move into itself
        try {
            if (dragged.isFolder) {
                await fetchApi(`/media/folders/${dragged.id}`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ parent_id: targetFolderId })
                });
                setFolders(folders.map(f => f.id === dragged.id ? {...f, parent_id: targetFolderId} : f));
            } else {
                await fetchApi(`/media/${dragged.id}/move`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ folder_id: targetFolderId })
                });
                setAssets(assets.map(a => a.id === dragged.id ? {...a, folderId: targetFolderId} : a));
            }
        } catch (err) { alert("Lỗi khi di chuyển"); }
    };
"""
        content = content.replace("    const handleDrop = (e: React.DragEvent) => {", move_func + "\n    const handleDrop = (e: React.DragEvent) => {")

    # 3. Breadcrumb drop
    breadcrumb_replace = """<button 
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
                            >"""
    content = content.replace("<button onClick={() => setPathStack([])} className=\"hover:text-white transition-colors\">", breadcrumb_replace)

    breadcrumb_item_replace = """<button 
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
                            >"""
    content = content.replace("<button onClick={() => setPathStack(pathStack.slice(0, index + 1))} className=\"hover:text-white transition-colors font-semibold truncate max-w-[180px]\">", breadcrumb_item_replace)

    # 4. Folder drag & drop
    folder_replace = """<div 
                            key={folder.id} 
                            draggable
                            onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedItem({ id: folder.id, isFolder: true });
                            }}
                            onDragEnd={() => setDraggedItem(null)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (folder.type === 'folder' && draggedItem && draggedItem.id !== folder.id) {
                                    setDragTarget(folder.id);
                                }
                            }}
                            onDragLeave={() => setDragTarget(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragTarget(null);
                                if (folder.type === 'folder' && draggedItem && draggedItem.id !== folder.id) {
                                    handleDropMove(draggedItem, folder.id);
                                }
                            }}
                            onClick={() => folder.type === 'album' ? window.open(`/album/${folder.short_token}`, '_blank') : setPathStack(prev => [...prev, { id: folder.id, name: folder.name, type: folder.type }])}
                            onContextMenu={(e) => handleItemContextMenu(e, folder, true)}
                            className={`rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all border ${dragTarget === folder.id ? 'border-[#D84040] bg-[#D84040]/20 scale-[1.02]' : 'border-[#2E2020] bg-[#1D1616]/40 hover:border-[#D84040]/70'} group`}
                        >"""
    # Use regex for flexibility, but let's be careful. The original string has a specific format.
    import re
    # We replace the div starting at <div key={folder.id} to className="... group">
    folder_regex = r'<div\s*key=\{folder\.id\}\s*onClick=\{[^\}]+\}\s*onContextMenu=\{[^\}]+\}\s*className="[^"]*group"\s*>'
    # Actually since it was recently modified with album:
    folder_regex_album = r'<div\s*key=\{folder\.id\}\s*onClick=\{[^\}]+\}\s*onContextMenu=\{[^\}]+\}\s*className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all border border-\[\#2E2020\] bg-\[\#1D1616\]/40 hover:border-\[\#D84040\]/70 group"\s*>'
    content = re.sub(folder_regex_album, folder_replace, content, flags=re.MULTILINE|re.DOTALL)

    # If the regex fails, it means we need a simpler replacement or the exact string. Let's try to match it directly if possible, or we'll see if it applied.
    
    # 5. File drag
    file_replace = """<div 
                                key={asset.id} 
                                draggable
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDraggedItem({ id: asset.id, isFolder: false });
                                }}
                                onDragEnd={() => setDraggedItem(null)}
                                className="rounded-xl overflow-hidden group cursor-pointer flex flex-col hover:border-[#D84040]/70 transition-all" 
                                style={{ background: "rgba(36, 28, 28, 0.6)", border: "1px solid rgba(46, 32, 32, 0.6)" }}
                                onContextMenu={(e) => handleItemContextMenu(e, asset, false)}
                                onClick={() => setPreviewAsset(asset)}
                            >"""
    file_regex = r'<div\s*key=\{asset\.id\}\s*className="rounded-xl overflow-hidden group cursor-pointer flex flex-col"\s*style=\{\{ background: "rgba\(36, 28, 28, 0\.6\)", border: "1px solid rgba\(46, 32, 32, 0\.6\)" \}\}\s*onContextMenu=\{[^\}]+\}\s*onClick=\{[^\}]+\}\s*>'
    content = re.sub(file_regex, file_replace, content, flags=re.MULTILINE|re.DOTALL)
    
    with open(filepath, "w") as f:
        f.write(content)

apply_patch("src/modules/admin/pages/MediaLibraryPage.tsx")
apply_patch("src/modules/crew/pages/CrewMediaLibraryPage.tsx")

