// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, UserPlus, Loader2, CheckCircle2, Building2, User, Mail, Phone, DollarSign, AlignLeft, Globe, Briefcase, TrendingUp, Info, Camera, X } from "lucide-react";
import { clients } from "../data/mockData";
import { fetchApi } from "../utils/apiClient";
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
const statusOptions = [
    { value: "Active", color: "#4CAF50", bg: "rgba(76,175,80,0.12)" },
    { value: "Paused", color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
    { value: "Completed", color: "#6B8FD6", bg: "rgba(107,143,214,0.12)" },
];
export function AddClientPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("Active");
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: { status: "Active", since: String(new Date().getFullYear()) },
    });
    const nameValue = watch("name") || "";
    const contactValue = watch("contact") || "";
    const budgetValue = watch("budget") || "";
    const initials = nameValue.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    const statusInfo = statusOptions.find((s) => s.value === selectedStatus) || statusOptions[0];
    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            let logoMediaId = null;

            // Upload logo if selected
            if (avatarFile) {
                const formData = new FormData();
                formData.append("file", avatarFile);
                formData.append("alt", `${data.name} Logo`);
                formData.append("caption", `Logo for ${data.name}`);
                const mediaAsset = await fetchApi("/media/upload", {
                    method: "POST",
                    body: formData,
                });
                logoMediaId = mediaAsset.id;
            }

            const payload = {
                name: data.name,
                slug: data.slug || null,
                logo_media_id: logoMediaId,
                website: data.website || null,
                contact: data.contact,
                email: data.email,
                phone: data.phone || null,
                industry: data.industry || null,
                status: selectedStatus,
                since: data.since || null,
                notes: data.notes || null,
            };
            await fetchApi("/projects/clients", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            setSuccess(true);
            setTimeout(() => navigate("/admin/clients"), 1300);
        } catch (error) {
            console.error("Error creating client:", error);
            alert(error instanceof Error ? error.message : "Failed to create client.");
        } finally {
            setSubmitting(false);
        }
    };
    const totalExistingBudget = clients.reduce((s, c) => {
        return s + parseInt(c.budget.replace(/[$,]/g, ""));
    }, 0);
    return (<div className="px-8 py-7 w-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                    <ArrowLeft size={16}/>
                </button>
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>New Client</h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">Add a new client to your agency roster</p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-3 gap-6 items-start">

                {/* ── Left: Main Form (2 cols) ── */}
                <div className="col-span-2 rounded-2xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid #2A1F1F", background: "linear-gradient(to right, #1D1616, #241C1C)" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(216,64,64,0.15)", border: "1px solid rgba(216,64,64,0.3)" }}>
                            <UserPlus size={17} color="#D84040"/>
                        </div>
                        <div>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Client Information</p>
                            <p style={{ color: "#666", fontSize: "12px" }}>Fields marked * are required</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
                        {/* ── Avatar Upload ── */}
                        <div className="flex flex-col items-center py-2">
                            <input id="client-avatar-input" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                setAvatarPreview(URL.createObjectURL(file));
                setAvatarFile(file);
            }
        }}/>
                            <div className="relative group cursor-pointer mb-3" onClick={() => document.getElementById("client-avatar-input")?.click()}>
                                {/* Avatar circle */}
                                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "#8E1616", border: "3px solid #3A2A2A" }}>
                                    {avatarPreview ? (<img src={avatarPreview} alt="Client avatar" className="w-full h-full object-cover"/>) : (<span style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700 }}>{initials || "?"}</span>)}
                                </div>
                                {/* Camera hover overlay */}
                                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                                    <Camera size={20} color="#EEEEEE"/>
                                </div>
                                {/* Small camera badge — always visible */}
                                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#D84040", border: "2px solid #241C1C" }}>
                                    <Camera size={11} color="#fff"/>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => document.getElementById("client-avatar-input")?.click()} style={{ color: "#D84040", fontSize: "12px", fontWeight: 500 }}>
                                    {avatarPreview ? "Change Logo / Avatar" : "Upload Logo / Avatar"}
                                </button>
                                {avatarPreview && (<>
                                        <span style={{ color: "#3A2A2A" }}>·</span>
                                        <button type="button" onClick={() => setAvatarPreview(null)} className="flex items-center gap-1" style={{ color: "#666", fontSize: "12px" }}>
                                            <X size={11}/> Remove
                                        </button>
                                    </>)}
                            </div>
                        </div>

                        {/* Company + Contact */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Building2 size={13} color="#D84040"/> Company Name *
                                </label>
                                <input {...register("name", { required: "Company name is required" })} placeholder="e.g. Apex Media" className="px-3 py-2.5 rounded-lg outline-none" style={{ ...inputStyle, borderColor: errors.name ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.name ? "#D84040" : "#3A2A2A")}/>
                                {errors.name && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <User size={13} color="#D84040"/> Contact Person *
                                </label>
                                <input {...register("contact", { required: "Contact person is required" })} placeholder="e.g. Derek Flynn" className="px-3 py-2.5 rounded-lg outline-none" style={{ ...inputStyle, borderColor: errors.contact ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.contact ? "#D84040" : "#3A2A2A")}/>
                                {errors.contact && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.contact.message}</p>}
                            </div>
                        </div>

                        {/* Email + Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Mail size={13} color="#D84040"/> Email *
                                </label>
                                <input type="email" {...register("email", { required: "Email is required" })} placeholder="contact@company.com" className="px-3 py-2.5 rounded-lg outline-none" style={{ ...inputStyle, borderColor: errors.email ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.email ? "#D84040" : "#3A2A2A")}/>
                                {errors.email && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Phone size={13} color="#D84040"/> Phone
                                </label>
                                <input {...register("phone")} placeholder="+1 (555) 000-0000" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                        </div>

                        {/* Website + Budget */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Globe size={13} color="#D84040"/> Website
                                </label>
                                <input {...register("website")} placeholder="https://company.com" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <DollarSign size={13} color="#D84040"/> Total Budget
                                </label>
                                <input {...register("budget")} placeholder="e.g. $50,000" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                        </div>

                        {/* Status + Client Since */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <User size={13} color="#D84040"/> Relationship Status
                                </label>
                                <div className="flex gap-2">
                                    {statusOptions.map((s) => (<button key={s.value} type="button" onClick={() => { setSelectedStatus(s.value); setValue("status", s.value); }} className="flex-1 py-2 rounded-lg transition-all" style={{
                background: selectedStatus === s.value ? s.bg : "#1D1616",
                border: `1px solid ${selectedStatus === s.value ? s.color : "#3A2A2A"}`,
                color: selectedStatus === s.value ? s.color : "#666",
                fontSize: "12px",
                fontWeight: selectedStatus === s.value ? 600 : 400,
            }}>
                                            {s.value}
                                        </button>))}
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Briefcase size={13} color="#D84040"/> Client Since
                                </label>
                                <input {...register("since")} placeholder="e.g. 2024" className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <AlignLeft size={13} color="#D84040"/> Internal Notes
                            </label>
                            <textarea {...register("notes")} rows={4} placeholder="Internal notes, special requirements, preferences, or anything important about this client relationship..." className="px-3 py-2.5 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                        </div>

                        <div style={{ borderTop: "1px solid #2A1F1F" }}/>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-lg transition-all" style={{ background: "#1D1616", color: "#888", border: "1px solid #3A2A2A", fontSize: "14px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; e.currentTarget.style.borderColor = "#666"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting || success} className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all" style={{ background: success ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "14px", fontWeight: 600, opacity: submitting ? 0.8 : 1 }}>
                                {submitting ? <><Loader2 size={15} className="animate-spin"/> Adding Client...</>
            : success ? <><CheckCircle2 size={15}/> Client Added!</>
                : <><UserPlus size={15}/> Add Client</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Right: Preview + Stats (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Live Preview Card */}
                    <div className="rounded-xl p-5" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#666", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-4">Preview</p>
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: "#8E1616", border: "2px solid #2E2020" }}>
                                    {avatarPreview ? (<img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover"/>) : (<span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>{initials || "?"}</span>)}
                                </div>
                                <div>
                                    <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{nameValue || "Company Name"}</p>
                                    <p style={{ color: "#888", fontSize: "12px" }}>{contactValue || "Contact person"}</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full" style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: "11px", fontWeight: 500 }}>
                                {selectedStatus}
                            </span>
                        </div>
                        <div className="pt-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                            <div className="flex justify-between">
                                <div>
                                    <p style={{ color: "#666", fontSize: "11px" }}>Projects</p>
                                    <p style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700 }}>0</p>
                                </div>
                                <div>
                                    <p style={{ color: "#666", fontSize: "11px" }}>Total Budget</p>
                                    <p style={{ color: "#D84040", fontSize: "16px", fontWeight: 700 }}>{budgetValue || "—"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Stats */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={13} color="#D84040"/>
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Portfolio Overview</p>
                        </div>
                        {[
            { label: "Existing Clients", value: clients.length },
            { label: "Active Clients", value: clients.filter((c) => c.status === "Active").length },
            { label: "Total Budget Pool", value: `$${(totalExistingBudget / 1000).toFixed(0)}K` },
        ].map((stat) => (<div key={stat.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #2A1F1F" }}>
                                <span style={{ color: "#888", fontSize: "12px" }}>{stat.label}</span>
                                <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>{stat.value}</span>
                            </div>))}
                    </div>

                    {/* Tip */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(216,64,64,0.06)", border: "1px solid rgba(216,64,64,0.2)" }}>
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={13} color="#D84040"/>
                            <p style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>Tip</p>
                        </div>
                        <p style={{ color: "#999", fontSize: "12px", lineHeight: "1.6" }}>
                            You can assign projects to this client once it's created. Internal notes are private and never visible to the client.
                        </p>
                    </div>
                </div>
            </div>
        </div>);
}
