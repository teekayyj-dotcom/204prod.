import { featuredProjects } from "../data/mockData";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, { bg: string; text: string }> = {
  "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
  Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
  Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
  Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
};

export function FeaturedProjects() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
          Featured Projects
        </h3>
        <button
          onClick={() => navigate("/admin/projects")}
          style={{ color: "#D84040", fontSize: "13px" }}
          className="transition-opacity hover:opacity-70"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {featuredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/admin/projects/${project.id}`)}
            className="rounded-xl overflow-hidden group cursor-pointer"
            style={{ background: "#241C1C", border: "1px solid #2E2020" }}
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, #241C1C 0%, transparent 60%)" }}
              />
              <div className="absolute top-3 right-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: statusColors[project.status]?.bg || "rgba(0,0,0,0.4)",
                    color: statusColors[project.status]?.text || "#fff",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {project.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
                    {project.title}
                  </h4>
                  <p style={{ color: "#888", fontSize: "12px" }} className="mt-0.5">
                    {project.client} · {project.category}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 mb-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded"
                    style={{ background: "#2A1F1F", color: "#888", fontSize: "11px", border: "1px solid #3A2A2A" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: "#777", fontSize: "11px" }}>Progress</span>
                  <span style={{ color: "#D84040", fontSize: "11px", fontWeight: 600 }}>
                    {project.progress}%
                  </span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "#2A1F1F" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${project.progress}%`,
                      background: project.progress === 100
                        ? "#6B8FD6"
                        : "linear-gradient(to right, #8E1616, #D84040)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
