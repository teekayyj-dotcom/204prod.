// @ts-nocheck
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { ArrowLeft, Edit3, Save, X, Trash2, CheckCircle2, Loader2, Mail, Phone, Globe, Building2, User, Briefcase, DollarSign, Calendar, AlertTriangle, ExternalLink, Activity, Tag, ChevronRight, Plus, Check, Camera } from "lucide-react";
import { clients, allProjects } from "../data/mockData";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
const statusColors = {
    Active: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50", border: "rgba(76,175,80,0.3)" },
    Paused: { bg: "rgba(232,168,56,0.15)", text: "#E8A838", border: "rgba(232,168,56,0.3)" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6", border: "rgba(107,143,214,0.3)" },
};
const projectStatusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
};
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
export function ClientProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    // Add Industry state
    const [customIndustries, setCustomIndustries] = useState([]);
    const [addingIndustry, setAddingIndustry] = useState(false);
    const [industryInput, setIndustryInput] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);
    const client = clients.find((c) => c.id === id);
    const clientProjects = allProjects.filter((p) => p.client === client?.name);
    const { register, handleSubmit, watch, reset } = useForm({
        defaultValues: client
            ? {
                name: client.name,
                contact: client.contact,
                email: client.email,
                phone: client.phone || "",
                website: client.website || "",
                industry: client.industry || "",
                status: client.status,
                since: client.since,
                budget: client.budget,
                notes: client.notes || "",
            }
            : {},
    });
    const watched = watch();
    const statusInfo = statusColors[watched.status] || statusColors["Active"];
    const initials = (watched.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const onSave = async (_data) => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => { setSaved(false); setIsEditing(false); }, 1400);
    };
    const handleDelete = async () => {
        setDeleting(true);
        await new Promise((r) => setTimeout(r, 900));
        navigate("/admin/clients");
    };
    const handleCancel = () => { reset(); setIsEditing(false); };
    if (!client) {
        return (<div className="px-8 py-7">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/admin/clients")} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }}>
                        <ArrowLeft size={16}/>
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertTriangle size={48} color="#3A2A2A" className="mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Client not found</p>
                    <button onClick={() => navigate("/admin/clients")} className="mt-4 px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}>Back to Clients</button>
                </div>
            </div>);
    }
    return (<div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/clients")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                        <ArrowLeft size={16}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: "#666", fontSize: "13px" }}>Clients</span>
                            <span style={{ color: "#444" }}>/</span>
                            <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{client.name}</span>
                        </div>
                        <h1 style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700 }} className="mt-0.5">{watched.name}</h1>
                    </div>
                </div>

                {/* Action buttons */}
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
                            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "#241C1C", color: "#666", border: "1px solid #2E2020", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#2E2020"; }}>
                                <Trash2 size={13}/> Delete
                            </button>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}>
                                <Edit3 size={13}/> Edit Client
                            </button>
                        </>)}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal isOpen={confirmDelete} itemType="client" itemName={client.name} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} isDeleting={deleting}/>

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-6">

                {/* ── Left: Profile + Projects (2 cols) ── */}
                <div className="col-span-2 space-y-5">

                    {/* Profile Card */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        {/* Banner — sent to back so avatar and text sit cleanly on top */}
                        <div className="h-24 relative" style={{ background: "linear-gradient(135deg, #1D1616 0%, #8E1616 60%, #D84040 100%)", zIndex: 0 }}>
                            {/* Status badge */}
                            <span className="absolute top-3 right-4 px-2.5 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, border: `1px solid ${statusInfo.border}`, fontSize: "12px", fontWeight: 600, backdropFilter: "blur(8px)" }}>
                                {watched.status}
                            </span>
                        </div>

                        {/* Content — elevated above the gradient banner */}
                        <div className="px-6 pb-6 relative" style={{ zIndex: 1 }}>
                            {/* Avatar row */}
                            <div className="flex items-end justify-between -mt-8 mb-4">
                                <div className="relative group">
                                    <input id="client-profile-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                setAvatarPreview(URL.createObjectURL(file));
        }}/>
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "18px", fontWeight: 700, border: "3px solid #241C1C", position: "relative", zIndex: 2 }}>
                                        {avatarPreview ? (<img src={avatarPreview} alt="Client avatar" className="w-full h-full object-cover"/>) : (initials)}
                                    </div>
                                    {/* Camera overlay — only when editing */}
                                    {isEditing && (<>
                                            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ background: "rgba(0,0,0,0.6)", zIndex: 3 }} onClick={() => document.getElementById("client-profile-avatar")?.click()}>
                                                <Camera size={18} color="#EEEEEE"/>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#D84040", border: "2px solid #241C1C", zIndex: 4 }} onClick={() => document.getElementById("client-profile-avatar")?.click()}>
                                                <Camera size={9} color="#fff"/>
                                            </div>
                                        </>)}
                                </div>
                                {isEditing && (<div className="flex items-center gap-2 mb-1">
                                        <button type="button" onClick={() => document.getElementById("client-profile-avatar")?.click()} style={{ color: "#D84040", fontSize: "11px", fontWeight: 500 }}>
                                            {avatarPreview ? "Change" : "Upload Photo"}
                                        </button>
                                        {avatarPreview && (<>
                                                <span style={{ color: "#3A2A2A", fontSize: "10px" }}>·</span>
                                                <button type="button" onClick={() => setAvatarPreview(null)} style={{ color: "#666", fontSize: "11px" }}>
                                                    Remove
                                                </button>
                                            </>)}
                                        <span className="px-2 py-0.5 rounded ml-1" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", fontSize: "11px" }}>
                                            Editing
                                        </span>
                                    </div>)}
                            </div>

                            {/* Name + Industry */}
                            {isEditing ? (<div className="grid grid-cols-2 gap-4 mb-5">
                                    <div>
                                        <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                            <Building2 size={10} color="#D84040"/> Company Name
                                        </label>
                                        <input {...register("name")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                    </div>
                                    <div>
                                        <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                            <Tag size={10} color="#D84040"/> Industry
                                        </label>
                                        <input {...register("industry")} placeholder="e.g. Technology" className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                    </div>
                                </div>) : (<div className="mb-4">
                                    <h2 style={{ color: "#EEEEEE", fontSize: "20px", fontWeight: 700 }}>{watched.name}</h2>
                                    <p style={{ color: "#888", fontSize: "13px" }} className="mt-0.5">{client.industry || "—"}</p>
                                </div>)}

                            {/* Contact details grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
            { icon: User, label: "Contact", field: "contact", placeholder: "Contact person" },
            { icon: Mail, label: "Email", field: "email", placeholder: "email@company.com" },
            { icon: Phone, label: "Phone", field: "phone", placeholder: "+1 (555) 000-0000" },
            { icon: Globe, label: "Website", field: "website", placeholder: "https://company.com" },
        ].map(({ icon: Icon, label, field, placeholder }) => (<div key={field}>
                                        <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1.5">
                                            <Icon size={10} color="#D84040"/> {label}
                                        </label>
                                        {isEditing ? (<input {...register(field)} placeholder={placeholder} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "13px" }}>{watched[field] || "—"}</p>)}
                                    </div>))}
                            </div>

                            {/* Status + Since + Budget row */}
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid #2A1F1F" }}>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                        <Activity size={10} color="#D84040"/> Status
                                    </label>
                                    {isEditing ? (<select {...register("status")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle}>
                                            <option value="Active">Active</option>
                                            <option value="Paused">Paused</option>
                                            <option value="Completed">Completed</option>
                                        </select>) : (<span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.text, fontSize: "12px", fontWeight: 600 }}>
                                            {client.status}
                                        </span>)}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                        <Calendar size={10} color="#D84040"/> Client Since
                                    </label>
                                    {isEditing ? (<input {...register("since")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "14px" }}>{client.since}</p>)}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                        <DollarSign size={10} color="#D84040"/> Total Budget
                                    </label>
                                    {isEditing ? (<input {...register("budget")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#D84040", fontSize: "15px", fontWeight: 700 }}>{client.budget}</p>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Projects</p>
                            <span style={{ color: "#D84040", fontSize: "12px" }}>{clientProjects.length} total</span>
                        </div>
                        {clientProjects.length > 0 ? (<div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
                                {clientProjects.map((p) => (<div key={p.id} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors" onClick={() => navigate(`/admin/projects/${p.id}`)} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                        <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{p.title}</p>
                                            <p style={{ color: "#666", fontSize: "11px" }}>{p.category} · {p.dueDate}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: "80px" }}>
                                                <div className="rounded-full" style={{ height: "4px", background: "#2A1F1F" }}>
                                                    <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.progress === 100 ? "#6B8FD6" : "linear-gradient(to right, #8E1616, #D84040)" }}/>
                                                </div>
                                            </div>
                                            <span style={{ color: "#666", fontSize: "11px", minWidth: "28px" }}>{p.progress}%</span>
                                            <span className="px-2 py-0.5 rounded-full" style={{ background: projectStatusColors[p.status]?.bg, color: projectStatusColors[p.status]?.text, fontSize: "10px", fontWeight: 500 }}>
                                                {p.status}
                                            </span>
                                            <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{p.budget}</span>
                                            <ChevronRight size={14} color="#555"/>
                                        </div>
                                    </div>))}
                            </div>) : (<div className="py-10 text-center">
                                <Briefcase size={32} color="#3A2A2A" className="mx-auto mb-2"/>
                                <p style={{ color: "#666", fontSize: "13px" }}>No projects yet for this client</p>
                            </div>)}
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl p-5" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <label style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="flex items-center gap-2 mb-3">
                            Internal Notes
                        </label>
                        {isEditing ? (<textarea {...register("notes")} rows={4} placeholder="Internal notes about this client relationship..." className="px-3 py-2.5 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.7" }}>
                                {client.notes || "No internal notes for this client."}
                            </p>)}
                    </div>
                </div>

                {/* ── Right: Sidebar (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Quick Stats */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Account Summary</p>
                        {[
            { icon: Briefcase, label: "Total Projects", value: client.projects },
            { icon: Activity, label: "Active Projects", value: clientProjects.filter((p) => p.status === "In Progress").length },
            { icon: DollarSign, label: "Total Budget", value: client.budget, color: "#D84040" },
            { icon: Calendar, label: "Client Since", value: client.since },
        ].map(({ icon: Icon, label, value, color }) => (<div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #2A1F1F" }}>
                                <div className="flex items-center gap-2">
                                    <Icon size={13} color="#8E1616"/>
                                    <span style={{ color: "#888", fontSize: "12px" }}>{label}</span>
                                </div>
                                <span style={{ color: color || "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{value}</span>
                            </div>))}
                    </div>

                    {/* Contact Actions */}
                    <div className="rounded-xl p-4 space-y-2" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Quick Actions</p>
                        <a href={`mailto:${client.email}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "#1D1616", color: "#EEEEEE", border: "1px solid #2A1F1F", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                            <Mail size={14} color="#D84040"/>
                            Send Email
                        </a>
                        {client.phone && (<a href={`tel:${client.phone}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "#1D1616", color: "#EEEEEE", border: "1px solid #2A1F1F", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                                <Phone size={14} color="#D84040"/>
                                {client.phone}
                            </a>)}
                        {client.website && (<a href={client.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "#1D1616", color: "#EEEEEE", border: "1px solid #2A1F1F", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                                <ExternalLink size={14} color="#D84040"/>
                                Visit Website
                            </a>)}
                        <button onClick={() => navigate("/admin/projects/new")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.1)"; }}>
                            <Briefcase size={14}/>
                            New Project for Client
                        </button>
                    </div>

                    {/* Industry tag — with Add Industry */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Industry</p>

                        {/* Primary industry + custom industry badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {client.industry && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)", fontSize: "12px", fontWeight: 500 }}>
                                    <Tag size={11}/> {client.industry}
                                </span>)}
                            {customIndustries.map((ind) => (<span key={ind} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(142,22,22,0.12)", color: "#C0585A", border: "1px solid rgba(142,22,22,0.3)", fontSize: "12px", fontWeight: 500 }}>
                                    <Tag size={11}/> {ind}
                                    <button type="button" onClick={() => setCustomIndustries((prev) => prev.filter((x) => x !== ind))} className="ml-0.5 opacity-60 hover:opacity-100">
                                        <X size={10}/>
                                    </button>
                                </span>))}
                        </div>

                        {/* Inline add-industry input */}
                        {addingIndustry ? (<div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input autoFocus value={industryInput} onChange={(e) => setIndustryInput(e.target.value)} onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = industryInput.trim();
                    if (trimmed && !customIndustries.includes(trimmed)) {
                        setCustomIndustries((prev) => [...prev, trimmed]);
                    }
                    setIndustryInput("");
                    setAddingIndustry(false);
                }
                if (e.key === "Escape") {
                    setAddingIndustry(false);
                    setIndustryInput("");
                }
            }} placeholder="e.g. Fintech, Healthcare..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "#1D1616", border: "1px solid #D84040", color: "#EEEEEE", fontSize: "13px" }}/>
                                    <button type="button" onClick={() => {
                const trimmed = industryInput.trim();
                if (trimmed && !customIndustries.includes(trimmed)) {
                    setCustomIndustries((prev) => [...prev, trimmed]);
                }
                setIndustryInput("");
                setAddingIndustry(false);
            }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#D84040", color: "#fff" }}>
                                        <Check size={13}/>
                                    </button>
                                    <button type="button" onClick={() => { setAddingIndustry(false); setIndustryInput(""); }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#2A1F1F", color: "#888", border: "1px solid #3A2A2A" }}>
                                        <X size={13}/>
                                    </button>
                                </div>
                                <p style={{ color: "#666", fontSize: "11px" }}>Press Enter to save · Esc to cancel</p>
                            </div>) : (<button type="button" onClick={() => setAddingIndustry(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-full transition-all" style={{ background: "transparent", color: "#666", border: "1px dashed #3A2A2A", fontSize: "12px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; e.currentTarget.style.color = "#666"; }}>
                                <Plus size={12}/> Add Industry
                            </button>)}
                    </div>
                </div>
            </div>
        </div>);
}
