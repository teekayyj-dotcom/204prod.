import { useState, useEffect } from "react";
import { fetchApi } from "../utils/apiClient";
import { ChevronRight, FileText, CheckSquare, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ActionCenter() {
  const navigate = useNavigate();
  const [pendingPayables, setPendingPayables] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingFiles, setPendingFiles] = useState(0);

  useEffect(() => {
    // Payables
    fetchApi<any[]>("/finance/payables").then(data => {
      setPendingPayables(data.filter(p => p.status === "pending" || p.status === "blocked").length);
    }).catch(console.error);

    // Leaves
    fetchApi<any[]>("/hr/leave-requests").then(data => {
      setPendingLeaves(data.filter(r => r.status === "pending" || r.status === "Chờ duyệt").length);
    }).catch(console.error);

    // Files Publish (check unpublished items in projects if available, otherwise 0)
    fetchApi<any[]>("/projects").then(data => {
      let count = 0;
      data.forEach(p => {
        if (p.gallery && Array.isArray(p.gallery)) {
          count += p.gallery.filter((g: any) => !g.published).length;
        }
      });
      setPendingFiles(count);
    }).catch(console.error);

  }, []);

  const totalPending = pendingPayables + pendingLeaves + pendingFiles;

  const actions = [
    {
      id: "payables",
      title: "Duyệt chi",
      description: "Các khoản thanh toán Cát-xê, mua sắm cần phê duyệt.",
      count: pendingPayables,
      icon: <DollarSignIcon />,
      color: "#ef4444",
      path: "/admin/finance/payables"
    },
    {
      id: "leaves",
      title: "Duyệt đơn từ",
      description: "Đơn xin nghỉ phép, xin cấp ngân sách từ Crew.",
      count: pendingLeaves,
      icon: <FileText size={18} color="#f59e0b" />,
      color: "#f59e0b",
      path: "/admin/hr"
    },
    {
      id: "publish",
      title: "Duyệt file Publish",
      description: "Các video/hình ảnh Crew đã tải lên chờ gửi khách hàng.",
      count: pendingFiles,
      icon: <Film size={18} color="#3b82f6" />,
      color: "#3b82f6",
      path: "/admin/projects"
    }
  ];

  return (
    <div style={{ background: "rgba(29, 22, 22, 0.6)", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", borderRadius: "14px", padding: "20px", height: "100%" }}>
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Trung tâm Phê duyệt Khẩn</h3>
        <span style={{ color: totalPending > 0 ? "#ef4444" : "#4ade80", fontSize: "12px", fontWeight: 600 }}>
          {totalPending === 0 ? "Hoàn thành" : `${totalPending} Việc cần xử lý`}
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {actions.map(action => (
          <div 
            key={action.id}
            onClick={() => navigate(action.path)}
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
            style={{ background: "rgba(42, 31, 31, 0.4)", border: "1px solid rgba(46,32,32,0.6)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(42, 31, 31, 0.8)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(42, 31, 31, 0.4)"}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${action.color}15` }}>
                {action.icon}
              </div>
              <div>
                <h4 style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>{action.title}</h4>
                <p style={{ color: "#888", fontSize: "12px" }}>{action.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {action.count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold" style={{ background: action.color, color: "#fff" }}>
                  {action.count}
                </span>
              )}
              <ChevronRight size={16} color="#666" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DollarSignIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
