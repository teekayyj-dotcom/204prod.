import { recentActivity } from "../data/mockData";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, { bg: string; text: string }> = {
  "In Progress": { bg: "#2A1A1A", text: "#D84040" },
  Review: { bg: "#1A2A1A", text: "#4CAF50" },
  Completed: { bg: "#1A1A2A", text: "#6B8FD6" },
  Planning: { bg: "#2A2A1A", text: "#E8A838" },
};

export function RecentActivity() {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl"
      style={{ background: "#241C1C", border: "1px solid #2E2020" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #2A1F1F" }}>
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>
          Recent Project Activity
        </h3>
        <button
          onClick={() => navigate("/admin/projects")}
          style={{ color: "#D84040", fontSize: "13px" }}
          className="transition-opacity hover:opacity-70"
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #2A1F1F" }}>
              {["Project", "Client", "Category", "Assignee", "Status", "Updated"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left"
                  style={{ color: "#666", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/admin/projects/${row.id}`)}
                className="cursor-pointer"
                style={{
                  borderBottom: i < recentActivity.length - 1 ? "1px solid #2A1F1F" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#2A1F1F")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <td className="px-5 py-3.5">
                  <span style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 500 }}>
                    {row.project}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span style={{ color: "#999", fontSize: "13px" }}>{row.client}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{ background: "#2A1F1F", color: "#888", fontSize: "12px", border: "1px solid #3A2A2A" }}
                  >
                    {row.category}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span style={{ color: "#999", fontSize: "13px" }}>{row.assignee}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="px-2.5 py-0.5 rounded-full"
                    style={{
                      background: statusColors[row.status]?.bg || "#2A1F1F",
                      color: statusColors[row.status]?.text || "#999",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span style={{ color: "#666", fontSize: "12px" }}>{row.updated}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
