// @ts-nocheck
import { Plus, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OverviewMetrics } from "../dashboard/OverviewMetrics";
import { AnalyticsCharts } from "../dashboard/AnalyticsCharts";
import { TopActiveProjects } from "../dashboard/TopActiveProjects";
import { ActionCenter } from "../dashboard/ActionCenter";
import { CrewRadar } from "../dashboard/CrewRadar";

import { CheckinWidget } from "../dashboard/CheckinWidget";

export function DashboardPage() {
    const navigate = useNavigate();
    return (
        <div className="px-4 md:px-8 py-7 w-full overflow-x-hidden" style={{ background: "#110D0D", minHeight: "100vh" }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Dashboard
                    </h1>
                    <p style={{ color: "#888", fontSize: "14px" }} className="mt-0.5">
                        Welcome back — here's your operational command center.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                        <Search size={15} color="#666"/>
                        <input placeholder="Quick search..." className="outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "13px", width: "160px" }}/>
                    </div>

                    {/* Notifications */}
                    <button className="hidden lg:flex relative w-10 h-10 rounded-lg items-center justify-center transition-all" style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}>
                        <Bell size={17} color="#888"/>
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#D84040" }}/>
                    </button>

                    {/* Add New Project CTA */}
                    <button onClick={() => navigate("/admin/projects/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200" style={{
                        background: "#D84040",
                        color: "#EEEEEE",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: "none",
                        boxShadow: "0 4px 14px rgba(216, 64, 64, 0.4)"
                    }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                        <Plus size={16}/>
                        Add New Project
                    </button>
                </div>
            </div>

            {/* Admin Check-in */}
            <section className="mb-7">
                <CheckinWidget />
            </section>

            {/* Overview KPIs */}
            <section className="mb-7">
                <OverviewMetrics />
            </section>

            {/* Analytics Charts */}
            <section className="mb-7">
                <AnalyticsCharts />
            </section>

            {/* Action Center & Top Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
                <div className="col-span-1">
                    <ActionCenter />
                </div>
                <div className="col-span-2">
                    <TopActiveProjects />
                </div>
            </div>

            {/* Crew Radar */}
            <section className="mb-7">
                <CrewRadar />
            </section>
        </div>
    );
}
