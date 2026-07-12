import { useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchApi } from "../../admin/utils/apiClient";

interface CrewScheduleTabProps {
  employeeId?: number;
  employeeName: string;
}

export function CrewScheduleTab({ employeeId, employeeName }: CrewScheduleTabProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<Record<string, string[]>>({});

  const startOfCurrentWeek = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startOfCurrentWeek, i));

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const weekStartStr = format(startOfCurrentWeek, "yyyy-MM-dd");
        const data = await fetchApi<any[]>(`/hr/work-schedules?week_start_date=${weekStartStr}`);
        
        let mySchedule = null;
        if (employeeId) {
          mySchedule = data.find(s => s.employee_id === employeeId);
        } else {
          mySchedule = data.find(s => s.employee_name === employeeName);
        }

        setScheduleData(mySchedule ? mySchedule.schedule_data : {});
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId || employeeName) {
      loadSchedule();
    }
  }, [weekOffset, employeeId, employeeName, startOfCurrentWeek]);

  let totalShifts = 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg"
          style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <button onClick={() => setWeekOffset(prev => prev - 1)} className="text-[#666] hover:text-[#EEEEEE]">
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: "#EEEEEE", fontSize: "14px", fontWeight: 600 }}>
            Tuần từ {weekDays[0].toLocaleDateString("vi-VN")} đến {weekDays[5].toLocaleDateString("vi-VN")}
          </span>
          <button onClick={() => setWeekOffset(prev => prev + 1)} className="text-[#666] hover:text-[#EEEEEE]">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl shadow-2xl" style={{ background: "rgba(29, 22, 22, 0.4)", border: "1px solid rgba(46, 32, 32, 0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="min-w-[800px] grid grid-cols-[repeat(6,minmax(100px,1fr))_80px] text-sm text-neutral-300">
          
          {/* --- HEADER ROW --- */}
          <div className="contents font-medium text-neutral-500 uppercase text-xs">
            {weekDays.map(d => (
              <div key={d.toISOString()} className="p-4 border-b border-neutral-800/50 text-center sticky top-0" style={{ background: "rgba(25, 18, 18, 1)" }}>
                <div>{d.toLocaleDateString("vi-VN", { weekday: 'short' })}</div>
                <div>{d.getDate()}/{d.getMonth()+1}</div>
              </div>
            ))}
            <div className="p-4 border-b border-neutral-800/50 text-center sticky top-0" style={{ background: "rgba(25, 18, 18, 1)" }}>Số Ca</div>
          </div>

          {/* --- DATA ROW --- */}
          {loading ? (
             <div className="col-span-7 py-8 flex justify-center"><Loader2 className="animate-spin text-[#D84040]" size={20} /></div>
          ) : (
            <div className="contents group">
              {weekDays.map(d => {
                const dateStr = format(d, "yyyy-MM-dd");
                const dayShifts = scheduleData[dateStr] || [];
                totalShifts += dayShifts.length;
                
                return (
                  <div 
                    key={dateStr} 
                    className="p-4 border-b border-neutral-800/50 flex flex-col gap-1.5 items-center justify-center relative transition-colors hover:bg-[#2A1F1F]/40 min-h-[80px]"
                  >
                    {dayShifts.length > 0 ? (
                      <>
                        {dayShifts.includes("morning") && dayShifts.includes("afternoon") ? (
                          <div className="w-full py-2 px-2 rounded-md text-center text-xs font-medium border backdrop-blur-sm transition-all bg-emerald-950/40 text-emerald-400 border-emerald-900/50">
                            Cả ngày
                          </div>
                        ) : (
                          <>
                            {dayShifts.includes("morning") && (
                              <div className="w-full py-2 px-2 rounded-md text-center text-xs font-medium border backdrop-blur-sm transition-all bg-amber-950/40 text-amber-400 border-amber-900/50">
                                Sáng
                              </div>
                            )}
                            {dayShifts.includes("afternoon") && (
                              <div className="w-full py-2 px-2 rounded-md text-center text-xs font-medium border backdrop-blur-sm transition-all bg-red-950/40 text-red-400 border-red-900/50">
                                Chiều
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-neutral-600 text-xs italic">Nghỉ</div>
                    )}
                  </div>
                );
              })}

              <div className="p-4 border-b border-neutral-800/50 flex items-center justify-center font-bold text-neutral-100 transition-colors hover:bg-[#2A1F1F]/40">
                {totalShifts}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
