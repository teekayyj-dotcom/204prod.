import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statCards = [
  { label: "Active Projects", value: "24", change: "+3", positive: true, path: "/admin/projects" },
  { label: "Clients", value: "12", change: "+2", positive: true, path: "/admin/clients" },
  { label: "Avg. Completion", value: "87%", change: "+5%", positive: true, path: "/admin/projects" },
];

export function OverviewMetrics() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          onClick={() => navigate(card.path)}
          className="rounded-xl p-5 cursor-pointer backdrop-blur-md transition-all duration-300 hover:bg-[#2A1F1F]/60 hover:border-[#D84040]/50"
          style={{ background: "rgba(36, 28, 28, 0.4)", border: "1px solid rgba(46, 32, 32, 0.6)" }}
        >
          <p style={{ color: "#888", fontSize: "12px" }} className="mb-1">
            {card.label}
          </p>
          <p style={{ color: "#EEEEEE", fontSize: "28px", fontWeight: 700 }}>
            {card.value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={12} color="#D84040" />
            <span style={{ color: "#D84040", fontSize: "11px" }}>{card.change} this month</span>
          </div>
        </div>
      ))}
    </div>
  );
}