// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Briefcase, UserCheck, UserX, Mail, Loader2, X, Clock, CheckCircle, Trash2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";
import { OutsourcePage } from "./OutsourcePage";

// System-level account roles (non-deletable, not from categories)
const SYSTEM_ROLES = ["Admin", "Crew", "Client"];

export function CrewPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [crewMembers, setCrewMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState("All Roles");
    const [freelancers, setFreelancers] = useState([]);
    const [outsourceQuickFilter, setOutsourceQuickFilter] = useState<"available" | "busy" | "blacklist" | "doc-issues" | null>(null);
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [hrRoles, setHrRoles] = useState<string[]>([]); // fetched from /categories (type=hr_role)

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "outsource") setFilter("Outsource");
        else if (tab === "active") setFilter("Active");
        else if (tab === "on-leave") setFilter("On Leave");
        else if (tab === "pending") setFilter("Pending");
        else setFilter("All");

        const q = searchParams.get("search");
        if (q) setSearch(q);
    }, [searchParams]);

    const handleFilterChange = (f: string) => {
        if (f === "Outsource") {
            setSearchParams({ tab: "outsource" });
        } else if (f === "Active") {
            setSearchParams({ tab: "active" });
        } else if (f === "On Leave") {
            setSearchParams({ tab: "on-leave" });
        } else if (f === "Pending") {
            setSearchParams({ tab: "pending" });
        } else {
            setSearchParams({});
        }
    };
    
    // Roles management state
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
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

    const fetchPendingUsers = () => {
        const token = localStorage.getItem("token") || "";
        fetchApi<any[]>('/users', {
            headers: { "x-admin-token": token }
        })
            .then((data) => {
                const pending = data.filter(u => u.role === 'pending');
                setPendingUsers(pending);
            })
            .catch(err => console.error("Error loading pending users:", err));
    };

    useEffect(() => {
        fetchCrewMembers();
        fetchPendingUsers();

        // Fetch hr_role categories from the API (same source as CategoriesPage)
        fetchApi('/categories')
            .then((cats: any[]) => {
                const roles = (cats || [])
                    .filter((c: any) => c.type === 'hr_role')
                    .map((c: any) => c.name as string);
                setHrRoles(roles);
            })
            .catch(err => console.error('Error loading hr_role categories:', err));
    }, []);

    // All roles for the filter dropdown = hr_role categories from DB
    const filterRoles = hrRoles;





    const handleApproveUser = async (user: any, newRole: string) => {
        if (!newRole) return;
        try {
            const token = localStorage.getItem("token") || "";
            await fetchApi(`/users/${user.id}/role`, {
                method: "PUT",
                headers: { "x-admin-token": token },
                body: JSON.stringify({ role: newRole })
            });

            if (newRole === "crew" || newRole === "admin") {
                await fetchApi("/crew", {
                    method: "POST",
                    body: JSON.stringify({
                        name: user.display_name || user.username,
                        email: user.email,
                        role: newRole === "admin" ? "Admin" : "Other",
                        avatar: user.avatar_url || "",
                        status: "Active"
                    })
                });
            } else if (newRole === "client") {
                await fetchApi("/clients", {
                    method: "POST",
                    body: JSON.stringify({
                        name: user.display_name || user.username,
                        slug: user.username.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        email: user.email,
                        status: "Active",
                        avatar: user.avatar_url || ""
                    })
                });
            } else if (newRole === "outsource") {
                await fetchApi("/freelancers", {
                    method: "POST",
                    body: JSON.stringify({
                        name: user.display_name || user.username,
                        email: user.email,
                        role: "Freelancer",
                        status: "available",
                        avatar: user.avatar_url || ""
                    })
                });
            }

            alert(`Đã phê duyệt ${user.email} thành ${newRole}!`);
            fetchPendingUsers();
            if (newRole === "crew" || newRole === "admin") fetchCrewMembers();
        } catch (error) {
            console.error("Error approving user:", error);
            alert("Đã xảy ra lỗi khi phê duyệt user.");
        }
    };

    const handleDeleteUser = async (userId: string | number) => {
        if (!confirm("Bạn có chắc chắn muốn xoá tài khoản này không?")) return;
        try {
            const token = localStorage.getItem("token") || "";
            await fetchApi(`/users/${userId}`, {
                method: "DELETE",
                headers: { "x-admin-token": token }
            });
            alert("Đã xoá tài khoản thành công!");
            fetchPendingUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Đã xảy ra lỗi khi xoá tài khoản.");
        }
    };

    const filters = ["All", "Active", "On Leave", "Outsource", "Pending"];
    const filtered = crewMembers.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            (m.role && m.role.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = filter === "All" || m.status === filter;
        const matchRole = selectedRoleFilter === "All Roles" ||
            (m.role && m.role.split(',').map(r => r.trim()).some(r => r.toLowerCase() === selectedRoleFilter.toLowerCase()));
        return matchSearch && matchStatus && matchRole;
    });

    const available = freelancers.filter((p) => p.status === "available").length;
    const busy = freelancers.filter((p) => p.status === "busy").length;
    const blacklisted = freelancers.filter((p) => p.status === "blacklist").length;
    const docIssues = freelancers.filter((p) => !p.cccdDone || !p.contractSigned || !p.ndaSigned).length;

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Crew
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        {filter === "Outsource" 
                            ? "Talent Pool" 
                            : `${crewMembers.filter((m) => m.status === "Active").length} active members · ${crewMembers.length} total`}
                    </p>
                </div>
                {filter !== "Outsource" && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <button 
                            onClick={() => setIsRolesModalOpen(true)} 
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors w-fit" 
                            style={{ background: "rgba(36, 28, 28, 0.4)", borderColor: "rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} 
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D84040")} 
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}
                        >
                            <Briefcase size={16} color="#D84040"/>
                            Manage Roles
                        </button>
                        <button 
                            onClick={() => navigate("/admin/crew/new")} 
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg w-fit" 
                            style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} 
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} 
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}
                        >
                            <Plus size={16}/>
                            Add Member
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            {filter !== "Outsource" && filter !== "Pending" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                    {[
                        {
                            label: "Active Members",
                            value: crewMembers.filter((m) => m.status === "Active").length,
                            icon: UserCheck,
                            color: "#4CAF50",
                            filterKey: "Active"
                        },
                        {
                            label: "On Leave",
                            value: crewMembers.filter((m) => m.status === "On Leave").length,
                            icon: UserX,
                            color: "#E8A838",
                            filterKey: "On Leave"
                        },
                        {
                            label: "Active Projects",
                            value: crewMembers.reduce((s, m) => s + m.projects, 0),
                            icon: Briefcase,
                            color: "#D84040",
                            filterKey: null
                        },
                        {
                            label: "Chờ xét duyệt",
                            value: pendingUsers.length,
                            icon: Clock,
                            color: "#9ca3af",
                            filterKey: "Pending"
                        },
                    ].map((stat) => (
                        <div key={stat.label} onClick={() => stat.filterKey && handleFilterChange(stat.filterKey)} className={`rounded-xl p-4 flex items-center gap-4 ${stat.filterKey ? "cursor-pointer transition-all" : ""}`} style={{ background: filter === stat.filterKey ? `${stat.color}15` : "rgba(36, 28, 28, 0.4)", border: `1px solid ${filter === stat.filterKey ? stat.color : "rgba(46, 32, 32, 0.6)"}`, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", transform: filter === stat.filterKey ? "scale(1.02)" : "scale(1)" }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}20` }}>
                                <stat.icon size={22} color={stat.color}/>
                            </div>
                            <div>
                                <p style={{ color: "#BBBBBB", fontSize: "13px" }}>{stat.label}</p>
                                <p style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filter === "Outsource" ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                    {[
                        { label: "Đang rảnh",    value: available,   color: "#4ade80", key: "available" as const },
                        { label: "Đang bận",     value: busy,        color: "#fbbf24", key: "busy" as const },
                        { label: "Blacklist",    value: blacklisted, color: "#f87171", key: "blacklist" as const },
                        { label: "Thiếu giấy tờ",value: docIssues,  color: "#c084fc", key: "doc-issues" as const },
                    ].map((k) => {
                        const isActive = outsourceQuickFilter === k.key;
                        return (
                        <div key={k.label} className="rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all"
                            onClick={() => setOutsourceQuickFilter(isActive ? null : k.key)}
                            style={{ 
                                background: isActive ? `${k.color}15` : "rgba(36, 28, 28, 0.4)", 
                                border: `1px solid ${isActive ? `${k.color}80` : "rgba(46, 32, 32, 0.6)"}`, 
                                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                transform: isActive ? "scale(1.02)" : "scale(1)",
                            }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${k.color}20` }}>
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: k.color }} />
                            </div>
                            <div>
                                <p style={{ color: "#BBBBBB", fontSize: "13px" }}>{k.label}</p>
                                <p style={{ color: k.color, fontSize: "24px", fontWeight: 700 }}>{k.value}</p>
                            </div>
                        </div>
                        );
                    })}
                </div>
            ) : null}

            {/* Filter bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    {/* Status Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {filters.map((f) => (
                            <button 
                                key={f} 
                                onClick={() => handleFilterChange(f)} 
                                className="px-4 py-1.5 rounded-lg transition-all text-xs sm:text-sm" 
                                style={{
                                    background: filter === f ? "#D84040" : "#241C1C",
                                    color: filter === f ? "#fff" : "#CCCCCC",
                                    border: `1px solid ${filter === f ? "#D84040" : "#2E2020"}`,
                                    fontWeight: filter === f ? 600 : 400,
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Roles Selector Filter */}
                    {filter !== "Outsource" && filter !== "Pending" && (
                        <select 
                            value={selectedRoleFilter} 
                            onChange={(e) => setSelectedRoleFilter(e.target.value)} 
                            className="px-3 py-1.5 rounded-lg outline-none cursor-pointer w-full sm:w-auto" 
                            style={{ background: "rgba(36, 28, 28, 0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                                color: "#888",
                                border: "1px solid #2E2020",
                                fontSize: "13px",
                            }}
                        >
                            <option value="All Roles">All Roles</option>
                            {filterRoles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Search */}
                {filter !== "Outsource" && filter !== "Pending" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-full md:w-auto" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <Search size={14} color="#666"/>
                        <input placeholder="Search crew..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent w-full md:w-[180px]" style={{ color: "#EEEEEE", fontSize: "13px" }}/>
                    </div>
                )}
            </div>

            {/* Grid & Content */}
            {filter === "Pending" ? (
                <div className="space-y-4">
                    {pendingUsers.map(user => (
                        <div key={user.id} className="p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                            <div className="flex items-center gap-4">
                                <img src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} alt={user.username} className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #241C1C" }}/>
                                <div>
                                    <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>{user.display_name || user.username}</h3>
                                    <p style={{ color: "#888", fontSize: "13px" }}>{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    className="px-3 py-2 rounded-lg outline-none cursor-pointer" 
                                    style={{ background: "#2A1F1F", color: "#EEEEEE", border: "1px solid #3A2A2A", fontSize: "13px" }}
                                    onChange={(e) => handleApproveUser(user, e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Phê duyệt vai trò...</option>
                                    <option value="crew">Nhân sự (Crew)</option>
                                    <option value="client">Khách hàng (Client)</option>
                                    <option value="outsource">Cộng tác viên (Outsource)</option>
                                    <option value="admin">Quản trị viên (Admin)</option>
                                </select>
                                <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 rounded-lg flex items-center justify-center transition-all"
                                    style={{ background: "rgba(216,64,64,0.1)", color: "#D84040", border: "1px solid rgba(216,64,64,0.2)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#D84040"; e.currentTarget.style.color = "#fff"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(216,64,64,0.1)"; e.currentTarget.style.color = "#D84040"; }}
                                    title="Từ chối / Xoá tài khoản"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {pendingUsers.length === 0 && (
                        <div className="text-center py-16">
                            <CheckCircle size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                            <p style={{ color: "#666", fontSize: "14px" }}>Không có user nào đang chờ duyệt</p>
                        </div>
                    )}
                </div>
            ) : filter !== "Outsource" ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((member) => (
                            <div key={member.id} className="rounded-xl overflow-hidden group cursor-pointer" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={() => navigate(`/admin/crew/${member.id}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
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
                                            <span key={skill} className="px-2 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#BBBBBB", fontSize: "12px", border: "1px solid #3A2A2A" }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #2A1F1F" }}>
                                        <div className="flex items-center gap-1.5">
                                            <Briefcase size={13} color="#8E1616"/>
                                            <span style={{ color: "#BBBBBB", fontSize: "13px" }}>
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
                </>
            ) : (
                <OutsourcePage showHeader={false} onTalentPoolChange={setFreelancers} quickFilter={outsourceQuickFilter} />
            )}

            {/* Manage Roles Modal */}
            {isRolesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
                            <div>
                                <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Manage Roles</h3>
                                <p style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>Vị trí chuyên môn được quản lý tại Categories</p>
                            </div>
                            <button onClick={() => setIsRolesModalOpen(false)} style={{ color: "#888" }} className="hover:opacity-70">
                                <X size={18}/>
                            </button>
                        </div>
                        <div className="p-5 space-y-5">

                            {/* System Roles — fixed, non-editable */}
                            <div>
                                <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "8px" }}>VAI TRÒ HỆ THỐNG</p>
                                <div className="space-y-1.5">
                                    {SYSTEM_ROLES.map(role => (
                                        <div key={role} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)" }}>
                                            <div>
                                                <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{role}</p>
                                                <p style={{ color: "#555", fontSize: "11px" }}>Vai trò hệ thống · không thể xoá</p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(142,22,22,0.15)", color: "#D84040", border: "1px solid rgba(216,64,64,0.2)" }}>System</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Specialist Roles — from hr_role categories */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em" }}>VỊ TRÍ CHUYÊN MÔN ({hrRoles.length})</p>
                                    <button
                                        onClick={() => { setIsRolesModalOpen(false); navigate("/admin/categories?tab=hr"); }}
                                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                                        style={{ color: "#D84040" }}
                                    >
                                        <Briefcase size={11}/> Quản lý tại Categories
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid #3A2A2A" }}>
                                    <Search size={12} color="#666"/>
                                    <input value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Tìm vị trí..." className="w-full outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "12px" }}/>
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                    {hrRoles
                                        .filter(role => role.toLowerCase().includes(roleSearch.toLowerCase()))
                                        .map(role => {
                                            const count = crewMembers.filter(m => m.role && m.role.split(',').map(r => r.trim()).some(r => r.toLowerCase() === role.toLowerCase())).length;
                                            return (
                                                <div key={role} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)" }}>
                                                    <div>
                                                        <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>{role}</p>
                                                        <p style={{ color: "#666", fontSize: "11px" }}>{count} thành viên</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {hrRoles.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase())).length === 0 && (
                                        <p style={{ color: "#555", fontSize: "12px", textAlign: "center", padding: "16px 0", fontStyle: "italic" }}>Chưa có vị trí nào. Thêm tại Categories → HR.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-3 flex justify-end" style={{ borderTop: "1px solid #2A1F1F", background: "#1D1616" }}>
                            <button onClick={() => setIsRolesModalOpen(false)} className="px-4 py-2 rounded-lg" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", color: "#EEEEEE", fontSize: "13px" }}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
