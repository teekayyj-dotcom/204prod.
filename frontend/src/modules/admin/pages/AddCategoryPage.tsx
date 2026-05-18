// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ArrowLeft, FolderPlus, Loader2, CheckCircle2, Tag, AlignLeft, Palette, Info, Layers } from "lucide-react";
import { allProjects } from "../data/mockData";
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
const colorOptions = [
    { label: "Bright Red", value: "#D84040" },
    { label: "Deep Red", value: "#8E1616" },
    { label: "Amber", value: "#E8A838" },
    { label: "Green", value: "#4CAF50" },
    { label: "Blue", value: "#6B8FD6" },
    { label: "Purple", value: "#9B6BD6" },
    { label: "Teal", value: "#4CBFBF" },
    { label: "Pink", value: "#D64B8A" },
];
export function AddCategoryPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedColor, setSelectedColor] = useState("#D84040");
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: { color: "#D84040" },
    });
    const nameValue = watch("name") || "";
    const descValue = watch("description") || "";
    const existingCategoryNames = [...new Set(allProjects.map((p) => p.category))];
    const onSubmit = async (_data) => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 1100));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => navigate("/admin/categories"), 1300);
    };
    return (<div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                    <ArrowLeft size={16}/>
                </button>
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>New Category</h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">Create a new project category for your taxonomy</p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-3 gap-6 items-start">

                {/* ── Left: Main Form (2 cols) ── */}
                <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid #2A1F1F", background: "linear-gradient(to right, #1D1616, #241C1C)" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(216,64,64,0.15)", border: "1px solid rgba(216,64,64,0.3)" }}>
                            <FolderPlus size={17} color="#D84040"/>
                        </div>
                        <div>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Category Details</p>
                            <p style={{ color: "#666", fontSize: "12px" }}>Fields marked * are required</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <Tag size={13} color="#D84040"/> Category Name *
                            </label>
                            <input {...register("name", { required: "Category name is required" })} placeholder="e.g. Motion Design" className="px-3 py-2.5 rounded-lg outline-none transition-all" style={{ ...inputStyle, borderColor: errors.name ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.name ? "#D84040" : "#3A2A2A")}/>
                            {errors.name && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <Tag size={13} color="#D84040"/> URL Slug
                            </label>
                            <input {...register("slug")} placeholder="e.g. motion-design (auto-generated if left blank)" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            <p style={{ color: "#555", fontSize: "11px" }} className="mt-1">Used in URLs — will be auto-generated from the name if left empty.</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <AlignLeft size={13} color="#D84040"/> Description
                            </label>
                            <textarea {...register("description")} rows={4} placeholder="Describe what type of projects belong to this category, typical deliverables, and workflow notes..." className="px-3 py-2.5 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                        </div>

                        {/* Accent Color */}
                        <div>
                            <label className="flex items-center gap-2 mb-3" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <Palette size={13} color="#D84040"/> Accent Color
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {colorOptions.map((c) => (<button key={c.value} type="button" onClick={() => { setSelectedColor(c.value); setValue("color", c.value); }} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{
                background: selectedColor === c.value ? `${c.value}20` : "#1D1616",
                border: `1px solid ${selectedColor === c.value ? c.value : "#3A2A2A"}`,
                color: selectedColor === c.value ? c.value : "#666",
                fontSize: "12px",
                fontWeight: selectedColor === c.value ? 600 : 400,
            }}>
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.value }}/>
                                        {c.label}
                                    </button>))}
                            </div>
                        </div>

                        <div style={{ borderTop: "1px solid #2A1F1F" }}/>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-lg transition-all" style={{ background: "#1D1616", color: "#888", border: "1px solid #3A2A2A", fontSize: "14px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; e.currentTarget.style.borderColor = "#666"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting || success} className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all" style={{ background: success ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "14px", fontWeight: 600, opacity: submitting ? 0.8 : 1 }}>
                                {submitting ? <><Loader2 size={15} className="animate-spin"/> Creating...</>
            : success ? <><CheckCircle2 size={15}/> Category Created!</>
                : <><FolderPlus size={15}/> Create Category</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Right: Preview + Existing (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Live Preview */}
                    <div className="rounded-xl p-5" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Preview</p>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${selectedColor}20`, border: `1px solid ${selectedColor}40` }}>
                                <FolderPlus size={22} color={selectedColor}/>
                            </div>
                            <div>
                                <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>
                                    {nameValue || "Category Name"}
                                </p>
                                <p style={{ color: "#666", fontSize: "12px" }}>0 projects</p>
                            </div>
                        </div>
                        {descValue && (<p style={{ color: "#888", fontSize: "12px", lineHeight: "1.5" }}>{descValue.slice(0, 100)}{descValue.length > 100 ? "…" : ""}</p>)}
                        <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: "#2A1F1F" }}>
                            <div className="h-full w-0 rounded-full" style={{ background: `linear-gradient(to right, ${selectedColor}88, ${selectedColor})` }}/>
                        </div>
                    </div>

                    {/* Existing Categories */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Layers size={13} color="#D84040"/>
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Existing Categories</p>
                        </div>
                        <div className="space-y-1.5">
                            {existingCategoryNames.map((cat) => (<div key={cat} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: "#1D1616" }}>
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#8E1616" }}/>
                                    <span style={{ color: "#999", fontSize: "12px" }}>{cat}</span>
                                </div>))}
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(216,64,64,0.06)", border: "1px solid rgba(216,64,64,0.2)" }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={13} color="#D84040"/>
                            <p style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>Tip</p>
                        </div>
                        <p style={{ color: "#999", fontSize: "12px", lineHeight: "1.6" }}>
                            Keep category names concise and distinct. You can assign multiple projects to the same category for better organisation.
                        </p>
                    </div>
                </div>
            </div>
        </div>);
}
