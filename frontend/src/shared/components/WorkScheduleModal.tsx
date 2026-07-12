import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import { fetchApi } from "../../modules/admin/utils/apiClient";

interface WorkScheduleModalProps {
  onClose: () => void;
  employeeName: string;
  employeeAvatar?: string;
  initialScheduleData?: Record<string, string[]>;
  isAdminMode?: boolean;
}

export function WorkScheduleModal({ onClose, employeeName, employeeAvatar, initialScheduleData, isAdminMode = false }: WorkScheduleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Create schedule data state
  const [scheduleData, setScheduleData] = useState<Record<string, string[]>>(initialScheduleData || {});

  useEffect(() => {
    // We could fetch existing data for this week here from API
    // For now, assume empty or basic implementation
  }, [selectedWeekStart]);

  const daysOfWeek = Array.from({ length: 6 }).map((_, i) => addDays(selectedWeekStart, i));

  const handleToggle = (dateStr: string, shift: string) => {
    setErrorMsg("");
    setScheduleData(prev => {
      const dayShifts = prev[dateStr] || [];
      if (dayShifts.includes(shift)) {
        return { ...prev, [dateStr]: dayShifts.filter(s => s !== shift) };
      } else {
        return { ...prev, [dateStr]: [...dayShifts, shift] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalShifts = Object.values(scheduleData).flat().length;
    if (!isAdminMode && totalShifts < 6) {
      setErrorMsg(`Bạn mới chọn ${totalShifts} ca. Vui lòng chọn tối thiểu 6 ca làm việc trong tuần.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    
    // Default avatar handling
    const userJson = localStorage.getItem("user");
    const defaultAvatar = userJson ? JSON.parse(userJson).avatar : "https://i.pravatar.cc/150?u=crew";
    const avatar = employeeAvatar || defaultAvatar;

    const payload = {
      employee_name: employeeName,
      avatar: avatar,
      week_start_date: format(selectedWeekStart, "yyyy-MM-dd"),
      schedule_data: scheduleData
    };

    try {
      await fetchApi("/hr/work-schedules", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setIsSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Đã xảy ra lỗi khi đăng ký ca làm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-[#1A1515] border border-[#2A1F1F] rounded-2xl p-8 flex flex-col items-center justify-center max-w-sm w-full text-center">
          <CheckCircle className="text-[#4ade80] mb-4" size={48} />
          <h2 className="text-xl font-bold text-[#E5E5E5] mb-2">Đăng ký thành công!</h2>
          <p className="text-sm text-[#A3A3A3]">Hệ thống đang tải lại dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1A1515] border border-[#2A1F1F] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#2A1F1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A1F1F] flex items-center justify-center">
              <Calendar className="text-[#D4A843]" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E5E5E5]">Đăng ký ca làm việc</h2>
              <p className="text-sm text-[#A3A3A3]">Chọn tuần và đánh dấu các ca làm việc của bạn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2A1F1F] rounded-lg transition-colors">
            <X size={20} className="text-[#A3A3A3]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between bg-[#0A0707] border border-[#2A1F1F] rounded-xl p-4">
            <span className="text-sm font-medium text-[#E5E5E5]">Tuần làm việc:</span>
            <select 
              className="bg-[#1A1515] border border-[#2A1F1F] rounded-lg px-4 py-2 text-[#E5E5E5] text-sm focus:outline-none"
              value={format(selectedWeekStart, "yyyy-MM-dd")}
              onChange={(e) => setSelectedWeekStart(new Date(e.target.value))}
            >
              <option value={format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")}>
                Tuần này ({format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd/MM")} - {format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), "dd/MM")})
              </option>
              <option value={format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), "yyyy-MM-dd")}>
                Tuần tới ({format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), "dd/MM")} - {format(addDays(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), 6), "dd/MM")})
              </option>
            </select>
          </div>

          <div className="border border-[#2A1F1F] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#0A0707] border-b border-[#2A1F1F]">
                <tr>
                  <th className="p-4 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">Ngày</th>
                  <th className="p-4 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider text-center">Ca Sáng (9h-13h)</th>
                  <th className="p-4 text-xs font-medium text-[#A3A3A3] uppercase tracking-wider text-center">Ca Chiều (13h30-17h30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A1F1F]">
                {daysOfWeek.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isMorning = scheduleData[dateStr]?.includes("morning");
                  const isAfternoon = scheduleData[dateStr]?.includes("afternoon");

                  return (
                    <tr key={dateStr} className="hover:bg-[#2A1F1F]/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-[#E5E5E5] capitalize">
                          {format(day, "EEEE", { locale: vi })}
                        </div>
                        <div className="text-xs text-[#A3A3A3]">
                          {format(day, "dd/MM/yyyy")}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isMorning || false}
                            onChange={() => handleToggle(dateStr, "morning")}
                          />
                          <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                            isMorning 
                              ? "bg-[#D4A843] border-[#D4A843] text-black" 
                              : "border-[#2A1F1F] hover:border-[#D4A843]"
                          }`}>
                            {isMorning && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                        </label>
                      </td>
                      <td className="p-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isAfternoon || false}
                            onChange={() => handleToggle(dateStr, "afternoon")}
                          />
                          <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                            isAfternoon 
                              ? "bg-[#D4A843] border-[#D4A843] text-black" 
                              : "border-[#2A1F1F] hover:border-[#D4A843]"
                          }`}>
                            {isAfternoon && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl p-4 flex gap-3">
            <div className="w-1.5 h-full bg-[#D4A843] rounded-full"></div>
            <div className="text-xs text-[#A3A3A3] space-y-1">
              <p>• Yêu cầu: Nhân sự đăng ký tối thiểu 6 ca/tuần.</p>
              <p>• Thời gian làm việc có thể linh hoạt theo dự án/văn phòng.</p>
              <p>• Nếu không check-in vào ca đã đăng ký sẽ tính là vắng mặt.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="text-[#D84040] text-sm text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#2A1F1F]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-[#2A1F1F] text-[#E5E5E5] font-medium hover:bg-[#2A1F1F] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#D4A843] text-black font-medium hover:bg-[#B38D38] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Đăng ký ca làm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
