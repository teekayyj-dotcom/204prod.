import { useState, useEffect } from "react";
import { fetchApi } from "../utils/apiClient";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, { bg: string; text: string }> = {
  "In Progress": { bg: "rgba(216,64,64,0.15)", text: "#D84040" },
  Review: { bg: "rgba(76,175,80,0.15)", text: "#4CAF50" },
  Completed: { bg: "rgba(107,143,214,0.15)", text: "#6B8FD6" },
  Planning: { bg: "rgba(232,168,56,0.15)", text: "#E8A838" },
    Other: { bg: "rgba(136,136,136,0.15)", text: "#888888" },
};

export function FeaturedProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi<any[]>("/projects/all").then(data => {
      const featured = data.filter((p: any) => p.featured).slice(0, 4);
      setProjects(featured);
    }).catch(console.error);
  }, []);

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
        {projects.map((project) => (
          <div
            key={project.id || project.slug}
            onClick={() => navigate(`/admin/projects/${project.slug || project.id}`)}
            className="rounded-xl overflow-hidden group cursor-pointer backdrop-blur-md transition-all duration-300 hover:border-[#D84040]/70"
            style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={project.cover_image || project.image || "https://via.placeholder.com/400x300?text=No+Image"}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(36, 28, 28, 0.7) 0%, transparent 60%)" }}
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
                {(project.tags || []).map((tag: string) => (
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
                    {project.progress || 0}%
                  </span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "#2A1F1F" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${project.progress || 0}%`,
                      background: (project.progress || 0) === 100
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

