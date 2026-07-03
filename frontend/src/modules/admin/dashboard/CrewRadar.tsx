import { useState, useEffect } from "react";
import { fetchApi } from "../utils/apiClient";
import { Users, UserCheck, AlertOctagon } from "lucide-react";

export function CrewRadar() {
  const [crewCount, setCrewCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [available, setAvailable] = useState(0);
  const [overloaded, setOverloaded] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchApi<any[]>("/crew/members").catch(() => []),
      fetchApi<any[]>("/hr/attendance-logs").catch(() => [])
    ]).then(([members, logs]) => {
      // 1. Total crew
      const total = members.length || 0;
      setCrewCount(total);

      // 2. Attendance (Present today)
      const todayStr = new Date().toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
      // Format from backend is DD/MM/YYYY
      const todayLogs = logs.filter(log => log.date === todayStr && log.action === "check-in");
      const uniquePresent = new Set(todayLogs.map(log => log.employee_name)).size;
      setPresentCount(uniquePresent);

      // 3. Workload based on active projects count per member
      let avail = 0;
      let over = 0;
      members.forEach(m => {
        const pCount = m.projects_count || 0;
        if (pCount === 0) avail++;
        else if (pCount >= 3) over++;
      });
      setAvailable(avail);
      setOverloaded(over);
    });
  }, []);

  const total = crewCount > 0 ? crewCount : 1;
  const attendanceRate = Math.round((presentCount / total) * 100);

  return (
    <div style={{ background: "rgba(29, 22, 22, 0.6)", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", borderRadius: "14px", padding: "20px", height: "100%" }}>
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 600 }}>Sức khỏe Đội ngũ (Crew Radar)</h3>
        <span style={{ color: "#888", fontSize: "12px" }}>Hôm nay</span>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Attendance */}
        <div className="p-4 rounded-xl flex flex-col items-center justify-center text-center" style={{ background: "rgba(42, 31, 31, 0.4)", border: "1px solid rgba(46,32,32,0.6)" }}>
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={16} color="#4ade80" />
            <span style={{ color: "#888", fontSize: "12px", fontWeight: 500 }}>Tỷ lệ hiện diện</span>
          </div>
          <div className="text-3xl font-bold" style={{ color: attendanceRate >= 80 ? "#4ade80" : "#f59e0b" }}>{attendanceRate}%</div>
          <div className="text-xs mt-1" style={{ color: "#666" }}>{presentCount}/{crewCount} nhân sự</div>
        </div>

        {/* Workload */}
        <div className="p-4 rounded-xl flex flex-col justify-center" style={{ background: "rgba(42, 31, 31, 0.4)", border: "1px solid rgba(46,32,32,0.6)" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: "#888", fontSize: "12px" }}>Available (0 dự án)</span>
            <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: 600 }}>{available}</span>
          </div>
          <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-[#4ade80] rounded-full" style={{ width: `${(available/total)*100}%` }}></div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span style={{ color: "#888", fontSize: "12px" }}>Overloaded (3+ dự án)</span>
            <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>{overloaded}</span>
          </div>
          <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
            <div className="h-full bg-[#ef4444] rounded-full" style={{ width: `${(overloaded/total)*100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Recommendations / Warning */}
      {overloaded > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <AlertOctagon size={18} color="#ef4444" className="mt-0.5 shrink-0" />
          <div>
            <p style={{ color: "#EEEEEE", fontSize: "13px", fontWeight: 600 }}>Cảnh báo quá tải</p>
            <p style={{ color: "#bbb", fontSize: "12px", marginTop: "2px" }}>
              Có {overloaded} nhân sự đang gánh khối lượng việc cao. Cần cân nhắc điều phối sang {available} nhân sự đang trống lịch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
