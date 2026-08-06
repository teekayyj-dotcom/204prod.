import re

def apply_patch_folder(filepath):
    with open(filepath, "r") as f:
        content = f.read()

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
    folder_regex = r'<div\s*key=\{folder\.id\}\s*onClick=\{[^\}]+\}\s*onContextMenu=\{[^\}]+\}\s*className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all border border-\[\#2E2020\] bg-\[\#1D1616\]/40 hover:border-\[\#D84040\]/70 group"\s*>'
    content = re.sub(folder_regex, folder_replace, content, flags=re.MULTILINE|re.DOTALL)
    
    with open(filepath, "w") as f:
        f.write(content)

apply_patch_folder("src/modules/admin/pages/MediaLibraryPage.tsx")

