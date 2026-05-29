// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Edit3, Save, X, Calendar, DollarSign, Tag, User, Briefcase, Clock, CheckCircle2, Loader2, Trash2, MessageSquare, Activity, ExternalLink, AlertCircle, Star, Video, Link2, UploadCloud, Play, Camera } from "lucide-react";
import { crewMembers } from "../data/mockData";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { fetchApi } from "../utils/apiClient";
const statusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040", border: "rgba(216,64,64,0.3)" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6", border: "rgba(107,143,214,0.3)" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)" },
};
const mockActivity = [
    { id: 1, user: "Sarah Kim", action: "updated project status to In Progress", time: "2 hours ago", avatar: "SK" },
    { id: 2, user: "Jake Torres", action: "pushed a new build — v0.4.1", time: "5 hours ago", avatar: "JT" },
    { id: 3, user: "Maya Chen", action: "uploaded revised wireframes", time: "1 day ago", avatar: "MC" },
    { id: 4, user: "Alex (You)", action: "created this project", time: "3 days ago", avatar: "AY" },
];
const mockComments = [
    { id: 1, user: "Sarah Kim", text: "Client approved the direction — moving into production phase now.", time: "2 hours ago", avatar: "SK" },
    { id: 2, user: "Jake Torres", text: "Main components are all wired up. Need final copy from Emma before we can close the homepage.", time: "1 day ago", avatar: "JT" },
];
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
export function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dbClients, setDbClients] = useState([]);
    const [dbCategories, setDbCategories] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState("activity");
    const [isFeatured, setIsFeatured] = useState(false);
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeletingProject, setIsDeletingProject] = useState(false);
    const [activities, setActivities] = useState([]);
    const [comments, setComments] = useState([]);
    const [assignedCrew, setAssignedCrew] = useState([]);
    const [dbCrew, setDbCrew] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);

    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({});

    useEffect(() => {
        Promise.all([
            fetchApi(`/projects/${id}`),
            fetchApi('/projects/clients/all'),
            fetchApi('/categories'),
            fetchApi('/crew')
        ]).then(([projData, clientsData, categoriesData, crewData]) => {
            setProject(projData);
            setIsFeatured(!!projData.featured);
            setDbClients(clientsData);
            setDbCategories(categoriesData);
            setDbCrew(crewData);
            setGalleryImages(projData.gallery || []);
            reset({
                title: projData.title,
                client: projData.client_slug || projData.client,
                category: projData.format_slug || projData.format,
                status: projData.status,
                dueDate: projData.dueDate || `${projData.year}-01-01`,
                budget: projData.budget,
                description: projData.summary || "",
                progress: projData.progress,
                videoUrl: projData.videoUrl || "",
            });

            // Determine if this is a mock project or a new project
            const isMockProject = [
                "proj-aurora-rebrand", "proj-slate-site", "proj-pulse-campaign", "proj-nova-ecom", "proj-aurora-motion", "proj-slate-photo",
                "aurora-platform-rebrand", "slate-house-portfolio", "pulse-summer-campaign", "nova-goods-product-launch", "aurora-motion-toolkit", "slate-editorial-shoot"
            ].includes(id.toLowerCase());

            const loadedCredits = projData.credits || [];
            if (loadedCredits.length > 0) {
                const parsedCrew = loadedCredits.map((credStr, idx) => {
                    const parts = credStr.split(":");
                    const role = parts[0]?.trim() || "";
                    const name = parts[1]?.trim() || "";
                    return { id: `cred-${idx}-${Date.now()}`, name, role };
                });
                setAssignedCrew(parsedCrew);
            } else if (isMockProject) {
                setActivities([
                    { id: 1, user: "Sarah Kim", action: "updated project status to In Progress", time: "2 hours ago", avatar: "SK" },
                    { id: 2, user: "Jake Torres", action: "pushed a new build — v0.4.1", time: "5 hours ago", avatar: "JT" },
                    { id: 3, user: "Maya Chen", action: "uploaded revised wireframes", time: "1 day ago", avatar: "MC" },
                    { id: 4, user: "Alex (You)", action: "created this project", time: "3 days ago", avatar: "AY" },
                ]);
                setComments([
                    { id: 1, user: "Sarah Kim", text: "Client approved the direction — moving into production phase now.", time: "2 hours ago", avatar: "SK" },
                    { id: 2, user: "Jake Torres", text: "Main components are all wired up. Need final copy from Emma before we can close the homepage.", time: "1 day ago", avatar: "JT" },
                ]);
                setAssignedCrew(crewMembers.slice(0, 3));
            } else {
                setActivities([
                    { id: 1, user: "Alex (You)", action: "created this project", time: "Just now", avatar: "AY" }
                ]);
                setComments([]);
                setAssignedCrew([]);
            }

            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [id, reset]);

    const handleDeleteProject = async () => {
        setIsDeletingProject(true);
        try {
            await fetchApi(`/projects/${id}`, {
                method: "DELETE"
            });
            navigate("/admin/projects");
        } catch (err) {
            console.error("Failed to delete project:", err);
            alert(err instanceof Error ? err.message : "Failed to delete project.");
        } finally {
            setIsDeletingProject(false);
            setShowDeleteModal(false);
        }
    };
    // Video media state
    const [dragActive, setDragActive] = useState(false);
    const [uploadedVideo, setUploadedVideo] = useState(null);
    // Thumbnail editing state
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover")
            setDragActive(true);
        else if (e.type === "dragleave")
            setDragActive(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("video/"))
            setUploadedVideo(file);
    };

    const watched = watch();
    const statusInfo = statusColors[watched.status] || statusColors["Planning"];
    const onSave = async (data) => {
        setSaving(true);
        try {
            let coverMediaId = undefined;

            // Upload thumbnail if selected
            if (thumbnailFile) {
                const formData = new FormData();
                formData.append("file", thumbnailFile);
                formData.append("alt", data.title || "Project Thumbnail");
                formData.append("caption", `Thumbnail for ${data.title}`);
                const mediaAsset = await fetchApi("/media/upload", {
                    method: "POST",
                    body: formData,
                });
                coverMediaId = mediaAsset.id;
            } else if (thumbnailPreview === null) {
                // If thumbnailPreview was explicitly set to null (i.e. removed)
                coverMediaId = null;
            }

            // Upload video if selected
            let finalVideoUrl = data.videoUrl;
            if (uploadedVideo) {
                const formData = new FormData();
                formData.append("file", uploadedVideo);
                formData.append("alt", `${data.title} Video`);
                formData.append("caption", `Video for ${data.title}`);
                const mediaAsset = await fetchApi("/media/upload", {
                    method: "POST",
                    body: formData,
                });
                finalVideoUrl = mediaAsset.url;
            }

            // Upload new gallery files
            const finalGalleryMediaIds = [];
            for (const img of galleryImages) {
                if (img.file) {
                    const formData = new FormData();
                    formData.append("file", img.file);
                    formData.append("alt", `${data.title} Behind the Scenes`);
                    formData.append("caption", `Behind the Scenes for ${data.title}`);
                    const mediaAsset = await fetchApi("/media/upload", {
                        method: "POST",
                        body: formData,
                    });
                    finalGalleryMediaIds.push(mediaAsset.id);
                } else {
                    finalGalleryMediaIds.push(img.id);
                }
            }

            const payload = {
                title: data.title,
                client_slug: data.client,
                year: parseInt(new Date(data.dueDate || Date.now()).getFullYear()),
                format_slug: data.category,
                featured: isFeatured,
                status: data.status,
                cover_media_id: coverMediaId,
                summary: data.description || null,
                video_url: finalVideoUrl,
                credits: assignedCrew.map(c => `${c.role}: ${c.name}`),
                gallery_media_ids: finalGalleryMediaIds,
            };
            const updated = await fetchApi(`/projects/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            setProject(updated);
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                setIsEditing(false);
                setThumbnailFile(null);
                setUploadedVideo(null);
            }, 1400);
        } catch (err) {
            console.error("Failed to update project:", err);
            alert(err instanceof Error ? err.message : "Failed to update project.");
        } finally {
            setSaving(false);
        }
    };
    const handleCancel = () => {
        reset();
        setThumbnailPreview(null);
        setThumbnailFile(null);
        setUploadedVideo(null);
        setGalleryImages(project.gallery || []);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    if (!project) {
        return (<div className="px-8 py-7">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/admin/projects")} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }}>
                        <ArrowLeft size={16}/>
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertCircle size={48} color="#3A2A2A" className="mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Project not found</p>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-1 mb-4">This project doesn't exist or may have been deleted.</p>
                    <button onClick={() => navigate("/admin/projects")} className="px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}>
                        Back to Projects
                    </button>
                </div>
            </div>);
    }
    return (<div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/projects")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                        <ArrowLeft size={16}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: "#666", fontSize: "13px" }}>Projects</span>
                            <span style={{ color: "#444" }}>/</span>
                            <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{project.title}</span>
                        </div>
                        <h1 style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700 }} className="mt-0.5">
                            {watched.title || project.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (<>
                            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "#241C1C", color: "#888", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}>
                                <X size={14}/> Discard
                            </button>
                            <button onClick={handleSubmit(onSave)} disabled={saving || saved} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: saved ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                                {saving ? <><Loader2 size={13} className="animate-spin"/> Saving...</>
                : saved ? <><CheckCircle2 size={13}/> Saved!</>
                    : <><Save size={13}/> Save Changes</>}
                            </button>
                        </>) : (<>
                            {/* Featured toggle */}
                            <button onClick={() => setIsFeatured((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all" style={{
                background: isFeatured ? "rgba(255,193,7,0.12)" : "#241C1C",
                color: isFeatured ? "#FFC107" : "#666",
                border: `1px solid ${isFeatured ? "rgba(255,193,7,0.4)" : "#2E2020"}`,
                fontSize: "13px",
                fontWeight: isFeatured ? 600 : 400,
            }} title={isFeatured ? "Remove from featured" : "Mark as featured"}>
                                <Star size={13} fill={isFeatured ? "#FFC107" : "none"}/>
                                {isFeatured ? "Featured" : "Highlight"}
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "#241C1C", color: "#666", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2E2020"; }}>
                                <ExternalLink size={13}/> Preview
                            </button>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}>
                                <Edit3 size={13}/> Edit Project
                            </button>
                        </>)}
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-6">

                {/* ── Left: Hero + Details (2 cols) ── */}
                <div className="col-span-2 space-y-5">

                    {/* Hero Image */}
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                        <div className="relative h-56">
                            <img src={thumbnailPreview || project.cover_image || project.image} alt={project.title} className="w-full h-full object-cover"/>
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #1D1616 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }}/>
                            {/* Thumbnail edit overlay — visible only when editing */}
                            {isEditing && (<>
                                    <input id="thumb-upload-detail" type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    setThumbnailPreview(URL.createObjectURL(file));
                    setThumbnailFile(file);
                }
            }}/>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.5)", zIndex: 4 }}>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => document.getElementById("thumb-upload-detail")?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "rgba(255,255,255,0.14)", color: "#EEEEEE", fontSize: "13px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}>
                                                <Camera size={14}/> Change Thumbnail
                                            </button>
                                            {thumbnailPreview && (<button type="button" onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(216,64,64,0.3)", color: "#EEEEEE", fontSize: "13px", backdropFilter: "blur(8px)", border: "1px solid rgba(216,64,64,0.5)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.45)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.3)"; }}>
                                                    <X size={13}/> Reset
                                                </button>)}
                                        </div>
                                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>PNG, JPG or WebP recommended</p>
                                    </div>
                                </>)}
                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between" style={{ zIndex: 5 }}>
                                <div>
                                    <span className="px-3 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}`, fontSize: "12px", fontWeight: 600, backdropFilter: "blur(8px)" }}>
                                        {watched.status}
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    {(project.tags || []).map((tag) => (<span key={tag} className="px-2 py-0.5 rounded" style={{ background: "rgba(29,22,22,0.8)", color: "#aaa", fontSize: "11px", backdropFilter: "blur(6px)" }}>
                                            {tag}
                                        </span>))}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ background: "#241C1C" }} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <span style={{ color: "#888", fontSize: "12px" }}>Overall Progress</span>
                                {isEditing ? (<div className="flex items-center gap-2">
                                        <input type="range" min={0} max={100} {...register("progress", { valueAsNumber: true })} className="w-28 accent-red-500"/>
                                        <span style={{ color: "#D84040", fontSize: "13px", fontWeight: 700, minWidth: "36px" }}>
                                            {watched.progress}%
                                        </span>
                                    </div>) : (<span style={{ color: "#D84040", fontSize: "14px", fontWeight: 700 }}>{project.progress}%</span>)}
                            </div>
                            <div className="rounded-full" style={{ height: "6px", background: "#2A1F1F" }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${isEditing ? watched.progress : project.progress}%`,
            background: project.progress === 100
                ? "#6B8FD6"
                : "linear-gradient(to right, #8E1616, #D84040)",
        }}/>
                            </div>
                        </div>
                    </div>

                    {/* Core Details Form/View */}
                    <div className="rounded-xl" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Project Information</p>
                            {isEditing && (<span className="px-2 py-0.5 rounded" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", fontSize: "11px" }}>
                                    Editing
                                </span>)}
                        </div>

                        <div className="px-5 py-5 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    <Briefcase size={11} color="#D84040"/> Project Title
                                </label>
                                {isEditing ? (<input {...register("title", { required: true })} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>{project.title}</p>)}
                            </div>

                            {/* Client + Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <User size={11} color="#D84040"/> Client
                                    </label>
                                    {isEditing ? (<select {...register("client")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                            {dbClients.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                        </select>) : (<p style={{ color: "#EEEEEE", fontSize: "14px" }}>{project.client}</p>)}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Tag size={11} color="#D84040"/> Category
                                    </label>
                                    {isEditing ? (<select {...register("category")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                            {dbCategories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                        </select>) : (<button onClick={() => {
                const catId = project.format_slug || project.category;
                if (catId)
                    navigate(`/admin/categories/${catId}`);
            }} className="flex items-center gap-1.5 group/cat" style={{ color: "#EEEEEE", fontSize: "14px", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                                            {project.format || project.category}
                                            <ExternalLink size={11} color="#555" className="opacity-0 group-hover/cat:opacity-100 transition-opacity"/>
                                        </button>)}
                                </div>
                            </div>

                            {/* Status + Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Activity size={11} color="#D84040"/> Status
                                    </label>
                                    {isEditing ? (<select {...register("status")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                            <option value="Planning">Planning</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Review">Review</option>
                                            <option value="Completed">Completed</option>
                                        </select>) : (<span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, fontSize: "12px", fontWeight: 600 }}>
                                            {project.status}
                                        </span>)}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Calendar size={11} color="#D84040"/> Due Date
                                    </label>
                                    {isEditing ? (<input type="date" {...register("dueDate")} className="px-3 py-2 rounded-lg outline-none" style={{ ...inputStyle, colorScheme: "dark" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "14px" }}>{project.dueDate}</p>)}
                                </div>
                            </div>

                            {/* Budget + Tags */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <DollarSign size={11} color="#D84040"/> Budget
                                    </label>
                                    {isEditing ? (<input {...register("budget")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#D84040", fontSize: "15px", fontWeight: 700 }}>{project.budget}</p>)}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        <Tag size={11} color="#D84040"/> Tags
                                    </label>
                                    {isEditing ? (<input {...register("tags")} placeholder="Comma-separated tags" className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<div className="flex flex-wrap gap-1.5">
                                            {(project.tags || []).map((tag) => (<span key={tag} className="px-2 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#888", fontSize: "12px", border: "1px solid #3A2A2A" }}>
                                                    {tag}
                                                </span>))}
                                        </div>)}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-2 mb-1.5" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                    Description
                                </label>
                                {isEditing ? (<textarea {...register("description")} rows={4} className="px-3 py-2 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.7" }}>
                                        A comprehensive creative engagement focused on delivering exceptional brand experiences and driving measurable outcomes for the client. The project spans multiple phases including discovery, design, development, and delivery.
                                    </p>)}
                            </div>

                            {/* ── Video Media ── */}
                            <div className="pt-4" style={{ borderTop: "1px solid #2A1F1F" }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Video size={12} color="#D84040"/>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                        Video Media
                                    </label>
                                    {!isEditing && (<span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(216,64,64,0.1)", color: "#666", fontSize: "10px", border: "1px solid rgba(216,64,64,0.18)" }}>
                                            Optional
                                        </span>)}
                                </div>

                                {isEditing ? (<div className="space-y-4 mt-3">
                                        {/* Video URL field */}
                                        <div>
                                            <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5 mb-2">
                                                <Link2 size={10} color="#D84040"/> Video URL
                                            </label>
                                            <div className="relative">
                                                <Link2 size={13} color="#555" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
                                                <input {...register("videoUrl")} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." className="px-3 py-2 rounded-lg outline-none transition-all" style={{ ...inputStyle, paddingLeft: "36px", paddingRight: "36px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                                {watch("videoUrl") && (
                                                    <button type="button" onClick={() => setValue("videoUrl", "")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center bg-[#2A1F1F] hover:bg-[#3A2A2A] text-white/50 hover:text-white transition-all" title="Clear Video URL">
                                                        <X size={10}/>
                                                    </button>
                                                )}
                                            </div>
                                            {watch("videoUrl") && (<div className="flex items-center gap-2 mt-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4CAF50" }}/>
                                                    <span style={{ color: "#4CAF50", fontSize: "11px" }}>URL detected — will be embedded on the project page</span>
                                                </div>)}
                                        </div>

                                        {/* Upload label */}
                                        <div>
                                            <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5 mb-2">
                                                <UploadCloud size={10} color="#D84040"/> Upload Video File
                                            </label>

                                            {!uploadedVideo ? (<div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById("video-upload-edit")?.click()} className="rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-all select-none" style={{
                    border: `2px dashed ${dragActive ? "#D84040" : "#3A2A2A"}`,
                    background: dragActive ? "rgba(216,64,64,0.05)" : "rgba(29,22,22,0.4)",
                }}>
                                                    <input id="video-upload-edit" type="file" accept="video/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                        setUploadedVideo(file);
                }}/>
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: dragActive ? "rgba(216,64,64,0.15)" : "#1D1616", border: `1px solid ${dragActive ? "rgba(216,64,64,0.4)" : "#2E2020"}` }}>
                                                        <UploadCloud size={18} color={dragActive ? "#D84040" : "#555"}/>
                                                    </div>
                                                    <p style={{ color: dragActive ? "#D84040" : "#888", fontSize: "12px", fontWeight: 500 }}>
                                                        {dragActive ? "Drop video here" : "Drag & drop a video file"}
                                                    </p>
                                                    <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">
                                                        or <span style={{ color: "#D84040" }}>browse files</span> · MP4, MOV, WebM — up to 500 MB
                                                    </p>
                                                </div>) : (<div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}>
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(76,175,80,0.15)" }}>
                                                        <Play size={14} color="#4CAF50" fill="#4CAF50"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="truncate">{uploadedVideo.name}</p>
                                                        <p style={{ color: "#666", fontSize: "11px" }}>{(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB · {uploadedVideo.type || "video"}</p>
                                                    </div>
                                                    <button type="button" onClick={() => setUploadedVideo(null)} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                                        <X size={12}/>
                                                    </button>
                                                </div>)}
                                        </div>
                                    </div>) : (
        /* View mode */
        (() => {
            const url = project.videoUrl || "";
            const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
            const vmMatch = url.match(/vimeo\.com\/(\d+)/);
            const embedUrl = ytMatch
                ? `https://www.youtube.com/embed/${ytMatch[1]}`
                : vmMatch
                    ? `https://player.vimeo.com/video/${vmMatch[1]}`
                    : null;
            if (embedUrl) {
                return (<div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                                                    <iframe src={embedUrl} className="w-full" style={{ height: "220px", border: "none", display: "block" }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Project video"/>
                                                </div>);
            }
            if (url) {
                return (<a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl transition-all" style={{ background: "#1D1616", border: "1px solid #2E2020", color: "#EEEEEE", textDecoration: "none" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; }}>
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(216,64,64,0.12)" }}>
                                                        <Video size={14} color="#D84040"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>Video Link</p>
                                                        <p style={{ color: "#D84040", fontSize: "11px" }} className="truncate">{url}</p>
                                                    </div>
                                                    <ExternalLink size={13} color="#555"/>
                                                </a>);
            }
            if (uploadedVideo) {
                return (<div className="flex items-center gap-3 mt-3 px-4 py-3 rounded-xl" style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}>
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(76,175,80,0.15)" }}>
                                                        <Play size={14} color="#4CAF50" fill="#4CAF50"/>
                                                    </div>
                                                    <div>
                                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="truncate">{uploadedVideo.name}</p>
                                                        <p style={{ color: "#666", fontSize: "11px" }}>{(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB uploaded</p>
                                                    </div>
                                                </div>);
            }
            return (<p style={{ color: "#444", fontSize: "13px", fontStyle: "italic" }} className="mt-2">
                                                No video attached — click <span style={{ color: "#D84040" }}>Edit Project</span> to add one.
                                            </p>);
        })())}
                            </div>
                        </div>
                    </div>

                    {/* Behind the Scenes Images */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <div className="flex items-center gap-2">
                                <Camera size={14} color="#D84040"/>
                                <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Behind the Scenes Images</p>
                            </div>
                            <span style={{ color: "#888", fontSize: "12px" }}>{galleryImages.length} images</span>
                        </div>
                        <div className="p-5">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div 
                                        onClick={() => document.getElementById("gallery-upload-input")?.click()}
                                        className="rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer transition-all select-none"
                                        style={{
                                            border: "2px dashed #3A2A2A",
                                            background: "rgba(29,22,22,0.4)"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; }}
                                    >
                                        <input 
                                            id="gallery-upload-input" 
                                            type="file" 
                                            accept="image/*" 
                                            multiple 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const files = e.target.files;
                                                if (files) {
                                                    Array.from(files).forEach(file => {
                                                        const previewUrl = URL.createObjectURL(file);
                                                        setGalleryImages(prev => [...prev, { id: `new-${Date.now()}-${Math.random()}`, url: previewUrl, file }]);
                                                    });
                                                }
                                            }}
                                        />
                                        <UploadCloud size={20} color="#555" className="mb-2"/>
                                        <p style={{ color: "#888", fontSize: "12px", fontWeight: 500 }}>Click to upload multiple images</p>
                                        <p style={{ color: "#555", fontSize: "10px" }} className="mt-0.5">PNG, JPG or WebP</p>
                                    </div>

                                    {galleryImages.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-3 mt-4">
                                            {galleryImages.map((img) => (
                                                <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden group" style={{ border: "1px solid #3A2A2A" }}>
                                                    <img src={img.url} alt="BTS" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setGalleryImages(prev => prev.filter(item => item.id !== img.id))}
                                                            className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors"
                                                            title="Delete image"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }} className="text-center py-2">No images uploaded yet.</p>
                                    )}
                                </div>
                            ) : (
                                galleryImages.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {galleryImages.map((img) => (
                                            <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden" style={{ border: "1px solid #2E2020" }}>
                                                <img src={img.url} alt="Behind the Scenes" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all duration-300" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: "#444", fontSize: "13px", fontStyle: "italic" }}>No behind the scenes images uploaded for this project.</p>
                                )
                            )}
                        </div>
                    </div>

                    {/* Activity / Comments Tabs */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            {["activity", "comments"].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className="flex items-center gap-2 px-5 py-3.5 transition-all capitalize" style={{
                color: activeTab === tab ? "#EEEEEE" : "#666",
                borderBottom: `2px solid ${activeTab === tab ? "#D84040" : "transparent"}`,
                fontSize: "13px",
                fontWeight: activeTab === tab ? 600 : 400,
                background: "transparent",
            }}>
                                    {tab === "activity" ? <Activity size={13}/> : <MessageSquare size={13}/>}
                                    {tab === "activity" ? "Activity" : "Comments"}{" "}
                                    <span className="px-1.5 py-0.5 rounded" style={{
                background: activeTab === tab ? "rgba(216,64,64,0.15)" : "#2A1F1F",
                color: activeTab === tab ? "#D84040" : "#555",
                fontSize: "10px",
            }}>
                                        {tab === "activity" ? activities.length : comments.length}
                                    </span>
                                </button>))}
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            {activeTab === "activity" &&
            activities.map((item) => (<div key={item.id} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>
                                            {item.avatar}
                                        </div>
                                        <div>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px" }}>
                                                <span style={{ fontWeight: 600 }}>{item.user}</span>{" "}
                                                <span style={{ color: "#888" }}>{item.action}</span>
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock size={10} color="#555"/>
                                                <span style={{ color: "#555", fontSize: "11px" }}>{item.time}</span>
                                            </div>
                                        </div>
                                    </div>))}

                            {activeTab === "comments" && (<>
                                    {comments.map((c) => (<div key={c.id} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "11px", fontWeight: 700 }}>
                                                {c.avatar}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{c.user}</span>
                                                    <span style={{ color: "#555", fontSize: "11px" }}>{c.time}</span>
                                                </div>
                                                <p className="px-3 py-2 rounded-lg" style={{ background: "#1D1616", color: "#aaa", fontSize: "13px", lineHeight: "1.6", border: "1px solid #2A1F1F" }}>
                                                    {c.text}
                                                </p>
                                            </div>
                                        </div>))}
                                    <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid #2A1F1F" }}>
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D84040", color: "#fff", fontSize: "10px", fontWeight: 700 }}>
                                            AY
                                        </div>
                                        <input onKeyDown={(e) => {
                                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                                const newComment = {
                                                    id: Date.now(),
                                                    user: "Alex (You)",
                                                    text: e.currentTarget.value.trim(),
                                                    time: "Just now",
                                                    avatar: "AY"
                                                };
                                                setComments((prev) => [...prev, newComment]);
                                                e.currentTarget.value = "";
                                            }
                                        }} placeholder="Add a comment..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "#1D1616", border: "1px solid #2A1F1F", color: "#EEEEEE", fontSize: "13px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#2A1F1F")}/>
                                    </div>
                                </>)}
                        </div>
                    </div>
                </div>

                {/* ── Right: Sidebar (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Quick Stats */}
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick Stats</p>
                        {[
            { icon: DollarSign, label: "Budget", value: project.budget, color: "#D84040" },
            { icon: Calendar, label: "Due Date", value: project.dueDate, color: "#EEEEEE" },
            { icon: Activity, label: "Progress", value: `${project.progress}%`, color: project.progress === 100 ? "#4CAF50" : "#D84040" },
        ].map(({ icon: Icon, label, value, color }) => (<div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #2A1F1F" }}>
                                <div className="flex items-center gap-2">
                                    <Icon size={13} color="#8E1616"/>
                                    <span style={{ color: "#888", fontSize: "12px" }}>{label}</span>
                                </div>
                                <span style={{ color, fontSize: "13px", fontWeight: 600 }}>{value}</span>
                            </div>))}
                        <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <div className="flex items-center gap-2">
                                <Clock size={13} color="#8E1616"/>
                                <span style={{ color: "#888", fontSize: "12px" }}>Last Updated</span>
                            </div>
                            <span style={{ color: "#666", fontSize: "12px" }}>2 hours ago</span>
                        </div>
                        {/* Featured status row */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                <Star size={13} color="#8E1616"/>
                                <span style={{ color: "#888", fontSize: "12px" }}>Highlighted</span>
                            </div>
                            <button onClick={() => setIsFeatured((v) => !v)} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all" style={{
            background: isFeatured ? "rgba(255,193,7,0.12)" : "#2A1F1F",
            color: isFeatured ? "#FFC107" : "#555",
            border: `1px solid ${isFeatured ? "rgba(255,193,7,0.4)" : "#3A2A2A"}`,
            fontSize: "11px",
            fontWeight: 600,
        }}>
                                <Star size={10} fill={isFeatured ? "#FFC107" : "none"}/>
                                {isFeatured ? "Yes" : "No"}
                            </button>
                        </div>
                    </div>

                    {/* Assigned Crew */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center justify-between mb-3">
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Assigned Crew</p>
                            <span style={{ color: "#D84040", fontSize: "12px" }}>{assignedCrew.length} members</span>
                        </div>
                        
                        {isEditing ? (
                            <div className="space-y-3">
                                {/* List of assigned crew with remove buttons */}
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {assignedCrew.map((c) => {
                                        const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                        const realMember = dbCrew.find(m => m.name.toLowerCase() === c.name.toLowerCase());
                                        const avatarUrl = realMember?.avatar || null;
                                        
                                        return (
                                            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={c.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: "#8E1616", color: "#EEEEEE" }}>
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p style={{ color: "#EEEEEE", fontSize: "11px", fontWeight: 500 }} className="truncate">{c.name}</p>
                                                        <p style={{ color: "#D84040", fontSize: "10px" }} className="truncate">{c.role}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setAssignedCrew(prev => prev.filter(item => item.id !== c.id))}
                                                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {assignedCrew.length === 0 && (
                                        <p style={{ color: "#666", fontSize: "11px", fontStyle: "italic" }} className="py-2">No crew assigned yet.</p>
                                    )}
                                </div>
                                
                                {/* Dropdown select to assign registered crew member */}
                                <div className="mt-3 pt-3 border-t border-[#2A1F1F]">
                                    <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Assign Crew Member</label>
                                    <select 
                                        value="" 
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const selectedMember = dbCrew.find(m => m.id.toString() === selectedId);
                                            if (selectedMember) {
                                                const primaryRole = selectedMember.role ? selectedMember.role.split(",")[0].trim() : "Crew Member";
                                                setAssignedCrew(prev => [
                                                    ...prev, 
                                                    { 
                                                        id: `crew-${selectedMember.id}-${Date.now()}`, 
                                                        name: selectedMember.name, 
                                                        role: primaryRole 
                                                    }
                                                ]);
                                            }
                                            e.target.value = "";
                                        }}
                                        className="px-3 py-2 rounded-lg outline-none appearance-none cursor-pointer"
                                        style={inputStyle}
                                    >
                                        <option value="">Select registered crew...</option>
                                        {dbCrew
                                            .filter(m => !assignedCrew.some(ac => ac.name.toLowerCase() === m.name.toLowerCase()))
                                            .map((m) => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.role ? m.role.split(",")[0].trim() : "No Role"})</option>
                                            ))}
                                    </select>
                                </div>
                                
                                {/* Custom write-in credit */}
                                <div className="mt-3 pt-3 border-t border-[#2A1F1F] space-y-2">
                                    <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Add Custom Credit</label>
                                    <div className="flex gap-2">
                                        <input 
                                            id="custom-credit-role" 
                                            placeholder="Role: e.g. Sound Designer" 
                                            className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs" 
                                            style={inputStyle}
                                        />
                                        <input 
                                            id="custom-credit-name" 
                                            placeholder="Name: e.g. John Doe" 
                                            className="px-2 py-1.5 rounded-lg outline-none flex-1 text-xs" 
                                            style={inputStyle}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const roleEl = document.getElementById("custom-credit-role");
                                                const nameEl = document.getElementById("custom-credit-name");
                                                const roleVal = roleEl?.value.trim();
                                                const nameVal = nameEl?.value.trim();
                                                if (roleVal && nameVal) {
                                                    setAssignedCrew(prev => [
                                                        ...prev, 
                                                        { id: `custom-${Date.now()}`, name: nameVal, role: roleVal }
                                                    ]);
                                                    if (roleEl) roleEl.value = "";
                                                    if (nameEl) nameEl.value = "";
                                                } else {
                                                    alert("Please enter both a role and a name.");
                                                }
                                            }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold" 
                                            style={{ background: "#D84040", color: "#fff" }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assignedCrew.map((c) => {
                                    const realMember = dbCrew.find(m => m.name.toLowerCase() === c.name.toLowerCase());
                                    const avatarUrl = realMember?.avatar || null;
                                    const status = realMember?.status || "Active";
                                    const initials = c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                                    
                                    return (
                                        <div key={c.id} className="flex items-center gap-3">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid #2A1F1F" }}/>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "#8E1616", border: "2px solid #2A1F1F", color: "#EEEEEE" }}>
                                                    {initials}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                {realMember ? (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => navigate(`/admin/crew/${realMember.id}`)}
                                                        className="text-left hover:text-[#D84040] transition-colors"
                                                        style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}
                                                    >
                                                        {c.name}
                                                    </button>
                                                ) : (
                                                    <p style={{ color: "#EEEEEE", fontSize: "12px", fontWeight: 500 }}>{c.name}</p>
                                                )}
                                                <p style={{ color: "#D84040", fontSize: "11px" }}>{c.role}</p>
                                            </div>
                                            {realMember && (
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status === "Active" ? "#4CAF50" : "#E8A838" }}/>
                                            )}
                                        </div>
                                    );
                                })}
                                {assignedCrew.length === 0 && (
                                    <p style={{ color: "#666", fontSize: "12px", fontStyle: "italic" }}>No crew assigned to this project yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Client Info */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }} className="mb-3">Client</p>
                        {(() => {
            const clientData = dbClients.find((c) => c.name === project.client || c.slug === project.client_slug);
            return clientData ? (<div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "12px", fontWeight: 700 }}>
                                            {(clientData.name || "Client").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{clientData.name}</p>
                                            <p style={{ color: "#888", fontSize: "11px" }}>{clientData.contact || "Primary Contact"}</p>
                                        </div>
                                    </div>
                                    <a href={`mailto:${clientData.email || 'contact@example.com'}`} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "#1D1616", color: "#888", border: "1px solid #2A1F1F", fontSize: "12px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                                        <User size={12}/>
                                        {clientData.email || "No Email Registered"}
                                    </a>
                                </div>) : null;
        })()}
                    </div>

                    {/* Danger Zone */}
                    {isEditing && (<div className="rounded-xl p-4" style={{ background: "rgba(142,22,22,0.08)", border: "1px solid rgba(142,22,22,0.3)" }}>
                            <p style={{ color: "#D84040", fontSize: "13px", fontWeight: 600 }} className="mb-2">Danger Zone</p>
                            <p style={{ color: "#888", fontSize: "12px", lineHeight: "1.5" }} className="mb-3">
                                Permanently delete this project and all associated data. This action cannot be undone.
                            </p>
                            <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.3)", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.1)"; }}>
                                <Trash2 size={13}/> Delete Project
                            </button>
                        </div>)}
                </div>
            </div>

            {/* Delete confirmation modal */}
            <DeleteConfirmModal isOpen={showDeleteModal} itemType="project" itemName={project?.title ?? ""} onConfirm={handleDeleteProject} onCancel={() => setShowDeleteModal(false)} isDeleting={isDeletingProject}/>
        </div>);
}
