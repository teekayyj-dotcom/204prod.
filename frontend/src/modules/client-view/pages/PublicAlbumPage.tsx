import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchApi } from "../utils/apiClient";
import { Loader2, Heart, Star, MessageSquare, X, Send, ArrowLeft, Image as ImageIcon, ExternalLink, Download } from "lucide-react";

export function PublicAlbumPage() {
    const { token } = useParams<{ token: string }>();
    const [album, setAlbum] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Auto-fill client name from previous sessions or logins if available
    const [clientName, setClientName] = useState(() => {
        return localStorage.getItem("204_album_guest_name") || "";
    });
    const [hasEnteredName, setHasEnteredName] = useState(() => {
        return Boolean(localStorage.getItem("204_album_guest_name"));
    });
    
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        if (!token) return;
        fetchApi(`/projects/albums/public/${token}`)
            .then(res => setAlbum(res))
            .catch(err => setError("Album không tồn tại hoặc đã bị xoá."))
            .finally(() => setLoading(false));
    }, [token]);

    const handleStartViewing = (name?: string) => {
        const finalName = (name !== undefined ? name : clientName).trim() || "Khách xem";
        setClientName(finalName);
        localStorage.setItem("204_album_guest_name", finalName);
        setHasEnteredName(true);
    };

    const getPhotoUrl = (photo: any, highRes = false) => {
        if (!photo) return "";
        const fileId = photo.file_id || photo.id;
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=${highRes ? 'w2000' : 'w600'}`;
        }
        if (photo.thumbnail_url) {
            if (highRes) {
                return photo.thumbnail_url.replace(/=s\d+.*$/, '=s2000').replace(/=w\d+.*$/, '=s2000');
            }
            return photo.thumbnail_url;
        }
        return photo.web_content_url || "";
    };

    const handleInteract = async (photoId: string, type: 'like' | 'star' | 'comment', text?: string) => {
        const user = clientName.trim() || "Khách xem";
        
        try {
            const res = await fetchApi(`/projects/albums/public/${token}/interact`, {
                method: "POST",
                body: JSON.stringify({
                    client_name: user,
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
            
            if (selectedPhoto && selectedPhoto.id === photoId) {
                setSelectedPhoto((prev: any) => ({
                    ...prev,
                    interactions: [...(prev.interactions || []), res]
                }));
            }
            
            if (type === 'comment') {
                setCommentText("");
            }
        } catch (err) {
            alert("Có lỗi xảy ra khi gửi tương tác");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0909] text-white gap-3">
                <Loader2 className="animate-spin text-[#D84040]" size={36} />
                <p className="text-sm text-gray-400">Đang tải Album ảnh Google Drive...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0909] text-white p-6 text-center">
                <div className="bg-[#1D1616] p-8 rounded-2xl border border-red-500/30 max-w-md w-full">
                    <p className="text-red-400 font-semibold mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2.5 bg-[#D84040] hover:bg-red-600 rounded-lg text-white font-medium text-sm transition-all"
                    >
                        Tải lại trang
                    </button>
                </div>
            </div>
        );
    }

    if (!album) return null;

    const bgUrl = album.background_url || (album.photos?.[0] ? getPhotoUrl(album.photos[0], true) : "");

    if (!hasEnteredName) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black relative p-4" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black/75 backdrop-blur-md"></div>
                <div className="relative z-10 bg-[#1D1616]/95 p-8 rounded-2xl border border-[#3A2A2A] max-w-md w-full text-center shadow-2xl">
                    <div className="w-12 h-12 rounded-full bg-[#D84040]/10 border border-[#D84040]/30 flex items-center justify-center mx-auto mb-4 text-[#D84040]">
                        <ImageIcon size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{album.title}</h1>
                    <p className="text-gray-400 mb-6 text-sm">{album.photos?.length || 0} ảnh chất lượng cao</p>
                    <input 
                        type="text" 
                        placeholder="Nhập tên của bạn (để like, bình luận)..." 
                        className="w-full bg-[#0a0a0a] border border-[#3A2A2A] text-white px-4 py-3 rounded-lg mb-3 focus:outline-none focus:border-[#D84040] text-sm"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleStartViewing()}
                    />
                    <button 
                        onClick={() => handleStartViewing()}
                        className="w-full bg-[#D84040] hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all text-sm mb-2 shadow-lg shadow-red-900/30"
                    >
                        Xem Album
                    </button>
                    <button 
                        onClick={() => handleStartViewing("Khách xem")}
                        className="text-xs text-gray-400 hover:text-white transition-colors py-1"
                    >
                        Bỏ qua & Xem trực tiếp dưới tên Khách →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0808] text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/10 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            <span>204PROD ALBUM</span>
                            <span>•</span>
                            <span>{album.photos?.length || 0} Photos</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">{album.title}</h1>
                        <p className="text-gray-400 mt-1.5 text-sm">
                            Đang xem dưới tên: <span className="text-[#D84040] font-semibold">{clientName || "Khách"}</span> 
                            <button 
                                onClick={() => setHasEnteredName(false)} 
                                className="ml-2 text-xs text-gray-500 hover:text-gray-300 underline"
                            >
                                Đổi tên
                            </button>
                        </p>
                    </div>
                </header>
                
                <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                    {album.photos?.map((photo: any) => {
                        const imgThumb = getPhotoUrl(photo, false);
                        const likeCount = photo.interactions?.filter((i: any) => i.interaction_type === 'like').length || 0;
                        const starCount = photo.interactions?.filter((i: any) => i.interaction_type === 'star').length || 0;
                        const commentCount = photo.interactions?.filter((i: any) => i.interaction_type === 'comment').length || 0;

                        return (
                            <div 
                                key={photo.id} 
                                className="relative group rounded-xl overflow-hidden cursor-pointer bg-white/5 border border-white/10 break-inside-avoid hover:border-[#D84040]/50 transition-all duration-300 shadow-md" 
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <img 
                                    src={imgThumb} 
                                    alt="" 
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" 
                                    loading="lazy" 
                                    onError={(e: any) => {
                                        if (photo.file_id) {
                                            e.currentTarget.src = `https://lh3.googleusercontent.com/d/${photo.file_id}`;
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleInteract(photo.id, 'like'); }} 
                                            className="text-white hover:text-red-400 flex items-center gap-1 text-xs font-semibold"
                                        >
                                            <Heart size={14} className={photo.interactions?.some((i: any) => i.interaction_type === 'like' && i.client_name === clientName) ? "fill-red-500 text-red-500" : ""} /> 
                                            {likeCount}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleInteract(photo.id, 'star'); }} 
                                            className="text-white hover:text-yellow-400 flex items-center gap-1 text-xs font-semibold"
                                        >
                                            <Star size={14} className={photo.interactions?.some((i: any) => i.interaction_type === 'star' && i.client_name === clientName) ? "fill-yellow-400 text-yellow-400" : ""} /> 
                                            {starCount}
                                        </button>
                                        <span className="text-white flex items-center gap-1 ml-auto text-xs font-semibold">
                                            <MessageSquare size={14} /> 
                                            {commentCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col md:flex-row backdrop-blur-md">
                    <button 
                        onClick={() => setSelectedPhoto(null)} 
                        className="absolute top-4 right-4 z-50 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
                    >
                        <X size={22} />
                    </button>
                    
                    {/* Main Image View */}
                    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0 overflow-hidden relative select-none">
                        <img 
                            src={getPhotoUrl(selectedPhoto, true)} 
                            alt="" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all" 
                            onError={(e: any) => {
                                const fallback = selectedPhoto.thumbnail_url || selectedPhoto.web_content_url;
                                if (fallback && e.currentTarget.src !== fallback) {
                                    e.currentTarget.src = fallback;
                                }
                            }}
                        />
                    </div>
                    
                    {/* Sidebar Comments & Interactions */}
                    <div className="w-full md:w-[380px] lg:w-[420px] bg-[#140f0f] border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[45vh] md:h-full">
                        <div className="p-4 border-b border-white/10 flex gap-3">
                            <button 
                                onClick={() => handleInteract(selectedPhoto.id, 'like')} 
                                className={`flex-1 py-2.5 rounded-lg flex justify-center items-center gap-2 text-xs font-semibold transition-all border ${
                                    selectedPhoto.interactions?.some((i: any) => i.interaction_type === 'like' && i.client_name === clientName)
                                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                }`}
                            >
                                <Heart size={16} className={selectedPhoto.interactions?.some((i: any) => i.interaction_type === 'like' && i.client_name === clientName) ? "fill-red-500 text-red-500" : ""} /> 
                                Like ({selectedPhoto.interactions?.filter((i: any) => i.interaction_type === 'like').length || 0})
                            </button>
                            <button 
                                onClick={() => handleInteract(selectedPhoto.id, 'star')} 
                                className={`flex-1 py-2.5 rounded-lg flex justify-center items-center gap-2 text-xs font-semibold transition-all border ${
                                    selectedPhoto.interactions?.some((i: any) => i.interaction_type === 'star' && i.client_name === clientName)
                                        ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                }`}
                            >
                                <Star size={16} className={selectedPhoto.interactions?.some((i: any) => i.interaction_type === 'star' && i.client_name === clientName) ? "fill-yellow-400 text-yellow-400" : ""} /> 
                                Star ({selectedPhoto.interactions?.filter((i: any) => i.interaction_type === 'star').length || 0})
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedPhoto.interactions?.filter((i: any) => i.interaction_type === 'comment').length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <MessageSquare size={28} className="text-white/20 mb-2" />
                                    <p className="text-white/40 text-xs italic">Chưa có bình luận nào cho ảnh này</p>
                                </div>
                            )}
                            {selectedPhoto.interactions?.filter((i: any) => i.interaction_type === 'comment').map((comment: any) => (
                                <div key={comment.id} className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-semibold text-xs text-[#D84040]">{comment.client_name}</span>
                                        <span className="text-[10px] text-white/40">{new Date(comment.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-white/90 leading-relaxed">{comment.comment_text}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 border-t border-white/10 bg-[#110d0d]">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder={`Bình luận dưới tên ${clientName || "Khách"}...`} 
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D84040] text-white"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && commentText.trim() && handleInteract(selectedPhoto.id, 'comment', commentText)}
                                />
                                <button 
                                    onClick={() => commentText.trim() && handleInteract(selectedPhoto.id, 'comment', commentText)}
                                    disabled={!commentText.trim()}
                                    className="bg-[#D84040] hover:bg-red-600 text-white px-3 py-2 rounded-lg disabled:opacity-40 transition-all"
                                >
                                    <Send size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
