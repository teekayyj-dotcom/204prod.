import { useState, useEffect } from "react";
import { fetchApi } from "../utils/apiClient";
import { Star, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopActiveProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  const parseBudget = (b: string | undefined | null) => {
    if (!b) return 0;
    const digits = b.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  };

  useEffect(() => {
    fetchApi<any>("/projects/all").then(data => {
      
      // Sort logic: Highest budget first
      const sorted = data
        .filter((p: any) => p.status !== "Completed" && p.status !== "Canceled" && p.status !== "Bàn giao" && p.status !== "Đã hủy")
        .sort((a: any, b: any) => {
          const budgetA = parseBudget(a.budget);
          const budgetB = parseBudget(b.budget);
          if (budgetA !== budgetB) return budgetB - budgetA;
          return (b.progress || 0) - (a.progress || 0); // fallback sort by progress
        })
        .slice(0, 5); // top 5
      setProjects(sorted);
    }).catch(console.error);
  }, []);

  const formatBudget = (b: string | undefined | null) => {
    if (!b || b === "TBD") return "TBD";
    const val = parseBudget(b);
    if (val === 0) return b;
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}T`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Tr`;
    return val.toLocaleString() + "đ";
  };

  return (
    <div style={{ background: "rgba(29, 22, 22, 0.6)", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", borderRadius: "14px", padding: "20px", height: "100%" }}>
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Dự án Trọng điểm (Top Budget)</h3>
        <span style={{ color: "#888", fontSize: "12px" }}>Đang thực hiện</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ color: "#888", fontSize: "12px", borderBottom: "1px solid rgba(46,32,32,0.6)" }}>
              <th className="pb-3 font-medium">Tên Dự án</th>
              <th className="pb-3 font-medium">Khách hàng</th>
              <th className="pb-3 font-medium">Ngân sách</th>
              <th className="pb-3 font-medium">PM</th>
              <th className="pb-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => {
              const isTop1 = idx === 0;
              return (
                <tr 
                  key={p.slug || p.id} 
                  onClick={() => navigate(`/admin/projects/${p.slug || p.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid rgba(46,32,32,0.3)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(42,31,31,0.6)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md overflow-hidden bg-[#2A1F1F]">
                        <img src={p.cover_image || "/favicon/204-logo.png"} alt={p.title} className={`w-full h-full ${!p.cover_image ? "p-0 opacity-20 grayscale object-contain" : "object-cover"}`} />
                      </div>
                      <span style={{ color: isTop1 ? "#fbbf24" : "#EEEEEE", fontSize: "14px", fontWeight: 500 }}>
                        {p.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3" style={{ color: "#bbb", fontSize: "13px" }}>{p.client || "N/A"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: isTop1 ? "#fbbf24" : "#4ade80", fontSize: "13px", fontWeight: 600 }}>
                        {formatBudget(p.budget)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3" style={{ color: "#bbb", fontSize: "13px" }}>{p.pm || "Chưa gán"}</td>
                  <td className="py-3">
                    {isTop1 ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: "rgba(251, 191, 36, 0.1)", width: "max-content" }}>
                        <Star size={12} color="#fbbf24" fill="#fbbf24" />
                        <span style={{ color: "#fbbf24", fontSize: "11px", fontWeight: 600 }}>VIP</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: "rgba(74, 222, 128, 0.1)", width: "max-content" }}>
                        <Clock size={12} color="#4ade80" />
                        <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>Đang chạy</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div className="py-10 text-center text-[#666] text-sm">Không có dự án nào đang chạy</div>
        )}
      </div>
    </div>
  );
}
