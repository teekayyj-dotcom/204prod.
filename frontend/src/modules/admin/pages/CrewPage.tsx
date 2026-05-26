// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Briefcase, UserCheck, UserX, Mail } from "lucide-react";
import { crewMembers } from "../data/mockData";
export function CrewPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const filters = ["All", "Active", "On Leave"];
    const filtered = crewMembers.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.role.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "All" || m.status === filter;
        return matchSearch && matchFilter;
    });
    return (<div className="px-8 py-7">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Crew
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        {crewMembers.filter((m) => m.status === "Active").length} active members · {crewMembers.length} total
                    </p>
                </div>
                <button onClick={() => navigate("/admin/crew/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: "#D84040", color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                    <Plus size={16}/>
                    Add Member
                </button>
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
        ].map((stat) => (<div key={stat.label} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                            <stat.icon size={22} color={stat.color}/>
                        </div>
                        <div>
                            <p style={{ color: "#888", fontSize: "12px" }}>{stat.label}</p>
                            <p style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>{stat.value}</p>
                        </div>
                    </div>))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    {filters.map((f) => (<button key={f} onClick={() => setFilter(f)} className="px-4 py-1.5 rounded-lg" style={{
                background: filter === f ? "#D84040" : "#241C1C",
                color: filter === f ? "#fff" : "#888",
                border: `1px solid ${filter === f ? "#D84040" : "#2E2020"}`,
                fontSize: "13px",
                fontWeight: filter === f ? 600 : 400,
            }}>
                            {f}
                        </button>))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                    <Search size={14} color="#666"/>
                    <input placeholder="Search crew..." value={search} onChange={(e) => setSearch(e.target.value)} className="outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "13px", width: "180px" }}/>
                </div>
            </div>

            {/* Crew Grid */}
            <div className="grid grid-cols-3 gap-5">
                {filtered.map((member) => (<div key={member.id} className="rounded-xl overflow-hidden group cursor-pointer" style={{ background: "#241C1C", border: "1px solid #2E2020" }} onClick={() => navigate(`/admin/crew/${member.id}`)} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8E1616")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2E2020")}>
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
                                <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full object-cover" style={{ border: "3px solid #241C1C" }}/>
                            </div>

                            <h3 style={{ color: "#EEEEEE", fontSize: "15px", fontWeight: 600 }} className="mb-0.5">
                                {member.name}
                            </h3>
                            <p style={{ color: "#D84040", fontSize: "13px" }} className="mb-3">
                                {member.role}
                            </p>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {member.skills.map((skill) => (<span key={skill} className="px-2 py-0.5 rounded" style={{ background: "#2A1F1F", color: "#888", fontSize: "11px", border: "1px solid #3A2A2A" }}>
                                        {skill}
                                    </span>))}
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
                    </div>))}
            </div>

            {filtered.length === 0 && (<div className="text-center py-16">
                    <UserCheck size={40} color="#3A2A2A" className="mx-auto mb-3"/>
                    <p style={{ color: "#666", fontSize: "14px" }}>No crew members found</p>
                </div>)}
        </div>);
}
