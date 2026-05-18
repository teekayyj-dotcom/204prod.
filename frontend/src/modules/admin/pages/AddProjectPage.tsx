// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ArrowLeft, Plus, Loader2, CheckCircle2, FolderOpen, Calendar, DollarSign, AlignLeft, Tag, User, Clock, CheckSquare, Info, Video, Link2, UploadCloud, X, Play, Camera, ImagePlus } from "lucide-react";
import { clients, categories } from "../data/mockData";
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
const statusColors = {
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
};
function FieldLabel({ icon: Icon, text }) {
    return (<label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
            <Icon size={13} color="#D84040"/>
            {text}
        </label>);
}
const checklist = [
    "Define project scope and deliverables",
    "Assign a client from your roster",
    "Set a realistic due date and budget",
    "Choose the correct service category",
    "Add relevant tags for discoverability",
];
export function AddProjectPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    // Thumbnail state
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [thumbDragActive, setThumbDragActive] = useState(false);
    const handleThumbDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover")
            setThumbDragActive(true);
        else if (e.type === "dragleave")
            setThumbDragActive(false);
    };
    const handleThumbDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setThumbDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/"))
            setThumbnailPreview(URL.createObjectURL(file));
    };
    // Video media state
    const [videoUrl, setVideoUrl] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [uploadedVideo, setUploadedVideo] = useState(null);
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
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: { status: "Planning" },
    });
    const watched = watch();
    const statusInfo = statusColors[watched.status] || statusColors["Planning"];
    const onSubmit = async (_data) => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 1200));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => navigate("/admin/projects"), 1400);
    };
    return (<div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                    <ArrowLeft size={16}/>
                </button>
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>New Project</h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">Fill in the details below to create a new project</p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-3 gap-6 items-start">

                {/* ── Left: Main Form (2 cols) ── */}
                <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid #2A1F1F", background: "linear-gradient(to right, #1D1616, #241C1C)" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(216,64,64,0.15)", border: "1px solid rgba(216,64,64,0.3)" }}>
                            <Plus size={17} color="#D84040"/>
                        </div>
                        <div>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Project Details</p>
                            <p style={{ color: "#666", fontSize: "12px" }}>Fields marked * are required</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
                        {/* ── Project Thumbnail ── */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <ImagePlus size={13} color="#D84040"/> Project Thumbnail
                                <span className="px-1.5 py-0.5 rounded ml-1" style={{ background: "rgba(216,64,64,0.1)", color: "#888", fontSize: "10px", border: "1px solid rgba(216,64,64,0.2)" }}>Optional</span>
                            </label>
                            <input id="thumb-upload-add" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                setThumbnailPreview(URL.createObjectURL(file));
        }}/>
                            {!thumbnailPreview ? (<div onDragEnter={handleThumbDrag} onDragLeave={handleThumbDrag} onDragOver={handleThumbDrag} onDrop={handleThumbDrop} onClick={() => document.getElementById("thumb-upload-add")?.click()} className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all select-none" style={{
                height: "148px",
                border: `2px dashed ${thumbDragActive ? "#D84040" : "#3A2A2A"}`,
                background: thumbDragActive ? "rgba(216,64,64,0.05)" : "#1D1616",
            }}>
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2" style={{ background: thumbDragActive ? "rgba(216,64,64,0.15)" : "#241C1C", border: `1px solid ${thumbDragActive ? "rgba(216,64,64,0.4)" : "#2E2020"}` }}>
                                        <ImagePlus size={18} color={thumbDragActive ? "#D84040" : "#555"}/>
                                    </div>
                                    <p style={{ color: thumbDragActive ? "#D84040" : "#888", fontSize: "13px", fontWeight: 500 }}>
                                        {thumbDragActive ? "Drop image here" : "Drag & drop project thumbnail"}
                                    </p>
                                    <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">
                                        or <span style={{ color: "#D84040" }}>browse files</span> · PNG, JPG, WebP
                                    </p>
                                </div>) : (<div className="relative rounded-xl overflow-hidden group" style={{ height: "148px" }}>
                                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.55)" }}>
                                        <button type="button" onClick={() => document.getElementById("thumb-upload-add")?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#EEEEEE", fontSize: "12px", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                                            <Camera size={13}/> Change
                                        </button>
                                        <button type="button" onClick={() => setThumbnailPreview(null)} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(216,64,64,0.35)", color: "#EEEEEE", fontSize: "12px", backdropFilter: "blur(6px)", border: "1px solid rgba(216,64,64,0.5)" }}>
                                            <X size={13}/> Remove
                                        </button>
                                    </div>
                                </div>)}
                        </div>

                        {/* Title */}
                        <div>
                            <FieldLabel icon={FolderOpen} text="Project Title *"/>
                            <input {...register("title", { required: "Title is required" })} placeholder="e.g. Nexus Brand Refresh" className="px-3 py-2.5 rounded-lg outline-none transition-all" style={{ ...inputStyle, borderColor: errors.title ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.title ? "#D84040" : "#3A2A2A")}/>
                            {errors.title && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.title.message}</p>}
                        </div>

                        {/* Client + Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel icon={User} text="Client *"/>
                                <select {...register("client", { required: "Client is required" })} className="px-3 py-2.5 rounded-lg outline-none appearance-none" style={{ ...inputStyle, borderColor: errors.client ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.client ? "#D84040" : "#3A2A2A")}>
                                    <option value="">Select client</option>
                                    {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                {errors.client && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.client.message}</p>}
                            </div>
                            <div>
                                <FieldLabel icon={Tag} text="Category *"/>
                                <select {...register("category", { required: "Category is required" })} className="px-3 py-2.5 rounded-lg outline-none appearance-none" style={{ ...inputStyle, borderColor: errors.category ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.category ? "#D84040" : "#3A2A2A")}>
                                    <option value="">Select category</option>
                                    {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                                {errors.category && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.category.message}</p>}
                            </div>
                        </div>

                        {/* Status + Due Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel icon={Tag} text="Status"/>
                                <select {...register("status")} className="px-3 py-2.5 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                    <option value="Planning">Planning</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <FieldLabel icon={Calendar} text="Due Date"/>
                                <input type="date" {...register("dueDate")} className="px-3 py-2.5 rounded-lg outline-none" style={{ ...inputStyle, colorScheme: "dark" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                        </div>

                        {/* Budget + Tags */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel icon={DollarSign} text="Budget"/>
                                <input {...register("budget")} placeholder="e.g. $25,000" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                            <div>
                                <FieldLabel icon={Tag} text="Tags"/>
                                <input {...register("tags")} placeholder="Branding, UI, React (comma-separated)" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <FieldLabel icon={AlignLeft} text="Description"/>
                            <textarea {...register("description")} rows={5} placeholder="Brief project overview, goals, key deliverables, and any important context for the team..." className="px-3 py-2.5 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                        </div>

                        {/* ── Video Media ── */}
                        <div className="pt-1" style={{ borderTop: "1px solid #2A1F1F" }}>
                            <div className="flex items-center gap-2 mb-1">
                                <Video size={13} color="#D84040"/>
                                <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>Video Media</span>
                                <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(216,64,64,0.1)", color: "#888", fontSize: "10px", border: "1px solid rgba(216,64,64,0.2)" }}>
                                    Optional
                                </span>
                            </div>
                            <p style={{ color: "#666", fontSize: "12px" }} className="mb-4">
                                Link a YouTube or Vimeo video, or upload a video file directly for this project.
                            </p>

                            {/* Video URL input */}
                            <div className="mb-4">
                                <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5 mb-2">
                                    <Link2 size={10} color="#D84040"/> Video URL
                                </label>
                                <div className="relative">
                                    <Link2 size={13} color="#555" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
                                    <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." className="px-3 py-2.5 rounded-lg outline-none transition-all" style={{ ...inputStyle, paddingLeft: "36px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                </div>
                                {videoUrl && (<div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4CAF50" }}/>
                                        <span style={{ color: "#4CAF50", fontSize: "11px" }}>URL detected — will be embedded on the project page</span>
                                    </div>)}
                            </div>

                            {/* Upload label */}
                            <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="flex items-center gap-1.5 mb-2">
                                <UploadCloud size={10} color="#D84040"/> Upload Video File
                            </label>

                            {/* Drag-and-drop zone / uploaded file display */}
                            {!uploadedVideo ? (<div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById("video-upload-add")?.click()} className="rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer transition-all select-none" style={{
                border: `2px dashed ${dragActive ? "#D84040" : "#3A2A2A"}`,
                background: dragActive ? "rgba(216,64,64,0.05)" : "rgba(29,22,22,0.4)",
            }}>
                                    <input id="video-upload-add" type="file" accept="video/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                    setUploadedVideo(file);
            }}/>
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: dragActive ? "rgba(216,64,64,0.15)" : "#241C1C", border: `1px solid ${dragActive ? "rgba(216,64,64,0.4)" : "#2E2020"}` }}>
                                        <UploadCloud size={22} color={dragActive ? "#D84040" : "#555"}/>
                                    </div>
                                    <p style={{ color: dragActive ? "#D84040" : "#888", fontSize: "13px", fontWeight: 500 }}>
                                        {dragActive ? "Drop video here" : "Drag & drop a video file"}
                                    </p>
                                    <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">
                                        or <span style={{ color: "#D84040" }}>browse files</span> · MP4, MOV, WebM — up to 500 MB
                                    </p>
                                </div>) : (<div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.25)" }}>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(76,175,80,0.15)" }}>
                                        <Play size={16} color="#4CAF50" fill="#4CAF50"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }} className="truncate">
                                            {uploadedVideo.name}
                                        </p>
                                        <p style={{ color: "#666", fontSize: "11px" }}>
                                            {(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB · {uploadedVideo.type || "video file"}
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => setUploadedVideo(null)} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: "#2A1F1F", color: "#666", border: "1px solid #3A2A2A" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                        <X size={12}/>
                                    </button>
                                </div>)}
                        </div>

                        <div style={{ borderTop: "1px solid #2A1F1F" }}/>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-lg transition-all" style={{ background: "#1D1616", color: "#888", border: "1px solid #3A2A2A", fontSize: "14px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; e.currentTarget.style.borderColor = "#666"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting || success} className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all" style={{ background: success ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "14px", fontWeight: 600, opacity: submitting ? 0.8 : 1 }}>
                                {submitting ? <><Loader2 size={15} className="animate-spin"/> Creating Project...</>
            : success ? <><CheckCircle2 size={15}/> Project Created!</>
                : <><Plus size={15}/> Create Project</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Right: Preview + Checklist (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Live Preview Card */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        {thumbnailPreview ? (<div className="h-28 relative overflow-hidden">
                                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover"/>
                                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(29,22,22,0.65))" }}/>
                            </div>) : (<div className="h-28" style={{ background: "linear-gradient(135deg, #1D1616 0%, #8E1616 60%, #D84040 100%)" }}/>)}
                        <div className="px-4 py-4 -mt-1">
                            <div className="flex items-start justify-between mb-2">
                                <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>
                                    {watched.title || "Project Title"}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ background: statusInfo.bg, color: statusInfo.text, fontSize: "10px", fontWeight: 600 }}>
                                    {watched.status || "Planning"}
                                </span>
                            </div>
                            <p style={{ color: "#888", fontSize: "12px" }} className="mb-3">
                                {watched.client || "No client"} · {watched.category || "No category"}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={11} color="#666"/>
                                    <span style={{ color: "#666", fontSize: "11px" }}>{watched.dueDate || "No due date"}</span>
                                </div>
                                <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{watched.budget || "—"}</span>
                            </div>
                            {watched.tags && (<div className="flex flex-wrap gap-1 mt-3">
                                    {watched.tags.split(",").slice(0, 3).map((t) => (<span key={t} className="px-1.5 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#888", fontSize: "10px", border: "1px solid #3A2A2A" }}>
                                            {t.trim()}
                                        </span>))}
                                </div>)}
                        </div>
                    </div>

                    {/* Pre-launch Checklist */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckSquare size={14} color="#D84040"/>
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Pre-launch Checklist</p>
                        </div>
                        <div className="space-y-2">
                            {checklist.map((item, i) => (<div key={i} className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: "rgba(216,64,64,0.12)", border: "1px solid rgba(216,64,64,0.3)" }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D84040" }}/>
                                    </div>
                                    <p style={{ color: "#888", fontSize: "12px" }}>{item}</p>
                                </div>))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(216,64,64,0.06)", border: "1px solid rgba(216,64,64,0.2)" }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={13} color="#D84040"/>
                            <p style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>Tip</p>
                        </div>
                        <p style={{ color: "#999", fontSize: "12px", lineHeight: "1.6" }}>
                            Use tags to make this project easier to find. You can always update the details from the project detail page after creation.
                        </p>
                    </div>
                </div>
            </div>
        </div>);
}
