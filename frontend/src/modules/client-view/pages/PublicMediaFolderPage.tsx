// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchApi, API_BASE_URL } from "../../../utils/apiClient";
import { Loader2, FileText, ImageIcon, Video, Archive, Figma, Download, X } from "lucide-react";
import { Header } from "../../client-site/components/Header";
import { Footer } from "../../client-site/components/Footer";
import { Helmet } from "react-helmet";

const typeIcons = { document: FileText, image: ImageIcon, video: Video, archive: Archive, design: Figma };

const getImagePreviewUrl = (asset) => {
    if (asset.kind !== "image" && asset.type !== "image") return asset.url;
    return `${API_BASE_URL}/media/${asset.id}/proxy?width=800`;
};

export function PublicMediaFolderPage() {
    const { id } = useParams();
    const [folder, setFolder] = useState<any>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewAsset, setPreviewAsset] = useState<any>(null);

    useEffect(() => {
        const loadFolderData = async () => {
            try {
                const folderData = await fetchApi(`/media/folders/${id}`);
                setFolder(folderData);
                
                // Only load assets if it's a published folder
                if (folderData.is_published) {
                    const assetsData = await fetchApi(`/media?folder_id=${id}`);
                    const mapped = assetsData.map(m => ({
                        id: m.id,
                        name: (m.kind === 'video' && m.caption) ? m.caption : (m.url.split('/').pop() || m.id),
                        type: m.kind,
                        size: m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : "Unknown",
                        uploaded: m.created_at ? new Date(m.created_at).toLocaleDateString() : "",
                        image: m.url,
                        previewImage: (m.kind === 'video' && m.url?.includes('/play_1080p.mp4')) ? m.url.replace('/play_1080p.mp4', '/thumbnail.jpg') : (m.thumbnail_url || getImagePreviewUrl(m))
                    }));
                    setAssets(mapped);
                } else {
                    setError("This folder is not public.");
                }
            } catch (err) {
                setError("Folder not found or you don't have permission.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadFolderData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0707] text-[#EEEEEE] flex flex-col">
                <Header />
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 size={32} className="animate-spin text-[#D84040]" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !folder) {
        return (
            <div className="min-h-screen bg-[#0A0707] text-[#EEEEEE] flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <Archive size={48} className="text-[#3A2A2A] mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Folder Unavailable</h2>
                    <p className="text-[#888]">{error || "The folder you are looking for does not exist."}</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0707] text-[#EEEEEE] flex flex-col">
            <Helmet>
                <title>{folder.name} | Shared Media | 204PROD.</title>
            </Helmet>
            <Header />
            
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 pt-28">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">{folder.name}</h1>
                    <p className="text-[#888] text-sm">Shared Media Folder • {assets.length} items</p>
                </div>

                {assets.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-[#2A1F1F] rounded-2xl bg-[#1A1A1A]/30">
                        <ImageIcon size={40} className="mx-auto text-[#3A2A2A] mb-4" />
                        <h3 className="text-white font-medium mb-1">Folder is empty</h3>
                        <p className="text-[#666] text-sm">There are no media files in this folder.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {assets.map(asset => {
                            const Icon = typeIcons[asset.type] || FileText;
                            
                            return (
                                <div key={asset.id} onClick={() => setPreviewAsset(asset)} className="group cursor-pointer">
                                    <div className="aspect-square bg-[#1A1A1A] rounded-xl mb-3 overflow-hidden border border-[#2A1F1F] group-hover:border-[#D84040]/50 transition-colors relative">
                                        {(asset.type === 'image' || asset.type === 'video') ? (
                                            <img src={asset.previewImage} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon size={32} className="text-[#555] group-hover:text-[#888] transition-colors" />
                                            </div>
                                        )}
                                        {asset.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                    <Video size={18} className="text-white ml-0.5" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-medium text-[#EEEEEE] truncate group-hover:text-white transition-colors">{asset.name}</h4>
                                    <p className="text-xs text-[#666] mt-0.5">{asset.size}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />

            {/* Preview Modal */}
            {previewAsset && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col backdrop-blur-sm">
                    <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-white font-medium">{previewAsset.name}</h3>
                            <span className="text-[#888] text-xs px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A1F1F] uppercase">{previewAsset.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={previewAsset.image} download target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
                                <Download size={20} />
                            </a>
                            <button onClick={() => setPreviewAsset(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#D84040]/10 hover:text-[#D84040] text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex justify-center items-center p-6 overflow-hidden">
                        {previewAsset.type === 'image' && (
                            <img src={previewAsset.image} alt={previewAsset.name} className="max-w-full max-h-full object-contain" />
                        )}
                        {previewAsset.type === 'video' && (
                            <video src={previewAsset.image} controls autoPlay className="max-w-full max-h-full outline-none" />
                        )}
                        {previewAsset.type !== 'image' && previewAsset.type !== 'video' && (
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-2xl bg-[#1A1A1A] flex items-center justify-center mb-6">
                                    <FileText size={40} className="text-[#555]" />
                                </div>
                                <p className="text-white mb-6 font-medium">No preview available for this file type</p>
                                <a href={previewAsset.image} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-xl bg-[#D84040] text-white font-bold hover:bg-[#E84040] transition-colors flex items-center gap-2">
                                    <Download size={18} /> Download File
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
