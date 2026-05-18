// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Users, Mail, Briefcase, TrendingUp, Plus } from "lucide-react";
import { clients } from "../data/mockData";
const statusColors = {
    Active: { bg: "rgba(76,175,80,0.12)", text: "#4CAF50" },
    Paused: { bg: "rgba(232,168,56,0.12)", text: "#E8A838" },
    Completed: { bg: "rgba(107,143,214,0.12)", text: "#6B8FD6" },
};
export function ClientsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const statuses = ["All", "Active", "Paused", "Completed"];
    const filtered = clients.filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.contact.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "All" || c.status === filter;
        return matchSearch && matchFilter;
    });
    const totalBudget = clients.reduce((sum, c) => {
        const n = parseInt(c.budget.replace(/[$,]/g, ""));
        return sum + n;
    }, 0);
    return (<div className="px-8 py-7">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Clients
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        Manage your client relationships
                    </p>
                </div>
                <button onClick={() => navigate("/admin/clients/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                    <Plus size={16}/>
                    Add Client
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-7">
                {[
            { label: "Total Clients", value: clients.length, icon: Users },
            { label: "Active", value: clients.filter((c) => c.status === "Active").length, icon: TrendingUp },
            { label: "Total Projects", value: clients.reduce((s, c) => s + c.projects, 0), icon: Briefcase },
            { label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: TrendingUp },
        ].map((stat) => (<div key={stat.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
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
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-2">
                    {statuses.map((s) => (<button key={s} onClick={() => setFilter(s)} className="px-4 py-1.5 rounded-lg transition-all" style={{
                background: filter === s ? "#D84040" : "#241C1C",
                color: filter === s ? "#fff" : "#888",
                border: `1px solid ${filter === s ? "#D84040" : "#2E2020"}`,
                fontSize: "13px",
                fontWeight: filter === s ? 600 : 400,
            }}>
                            {s}
                        </button>))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <Search size={14} color="#666"/>
                    <input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "13px", width: "180px" }}/>
                </div>
            </div>

            {/* Client Cards */}
            <div className="grid grid-cols-2 gap-4">
                {filtered.map((client) => (<div key={client.id} className="rounded-xl p-5 group cursor-pointer" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onClick={() => navigate(`/admin/clients/${client.id}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#8E1616", color: "#EEEEEE", fontSize: "14px", fontWeight: 700 }}>
                                    {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                    <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }}>
                                        {client.name}
                                    </h3>
                                    <p style={{ color: "#888", fontSize: "12px" }}>Since {client.since}</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full" style={{
                background: statusColors[client.status]?.bg,
                color: statusColors[client.status]?.text,
                fontSize: "11px",
                fontWeight: 500,
            }}>
                                {client.status}
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
                            <button className="px-3 py-1.5 rounded-lg" style={{ background: "#2A1F1F", color: "#888", fontSize: "12px", border: "1px solid #3A2A2A" }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client.id}`); }} onMouseEnter={(e) => {
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
