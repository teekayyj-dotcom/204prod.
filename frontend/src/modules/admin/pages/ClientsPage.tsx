// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Mail, Briefcase, TrendingUp, Plus, Loader2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";
const statusColors = {
    Lead: { bg: "rgba(233, 30, 99, 0.12)", text: "#E91E63" },
    Active: { bg: "rgba(76,175,80,0.12)", text: "#4CAF50" },
    Paused: { bg: "rgba(232,168,56,0.12)", text: "#E8A838" },
    Completed: { bg: "rgba(150, 150, 150, 0.12)", text: "#999999" },
};

const statusLabels = {
    All: "Tất cả",
    Lead: "Lead mới",
    Active: "Đang hợp tác",
    Paused: "Tạm dừng",
    Completed: "Đã ngừng hợp tác"
};

export function ClientsPage() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Read initial filters from query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const initialIndustry = searchParams.get("industry") || "";
    const initialTier = searchParams.get("tier") || "All";

    const [search, setSearch] = useState(initialIndustry);
    const [filter, setFilter] = useState("All");
    const [tierFilter, setTierFilter] = useState(initialTier);

    useEffect(() => {
        fetchApi('/projects/clients/all')
            .then((data) => {
                // Map the DB Client model to the UI expected format
                const mappedClients = data.map(c => {
                    let tier = "SME"; // default
                    if (c.notes) {
                        try {
                            const trimmed = c.notes.trim();
                            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                                const parsed = JSON.parse(trimmed);
                                tier = parsed.tier || tier;
                            }
                        } catch (e) {}
                    }
                    return {
                        ...c,
                        tier,
                        contact: c.contact || "Contact N/A",
                        email: c.email || "N/A",
                        status: c.status || "Active",
                        since: c.since || "2026",
                        projects: c.project_count || 0,
                        budget: c.total_budget ? `${c.total_budget.toLocaleString()} ₫` : "N/A",
                        avatar: c.logo_media_url || null
                    };
                });
                setClients(mappedClients);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const statuses = ["All", "Lead", "Active", "Paused", "Completed"];
    const filtered = clients.filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.contact.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()));
        const matchFilter = filter === "All" || c.status === filter;
        const matchTier = tierFilter === "All" || c.tier === tierFilter;
        return matchSearch && matchFilter && matchTier;
    });
    const totalBudget = clients.reduce((sum, c) => {
        const n = parseInt(c.budget.replace(/[$,]/g, "")) || 0;
        return sum + n;
    }, 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-white/50" size={32} />
            </div>
        );
    }
    return (<div className="px-8 py-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Clients
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        Manage your client relationships
                    </p>
                </div>
                <button onClick={() => navigate("/admin/clients/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg w-fit" style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                    <Plus size={16}/>
                    Add Client
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
                {[
            { label: "Total Clients", value: clients.length, icon: Users },
            { label: "New Leads", value: clients.filter((c) => c.status === "Lead").length, icon: Mail },
            { label: "Active", value: clients.filter((c) => c.status === "Active").length, icon: TrendingUp },
            { label: "Total Projects", value: clients.reduce((s, c) => s + c.projects, 0), icon: Briefcase },
            { label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: TrendingUp },
        ].map((stat) => (<div key={stat.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(216,64,64,0.12)" }}>
                            <stat.icon size={18} color="#D84040"/>
                        </div>
                        <div>
                            <p style={{ color: "#888", fontSize: "12px" }}>{stat.label}</p>
                            <p style={{ color: "#EEEEEE", fontSize: "20px", fontWeight: 700 }}>{stat.value}</p>
                        </div>
                    </div>))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-2 flex-wrap">
                        {statuses.map((s) => (<button key={s} onClick={() => setFilter(s)} className="px-4 py-1.5 rounded-lg transition-all text-xs sm:text-sm" style={{
                    background: filter === s ? "#D84040" : "#241C1C",
                    color: filter === s ? "#fff" : "#888",
                    border: `1px solid ${filter === s ? "#D84040" : "#2E2020"}`,
                    fontWeight: filter === s ? 600 : 400,
                }}>
                                {statusLabels[s] || s}
                            </button>))}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-full md:w-auto" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                        <Search size={14} color="#666"/>
                        <input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent w-full md:w-[180px]" style={{ color: "#EEEEEE", fontSize: "13px" }}/>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Cấp độ:</span>
                    <div className="flex gap-2 flex-wrap">
                        {["All", "VIP", "SME", "Partner"].map((t) => (<button key={t} onClick={() => setTierFilter(t)} className="px-3 py-1 rounded-lg transition-all text-xs" style={{
                    background: tierFilter === t ? "#6B8FD6" : "#241C1C",
                    color: tierFilter === t ? "#fff" : "#888",
                    border: `1px solid ${tierFilter === t ? "#6B8FD6" : "#2E2020"}`,
                    fontWeight: tierFilter === t ? 600 : 400,
                }}>
                                {t === "All" ? "Tất cả" : t}
                            </button>))}
                    </div>
                </div>
            </div>

            {/* Client Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((client) => (<div key={client.slug} className="rounded-xl p-5 group cursor-pointer" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={() => navigate(`/admin/clients/${client.slug}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "#8E1616", border: "1px solid #2E2020", color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>
                                    {client.avatar ? (
                                        <img src={client.avatar} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>
                                        {client.name}
                                    </h3>
                                    <p style={{ color: "#888", fontSize: "12px" }}>Since {client.since}</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full" style={{
                background: statusColors[client.status]?.bg || "rgba(100,100,100,0.12)",
                color: statusColors[client.status]?.text || "#888",
                fontSize: "11px",
                fontWeight: 500,
            }}>
                                {statusLabels[client.status] || client.status}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Users size={13} color="#666"/>
                                <span style={{ color: "#999", fontSize: "13px" }}>{client.contact}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={13} color="#666"/>
                                <span style={{ color: "#999", fontSize: "13px" }}>{client.email}</span>
                            </div>
                            {/* Industry & Tier metadata row */}
                            <div className="flex gap-2 pt-2 flex-wrap border-t border-[#2A1F1F]/40" style={{ fontSize: "11px" }}>
                                {client.industry && (
                                    <span className="px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#aaa" }}>
                                        Ngành: {client.industry}
                                    </span>
                                )}
                                <span className="px-2 py-0.5 rounded font-semibold" style={{ 
                                    background: client.tier === "VIP" ? "rgba(255,215,0,0.12)" : client.tier === "Partner" ? "rgba(26,188,156,0.12)" : "rgba(107,143,214,0.12)",
                                    color: client.tier === "VIP" ? "#FFD700" : client.tier === "Partner" ? "#1ABC9C" : "#6B8FD6"
                                }}>
                                    Cấp độ: {client.tier}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid #2A1F1F" }}>
                            <div>
                                <p style={{ color: "#666", fontSize: "11px" }}>Projects</p>
                                <p style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>{client.projects}</p>
                            </div>
                            <div>
                                <p style={{ color: "#666", fontSize: "11px" }}>Total Budget</p>
                                <p style={{ color: "#D84040", fontSize: "15px", fontWeight: 600 }}>{client.budget}</p>
                            </div>
                            <button className="px-3 py-1.5 rounded-lg" style={{ background: "#2A1F1F", color: "#888", fontSize: "12px", border: "1px solid #3A2A2A" }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client.slug}`); }} onMouseEnter={(e) => {
                e.currentTarget.style.background = "#D84040";
                e.currentTarget.style.color = "#fff";
            }} onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2A1F1F";
                e.currentTarget.style.color = "#888";
            }}>
                                View Profile
                            </button>
                        </div>
                    </div>))}
            </div>

            {filtered.length === 0 && (<div className="text-center py-16">
                    <Users size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>No clients found</p>
                </div>)}
        </div>);
}
