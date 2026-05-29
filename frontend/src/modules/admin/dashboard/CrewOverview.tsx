import { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/apiClient";

export function CrewOverview() {
  const navigate = useNavigate();
  const [crewMembers, setCrewMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/crew")
      .then((data) => {
        const mapped = data.map(m => ({
          ...m,
          projects: m.assigned_projects || 0
        }));
        setCrewMembers(mapped.slice(0, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading crew overview:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: "#241C1C", border: "1px solid #2E2020", color: "#666", fontSize: "14px" }}
      >
        Loading crew...
      </div>
    );
  }

  return (
    <div
      className="rounded-xl"
      style={{ background: "#241C1C", border: "1px solid #2E2020" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
          Crew Overview
        </h3>
        <button onClick={() => navigate("/admin/crew")} style={{ color: "#D84040", fontSize: "13px" }} className="hover:opacity-70 transition-opacity">
          Manage
        </button>
      </div>
      <div className="px-4 py-3 space-y-1">
        {crewMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => navigate(`/admin/crew/${member.id}`)}
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#2A1F1F")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <img
              src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              style={{ border: "2px solid #2A1F1F" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>
                  {member.name}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: member.status === "Active" ? "#4CAF50" : "#E8A838",
                  }}
                />
              </div>
              <p style={{ color: "#888", fontSize: "12px" }} className="mt-0.5">
                {member.role ? member.role.split(',').map(r => r.trim()).join(' · ') : 'No role assigned'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Briefcase size={12} color="#8E1616" />
              <span style={{ color: "#888", fontSize: "12px" }}>{member.projects}</span>
            </div>
          </div>
        ))}
        {crewMembers.length === 0 && (
          <div className="text-center py-6" style={{ color: "#666", fontSize: "13px" }}>
            No crew members registered
          </div>
        )}
      </div>
    </div>
  );
}
