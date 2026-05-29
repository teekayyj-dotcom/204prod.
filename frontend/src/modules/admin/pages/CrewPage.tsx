// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Briefcase, UserCheck, UserX, Mail, Loader2, X, Trash2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";

const defaultRoles = [
    "Creative Director", "Lead Developer", "UX Designer",
    "Motion Designer", "Copywriter", "Photographer",
    "Brand Strategist", "Project Manager", "Illustrator", "Other"
];

export function CrewPage() {
    const navigate = useNavigate();
    const [crewMembers, setCrewMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState("All Roles");
    
    // Roles management state
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
    const [customRoles, setCustomRoles] = useState([]);
    const [deletedRoles, setDeletedRoles] = useState([]);
    const [newRoleInput, setNewRoleInput] = useState("");
    const [roleSearch, setRoleSearch] = useState("");

    const fetchCrewMembers = () => {
        fetchApi('/crew')
            .then((data) => {
                const mapped = data.map(m => ({
                    ...m,
                    skills: m.skills_expertise ? m.skills_expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
                    projects: m.assigned_projects || 0
                }));
                setCrewMembers(mapped);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading crew:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCrewMembers();
        
        // Load custom and deleted roles lists from localStorage
        const storedCustom = localStorage.getItem("custom_crew_roles");
        if (storedCustom) {
            try { setCustomRoles(JSON.parse(storedCustom)); } catch (e) { console.error(e); }
        }
        
        const storedDeleted = localStorage.getItem("deleted_crew_roles");
        if (storedDeleted) {
            try { setDeletedRoles(JSON.parse(storedDeleted)); } catch (e) { console.error(e); }
        }
    }, []);

    const saveCustomRoles = (newRolesList) => {
        setCustomRoles(newRolesList);
        localStorage.setItem("custom_crew_roles", JSON.stringify(newRolesList));
    };

    const saveDeletedRoles = (newDeletedList) => {
        setDeletedRoles(newDeletedList);
        localStorage.setItem("deleted_crew_roles", JSON.stringify(newDeletedList));
    };

    // Calculate dynamic list of roles (defaults + custom + active DB roles, minus deleted defaults)
    const dbRoles = crewMembers.flatMap(m => m.role ? m.role.split(',').map(r => r.trim()) : []).filter(Boolean);
    const combinedRoles = Array.from(new Set([...defaultRoles, ...customRoles, ...dbRoles]))
        .filter(role => !deletedRoles.includes(role));

    const handleAddRole = () => {
        const trimmed = newRoleInput.trim();
        if (!trimmed) return;
        if (combinedRoles.includes(trimmed)) {
            alert("Role already exists.");
            return;
        }
        if (deletedRoles.includes(trimmed)) {
            saveDeletedRoles(deletedRoles.filter(r => r !== trimmed));
        } else {
            saveCustomRoles([...customRoles, trimmed]);
        }
        setNewRoleInput("");
    };

    const handleDeleteRole = async (roleToDelete) => {
        const membersToUpdate = crewMembers.filter(m => {
            const roles = m.role ? m.role.split(',').map(r => r.trim()) : [];
            return roles.includes(roleToDelete);
        });
        const count = membersToUpdate.length;

        if (count > 0) {
            const confirmAssign = window.confirm(
                `There are ${count} crew member(s) currently assigned to the "${roleToDelete}" role. \n\nDeleting this role will remove it from their assigned roles. Do you want to proceed?`
            );
            if (!confirmAssign) return;

            setLoading(true);
            for (const member of membersToUpdate) {
                try {
                    const remainingRoles = member.role.split(',').map(r => r.trim()).filter(r => r !== roleToDelete);
                    const updatedRoleStr = remainingRoles.length > 0 ? remainingRoles.join(', ') : "Other";
                    const payload = {
                        name: member.name,
                        email: member.email,
                        phone: member.phone || "",
                        role: updatedRoleStr,
                        avatar: member.avatar,
                        bio: member.bio || "",
                        skills_expertise: member.skills_expertise || "",
                        assigned_projects: member.assigned_projects || 0,
                        status: member.status || "Active",
                        created_at: member.created_at
                    };
                    await fetchApi(`/crew/${member.id}`, {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    });
                } catch (e) {
                    console.error("Error updating member role:", e);
                }
            }
            fetchCrewMembers();
        }

        if (defaultRoles.includes(roleToDelete)) {
            saveDeletedRoles([...deletedRoles, roleToDelete]);
        }
        saveCustomRoles(customRoles.filter(r => r !== roleToDelete));
    };

    const filters = ["All", "Active", "On Leave"];
    const filtered = crewMembers.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            (m.role && m.role.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filter === "All" || m.status === filter;
        const matchRole = selectedRoleFilter === "All Roles" || 
            (m.role && m.role.split(',').map(r => r.trim()).includes(selectedRoleFilter));
        return matchSearch && matchStatus && matchRole;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }

    return (
        <div className="px-8 py-7">
            {/* Header section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Crew
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        {crewMembers.filter((m) => m.status === "Active").length} active members · {crewMembers.length} total
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsRolesModalOpen(true)} 
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors" 
                        style={{ background: "#241C1C", borderColor: "#2E2020", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} 
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")} 
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}
                    >
                        <Briefcase size={16} color="#D84040"/>
                        Manage Roles
                    </button>
                    <button 
                        onClick={() => navigate("/admin/crew/new")} 
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg" 
                        style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} 
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} 
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}
                    >
                        <Plus size={16}/>
                        Add Member
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-7">
                {[
                    {
                        label: "Active Members",
                        value: crewMembers.filter((m) => m.status === "Active").length,
                        icon: UserCheck,
                        color: "#4CAF50",
                    },
                    {
                        label: "On Leave",
                        value: crewMembers.filter((m) => m.status === "On Leave").length,
                        icon: UserX,
                        color: "#E8A838",
                    },
                    {
                        label: "Active Projects",
                        value: crewMembers.reduce((s, m) => s + m.projects, 0),
                        icon: Briefcase,
                        color: "#D84040",
                    },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                            <stat.icon size={22} color={stat.color}/>
                        </div>
                        <div>
                            <p style={{ color: "#888", fontSize: "12px" }}>{stat.label}</p>
                            <p style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {/* Status Filters */}
                    <div className="flex gap-2">
                        {filters.map((f) => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)} 
                                className="px-4 py-1.5 rounded-lg transition-all" 
                                style={{
                                    background: filter === f ? "#D84040" : "#241C1C",
                                    color: filter === f ? "#fff" : "#888",
                                    border: `1px solid ${filter === f ? "#D84040" : "#2E2020"}`,
                                    fontSize: "13px",
                                    fontWeight: filter === f ? 600 : 400,
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Roles Selector Filter */}
                    <select 
                        value={selectedRoleFilter} 
                        onChange={(e) => setSelectedRoleFilter(e.target.value)} 
                        className="px-3 py-1.5 rounded-lg outline-none cursor-pointer" 
                        style={{
                            background: "#241C1C",
                            color: "#888",
                            border: "1px solid #2E2020",
                            fontSize: "13px",
                        }}
                    >
                        <option value="All Roles">All Roles</option>
                        {combinedRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <Search size={14} color="#666"/>
                    <input placeholder="Search crew..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "13px", width: "180px" }}/>
                </div>
            </div>

            {/* Crew Grid */}
            <div className="grid grid-cols-3 gap-5">
                {filtered.map((member) => (
                    <div key={member.id} className="rounded-xl overflow-hidden group cursor-pointer" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onClick={() => navigate(`/admin/crew/${member.id}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
                        {/* Banner */}
                        <div className="h-20 relative" style={{ background: "linear-gradient(135deg, #1D1616, #8E1616)" }}>
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full" style={{
                                background: member.status === "Active" ? "rgba(76,175,80,0.2)" : "rgba(232,168,56,0.2)",
                                color: member.status === "Active" ? "#4CAF50" : "#E8A838",
                                fontSize: "11px",
                                fontWeight: 500,
                            }}>
                                {member.status}
                            </div>
                        </div>

                        <div className="px-5 pb-5 relative">
                            {/* Avatar */}
                            <div className="relative z-10 -mt-8 mb-3">
                                <img src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} alt={member.name} className="w-16 h-16 rounded-full object-cover" style={{ border: "3px solid #241C1C" }}/>
                            </div>

                            <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }} className="mb-0.5">
                                {member.name}
                            </h3>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {member.role ? member.role.split(',').map((r) => r.trim()).map((r) => (
                                    <span key={r} className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.2)" }}>
                                        {r}
                                    </span>
                                )) : <span style={{ color: "#555", fontSize: "12px", fontStyle: "italic" }}>No role assigned</span>}
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {member.skills.map((skill) => (
                                    <span key={skill} className="px-2 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#888", fontSize: "11px", border: "1px solid #3A2A2A" }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase size={13} color="#8E1616"/>
                                    <span style={{ color: "#888", fontSize: "12px" }}>
                                        {member.projects} project{member.projects !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#2A1F1F", color: "#888" }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/crew/${member.id}`); }} onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#D84040";
                                    e.currentTarget.style.color = "#fff";
                                }} onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#2A1F1F";
                                    e.currentTarget.style.color = "#888";
                                }}>
                                    <Mail size={14}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16">
                    <UserCheck size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>No crew members found</p>
                </div>
            )}

            {/* Manage Roles Modal */}
            {isRolesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Manage Roles</h3>
                            <button onClick={() => setIsRolesModalOpen(false)} style={{ color: "#888" }} className="hover:opacity-70">
                                <X size={18}/>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Create New Role Input */}
                            <div className="flex gap-2">
                                <input 
                                    value={newRoleInput} 
                                    onChange={(e) => setNewRoleInput(e.target.value)} 
                                    placeholder="Enter new role name..." 
                                    className="flex-1 px-3 py-2 rounded-lg outline-none" 
                                    style={{ background: "#1D1616", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "13px" }} 
                                    onFocus={(e) => (e.target.style.borderColor = "#D84040")} 
                                    onBlur={(e) => (e.target.style.borderColor = "#3A2A2A")}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                                />
                                <button onClick={handleAddRole} className="px-4 py-2 rounded-lg" style={{ background: "#D84040", color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                                    Add
                                </button>
                            </div>

                            {/* Search roles list */}
                            <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#1D1616", border: "1px solid #3A2A2A" }}>
                                <Search size={13} color="#666"/>
                                <input value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Search roles list..." className="w-full outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "12px" }}/>
                            </div>

                            {/* Roles List */}
                            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                                {combinedRoles
                                    .filter(role => role.toLowerCase().includes(roleSearch.toLowerCase()))
                                    .map(role => {
                                        const count = crewMembers.filter(m => m.role && m.role.split(',').map(r => r.trim()).includes(role)).length;
                                        return (
                                            <div key={role} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}>
                                                <div>
                                                    <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{role}</p>
                                                    <p style={{ color: "#666", fontSize: "11px" }}>{count} member{count !== 1 ? "s" : ""}</p>
                                                </div>
                                                <button onClick={() => handleDeleteRole(role)} style={{ color: "#666" }} className="hover:text-red-500 hover:opacity-100 transition-colors p-1" title="Delete Role">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                        <div className="px-5 py-3 flex justify-end" style={{ borderTop: "1px solid #2A1F1F", background: "#1D1616" }}>
                            <button onClick={() => setIsRolesModalOpen(false)} className="px-4 py-2 rounded-lg" style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#EEEEEE", fontSize: "13px" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
