import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Play,
    Pause,
    Check,
    X,
    MessageSquare,
    Loader2,
    Clock,
    Trash2,
    Maximize2,
    AlertCircle,
    Rewind,
    FastForward,
    Gauge
} from "lucide-react";
import { fetchApi } from "../utils/apiClient";

interface FeedbackItem {
    id: number;
    project_slug: string;
    user_id: string;
    timecode: number;
    position_x: number;
    position_y: number;
    content: string;
    status: string;
    created_at: string;
    reply_content?: string;
    reply_author?: string;
    reply_at?: string;
}

interface ProjectData {
    title: string;
    slug: string;
    video_url?: string;
    cover_image?: string;
}

export function ClientPlaybackPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = location.pathname.startsWith("/admin");

    const [project, setProject] = useState<ProjectData | null>(null);
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Reply editing state
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");

    // Video state
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    // Send command to Bunny Stream iframe via playerjs postMessage protocol
    const sendBunnyCommand = (method: string, value?: any) => {
        if (!iframeRef.current?.contentWindow) return;
        const msg: any = { method };
        if (value !== undefined) msg.value = value;
        iframeRef.current.contentWindow.postMessage(JSON.stringify(msg), "*");
    };

    const handleSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    };

    // New comment pin drafting state
    const [tempPin, setTempPin] = useState<{ x: number; y: number; time: number } | null>(null);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    // Highlight state
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const lastClickedCommentIdRef = useRef<number | null>(null);

    // Sidebar comment state
    const [sidebarComment, setSidebarComment] = useState("");

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            fetchApi<ProjectData>(`/projects/${id}`),
            fetchApi<FeedbackItem[]>(`/projects/${id}/feedback`)
        ])
            .then(([projData, feedbackData]) => {
                setProject(projData);
                setFeedbacks(feedbackData);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading playback data:", err);
                setLoading(false);
            });
    }, [id]);

    // Handle play/pause — works for both native video and Bunny iframe
    const togglePlay = () => {
        if (iframeRef.current) {
            if (isPlaying) {
                sendBunnyCommand("pause");
            } else {
                sendBunnyCommand("play");
                setTempPin(null);
                setCommentText("");
            }
            setIsPlaying(!isPlaying);
        } else if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setTempPin(null);
                setCommentText("");
            } else {
                videoRef.current.pause();
            }
        }
    };

    // Listen for Bunny Stream playerjs postMessage events
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (!iframeRef.current) return;
            try {
                const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
                if (data.event === "timeupdate" && data.value) {
                    setCurrentTime(data.value.seconds ?? data.value.currentTime ?? 0);
                    if (data.value.duration) setDuration(data.value.duration);
                } else if (data.event === "play") {
                    setIsPlaying(true);
                } else if (data.event === "pause") {
                    setIsPlaying(false);
                } else if (data.event === "ended") {
                    setIsPlaying(false);
                } else if (data.event === "ready") {
                    // Subscribe to all events once ready
                    sendBunnyCommand("addEventListener", "timeupdate");
                    sendBunnyCommand("addEventListener", "play");
                    sendBunnyCommand("addEventListener", "pause");
                    sendBunnyCommand("addEventListener", "ended");
                    sendBunnyCommand("getDuration");
                }
            } catch (_) { /* ignore non-playerjs messages */ }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // Keyboard shortcuts for video controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === "INPUT" ||
                activeEl.tagName === "TEXTAREA" ||
                activeEl.getAttribute("contenteditable") === "true"
            )) {
                return;
            }

            if (e.key === " ") {
                e.preventDefault();
                togglePlay();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                const newTime = Math.max(0, currentTime - 10);
                if (videoRef.current) { videoRef.current.currentTime = newTime; }
                else { sendBunnyCommand("seekTo", newTime); }
                setCurrentTime(newTime);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                const newTime = Math.min(duration || 9999, currentTime + 10);
                if (videoRef.current) { videoRef.current.currentTime = newTime; }
                else { sendBunnyCommand("seekTo", newTime); }
                setCurrentTime(newTime);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [duration, currentTime, isPlaying]);

    // Loop to update playhead time at millisecond precision during playback
    useEffect(() => {
        let animationFrameId: number;

        const updateTimeLoop = () => {
            if (videoRef.current && !videoRef.current.paused) {
                setCurrentTime(videoRef.current.currentTime);
                animationFrameId = requestAnimationFrame(updateTimeLoop);
            }
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(updateTimeLoop);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying]);

    // Video time/duration updates
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const curr = videoRef.current.currentTime;
        setCurrentTime(curr);

        // If the user recently clicked a comment, see if the playhead is still near it
        if (lastClickedCommentIdRef.current !== null) {
            const clickedComment = feedbacks.find(f => f.id === lastClickedCommentIdRef.current);
            if (clickedComment && Math.abs(clickedComment.timecode - curr) < 1.0) {
                // Keep the clicked comment highlighted
                setHighlightedId(clickedComment.id);
                const el = document.getElementById(`comment-card-${clickedComment.id}`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
                return;
            } else {
                // User has moved away or played past it, clear click lock
                lastClickedCommentIdRef.current = null;
            }
        }

        // Find active comment to highlight in sidebar (narrower window to prevent overlapping hover highlight jumps)
        const active = feedbacks.find(f => Math.abs(f.timecode - curr) < 0.8);
        if (active) {
            setHighlightedId(active.id);
            // Auto scroll sidebar element into view
            const el = document.getElementById(`comment-card-${active.id}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        } else {
            setHighlightedId(null);
        }
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
        videoRef.current.playbackRate = playbackSpeed;
    };

    // Seek video from timeline click — works for both native video and Bunny iframe
    const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const targetTime = percentage * duration;
        if (videoRef.current) {
            videoRef.current.currentTime = targetTime;
        } else {
            sendBunnyCommand("seekTo", targetTime);
        }
        setCurrentTime(targetTime);
    };

    // Specific click-to-pin target calculation
    const handleVideoFrameClick = (e: React.MouseEvent<HTMLElement>) => {
        if (!videoRef.current) return;

        // Pause video on click
        videoRef.current.pause();
        setIsPlaying(false);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const time = videoRef.current.currentTime;

        setTempPin({ x, y, time });
    };

    // Submit new feedback item
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempPin || !commentText.trim() || !id) return;

        setSubmittingComment(true);
        try {
            const payload = {
                timecode: parseFloat(tempPin.time.toFixed(3)),
                position_x: parseFloat(tempPin.x.toFixed(2)),
                position_y: parseFloat(tempPin.y.toFixed(2)),
                content: commentText.trim(),
                user_id: isAdmin ? "Admin" : "Alex Johnson",
                status: "Open"
            };

            const created = await fetchApi<FeedbackItem>(`/projects/${id}/feedback`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            setFeedbacks(prev => [...prev, created].sort((a, b) => a.timecode - b.timecode));
            setTempPin(null);
            setCommentText("");
        } catch (err) {
            console.error("Failed to save feedback comment:", err);
            alert("Không thể lưu góp ý. Vui lòng thử lại.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleSidebarCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sidebarComment.trim() || !id) return;

        try {
            const payload = {
                timecode: parseFloat(currentTime.toFixed(3)),
                position_x: -1,
                position_y: -1,
                content: sidebarComment.trim(),
                user_id: isAdmin ? "Admin" : "Alex Johnson",
                status: "Open"
            };

            const created = await fetchApi<FeedbackItem>(`/projects/${id}/feedback`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            setFeedbacks(prev => [...prev, created].sort((a, b) => a.timecode - b.timecode));
            setSidebarComment("");
        } catch (err) {
            console.error("Failed to save sidebar feedback comment:", err);
            alert("Không thể lưu góp ý. Vui lòng thử lại.");
        }
    };

    const handleSaveReply = async (fbId: number) => {
        if (!replyText.trim()) return;
        try {
            const updated = await fetchApi<FeedbackItem>(`/projects/feedback/${fbId}/reply`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    reply_content: replyText.trim(),
                    reply_author: isAdmin ? "Admin" : "Alex Johnson"
                })
            });
            setFeedbacks(prev => prev.map(f => f.id === fbId ? updated : f));
            setReplyingToId(null);
            setReplyText("");
        } catch (err) {
            console.error("Failed to save reply:", err);
            alert("Không thể lưu phản hồi. Vui lòng thử lại.");
        }
    };

    // Resolve or change status of feedback comment
    const handleToggleStatus = async (fbId: number, currentStatus: string) => {
        const nextStatus = currentStatus === "Resolved" ? "Open" : "Resolved";
        try {
            const updated = await fetchApi<FeedbackItem>(`/projects/feedback/${fbId}/status?status_val=${nextStatus}`, {
                method: "PUT"
            });
            setFeedbacks(prev => prev.map(f => f.id === fbId ? updated : f));
        } catch (err) {
            console.error("Failed to toggle status:", err);
        }
    };

    // Delete feedback comment
    const handleDeleteFeedback = async (fbId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa phản hồi này không?")) return;
        try {
            await fetchApi(`/projects/feedback/${fbId}`, {
                method: "DELETE"
            });
            setFeedbacks(prev => prev.filter(f => f.id !== fbId));
            if (tempPin) setTempPin(null);
        } catch (err) {
            console.error("Failed to delete feedback:", err);
        }
    };

    // Helper to format seconds to timecode format MM:SS.mmm
    const formatTimecode = (sec: number) => {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);
        const milliseconds = Math.floor((sec % 1) * 1000);
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0A0707]">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0A0707] text-[#EEEEEE]">
                <AlertCircle size={48} className="text-[#D84040] mb-4" />
                <p className="text-lg font-semibold">Dự án không tồn tại</p>
                <button onClick={() => navigate(isAdmin ? "/admin/projects" : "/client/projects")} className="mt-4 px-4 py-2 bg-[#D84040] rounded-lg text-xs font-bold">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    // Direct sample video fallback
    const defaultSampleVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    // Read selected video from query parameters if present
    const searchParams = new URLSearchParams(location.search);
    const videoUrlParam = searchParams.get("video");
    const videoToPlay = videoUrlParam || project.video_url;

    // Detect YouTube / Vimeo embed (these need an iframe)
    const ytMatch = videoToPlay?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    const vmMatch = videoToPlay?.match(/vimeo\.com\/(\d+)/);
    // Legacy Bunny embed URL (old records before backend fix)
    const bunnyLegacy = !!videoToPlay && /iframe\.mediadelivery\.net\/embed\//.test(videoToPlay);

    const isEmbedVideo = !!(ytMatch || vmMatch || bunnyLegacy);

    const getEmbedUrl = () => {
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&controls=1`;
        if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=0&controls=1`;
        if (bunnyLegacy && videoToPlay) {
            return videoToPlay.includes("?")
                ? `${videoToPlay}&autoplay=false&loop=false&muted=false`
                : `${videoToPlay}?autoplay=false&loop=false&muted=false`;
        }
        return "";
    };

    // Direct playable video (.mp4/.mov/.webm) — Bunny CDN or self-hosted
    const isDirectVideo = !isEmbedVideo && !!videoToPlay;
    const finalVideoSource = isDirectVideo ? videoToPlay : defaultSampleVideo;

    // Filter feedback that is active (showing within 1.5s window of current time)
    const activePins = feedbacks.filter(f => Math.abs(f.timecode - currentTime) < 1.5);

    return (
        <div className="flex h-screen bg-[#0A0707] text-[#EEEEEE] overflow-hidden">

            {/* Left Column: Video Room (75% width) */}
            <div className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden bg-black">
                {/* Top Header */}
                <div className="flex items-center justify-between mb-4 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(isAdmin ? `/admin/projects/${project.slug}` : `/client/projects/${project.slug}`)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#141010] border border-[#2A1F1F] text-gray-400 hover:text-white"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Phòng chiếu phản hồi</span>
                            <h1 className="text-sm font-bold">{project.title}</h1>
                        </div>
                    </div>

                    {isEmbedVideo ? (
                        <div className="px-3 py-1 rounded bg-green-900/20 border border-green-500/25 text-green-400 text-[10px] flex items-center gap-1.5">
                            <Play size={12} fill="currentColor" />
                            <span>Đang chiếu video thật từ Bunny Stream</span>
                        </div>
                    ) : !isDirectVideo && (
                        <div className="px-3 py-1 rounded bg-[#FFC107]/10 border border-[#FFC107]/25 text-[#FFC107] text-[10px] flex items-center gap-1.5 animate-pulse">
                            <AlertCircle size={12} />
                            <span>Đang chiếu bản Demo (Native Player) để hỗ trợ phản hồi tọa độ</span>
                        </div>
                    )}
                </div>

                {/* Video Player Centerpiece */}
                <div className="flex-1 flex items-center justify-center relative w-full h-[65vh] rounded-xl overflow-hidden border border-[#1A1515] bg-[#000]">

                    {isEmbedVideo ? (
                        /* ─── YouTube / Vimeo / legacy Bunny iframe mode ─── */
                        <div className="relative w-full h-full flex flex-col">
                            <iframe
                                ref={iframeRef}
                                src={getEmbedUrl()}
                                className="w-full h-full"
                                style={{ border: "none" }}
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                title={project.title}
                            />
                            {/* Note banner about pin limitation */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-2 text-[10px] text-yellow-400/80 flex items-center gap-2 border-t border-yellow-400/10">
                                <AlertCircle size={11} />
                                Chế độ chiếu Bunny Stream: Góp ý tọa độ frame không khả dụng. Dùng ô Góp ý chung bên phải.
                            </div>
                        </div>
                    ) : (
                        /* ─── Native HTML5 video mode (with pin overlay) ─── */
                        <div className="relative max-w-full max-h-full aspect-video group">

                        <video
                            ref={videoRef}
                            src={finalVideoSource}
                            className="w-full h-full object-contain cursor-crosshair rounded-lg"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onClick={handleVideoFrameClick}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            playsInline
                        />

                        {/* Interactive Overlay to capture click pin coordinates */}
                        <div
                            className="absolute inset-0 cursor-crosshair bg-transparent"
                            onClick={handleVideoFrameClick}
                        />

                        {/* Rendering Active Pins in Realtime */}
                        {activePins.filter(pin => pin.position_x >= 0 && pin.position_y >= 0).map(pin => (
                            <div
                                key={pin.id}
                                className="absolute w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-bounce z-20"
                                style={{
                                    left: `${pin.position_x}%`,
                                    top: `${pin.position_y}%`,
                                    background: pin.status === "Resolved" ? "#4CAF50" : "#D84040",
                                    boxShadow: `0 0 12px ${pin.status === "Resolved" ? "#4CAF50" : "#D84040"}`
                                }}
                                title={pin.content}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                        ))}

                        {/* Rendering Temporary Draft Pin with input popup */}
                        {tempPin && (
                            <>
                                <div
                                    className="absolute w-4.5 h-4.5 rounded-full border-2 border-white bg-[#FFC107] flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-30"
                                    style={{
                                        left: `${tempPin.x}%`,
                                        top: `${tempPin.y}%`,
                                        boxShadow: "0 0 14px #FFC107"
                                    }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-black" />
                                </div>

                                {/* Form Popup at coordinates position */}
                                <form
                                    onSubmit={handleSubmitComment}
                                    className="absolute z-40 bg-[#141010] border border-[#2A1F1F] p-3 rounded-lg shadow-2xl space-y-2 w-64 text-xs transform -translate-x-1/2 mt-3"
                                    style={{
                                        left: `${Math.min(Math.max(tempPin.x, 20), 80)}%`,
                                        top: `${tempPin.y}%`
                                    }}
                                >
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span className="font-semibold text-[#FFC107]">Ghi chú tại {formatTimecode(tempPin.time)}</span>
                                        <button type="button" onClick={() => setTempPin(null)} className="text-gray-500 hover:text-white">
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Nhập nội dung góp ý tại điểm này..."
                                        rows={3}
                                        className="w-full bg-[#1D1616]/30 border border-[#2E2020]/60 rounded p-2 text-xs outline-none text-[#EEEEEE] resize-none focus:border-[#FFC107] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]"
                                        autoFocus
                                        required
                                    />
                                    <div className="flex justify-end gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setTempPin(null)}
                                            className="px-2 py-1 rounded bg-[#2A1F1F] hover:bg-[#3A3A3A] font-semibold text-[10px]"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingComment}
                                            className="px-2 py-1 rounded bg-[#D84040] hover:bg-[#c03030] font-semibold text-[10px]"
                                        >
                                            {submittingComment ? "Đang gửi..." : "Gửi góp ý"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                    )}
                </div>

                {/* Custom Playback Controls & Seek timeline */}
                <div className="space-y-3 mt-4 z-10 bg-[#0A0707] py-2">

                    {/* Timeline Slider bar with markers */}
                    <div className="relative">
                        {/* Interactive Click seek container */}
                        <div
                            onClick={handleTimelineSeek}
                            className="h-2.5 rounded-full bg-[#1A1515] relative cursor-pointer group/seek"
                        >
                            {/* Fill active progress */}
                            <div
                                className="h-full rounded-full bg-[#D84040] relative"
                                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow scale-0 group-hover/seek:scale-100 transition-transform" />
                            </div>

                            {/* Render comment tick markers */}
                            {feedbacks.map(f => {
                                const markerPos = duration > 0 ? (f.timecode / duration) * 100 : 0;
                                const isResolved = f.status === "Resolved";
                                return (
                                    <button
                                        key={f.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (videoRef.current) {
                                                lastClickedCommentIdRef.current = f.id;
                                                setHighlightedId(f.id);
                                                videoRef.current.currentTime = f.timecode;
                                                setCurrentTime(f.timecode);
                                            }
                                        }}
                                        className="absolute top-0 w-1.5 h-2.5 z-20 transform -translate-x-1/2 hover:scale-150 transition-transform"
                                        style={{
                                            left: `${markerPos}%`,
                                            background: isResolved ? "#4CAF50" : "#FFC107",
                                            borderRadius: "2px"
                                        }}
                                        title={`Phản hồi tại ${formatTimecode(f.timecode)}`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline text info and play controls */}
                    <div className="grid grid-cols-3 items-center text-xs text-gray-500">
                        {/* Play controls */}
                        <div className="flex items-center gap-1.5 justify-start">
                            <button
                                onClick={() => {
                                    const newTime = Math.max(0, currentTime - 10);
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = newTime;
                                    } else {
                                        sendBunnyCommand("seekTo", newTime);
                                    }
                                    setCurrentTime(newTime);
                                }}
                                className="w-8 h-8 rounded-full bg-[#1D1616]/40 border border-[#2E2020]/60 hover:bg-[#2A1F1F]/60 hover:border-[#D84040]/70 hover:text-white text-gray-400 flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow"
                                title="Tua lại 10 giây (←)"
                            >
                                <Rewind size={12} />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="w-9 h-9 rounded-full bg-[#D84040] hover:bg-[#c03030] text-white flex items-center justify-center transition-all shadow-md shadow-[#D84040]/15"
                                title="Phát / Tạm dừng (Space)"
                            >
                                {isPlaying ? <Pause size={13} fill="white" /> : <Play size={13} fill="white" className="ml-0.5" />}
                            </button>

                            <button
                                onClick={() => {
                                    const newTime = Math.min(duration || 9999, currentTime + 10);
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = newTime;
                                    } else {
                                        sendBunnyCommand("seekTo", newTime);
                                    }
                                    setCurrentTime(newTime);
                                }}
                                className="w-8 h-8 rounded-full bg-[#1D1616]/40 border border-[#2E2020]/60 hover:bg-[#2A1F1F]/60 hover:border-[#D84040]/70 hover:text-white text-gray-400 flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow"
                                title="Tua đi 10 giây (→)"
                            >
                                <FastForward size={12} />
                            </button>
                        </div>

                        {/* Center Time display */}
                        <div className="flex justify-center">
                            <span className="font-mono text-gray-300 font-semibold text-sm">
                                {formatTimecode(currentTime)} / {formatTimecode(duration)}
                            </span>
                        </div>

                        {/* Playback speed controls - Slide Up Transition */}
                        <div className="flex items-center justify-end gap-2 text-right relative group/speed select-none">
                            <button
                                type="button"
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                className="px-3 py-1.5 bg-[#1D1616]/40 border border-[#2E2020]/60 text-gray-300 rounded text-xs font-bold transition-all hover:border-[#D84040]/70 hover:bg-[#1D1616]/60 hover:text-white flex items-center gap-1.5 shadow backdrop-blur-sm"
                                title="Thay đổi tốc độ phát"
                            >
                                <Gauge size={13} className="text-[#D84040]" />
                                <span>Tốc độ: {playbackSpeed === 1 ? "1.0x" : `${playbackSpeed}x`}</span>
                            </button>

                            {/* Slide up menu container */}
                            <div
                                className={`absolute bottom-full right-0 mb-2 bg-[#141010]/95 backdrop-blur-md border border-[#2E2020] rounded-lg shadow-2xl p-1.5 w-36 z-50 text-left transition-all duration-300 ease-out origin-bottom transform ${showSpeedMenu
                                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                        : "opacity-0 translate-y-4 scale-95 pointer-events-none group-hover/speed:opacity-100 group-hover/speed:translate-y-0 group-hover/speed:scale-100 group-hover/speed:pointer-events-auto"
                                    }`}
                                onMouseLeave={() => setShowSpeedMenu(false)}
                            >
                                <div className="text-[9px] text-gray-500 font-bold px-2 py-1 uppercase tracking-wider border-b border-[#2A1F1F] mb-1">
                                    Chọn tốc độ phát
                                </div>
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                    <button
                                        key={speed}
                                        type="button"
                                        onClick={() => {
                                            handleSpeedChange(speed);
                                            setShowSpeedMenu(false);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${playbackSpeed === speed
                                                ? "bg-[#D84040]/15 text-[#D84040] font-bold"
                                                : "hover:bg-[#2A1F1F] text-gray-300"
                                            }`}
                                    >
                                        <span>{speed === 1 ? "1.0x (Chuẩn)" : `${speed}x`}</span>
                                        {playbackSpeed === speed && <Check size={11} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Timecode Comment Sidebar (400px width) */}
            <div className="w-[400px] border-l border-[#1F1818] bg-[#141010] flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-[#1F1818] flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-[#D84040]" />
                        Danh sách góp ý ({feedbacks.length})
                    </h2>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {feedbacks.map((fb) => {
                        const isHighlighted = highlightedId === fb.id;
                        const isResolved = fb.status === "Resolved";

                        return (
                            <div
                                key={fb.id}
                                id={`comment-card-${fb.id}`}
                                onClick={() => {
                                    if (videoRef.current) {
                                        lastClickedCommentIdRef.current = fb.id;
                                        setHighlightedId(fb.id);
                                        videoRef.current.currentTime = fb.timecode;
                                        setCurrentTime(fb.timecode);
                                    }
                                }}
                                className="p-4 rounded-lg border text-sm cursor-pointer transition-all duration-300 space-y-2.5"
                                style={{
                                    background: isHighlighted ? "rgba(216,64,64,0.06)" : "#1D1616",
                                    borderColor: isHighlighted ? "#D84040" : "#2E2020",
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[#FFC107] font-mono text-sm">
                                            {formatTimecode(fb.timecode)}
                                        </span>
                                        <span className="text-[12px] uppercase tracking-wider text-gray-400 font-bold">
                                            {fb.user_id}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Status Switcher checkbox */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStatus(fb.id, fb.status);
                                            }}
                                            className="px-2.5 py-0.5 rounded text-[10px] font-bold transition-colors border"
                                            style={{
                                                background: isResolved ? "rgba(76,175,80,0.12)" : "rgba(255,193,7,0.12)",
                                                color: isResolved ? "#4CAF50" : "#FFC107",
                                                borderColor: isResolved ? "rgba(76,175,80,0.2)" : "rgba(255,193,7,0.2)"
                                            }}
                                            title="Click để đổi trạng thái"
                                        >
                                            {isResolved ? "Đã sửa" : "Chờ sửa"}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFeedback(fb.id);
                                            }}
                                            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-gray-200 leading-relaxed text-[14px] whitespace-pre-line">{fb.content}</p>

                                {fb.reply_content && (
                                    <div className="mt-2 pl-2.5 border-l-2 border-[#D84040]/55 bg-[#141010] p-2 rounded text-xs space-y-1" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-between text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                                            <span>{fb.reply_author || "Admin"}</span>
                                            {fb.reply_at && <span>{new Date(fb.reply_at).toLocaleDateString()}</span>}
                                        </div>
                                        <p className="text-gray-300 leading-normal whitespace-pre-line text-[12px]">{fb.reply_content}</p>
                                    </div>
                                )}

                                <div className="pt-1.5 flex justify-end" onClick={(e) => e.stopPropagation()}>
                                    {replyingToId === fb.id ? (
                                        <div className="w-full space-y-2 mt-1.5">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Nhập câu trả lời..."
                                                rows={2}
                                                className="w-full bg-[#141010] border border-[#2E2020] rounded p-2 text-xs outline-none text-[#EEEEEE] resize-none focus:border-[#D84040]"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-1.5 text-[10px]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReplyingToId(null);
                                                        setReplyText("");
                                                    }}
                                                    className="px-2.5 py-1 rounded bg-[#2A1F1F] hover:bg-[#3A3A3A] font-semibold text-gray-400"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveReply(fb.id)}
                                                    className="px-2.5 py-1 rounded bg-[#D84040] hover:bg-[#c03030] text-white font-semibold"
                                                >
                                                    Lưu
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setReplyingToId(fb.id);
                                                setReplyText(fb.reply_content || "");
                                            }}
                                            className="text-[10px] text-[#D84040] hover:underline font-semibold"
                                        >
                                            {fb.reply_content ? "Sửa phản hồi" : "Phản hồi"}
                                        </button>
                                    )}
                                </div>

                                <div className="text-[10px] text-gray-500 flex justify-between">
                                    <span>
                                        {fb.position_x >= 0 && fb.position_y >= 0
                                            ? `Tọa độ: ${fb.position_x}%, ${fb.position_y}%`
                                            : "Không ghim điểm"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} /> Ghi nhận
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {feedbacks.length === 0 && (
                        <div className="text-center py-12 text-gray-600 space-y-2">
                            <MessageSquare size={24} className="text-[#2E2020] mx-auto" />
                            <p className="text-xs">Chưa có góp ý nào cho bản dựng này.</p>
                        </div>
                    )}
                </div>

                {/* Fixed Comment Form */}
                <div className="p-4 border-t border-[#2E2020]/60 bg-[#1D1616]/40 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                    <form onSubmit={handleSidebarCommentSubmit} className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>Góp ý nhanh tại {formatTimecode(currentTime)}</span>
                            <span className="font-semibold text-gray-400">{isAdmin ? "Admin" : "Alex Johnson"}</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={sidebarComment}
                                onChange={(e) => setSidebarComment(e.target.value)}
                                placeholder="Ghi chú nhanh tại thời điểm này..."
                                className="flex-1 bg-[#141010]/40 border border-[#2E2020]/60 rounded px-3 py-2 text-sm outline-none text-[#EEEEEE] focus:border-[#D84040] focus:bg-[#141010]/60 placeholder:text-gray-600 transition-all backdrop-blur-sm"
                                required
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#D84040] hover:bg-[#c03030] rounded text-sm font-bold transition-all shadow-md shadow-[#D84040]/15"
                            >
                                Gửi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
