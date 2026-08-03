import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchApi } from "../utils/apiClient";
import { Loader2, Heart, Star, MessageSquare, X, Send } from "lucide-react";

export function PublicAlbumPage() {
    const { token } = useParams<{ token: string }>();
    const [album, setAlbum] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clientName, setClientName] = useState("");
    const [hasEnteredName, setHasEnteredName] = useState(false);
    
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        if (!token) return;
        fetchApi(`/projects/albums/public/${token}`)
            .then(res => setAlbum(res))
            .catch(err => setError("Album không tồn tại hoặc đã bị xoá."))
            .finally(() => setLoading(false));
    }, [token]);

    const handleInteract = async (photoId: string, type: 'like' | 'star' | 'comment', text?: string) => {
        if (!hasEnteredName) {
            alert("Vui lòng nhập tên trước khi tương tác");
            return;
        }
        
        try {
            const res = await fetchApi(`/projects/albums/public/${token}/interact`, {
                method: "POST",
                body: JSON.stringify({
                    client_name: clientName,
                    interaction_type: type,
                    comment_text: text || null
                })
            });
            
            // Update local state
            setAlbum((prev: any) => ({
                ...prev,
                photos: prev.photos.map((p: any) => p.id === photoId ? {
                    ...p,
                    interactions: [...(p.interactions || []), res]
                } : p)
            }));
            
            if (type === 'comment') {
                setCommentText("");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi gửi tương tác");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-white" /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500">{error}</div>;
    if (!album) return null;

    if (!hasEnteredName) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black" style={{ backgroundImage: `url(${album.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                <div className="relative z-10 bg-[#1D1616]/90 p-8 rounded-xl border border-[#3A2A2A] max-w-md w-full text-center shadow-2xl">
                    <h1 className="text-2xl font-bold text-white mb-2">{album.title}</h1>
                    <p className="text-gray-400 mb-6 text-sm">{album.photos?.length || 0} Photos</p>
                    <input 
                        type="text" 
                        placeholder="Nhập tên của bạn..." 
                        className="w-full bg-[#0a0a0a] border border-[#3A2A2A] text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-red-500"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && clientName.trim() && setHasEnteredName(true)}
                    />
                    <button 
                        onClick={() => setHasEnteredName(true)}
                        disabled={!clientName.trim()}
                        className="w-full bg-[#D84040] hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Xem Album
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold">{album.title}</h1>
                        <p className="text-gray-400 mt-1">{album.photos?.length || 0} Photos · Xin chào, {clientName}</p>
                    </div>
                </header>
                
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    {album.photos?.map((photo: any) => (
                        <div key={photo.id} className="relative group rounded-lg overflow-hidden cursor-pointer bg-white/5 border border-white/10" onClick={() => setSelectedPhoto(photo)}>
                            <img src={photo.thumbnail_url || photo.web_content_url} alt="" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <div className="flex items-center gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); handleInteract(photo.id, 'like'); }} className="text-white hover:text-red-400 flex items-center gap-1"><Heart size={16} /> {photo.interactions?.filter((i:any)=>i.interaction_type==='like').length || 0}</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleInteract(photo.id, 'star'); }} className="text-white hover:text-yellow-400 flex items-center gap-1"><Star size={16} /> {photo.interactions?.filter((i:any)=>i.interaction_type==='star').length || 0}</button>
                                    <span className="text-white flex items-center gap-1 ml-auto"><MessageSquare size={16} /> {photo.interactions?.filter((i:any)=>i.interaction_type==='comment').length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col md:flex-row">
                    <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-50 text-white/50 hover:text-white bg-black/50 p-2 rounded-full"><X size={24} /></button>
                    
                    <div className="flex-1 flex items-center justify-center p-4">
                        <img src={selectedPhoto.web_content_url || selectedPhoto.thumbnail_url} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    
                    <div className="w-full md:w-[400px] bg-[#111] border-l border-white/10 flex flex-col h-[50vh] md:h-full">
                        <div className="p-4 border-b border-white/10 flex gap-4">
                            <button onClick={() => handleInteract(selectedPhoto.id, 'like')} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center items-center gap-2 transition-colors"><Heart size={18} className={selectedPhoto.interactions?.some((i:any) => i.interaction_type === 'like' && i.client_name === clientName) ? "text-red-500 fill-red-500" : ""} /> Like ({selectedPhoto.interactions?.filter((i:any)=>i.interaction_type==='like').length || 0})</button>
                            <button onClick={() => handleInteract(selectedPhoto.id, 'star')} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center items-center gap-2 transition-colors"><Star size={18} className={selectedPhoto.interactions?.some((i:any) => i.interaction_type === 'star' && i.client_name === clientName) ? "text-yellow-500 fill-yellow-500" : ""} /> Star ({selectedPhoto.interactions?.filter((i:any)=>i.interaction_type==='star').length || 0})</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedPhoto.interactions?.filter((i:any)=>i.interaction_type==='comment').length === 0 && (
                                <p className="text-white/30 text-center text-sm italic mt-10">Chưa có bình luận nào</p>
                            )}
                            {selectedPhoto.interactions?.filter((i:any)=>i.interaction_type==='comment').map((comment: any) => (
                                <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-sm text-[#D84040]">{comment.client_name}</span>
                                        <span className="text-[10px] text-white/40">{new Date(comment.created_at).toLocaleTimeString('vi-VN')}</span>
                                    </div>
                                    <p className="text-sm text-white/80">{comment.comment_text}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Viết bình luận..." 
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D84040]"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && commentText.trim() && handleInteract(selectedPhoto.id, 'comment', commentText)}
                                />
                                <button 
                                    onClick={() => commentText.trim() && handleInteract(selectedPhoto.id, 'comment', commentText)}
                                    disabled={!commentText.trim()}
                                    className="bg-[#D84040] text-white p-2 rounded-lg disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
