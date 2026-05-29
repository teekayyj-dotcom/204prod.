// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Edit3, Save, X, Trash2, CheckCircle2, Loader2, Mail, Briefcase, User, AlertTriangle, Tag, Plus, Activity, Calendar, Star, Check, Camera } from "lucide-react";
import { allProjects } from "../data/mockData";
import { fetchApi } from "../utils/apiClient";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { ImageCropperModal } from "../components/ImageCropperModal";
const projectStatusColors = {
    "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
    Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
    Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
    Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
};
const roleOptions = [
    "Creative Director", "Lead Developer", "UX Designer",
    "Motion Designer", "Copywriter", "Photographer",
    "Brand Strategist", "Project Manager", "Illustrator", "Other",
];
const skillSuggestions = [
    "Branding", "Figma", "React", "After Effects", "Blender", "Copywriting",
    "SEO", "Photography", "Cinema 4D", "Node.js", "TypeScript", "Art Direction",
    "Prototyping", "Strategy", "Social Media", "Illustration",
];
const inputStyle = {
    background: "#1D1616",
    border: "1px solid #3A2A2A",
    color: "#EEEEEE",
    fontSize: "14px",
    width: "100%",
};
export function CrewProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");
    // Add Role state
    const [addingRole, setAddingRole] = useState(false);
    const [roleInput, setRoleInput] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [customRolesList, setCustomRolesList] = useState([]);
    const [deletedRolesList, setDeletedRolesList] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState(null);

    const handleCropConfirm = (croppedBlob: Blob, croppedPreviewUrl: string) => {
        const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        setAvatarFile(croppedFile);
        setAvatarPreview(croppedPreviewUrl);
        setCropperOpen(false);
    };
    const assignedProjects = allProjects.slice(0, member?.projects || 0);

    const { register, handleSubmit, watch, reset, setValue } = useForm();
    const watched = watch();

    useEffect(() => {
        const storedCustom = localStorage.getItem("custom_crew_roles");
        if (storedCustom) {
            try { setCustomRolesList(JSON.parse(storedCustom)); } catch (e) { console.error(e); }
        }
        const storedDeleted = localStorage.getItem("deleted_crew_roles");
        if (storedDeleted) {
            try { setDeletedRolesList(JSON.parse(storedDeleted)); } catch (e) { console.error(e); }
        }
    }, []);

    const memberRolesList = member?.role ? member.role.split(",").map(r => r.trim()) : [];
    const availableRoles = Array.from(
        new Set([...roleOptions, ...customRolesList, ...memberRolesList].filter(Boolean))
    ).filter(role => !deletedRolesList.includes(role) || memberRolesList.includes(role));

    const addRole = (role) => {
        if (role && !selectedRoles.includes(role)) {
            setSelectedRoles(prev => [...prev, role]);
        }
    };

    const removeRole = (role) => {
        setSelectedRoles(prev => prev.filter(r => r !== role));
    };

    useEffect(() => {
        setLoading(true);
        fetchApi(`/crew/${id}`)
            .then((data) => {
                setMember(data);
                const memberSkills = data.skills_expertise ? data.skills_expertise.split(",").map((s) => s.trim()).filter(Boolean) : [];
                setSkills(memberSkills);
                const memberRoles = data.role ? data.role.split(",").map((s) => s.trim()).filter(Boolean) : [];
                setSelectedRoles(memberRoles);
                setAvatarPreview(data.avatar || null);
                const dateOnly = data.created_at ? data.created_at.split("T")[0] : new Date().toISOString().split("T")[0];
                reset({
                    name: data.name,
                    role: data.role,
                    email: data.email || "",
                    status: data.status || "Active",
                    bio: data.bio || "",
                    created_at: dateOnly,
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching crew member:", err);
                setLoading(false);
            });
    }, [id, reset]);

    const initials = (watched.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const addSkill = (skill) => {
        const trimmed = skill.trim();
        if (trimmed && !skills.includes(trimmed))
            setSkills((p) => [...p, trimmed]);
        setSkillInput("");
    };
    const removeSkill = (skill) => setSkills((p) => p.filter((s) => s !== skill));
    const onSave = async (data) => {
        setSaving(true);
        try {
            let avatarUrl = avatarPreview;
            if (avatarFile) {
                const formData = new FormData();
                formData.append("file", avatarFile);
                formData.append("alt", `${data.name} Avatar`);
                const mediaAsset = await fetchApi("/media/upload", {
                    method: "POST",
                    body: formData,
                });
                avatarUrl = mediaAsset.url;
            }
            const payload = {
                name: data.name,
                email: data.email,
                phone: member?.phone || "",
                role: selectedRoles.join(", "),
                avatar: avatarUrl || "",
                bio: data.bio || "",
                skills_expertise: skills.join(","),
                assigned_projects: member?.assigned_projects || 0,
                status: data.status || "Active",
                created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
            };
            const updatedMember = await fetchApi(`/crew/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            setMember(updatedMember);
            setSaved(true);
            setTimeout(() => { setSaved(false); setIsEditing(false); }, 1400);
        } catch (error) {
            console.error("Error updating crew member:", error);
            alert(error instanceof Error ? error.message : "Failed to update crew member.");
        } finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await fetchApi(`/crew/${id}`, {
                method: "DELETE",
            });
            navigate("/admin/crew");
        } catch (error) {
            console.error("Error deleting crew member:", error);
            alert(error instanceof Error ? error.message : "Failed to delete crew member.");
            setDeleting(false);
        }
    };
    const handleCancel = () => {
        if (member) {
            const dateOnly = member.created_at ? member.created_at.split("T")[0] : "";
            reset({
                name: member.name,
                role: member.role,
                email: member.email || "",
                status: member.status || "Active",
                bio: member.bio || "",
                created_at: dateOnly,
            });
            const memberSkills = member.skills_expertise ? member.skills_expertise.split(",").map((s) => s.trim()).filter(Boolean) : [];
            setSkills(memberSkills);
            const memberRoles = member.role ? member.role.split(",").map((s) => s.trim()).filter(Boolean) : [];
            setSelectedRoles(memberRoles);
            setAvatarPreview(member.avatar || null);
            setAvatarFile(null);
        }
        setIsEditing(false);
    };
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }
    if (!member) {
        return (<div className="px-8 py-7">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/admin/crew")} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }}>
                        <ArrowLeft size={16}/>
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertTriangle size={48} color="#3A2A2A" className="mb-4"/>
                    <p style={{ color: "#EEEEEE", fontSize: "18px", fontWeight: 600 }}>Member not found</p>
                    <button onClick={() => navigate("/admin/crew")} className="mt-4 px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#fff", fontSize: "14px" }}>Back to Crew</button>
                </div>
            </div>);
    }
    const joinedYear = member.created_at ? new Date(member.created_at).getFullYear() : 2026;
    const yearsWithAgency = new Date().getFullYear() - joinedYear;
    const joinedDateStr = member.created_at 
        ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
        : "May 2026";
    const saveRole = () => {
        const trimmed = roleInput.trim();
        if (trimmed) {
            const updatedCustomList = Array.from(new Set([...customRolesList, trimmed]));
            setCustomRolesList(updatedCustomList);
            localStorage.setItem("custom_crew_roles", JSON.stringify(updatedCustomList));
            addRole(trimmed);
        }
        setRoleInput("");
        setAddingRole(false);
    };
    return (<div className="px-8 py-7 w-full">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/crew")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#888" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#888"; }}>
                        <ArrowLeft size={16}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span style={{ color: "#666", fontSize: "13px" }}>Crew</span>
                            <span style={{ color: "#444" }}>/</span>
                            <span style={{ color: "#EEEEEE", fontSize: "13px" }}>{member.name}</span>
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
                                <Trash2 size={13}/> Remove
                            </button>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{ background: "#D84040", color: "#fff", fontSize: "13px", fontWeight: 600 }} onMouseEnter={(e) => { e.currentTarget.style.background = "#c03030"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#D84040"; }}>
                                <Edit3 size={13}/> Edit Profile
                            </button>
                        </>)}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal isOpen={confirmDelete} itemType="crew member" itemName={member.name} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} isDeleting={deleting}/>

            {/* Main grid */}
            <div className="grid grid-cols-3 gap-6">

                {/* ── Left: Profile + Bio + Skills + Projects (2 cols) ── */}
                <div className="col-span-2 space-y-5">

                    {/* Profile Hero Card */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        {/* Banner — sent to back so text above it is always visible */}
                        <div className="h-28 relative" style={{
            background: "linear-gradient(135deg, #1D1616 0%, #8E1616 55%, #D84040 100%)",
            zIndex: 0,
        }}>
                            <span className="absolute top-3 right-4 px-2.5 py-1 rounded-full" style={{
            background: watched.status === "Active" ? "rgba(76,175,80,0.2)" : "rgba(232,168,56,0.2)",
            color: watched.status === "Active" ? "#4CAF50" : "#E8A838",
            fontSize: "12px", fontWeight: 600, backdropFilter: "blur(8px)",
        }}>
                                {watched.status}
                            </span>
                        </div>

                        {/* Content — sits above the banner in stacking order */}
                        <div className="px-6 pb-6 relative" style={{ zIndex: 1 }}>
                            {/* Avatar + name row — avatar pulls up over banner via -mt-10 */}
                            <div className="flex items-end gap-4 -mt-10 mb-4">
                                <div className="relative group" style={{ zIndex: 2 }}>
                                    <input id="crew-profile-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                setRawImageSrc(URL.createObjectURL(file));
                setCropperOpen(true);
            }
            e.target.value = "";
        }}/>
                                    <img src={avatarPreview || member.avatar} alt={member.name} className="w-20 h-20 rounded-full object-cover" style={{ border: "3px solid #241C1C" }}/>
                                    {/* Camera overlay — only in edit mode */}
                                    {isEditing && (<>
                                            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => document.getElementById("crew-profile-avatar")?.click()}>
                                                <Camera size={22} color="#EEEEEE"/>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#D84040", border: "2px solid #241C1C" }} onClick={() => document.getElementById("crew-profile-avatar")?.click()}>
                                                <Camera size={11} color="#fff"/>
                                            </div>
                                        </>)}
                                </div>
                                <div className="pb-1 flex-1" style={{ zIndex: 2, position: "relative" }}>
                                    {isEditing ? (<div>
                                            <div className="mb-2">
                                                <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Full Name</label>
                                                <input {...register("name")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                            </div>
                                            <div className="mb-2">
                                                <label style={{ color: "#888", fontSize: "11px", display: "block" }} className="mb-1">Roles / Titles</label>
                                                <input type="hidden" {...register("role", { validate: () => selectedRoles.length > 0 || "At least one role is required" })} />
                                                {selectedRoles.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {selectedRoles.map((role) => (
                                                            <span key={role} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)" }}>
                                                                {role}
                                                                <button type="button" onClick={() => removeRole(role)} className="ml-1 hover:opacity-75">
                                                                    <X size={10}/>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <select 
                                                    value="" 
                                                    onChange={(e) => {
                                                        addRole(e.target.value);
                                                        e.target.value = "";
                                                    }}
                                                    className="px-3 py-2 rounded-lg outline-none appearance-none cursor-pointer" 
                                                    style={inputStyle} 
                                                    onFocus={(e) => (e.target.style.borderColor = "#D84040")} 
                                                    onBlur={(e) => (e.target.style.borderColor = selectedRoles.length === 0 && errors?.role ? "#D84040" : "#3A2A2A")}
                                                >
                                                    <option value="">Select roles...</option>
                                                    {availableRoles.filter(r => !selectedRoles.includes(r)).map((r) => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Avatar change link beneath select input */}
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => document.getElementById("crew-profile-avatar")?.click()} style={{ color: "#D84040", fontSize: "11px", fontWeight: 500 }}>
                                                    {avatarPreview ? "Change Photo" : "Upload Photo"}
                                                </button>
                                                {avatarPreview && (<>
                                                         <span style={{ color: "#3A2A2A", fontSize: "10px" }}>·</span>
                                                         <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} style={{ color: "#666", fontSize: "11px" }}>
                                                             Reset
                                                         </button>
                                                     </>)}
                                             </div>
                                         </div>) : (<>
                                             <h2 style={{ color: "#EEEEEE", fontSize: "20px", fontWeight: 700 }}>{watched.name}</h2>
                                             <div className="flex flex-wrap gap-1 mt-1">
                                                 {selectedRoles.map((r) => (
                                                     <span key={r} className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.2)" }}>
                                                         {r}
                                                     </span>
                                                 ))}
                                                 {selectedRoles.length === 0 && (
                                                     <span style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>No role assigned</span>
                                                 )}
                                             </div>
                                         </>)}
                                </div>
                                {isEditing && (<span className="px-2 py-0.5 rounded mb-1 flex-shrink-0" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", fontSize: "11px" }}>
                                        Editing
                                    </span>)}
                            </div>

                            {/* Email + Status + Join Date */}
                            <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: "1px solid #2A1F1F" }}>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                        <Mail size={10} color="#D84040"/> Email
                                    </label>
                                    {isEditing ? (<input type="email" {...register("email")} className="px-3 py-2 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "13px" }}>{member.email || "—"}</p>)}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                        <Activity size={10} color="#D84040"/> Availability
                                    </label>
                                    {isEditing ? (<select {...register("status")} className="px-3 py-2 rounded-lg outline-none appearance-none" style={inputStyle}>
                                            <option value="Active">Active</option>
                                            <option value="On Leave">On Leave</option>
                                        </select>) : (<span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{
                background: member.status === "Active" ? "rgba(76,175,80,0.15)" : "rgba(232,168,56,0.15)",
                color: member.status === "Active" ? "#4CAF50" : "#E8A838",
                fontSize: "12px", fontWeight: 600,
            }}>
                                            {member.status}
                                        </span>)}
                                </div>
                                <div>
                                    <label style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-1.5 flex items-center gap-1">
                                        <Calendar size={10} color="#D84040"/> Join Date
                                    </label>
                                    {isEditing ? (<input type="date" {...register("created_at")} className="px-3 py-2.5 rounded-lg outline-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#EEEEEE", fontSize: "13px" }}>{joinedDateStr}</p>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="rounded-xl p-5" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <label style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="flex items-center gap-2 mb-3">
                            <User size={14} color="#D84040"/> Bio
                        </label>
                        {isEditing ? (<textarea {...register("bio")} rows={4} placeholder="Professional background, expertise, and working style..." className="px-3 py-2.5 rounded-lg outline-none resize-none" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>) : (<p style={{ color: "#aaa", fontSize: "13px", lineHeight: "1.8" }}>
                                {member.bio || "No bio available."}
                            </p>)}
                    </div>

                    {/* Skills */}
                    <div className="rounded-xl p-5" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <label style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} className="flex items-center gap-2 mb-4">
                            <Tag size={14} color="#D84040"/> Skills & Expertise
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {skills.map((skill) => (<span key={skill} className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", fontSize: "12px", border: "1px solid rgba(216,64,64,0.25)", fontWeight: 500 }}>
                                    {skill}
                                    {isEditing && (<button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 hover:opacity-70">
                                            <X size={11}/>
                                        </button>)}
                                </span>))}
                        </div>
                        {isEditing && (<>
                                <div className="flex gap-2 mb-3">
                                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") {
            e.preventDefault();
            addSkill(skillInput);
        } }} placeholder="Add a skill and press Enter..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "13px" }} onFocus={(e) => (e.target.style.borderColor = "#D84040")} onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}/>
                                    <button type="button" onClick={() => addSkill(skillInput)} className="px-3 py-2 rounded-lg flex items-center" style={{ background: "rgba(216,64,64,0.15)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)" }}>
                                        <Plus size={14}/>
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {skillSuggestions.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (<button key={s} type="button" onClick={() => addSkill(s)} className="px-2 py-0.5 rounded transition-all" style={{ background: "#1D1616", color: "#666", fontSize: "11px", border: "1px solid #2E2020" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2E2020"; e.currentTarget.style.color = "#666"; }}>
                                            + {s}
                                        </button>))}
                                </div>
                            </>)}
                    </div>

                    {/* Assigned Projects */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <p style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>Assigned Projects</p>
                            <span style={{ color: "#D84040", fontSize: "12px" }}>{member.projects} projects</span>
                        </div>
                        <div className="divide-y" style={{ borderColor: "#2A1F1F" }}>
                            {assignedProjects.map((p) => (<div key={p.id} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors" onClick={() => navigate(`/admin/projects/${p.id}`)} onMouseEnter={(e) => (e.currentTarget.style.background = "#2A1F1F")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                    <img src={p.image} alt={p.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{p.title}</p>
                                        <p style={{ color: "#666", fontSize: "11px" }}>{p.client} · {p.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-full" style={{ background: projectStatusColors[p.status]?.bg, color: projectStatusColors[p.status]?.text, fontSize: "10px", fontWeight: 500 }}>
                                            {p.status}
                                        </span>
                                        <span style={{ color: "#D84040", fontSize: "12px", fontWeight: 600 }}>{p.budget}</span>
                                    </div>
                                </div>))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Sidebar (1 col) ── */}
                <div className="col-span-1 space-y-5">

                    {/* Member Stats */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Member Stats</p>
                        {[
            { icon: Briefcase, label: "Projects", value: member.projects, color: "#D84040" },
            { icon: Tag, label: "Skills", value: skills.length },
            { icon: Calendar, label: "Joined", value: joinedDateStr },
            { icon: Star, label: "Years w/ Agency", value: yearsWithAgency > 0 ? `${yearsWithAgency}yr${yearsWithAgency !== 1 ? "s" : ""}` : "< 1yr" },
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
                        <a href={`mailto:${member.email}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "#1D1616", color: "#EEEEEE", border: "1px solid #2A1F1F", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                            <Mail size={14} color="#D84040"/>
                            Send Message
                        </a>
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "#1D1616", color: "#EEEEEE", border: "1px solid #2A1F1F", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                            <Edit3 size={14} color="#D84040"/>
                            Edit Profile
                        </button>
                        <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all" style={{ background: "#1D1616", color: "#888", border: "1px solid #2A1F1F", fontSize: "13px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#D84040"; e.currentTarget.style.borderColor = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#2A1F1F"; }}>
                            <Trash2 size={14}/>
                            Remove from Crew
                        </button>
                    {/* Role badge — with Add Role */}
                    <div className="rounded-xl p-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <p style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.07em" }} className="mb-3">Current Roles</p>

                        {isEditing ? (
                            <div className="space-y-3">
                                <div>
                                    {selectedRoles.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {selectedRoles.map((role) => (
                                                <span key={role} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ background: "rgba(216,64,64,0.12)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)" }}>
                                                    {role}
                                                    <button type="button" onClick={() => removeRole(role)} className="ml-1 hover:opacity-75">
                                                        <X size={10}/>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <select 
                                        value="" 
                                        onChange={(e) => {
                                            addRole(e.target.value);
                                            e.target.value = "";
                                        }}
                                        className="px-3 py-2 rounded-lg outline-none appearance-none cursor-pointer" 
                                        style={inputStyle}
                                    >
                                        <option value="">Select roles...</option>
                                        {availableRoles.filter(r => !selectedRoles.includes(r)).map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {addingRole ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input autoFocus value={roleInput} onChange={(e) => setRoleInput(e.target.value)} onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    saveRole();
                                                }
                                                if (e.key === "Escape") {
                                                    setAddingRole(false);
                                                    setRoleInput("");
                                                }
                                            }} placeholder="e.g. Brand Strategist..." className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ background: "#1D1616", border: "1px solid #D84040", color: "#EEEEEE", fontSize: "13px" }}/>
                                            <button type="button" onClick={saveRole} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#D84040", color: "#fff" }}>
                                                <Check size={13}/>
                                            </button>
                                            <button type="button" onClick={() => { setAddingRole(false); setRoleInput(""); }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#2A1F1F", color: "#888", border: "1px solid #3A2A2A" }}>
                                                <X size={13}/>
                                            </button>
                                        </div>
                                        <p style={{ color: "#666", fontSize: "11px" }}>Press Enter to save · Esc to cancel</p>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setAddingRole(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-full transition-all" style={{ background: "transparent", color: "#666", border: "1px dashed #3A2A2A", fontSize: "12px" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84040"; e.currentTarget.style.color = "#D84040"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#3A2A2A"; e.currentTarget.style.color = "#666"; }}>
                                        <Plus size={12}/> Add Custom Option
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedRoles.map((r) => (
                                    <span key={r} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.25)", fontSize: "12px", fontWeight: 500 }}>
                                        <User size={12}/> {r}
                                    </span>
                                ))}
                                {selectedRoles.length === 0 && (
                                    <span style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>No role assigned</span>
                                )}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            <ImageCropperModal
                isOpen={cropperOpen}
                imageSrc={rawImageSrc || ""}
                onConfirm={handleCropConfirm}
                onCancel={() => setCropperOpen(false)}
            />
        </div>);
}
