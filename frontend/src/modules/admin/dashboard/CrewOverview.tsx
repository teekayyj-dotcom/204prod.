import { crewMembers } from "../data/mockData";
import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router";

export function CrewOverview() {
  const navigate = useNavigate();

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
              src={member.avatar}
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
                {member.role}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Briefcase size={12} color="#8E1616" />
              <span style={{ color: "#888", fontSize: "12px" }}>{member.projects}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
