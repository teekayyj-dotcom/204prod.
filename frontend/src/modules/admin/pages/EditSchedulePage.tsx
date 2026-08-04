import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Info, CheckCircle, CheckCircle2, Loader2 } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import { fetchApi } from "../utils/apiClient";

interface CrewMemberItem {
  id?: number;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

export function EditSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    employeeId?: number;
    employeeName?: string;
    avatar?: string;
    scheduleData?: Record<string, string[]>;
    weekStart?: string;
    isAdminMode?: boolean;
  } | null;

  const [crewList, setCrewList] = useState<CrewMemberItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<CrewMemberItem | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    state?.weekStart ? new Date(state.weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  const [scheduleData, setScheduleData] = useState<Record<string, string[]>>(
    state?.scheduleData || {}
  );

  const daysOfWeek = Array.from({ length: 6 }).map((_, i) => addDays(selectedWeekStart, i));

  // Load schedule for a specific member and week
  const loadMemberSchedule = async (member: CrewMemberItem, weekStart: Date) => {
    setLoadingSchedule(true);
    try {
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const schedules = await fetchApi<any[]>(`/hr/work-schedules?week_start_date=${weekStartStr}`);
      let existing = null;
      if (member.id) {
        existing = schedules.find(s => s.employee_id === member.id);
      }
      if (!existing && member.name) {
        existing = schedules.find(s => s.employee_name?.toLowerCase() === member.name?.toLowerCase());
      }
      setScheduleData(existing ? (existing.schedule_data || {}) : {});
    } catch (e) {
      console.error("Failed to load schedule for member:", e);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Initial load of crew members and auto-selecting the appropriate user
  useEffect(() => {
    const loadCrewAndInit = async () => {
      setLoadingMembers(true);
      try {
        const members = await fetchApi<CrewMemberItem[]>("/crew");
        const list = members || [];
        setCrewList(list);

        const userJson = localStorage.getItem("user");
        const currentUser = userJson ? JSON.parse(userJson) : null;

        let initialMember: CrewMemberItem | null = null;

        // 1. Check if passed via route state
        if (state?.employeeId) {
          initialMember = list.find(m => m.id === state.employeeId) || null;
        } else if (state?.employeeName) {
          initialMember = list.find(m => m.name?.toLowerCase() === state.employeeName?.toLowerCase()) || null;
        }

        // 2. Check if matches logged in user
        if (!initialMember && currentUser) {
          if (currentUser.email) {
            initialMember = list.find(m => m.email?.toLowerCase() === currentUser.email.toLowerCase()) || null;
          }
          if (!initialMember && (currentUser.display_name || currentUser.username)) {
            const cName = (currentUser.display_name || currentUser.username || "").toLowerCase();
            initialMember = list.find(m => m.name?.toLowerCase() === cName) || null;
          }
        }

        // 3. Fallback to state or first member in list
        if (!initialMember) {
          if (state?.employeeName) {
            initialMember = {
              id: state.employeeId,
              name: state.employeeName,
              avatar: state.avatar,
              role: "Nhân sự"
            };
          } else if (list.length > 0) {
            initialMember = list[0];
          } else if (currentUser) {
            initialMember = {
              id: currentUser.id,
              name: currentUser.display_name || currentUser.username || "Admin",
              avatar: currentUser.avatar || "",
              role: "Admin"
            };
          }
        }

        setSelectedMember(initialMember);

        // If we have initialMember and scheduleData wasn't passed directly in state, fetch existing schedule
        if (initialMember && (!state?.scheduleData || Object.keys(state.scheduleData).length === 0)) {
          loadMemberSchedule(initialMember, selectedWeekStart);
        }
      } catch (err) {
        console.error("Failed to load crew members:", err);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadCrewAndInit();
  }, []);

  const handleMemberChange = (memberIdStr: string) => {
    const memId = parseInt(memberIdStr, 10);
    const mem = crewList.find(m => m.id === memId);
    if (mem) {
      setSelectedMember(mem);
      loadMemberSchedule(mem, selectedWeekStart);
    }
  };

  const handleWeekChange = (newWeekStart: Date) => {
    setSelectedWeekStart(newWeekStart);
    if (selectedMember) {
      loadMemberSchedule(selectedMember, newWeekStart);
    }
  };

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

    if (!selectedMember || !selectedMember.name) {
      setErrorMsg("Vui lòng chọn nhân sự.");
      return;
    }

    const totalShifts = Object.values(scheduleData).flat().length;
    if (totalShifts < 6 && state?.isAdminMode === false) {
      setErrorMsg(`Vui lòng chọn tối thiểu 6 ca làm việc trong tuần.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    
    // Default avatar handling
    const defaultAvatar = "https://i.pravatar.cc/150?u=crew";
    const avatar = selectedMember.avatar || defaultAvatar;

    const payload = {
      employee_id: selectedMember.id,
      employee_name: selectedMember.name,
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
        navigate("/admin/hr/attendance");
      }, 1500);
    } catch (error) {
      console.error(error);
      setErrorMsg("Đã xảy ra lỗi khi đăng ký ca làm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalShifts = Object.values(scheduleData).flat().length;
  const isSatisfied = totalShifts >= 6 || state?.isAdminMode !== false;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <CheckCircle className="text-[#4ade80] mb-6" size={64} />
        <h2 className="text-3xl font-bold text-[#E5E5E5] mb-3">Đăng ký thành công!</h2>
        <p className="text-lg text-[#A3A3A3]">Hệ thống đang tải lại dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate("/admin/hr/attendance")} 
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1A1515] border border-[#2A1F1F] text-[#EEEEEE] hover:bg-[#2A1F1F] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Đăng ký ca làm việc</h1>
          <p className="text-[#888] text-sm">Cập nhật lịch làm việc hàng tuần cho nhân sự</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Col - Main Form */}
        <div className="flex-1 space-y-6">
          <form onSubmit={handleSubmit} className="bg-[#141010] border border-[#2A1F1F] rounded-xl p-6 lg:p-8 flex flex-col h-full shadow-lg">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-[#2A1F1F] gap-6">
              <div className="flex items-center gap-4 flex-1">
                {(() => {
                  const avatar = selectedMember?.avatar || "";
                  const isUrl = avatar && (avatar.startsWith("http") || avatar.startsWith("/") || avatar.includes(".") || avatar.includes("uploads"));
                  if (isUrl) {
                    return <img src={avatar} alt={selectedMember?.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#2A1F1F]" />;
                  }
                  return (
                    <div className="w-14 h-14 rounded-full bg-[#2A1F1F] flex items-center justify-center text-[#E5E5E5] font-bold text-xl border-2 border-[#3A2F2F]">
                      {avatar || selectedMember?.name?.substring(0,2).toUpperCase() || "NV"}
                    </div>
                  );
                })()}
                <div className="flex-1 max-w-sm">
                  <div className="text-xs text-[#A3A3A3] font-medium tracking-wide uppercase mb-1">Nhân sự</div>
                  {crewList.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedMember?.id || ""}
                        onChange={(e) => handleMemberChange(e.target.value)}
                        className="w-full appearance-none bg-[#1A1515] border border-[#2A1F1F] rounded-lg px-3 py-2 text-[#E5E5E5] text-base font-bold focus:outline-none focus:border-[#D4A843] transition-colors cursor-pointer"
                      >
                        {crewList.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#1A1515] text-[#E5E5E5]">
                            {c.name} {c.role ? `(${c.role})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="font-bold text-[#E5E5E5] text-xl">
                      {loadingMembers ? "Đang tải..." : (selectedMember?.name || "Chưa chọn nhân sự")}
                    </div>
                  )}
                  {selectedMember?.role && (
                    <div className="text-xs text-[#888] mt-1">{selectedMember.role}</div>
                  )}
                </div>
              </div>
              
              <div className="hidden md:block h-14 w-px bg-[#2A1F1F]"></div>
              
              <div className="w-full md:w-auto">
                <div className="text-xs text-[#A3A3A3] font-medium tracking-wide uppercase mb-1.5">Tuần làm việc</div>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4A843]" />
                  <select 
                    className="w-full md:w-64 appearance-none bg-[#1A1515] border border-[#2A1F1F] rounded-lg pl-10 pr-4 py-2.5 text-[#E5E5E5] text-sm focus:outline-none focus:border-[#D4A843] transition-colors cursor-pointer"
                    value={format(selectedWeekStart, "yyyy-MM-dd")}
                    onChange={(e) => handleWeekChange(new Date(e.target.value))}
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
            </div>

            {/* Table */}
            <div className="border border-[#2A1F1F] rounded-xl overflow-hidden bg-[#0A0707] shadow-inner mb-8 relative">
              {loadingSchedule && (
                <div className="absolute inset-0 bg-[#0A0707]/70 backdrop-blur-xs flex items-center justify-center z-20">
                  <Loader2 className="animate-spin text-[#D4A843]" size={28} />
                </div>
              )}
              <table className="w-full text-left">
                <thead className="bg-[#1A1515] border-b border-[#2A1F1F]">
                  <tr>
                    <th className="p-4 md:p-5 text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider w-[30%]">Ngày</th>
                    <th className="p-4 md:p-5 text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider text-center w-[35%]">
                      Ca Sáng <br className="md:hidden"/><span className="text-[#666] font-normal lowercase">(9h-13h)</span>
                    </th>
                    <th className="p-4 md:p-5 text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider text-center w-[35%]">
                      Ca Chiều <br className="md:hidden"/><span className="text-[#666] font-normal lowercase">(13h30-17h30)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A1F1F]">
                  {daysOfWeek.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isMorning = scheduleData[dateStr]?.includes("morning");
                    const isAfternoon = scheduleData[dateStr]?.includes("afternoon");

                    return (
                      <tr key={dateStr} className="hover:bg-[#1A1515]/50 transition-colors group">
                        <td className="p-4 md:p-5">
                          <div className="font-semibold text-[#E5E5E5] capitalize mb-1 group-hover:text-white transition-colors">
                            {format(day, "EEEE", { locale: vi })}
                          </div>
                          <div className="text-sm text-[#888]">
                            {format(day, "dd/MM/yyyy")}
                          </div>
                        </td>
                        <td className="p-4 md:p-5 text-center border-l border-[#2A1F1F]/50">
                          <label className="inline-flex items-center justify-center w-full h-full cursor-pointer group/cb">
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isMorning || false}
                              onChange={() => handleToggle(dateStr, "morning")}
                            />
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                              isMorning 
                                ? "bg-[#D4A843] border-[#D4A843] text-black shadow-[0_0_15px_rgba(212,168,67,0.3)] scale-110" 
                                : "border-[#3A2F2F] group-hover/cb:border-[#D4A843]/50 bg-[#1A1515]"
                            }`}>
                              {isMorning && <span className="text-base font-bold">✓</span>}
                            </div>
                          </label>
                        </td>
                        <td className="p-4 md:p-5 text-center border-l border-[#2A1F1F]/50">
                          <label className="inline-flex items-center justify-center w-full h-full cursor-pointer group/cb">
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isAfternoon || false}
                              onChange={() => handleToggle(dateStr, "afternoon")}
                            />
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                              isAfternoon 
                                ? "bg-[#D4A843] border-[#D4A843] text-black shadow-[0_0_15px_rgba(212,168,67,0.3)] scale-110" 
                                : "border-[#3A2F2F] group-hover/cb:border-[#D4A843]/50 bg-[#1A1515]"
                            }`}>
                              {isAfternoon && <span className="text-base font-bold">✓</span>}
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
              <div className="mb-8 bg-[#D84040]/10 border border-[#D84040]/20 text-[#D84040] text-sm p-4 rounded-xl flex items-center justify-center gap-2">
                <Info size={16} /> {errorMsg}
              </div>
            )}

            {/* Form Footer */}
            <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#2A1F1F]">
              <div className="text-sm text-[#888] flex items-center gap-2">
                <CheckCircle2 size={16} className={isSatisfied ? "text-emerald-500" : "text-amber-500"} />
                {totalShifts > 0 
                  ? `Đã chọn ${totalShifts} ca làm việc` 
                  : `Chưa chọn ca làm việc nào`}
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate("/admin/hr/attendance")}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-[#3A2F2F] text-[#E5E5E5] font-medium hover:bg-[#2A1F1F] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedMember}
                  className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg bg-[#D4A843] text-black font-bold hover:bg-[#FFE082] transition-colors disabled:opacity-50 disabled:hover:bg-[#D4A843] shadow-[0_0_20px_rgba(212,168,67,0.2)]"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* Right Col - Sidebar */}
        <div className="w-full lg:w-[380px] space-y-6 shrink-0">
          
          {/* Summary Widget */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-[#141010] border border-emerald-900/30 rounded-xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px]"></div>
            <div className="relative z-10">
              <div className="text-sm text-emerald-400/80 mb-2 font-medium tracking-wide uppercase">Tổng ca đã chọn</div>
              <div className="text-5xl font-black text-emerald-400 flex items-baseline gap-2 mb-2 tracking-tighter">
                {totalShifts} <span className="text-lg font-normal text-emerald-400/60 tracking-normal">ca</span>
              </div>
              <div className="w-full bg-[#1A1515] rounded-full h-2 mb-3 overflow-hidden border border-[#2A1F1F]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${totalShifts >= 6 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${Math.min(100, (totalShifts / 6) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-[#888]">
                {totalShifts >= 6 ? "Đã đạt mục tiêu tối thiểu (6 ca/tuần)" : "Tiến độ đăng ký trong tuần (khuyến nghị >= 6 ca)"}
              </div>
            </div>
          </div>

          {/* Checklist / Tips */}
          <div className="bg-[#141010] border border-[#2A1F1F] rounded-xl p-6 shadow-lg">
            <h3 className="flex items-center gap-2 font-semibold text-[#E5E5E5] mb-5">
              <CheckCircle2 size={16} className="text-[#D84040]" />
              Yêu cầu & Lưu ý
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-0.5 ${totalShifts >= 6 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-[#2A1F1F] text-[#666]'}`}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-sm text-[#E5E5E5] font-medium mb-1">Đăng ký đủ 6 ca</p>
                  <p className="text-xs text-[#888] leading-relaxed">Nhân sự part-time hoặc full-time cần đăng ký số ca theo hợp đồng, tối thiểu 6 ca.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/20 text-emerald-500">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-sm text-[#E5E5E5] font-medium mb-1">Thời gian linh hoạt</p>
                  <p className="text-xs text-[#888] leading-relaxed">Bạn có thể chọn làm sáng hoặc chiều tùy theo lịch cá nhân. Giờ ca sáng: 9h-13h. Ca chiều: 13h30-17h30.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-0.5 bg-[#D4A843]/20 text-[#D4A843]">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-sm text-[#E5E5E5] font-medium mb-1">Nghĩa vụ Check-in</p>
                  <p className="text-xs text-[#888] leading-relaxed">Nếu không chấm công vào ca đã đăng ký, hệ thống sẽ tự động tính là vắng mặt không phép.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#D84040]/5 border border-[#D84040]/20 rounded-xl p-5 shadow-lg">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#D84040] mb-2">
              <Info size={14} />
              Chế độ Quản trị (Admin)
            </h4>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Bạn có thể linh hoạt chuyển đổi giữa các nhân sự từ danh sách trên để xem hoặc chỉnh sửa lịch làm việc hàng tuần thay cho nhân viên.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
