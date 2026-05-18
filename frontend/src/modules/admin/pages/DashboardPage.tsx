// @ts-nocheck
import { Plus, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { OverviewMetrics } from "../dashboard/OverviewMetrics";
import { ProjectTimeline } from "../dashboard/ProjectTimeline";
import { RecentActivity } from "../dashboard/RecentActivity";
import { FeaturedProjects } from "../dashboard/FeaturedProjects";
import { CrewOverview } from "../dashboard/CrewOverview";
import { ClientTestimonials } from "../dashboard/ClientTestimonials";
export function DashboardPage() {
    const navigate = useNavigate();
    return (<div className="px-8 py-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 style={{ color: "#EEEEEE", fontSize: "24px", fontWeight: 700 }}>
                        Dashboard
                    </h1>
                    <p style={{ color: "#666", fontSize: "14px" }} className="mt-0.5">
                        Welcome back, Alex — here's what's happening today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <Search size={15} color="#666"/>
                        <input placeholder="Quick search..." className="outline-none bg-transparent" style={{ color: "#EEEEEE", fontSize: "13px", width: "160px" }}/>
                    </div>

                    {/* Notifications */}
                    <button className="relative w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#241C1C", border: "1px solid #2E2020" }}>
                        <Bell size={17} color="#888"/>
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#D84040" }}/>
                    </button>

                    {/* Add New Project CTA */}
                    <button onClick={() => navigate("/admin/projects/new")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200" style={{
            background: "#D84040",
            color: "#EEEEEE",
            fontSize: "14px",
            fontWeight: 600,
        }} onMouseEnter={(e) => (e.currentTarget.style.background = "#c03030")} onMouseLeave={(e) => (e.currentTarget.style.background = "#D84040")}>
                        <Plus size={16}/>
                        Add New Project
                    </button>
                </div>
            </div>

            {/* Overview Metrics */}
            <section className="mb-7">
                <OverviewMetrics />
            </section>

            {/* Timeline */}
            <section className="mb-7">
                <ProjectTimeline />
            </section>

            {/* Two column: Recent Activity + Crew */}
            <div className="grid grid-cols-3 gap-6 mb-7">
                <div className="col-span-2">
                    <RecentActivity />
                </div>
                <div>
                    <CrewOverview />
                </div>
            </div>

            {/* Featured Projects + Testimonials */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                    <FeaturedProjects />
                </div>
                <div>
                    <ClientTestimonials />
                </div>
            </div>
        </div>);
}
