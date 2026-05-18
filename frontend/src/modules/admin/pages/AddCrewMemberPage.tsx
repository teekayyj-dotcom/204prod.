// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ArrowLeft, UserPlus, Loader2, CheckCircle2, User, Mail, Briefcase, Tag, AlignLeft, X, Plus, Info, UserCheck, Camera } from "lucide-react";
import { crewMembers } from "../data/mockData";
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
const roleOptions = [
    "Creative Director", "Lead Developer", "UX Designer",
    "Motion Designer", "Copywriter", "Photographer",
    "Brand Strategist", "Project Manager", "Illustrator", "Other",
];
const skillSuggestions = [
    "Branding", "Figma", "React", "After Effects", "Blender", "Copywriting",
    "SEO", "Photography", "Cinema 4D", "Node.js", "TypeScript", "Art Direction",
    "Prototyping", "Strategy", "Social Media", "Illustration", "3D Modeling",
];
export function AddCrewMemberPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: { status: "Active" },
    });
    const nameValue = watch("name") || "";
    const roleValue = watch("role") || "";
    const statusValue = watch("status") || "Active";
    const initials = nameValue.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    const addSkill = (skill) => {
        const trimmed = skill.trim();
        if (trimmed && !skills.includes(trimmed))
            setSkills((prev) => [...prev, trimmed]);
        setSkillInput("");
    };
    const removeSkill = (skill) => setSkills((prev) => prev.filter((s) => s !== skill));
    const onSubmit = async (_data) => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 1100));
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => navigate("/admin/crew"), 1300);
    };
    return (<div className="px-8 py-7 w-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                    <ArrowLeft size={16}/>
                </button>
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>New Crew Member</h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">Add a new member to your creative team</p>
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
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Member Details</p>
                            <p style={{ color: "#666", fontSize: "12px" }}>Fields marked * are required</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
                        {/* ── Avatar Upload ── */}
                        <div className="flex flex-col items-center py-2">
                            <input id="crew-avatar-input" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                setAvatarPreview(URL.createObjectURL(file));
        }}/>
                            <div className="relative group cursor-pointer mb-3" onClick={() => document.getElementById("crew-avatar-input")?.click()}>
                                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#8E1616", border: "3px solid #3A2A2A" }}>
                                    {avatarPreview ? (<img src={avatarPreview} alt="Crew avatar" className="w-full h-full object-cover"/>) : (<span style={{ color: "#EEEEEE", fontSize: "22px", fontWeight: 700 }}>{initials}</span>)}
                                </div>
                                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                                    <Camera size={20} color="#EEEEEE"/>
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#D84040", border: "2px solid #241C1C" }}>
                                    <Camera size={11} color="#fff"/>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => document.getElementById("crew-avatar-input")?.click()} style={{ color: "#D84040", fontSize: "12px", fontWeight: 500 }}>
                                    {avatarPreview ? "Change Profile Photo" : "Upload Profile Photo"}
                                </button>
                                {avatarPreview && (<>
                                        <span style={{ color: "#3A2A2A" }}>·</span>
                                        <button type="button" onClick={() => setAvatarPreview(null)} className="flex items-center gap-1" style={{ color: "#666", fontSize: "12px" }}>
                                            <X size={11}/> Remove
                                        </button>
                                    </>)}
                            </div>
                        </div>

                        {/* Name + Role */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <User size={13} color="#D84040"/> Full Name *
                                </label>
                                <input {...register("name", { required: "Name is required" })} placeholder="e.g. Jordan Blake" className="px-3 py-2.5 rounded-lg outline-none" style={{ ...inputStyle, borderColor: errors.name ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.name ? "#D84040" : "#3A2A2A")}/>
                                {errors.name && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Briefcase size={13} color="#D84040"/> Role / Title *
                                </label>
                                <select {...register("role", { required: "Role is required" })} className="px-3 py-2.5 rounded-lg outline-none appearance-none" style={{ ...inputStyle, borderColor: errors.role ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.role ? "#D84040" : "#3A2A2A")}>
                                    <option value="">Select role</option>
                                    {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                                {errors.role && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.role.message}</p>}
                            </div>
                        </div>

                        {/* Email + Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <Mail size={13} color="#D84040"/> Email *
                                </label>
                                <input type="email" {...register("email", { required: "Email is required" })} placeholder="member@framecraft.co" className="px-3 py-2.5 rounded-lg outline-none" style={{ ...inputStyle, borderColor: errors.email ? "#D84040" : "#3A2A2A" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = errors.email ? "#D84040" : "#3A2A2A")}/>
                                {errors.email && <p style={{ color: "#D84040", fontSize: "11px" }} className="mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                    <User size={13} color="#D84040"/> Availability Status
                                </label>
                                <select {...register("status")} className="px-3 py-2.5 rounded-lg outline-none appearance-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}>
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <Tag size={13} color="#D84040"/> Skills & Expertise
                            </label>
                            {/* Added skills */}
                            {skills.length > 0 && (<div className="flex flex-wrap gap-1.5 mb-2">
                                    {skills.map((skill) => (<span key={skill} className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", fontSize: "12px", border: "1px solid rgba(216,64,64,0.25)" }}>
                                            {skill}
                                            <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5">
                                                <X size={10}/>
                                            </button>
                                        </span>))}
                                </div>)}
                            {/* Input row */}
                            <div className="flex gap-2 mb-2">
                                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") {
        e.preventDefault();
        addSkill(skillInput);
    } }} placeholder="Type a skill and press Enter..." className="flex-1 px-3 py-2.5 rounded-lg outline-none" style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                <button type="button" onClick={() => addSkill(skillInput)} className="px-3 py-2 rounded-lg flex items-center" style={{ background: "rgba(216,64,64,0.15)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)" }}>
                                    <Plus size={14}/>
                                </button>
                            </div>
                            {/* Quick-add suggestions */}
                            <div className="flex flex-wrap gap-1.5">
                                {skillSuggestions.filter((s) => !skills.includes(s)).slice(0, 10).map((s) => (<button key={s} type="button" onClick={() => addSkill(s)} className="px-2 py-0.5 rounded transition-all" style={{ background: "#1D1616", color: "#666", fontSize: "11px", border: "1px solid #2E2020" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#666"; }}>
                                        + {s}
                                    </button>))}
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="flex items-center gap-2 mb-2" style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                                <AlignLeft size={13} color="#D84040"/> Bio
                            </label>
                            <textarea {...register("bio")} rows={4} placeholder="Brief professional background, experience level, areas of specialisation, and working style..." className="px-3 py-2.5 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                        </div>

                        <div style={{ borderTop: "1px solid #2A1F1F" }}/>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-lg transition-all" style={{ background: "#1D1616", color: "#888", border: "1px solid #3A2A2A", fontSize: "14px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#EEEEEE"; e.currentTarget.style.borderColor = "#666"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#3A2A2A"; }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting || success} className="flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all" style={{ background: success ? "#4CAF50" : "#D84040", color: "#fff", fontSize: "14px", fontWeight: 600, opacity: submitting ? 0.8 : 1 }}>
                                {submitting ? <><Loader2 size={15} className="animate-spin"/> Adding Member...</>
            : success ? <><CheckCircle2 size={15}/> Member Added!</>
                : <><UserPlus size={15}/> Add to Crew</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Right: Profile Preview + Team Stats (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Live Profile Preview */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="h-20 relative" style={{ background: "linear-gradient(135deg, #1D1616, #8E1616)" }}>
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full" style={{
            background: statusValue === "Active" ? "rgba(76,175,80,0.2)" : "rgba(232,168,56,0.2)",
            color: statusValue === "Active" ? "#4CAF50" : "#E8A838",
            fontSize: "11px", fontWeight: 500,
        }}>
                                {statusValue}
                            </div>
                        </div>
                        <div className="px-4 pb-4">
                            <div className="relative z-10 -mt-8 mb-2">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "16px", fontWeight: 700, border: "3px solid #241C1C" }}>
                                    {avatarPreview ? (<img src={avatarPreview} alt="Preview" className="w-full h-full object-cover"/>) : (initials)}
                                </div>
                            </div>
                            <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>{nameValue || "Member Name"}</p>
                            <p style={{ color: "#D84040", fontSize: "12px" }} className="mb-3">{roleValue || "Role"}</p>
                            {skills.length > 0 && (<div className="flex flex-wrap gap-1">
                                    {skills.slice(0, 4).map((s) => (<span key={s} className="px-2 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#888", fontSize: "10px", border: "1px solid #3A2A2A" }}>
                                            {s}
                                        </span>))}
                                </div>)}
                        </div>
                    </div>

                    {/* Team Stats */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <UserCheck size={13} color="#D84040"/>
                            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Current Team</p>
                        </div>
                        {[
            { label: "Total Members", value: crewMembers.length },
            { label: "Active Now", value: crewMembers.filter((m) => m.status === "Active").length },
            { label: "On Leave", value: crewMembers.filter((m) => m.status === "On Leave").length },
        ].map((stat) => (<div key={stat.label} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #2A1F1F" }}>
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
                            Add skills using the suggestions or type custom ones. Skills help with project assignments and team filtering.
                        </p>
                    </div>
                </div>
            </div>
        </div>);
}
