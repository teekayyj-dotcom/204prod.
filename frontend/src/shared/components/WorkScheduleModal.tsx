import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, CheckCircle, Info } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import { fetchApi } from "../../modules/admin/utils/apiClient";

interface WorkScheduleModalProps {
  onClose: () => void;
  employeeId?: number;
  employeeName: string;
  employeeAvatar?: string;
  initialScheduleData?: Record<string, string[]>;
  isAdminMode?: boolean;
  defaultWeekStart?: Date;
}

export function WorkScheduleModal({ onClose, employeeId, employeeName, employeeAvatar, initialScheduleData, isAdminMode = false, defaultWeekStart }: WorkScheduleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(defaultWeekStart || startOfWeek(new Date(), { weekStartsOn: 1 }));
  
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
      employee_id: employeeId,
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

  const totalShifts = Object.values(scheduleData).flat().length;

  if (isSuccess) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1A1515] border border-[#2A1F1F] rounded-2xl p-8 flex flex-col items-center justify-center max-w-sm w-full text-center shadow-2xl">
          <CheckCircle className="text-[#4ade80] mb-4" size={48} />
          <h2 className="text-xl font-bold text-[#E5E5E5] mb-2">Đăng ký thành công!</h2>
          <p className="text-sm text-[#A3A3A3]">Hệ thống đang tải lại dữ liệu...</p>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-6 lg:p-8">
      <div className="bg-[#0A0707] border border-[#2A1F1F] md:rounded-3xl w-full max-w-6xl h-[100dvh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
        
        {/* Left Column - Notes & Context */}
        <div className="w-full md:w-[380px] shrink-0 bg-[#141010] p-6 md:p-8 flex flex-col gap-8 border-b md:border-b-0 md:border-r border-[#2A1F1F]">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#2A1F1F] flex items-center justify-center mb-4 border border-[#3A2F2F]">
              <Calendar className="text-[#D4A843]" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[#E5E5E5] mb-2 tracking-tight">Đăng ký ca làm</h2>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              Quản lý thời gian làm việc trong tuần của bạn. Vui lòng kiểm tra kỹ trước khi xác nhận.
            </p>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
            <div className="text-sm text-emerald-400/80 mb-1 font-medium tracking-wide uppercase">Tổng ca đã chọn</div>
            <div className="text-4xl font-bold text-emerald-400 flex items-baseline gap-1">
              {totalShifts} <span className="text-base font-normal text-emerald-400/60">ca</span>
            </div>
            {totalShifts < 6 && !isAdminMode && (
              <div className="mt-3 text-xs text-amber-500/90 bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20">
                Cần chọn thêm {6 - totalShifts} ca nữa
              </div>
            )}
            {totalShifts >= 6 && (
              <div className="mt-3 text-xs text-emerald-400/90 bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle size={14} /> Đã đạt yêu cầu tối thiểu
              </div>
            )}
          </div>

          <div className="bg-[#D4A843]/5 border border-[#D4A843]/10 rounded-2xl p-5 relative overflow-hidden mt-auto">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4A843]"></div>
            <h3 className="text-[#D4A843] font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
              Lưu ý quan trọng
            </h3>
            <ul className="text-sm text-[#A3A3A3] space-y-3">
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#D4A843] mt-0.5 shrink-0">•</span>
                Yêu cầu đăng ký tối thiểu 6 ca/tuần.
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#D4A843] mt-0.5 shrink-0">•</span>
                Thời gian làm việc linh hoạt theo dự án/văn phòng.
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#D4A843] mt-0.5 shrink-0">•</span>
                Nếu không check-in vào ca đã đăng ký sẽ tính là vắng mặt.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 flex flex-col h-full bg-[#0A0707] relative overflow-hidden">
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center bg-[#1A1515] hover:bg-[#2A1F1F] rounded-full transition-colors z-20 border border-[#2A1F1F] group"
          >
            <X size={20} className="text-[#A3A3A3] group-hover:text-white transition-colors" />
          </button>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 pt-20 md:p-10 md:pt-10 scrollbar-hide">
              
              {/* Header Info Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#141010] border border-[#2A1F1F] rounded-2xl p-4 mb-8 gap-4">
                <div className="flex items-center gap-4">
                  {employeeAvatar ? (
                    <img src={employeeAvatar} alt={employeeName} className="w-12 h-12 rounded-full object-cover border-2 border-[#2A1F1F]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2A1F1F] flex items-center justify-center text-[#E5E5E5] font-bold text-lg border-2 border-[#3A2F2F]">
                      {employeeName.substring(0,2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-[#A3A3A3] font-medium tracking-wide uppercase mb-0.5">Nhân sự</div>
                    <div className="font-bold text-[#E5E5E5] text-lg">{employeeName}</div>
                  </div>
                </div>
                
                <div className="hidden md:block h-12 w-px bg-[#2A1F1F]"></div>
                
                <div className="w-full md:w-auto">
                  <div className="text-xs text-[#A3A3A3] font-medium tracking-wide uppercase mb-1">Tuần làm việc</div>
                  <select 
                    className="bg-transparent text-[#D4A843] font-semibold text-base focus:outline-none cursor-pointer w-full hover:opacity-80 transition-opacity"
                    value={format(selectedWeekStart, "yyyy-MM-dd")}
                    onChange={(e) => setSelectedWeekStart(new Date(e.target.value))}
                  >
                    <option value={format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")} className="bg-[#1A1515] text-[#E5E5E5]">
                      Tuần này ({format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd/MM")} - {format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), "dd/MM")})
                    </option>
                    <option value={format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), "yyyy-MM-dd")} className="bg-[#1A1515] text-[#E5E5E5]">
                      Tuần tới ({format(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), "dd/MM")} - {format(addDays(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), 6), "dd/MM")})
                    </option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="border border-[#2A1F1F] rounded-2xl overflow-hidden bg-[#141010] shadow-xl">
                <table className="w-full text-left">
                  <thead className="bg-[#0A0707] border-b border-[#2A1F1F]">
                    <tr>
                      <th className="p-5 text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider w-[30%]">Ngày</th>
                      <th className="p-5 text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider text-center w-[35%]">Ca Sáng <br className="md:hidden"/><span className="text-[#666] font-normal lowercase">(9h-13h)</span></th>
                      <th className="p-5 text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider text-center w-[35%]">Ca Chiều <br className="md:hidden"/><span className="text-[#666] font-normal lowercase">(13h30-17h30)</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A1F1F]">
                    {daysOfWeek.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isMorning = scheduleData[dateStr]?.includes("morning");
                      const isAfternoon = scheduleData[dateStr]?.includes("afternoon");

                      return (
                        <tr key={dateStr} className="hover:bg-[#1A1515] transition-colors group">
                          <td className="p-5">
                            <div className="font-semibold text-[#E5E5E5] capitalize mb-0.5 group-hover:text-white transition-colors">
                              {format(day, "EEEE", { locale: vi })}
                            </div>
                            <div className="text-sm text-[#888]">
                              {format(day, "dd/MM/yyyy")}
                            </div>
                          </td>
                          <td className="p-5 text-center border-l border-[#2A1F1F]/50">
                            <label className="inline-flex items-center justify-center w-full h-full cursor-pointer group/cb">
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isMorning || false}
                                onChange={() => handleToggle(dateStr, "morning")}
                              />
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                                isMorning 
                                  ? "bg-[#D4A843] border-[#D4A843] text-black shadow-[0_0_15px_rgba(212,168,67,0.3)] scale-110" 
                                  : "border-[#3A2F2F] group-hover/cb:border-[#D4A843]/50 bg-[#0A0707]"
                              }`}>
                                {isMorning && <span className="text-sm font-bold">✓</span>}
                              </div>
                            </label>
                          </td>
                          <td className="p-5 text-center border-l border-[#2A1F1F]/50">
                            <label className="inline-flex items-center justify-center w-full h-full cursor-pointer group/cb">
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isAfternoon || false}
                                onChange={() => handleToggle(dateStr, "afternoon")}
                              />
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                                isAfternoon 
                                  ? "bg-[#D4A843] border-[#D4A843] text-black shadow-[0_0_15px_rgba(212,168,67,0.3)] scale-110" 
                                  : "border-[#3A2F2F] group-hover/cb:border-[#D4A843]/50 bg-[#0A0707]"
                              }`}>
                                {isAfternoon && <span className="text-sm font-bold">✓</span>}
                              </div>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {errorMsg && (
                <div className="mt-6 bg-[#D84040]/10 border border-[#D84040]/20 text-[#D84040] text-sm p-4 rounded-xl flex items-center justify-center gap-2">
                  <Info size={16} /> {errorMsg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#2A1F1F] bg-[#141010] shrink-0 flex items-center justify-between">
              <div className="hidden md:block text-sm text-[#888]">
                Kiểm tra kỹ các ca làm trước khi lưu
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 md:flex-none px-8 py-3 rounded-xl border border-[#3A2F2F] text-[#E5E5E5] font-semibold hover:bg-[#2A1F1F] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!isAdminMode && totalShifts < 6)}
                  className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-[#D4A843] text-black font-bold hover:bg-[#FFE082] transition-colors disabled:opacity-50 disabled:hover:bg-[#D4A843] shadow-[0_0_20px_rgba(212,168,67,0.2)]"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
