import { useState, useEffect } from "react";
import { X, Plane, Loader2 } from "lucide-react";
import { fetchApi } from "../utils/apiClient";

interface BusinessTripAssignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BusinessTripAssignModal({ onClose, onSuccess }: BusinessTripAssignModalProps) {
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [employee, setEmployee] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchApi("/crew").then((res: any) => setCrew(res || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee || !fromDate || !toDate || !reason) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    const selected = crew.find(c => c.name === employee);
    
    // Format date string for the backend e.g. "YYYY-MM-DD to YYYY-MM-DD" or similar.
    // The backend `is_date_in_range` function splits by "to" or "-"
    const dateStr = `${fromDate} to ${toDate}`;

    try {
      await fetchApi("/hr/leave-requests", {
        method: "POST",
        body: JSON.stringify({
          employee_name: employee,
          avatar: selected?.avatar || "",
          type: "business",
          status: "approved", // Automatically approved since Admin creates it
          date: dateStr,
          reason: reason,
          submitted_at: new Date().toLocaleDateString("vi-VN"),
          urgent: false
        })
      });
      onSuccess();
    } catch (err: any) {
      alert("Lỗi khi phân công: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1D1616", border: "1px solid #2A1F1F" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#f9731622] border border-[#f9731655]">
              <Plane size={18} color="#f97316" />
            </div>
            <div>
              <h2 style={{ color: "#EEEEEE", fontSize: "16px", fontWeight: 700 }}>Phân công Công tác</h2>
              <p style={{ color: "#888", fontSize: "12px" }}>Admin tạo đơn Công tác (tự động duyệt)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2A1F1F] rounded-full text-[#888]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ color: "#888", fontSize: "12px", fontWeight: 600 }} className="block mb-1.5">
              Nhân sự
            </label>
            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg outline-none appearance-none"
              style={{ background: "#2A1F1F", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
            >
              <option value="">-- Chọn nhân sự --</option>
              {crew.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name} - {c.role}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: "#888", fontSize: "12px", fontWeight: 600 }} className="block mb-1.5">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg outline-none"
                style={{ background: "#2A1F1F", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ color: "#888", fontSize: "12px", fontWeight: 600 }} className="block mb-1.5">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg outline-none"
                style={{ background: "#2A1F1F", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ color: "#888", fontSize: "12px", fontWeight: 600 }} className="block mb-1.5">
              Địa điểm / Ghi chú
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Quay phim tại Hồ Chí Minh..."
              className="w-full px-3 py-2.5 rounded-lg outline-none resize-none h-20"
              style={{ background: "#2A1F1F", border: "1px solid #3A2A2A", color: "#EEEEEE", fontSize: "14px" }}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: "#2A1F1F", color: "#EEEEEE" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80 flex justify-center items-center gap-2"
              style={{ background: "#f97316", color: "#FFFFFF" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plane size={16} />}
              Phân công
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
