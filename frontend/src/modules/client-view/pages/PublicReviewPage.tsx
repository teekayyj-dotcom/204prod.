import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchApi } from "../../../utils/apiClient";
import { ClientPlaybackPage } from "./ClientPlaybackPage";
import { Loader2, ArrowRight } from "lucide-react";

interface ReviewLinkPublic {
    token: string;
    project_slug: string;
    video_url: string;
    published: boolean;
}

export function PublicReviewPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewData, setReviewData] = useState<ReviewLinkPublic | null>(null);
    const [guestName, setGuestName] = useState("");
    const [isNameSet, setIsNameSet] = useState(false);

    // Check if user is logged in
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const isLoggedIn = !!userObj.access_token;

    useEffect(() => {
        if (!token) return;

        fetchApi<ReviewLinkPublic>(`/projects/public/review/${token}`)
            .then((data) => {
                if (!data.published) {
                    setError("Dự án này chưa được publish hoặc link chia sẻ đã bị khóa.");
                } else {
                    setReviewData(data);
                }
            })
            .catch((err) => {
                console.error("Failed to load review link:", err);
                setError("Liên kết không hợp lệ hoặc đã hết hạn.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token]);

    // If the user is logged in and link is valid, redirect them to the proper page based on their role
    useEffect(() => {
        if (isLoggedIn && reviewData) {
            const role = userObj.role;
            const videoParam = `?video=${encodeURIComponent(reviewData.video_url)}`;
            if (role === "admin") {
                navigate(`/admin/projects/${reviewData.project_slug}/playback${videoParam}`);
            } else if (role === "crew" || role === "editor") {
                navigate(`/crew-dashboard/projects/${reviewData.project_slug}/playback${videoParam}`);
            } else {
                navigate(`/client/projects/${reviewData.project_slug}/playback${videoParam}`);
            }
        }
    }, [isLoggedIn, reviewData, navigate, userObj.role]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0707] text-white">
                <Loader2 className="animate-spin mr-2" size={24} /> Đang tải...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0707] text-white">
                <div className="text-center p-8 bg-[#141010] rounded-xl border border-[#2A1F1F]">
                    <h2 className="text-xl font-bold mb-4 text-red-500">Lỗi</h2>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    if (isLoggedIn) {
        return null; // Redirecting
    }

    if (!isNameSet) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0A0707] text-white p-4">
                <div className="w-full max-w-md p-8 bg-[#141010] rounded-xl border border-[#2A1F1F]">
                    <h2 className="text-2xl font-bold mb-2">Chào mừng bạn!</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Vui lòng nhập tên của bạn để bắt đầu xem và để lại phản hồi cho video này.
                    </p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); if (guestName.trim()) setIsNameSet(true); }}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tên của bạn</label>
                            <input
                                type="text"
                                className="w-full bg-[#1A1414] border border-[#2A1F1F] rounded-lg p-3 text-white focus:outline-none focus:border-[#E50914] transition-colors"
                                placeholder="Nhập tên..."
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!guestName.trim()}
                            className="w-full py-3 bg-[#E50914] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Vào xem video <ArrowRight size={16} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <ClientPlaybackPage 
            guestProjectSlug={reviewData!.project_slug}
            guestVideoUrl={reviewData!.video_url}
            guestName={guestName}
            isGuest={true}
        />
    );
}
