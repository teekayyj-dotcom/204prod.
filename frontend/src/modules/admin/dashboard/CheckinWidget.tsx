import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Flame, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { fetchApi } from "../utils/apiClient";

export interface ActiveAttendanceStatusData {
  is_checked_in: boolean;
  session_type: "regular" | "ot" | "none";
  checkin_time: string | null;
  checkin_timestamp: number | null;
  shift_name: string | null;
  shift_start_time: string | null;
  shift_end_time: string | null;
  scheduled_auto_checkout_time: string | null;
  scheduled_checkout_reminder_time: string | null;
  ot_target_hours: number | null;
  last_action: string | null;
  status: string | null;
  note: string | null;
}

let serverTimeOffset = 0;
let hasSyncedTime = false;

async function syncServerTimeOffset() {
  if (hasSyncedTime) return;
  try {
    // Try to get Date header from current domain
    const res = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('Date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const localTime = Date.now();
      serverTimeOffset = serverTime - localTime;
      hasSyncedTime = true;
    }
  } catch (e) {
    console.warn("Could not sync server time", e);
  }
}

const getTrueTime = () => Date.now() + serverTimeOffset;

export function useCheckinTimer() {
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(() => {
    return localStorage.getItem("crew_checkin_active") === "true";
  });
  const [startTime, setStartTime] = useState<number | null>(() => {
    const s = localStorage.getItem("crew_checkin_start");
    return s ? parseInt(s) : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const [sessionType, setSessionType] = useState<"regular" | "ot" | "none">("none");
  const [shiftName, setShiftName] = useState<string | null>(null);
  const [shiftStartTime, setShiftStartTime] = useState<string | null>(null);
  const [shiftEndTime, setShiftEndTime] = useState<string | null>(null);
  const [scheduledAutoCheckoutTime, setScheduledAutoCheckoutTime] = useState<string | null>(null);
  const [scheduledCheckoutReminderTime, setScheduledCheckoutReminderTime] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncBackendStatus = useCallback(async () => {
    try {
      await syncServerTimeOffset();

      const uStr = localStorage.getItem("user");
      if (!uStr) return;
      const u = JSON.parse(uStr);
      const employeeName = u.display_name || u.username || "Crew";

      const data: ActiveAttendanceStatusData = await fetchApi(
        `/hr/attendance/active-status?employee_name=${encodeURIComponent(employeeName)}`
      );

      if (data && data.is_checked_in) {
        setIsCheckedIn(true);
        setSessionType(data.session_type);
        setShiftName(data.shift_name);
        setShiftStartTime(data.shift_start_time);
        setShiftEndTime(data.shift_end_time);
        setScheduledAutoCheckoutTime(data.scheduled_auto_checkout_time);
        setScheduledCheckoutReminderTime(data.scheduled_checkout_reminder_time);

        if (data.checkin_timestamp) {
          setStartTime(data.checkin_timestamp);
          setElapsed(Math.max(0, Math.floor((getTrueTime() - data.checkin_timestamp) / 1000)));
          localStorage.setItem("crew_checkin_start", String(data.checkin_timestamp));
        }
        localStorage.setItem("crew_checkin_active", "true");
      } else {
        setIsCheckedIn(false);
        setSessionType("none");
        setShiftName(null);
        setShiftStartTime(null);
        setShiftEndTime(null);
        setScheduledAutoCheckoutTime(null);
        setScheduledCheckoutReminderTime(null);
        setStartTime(null);
        setElapsed(0);
        localStorage.removeItem("crew_checkin_active");
        localStorage.removeItem("crew_checkin_start");
      }
    } catch (err) {
      console.warn("Failed to sync attendance status from backend:", err);
    }
  }, []);

  // Periodic and on-focus status syncing
  useEffect(() => {
    syncBackendStatus();
    const interval = setInterval(syncBackendStatus, 20000);
    const handleFocus = () => syncBackendStatus();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syncBackendStatus]);

  // Elapsed timer tick
  useEffect(() => {
    if (isCheckedIn && startTime) {
      setElapsed(Math.max(0, Math.floor((getTrueTime() - startTime) / 1000)));
      intervalRef.current = setInterval(() => {
        setElapsed(Math.max(0, Math.floor((getTrueTime() - startTime) / 1000)));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCheckedIn, startTime]);

  const checkIn = async () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        await syncServerTimeOffset();
        const now = getTrueTime();

        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          const avatarUrl =
            u.avatar_url ||
            u.avatar ||
            u.photo_url ||
            u.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username || "Crew")}&background=8E1616&color=fff`;

          await fetchApi("/hr/attendance-logs", {
            method: "POST",
            body: JSON.stringify({
              employee_name: u.display_name || u.username || "Crew",
              avatar: avatarUrl,
              action: "check-in",
              time: new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              date: new Date(now).toISOString().split("T")[0],
              status: "on-time",
              note: "Office",
              lat: lat,
              lng: lng,
            }),
          });

          setIsCheckedIn(true);
          setStartTime(now);
          setElapsed(0);
          localStorage.setItem("crew_checkin_active", "true");
          localStorage.setItem("crew_checkin_start", String(now));

          // Sync backend full status immediately
          await syncBackendStatus();
        } catch (err: any) {
          const msg = err.detail || err.message || "Lỗi lấy vị trí hoặc check-in";
          setLocationError(msg);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Bạn đã từ chối cấp quyền vị trí. Vui lòng vào Cài đặt trình duyệt để cho phép.");
        } else {
          setLocationError("Không thể lấy vị trí. Vui lòng kiểm tra GPS/Mạng.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const checkOut = async () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        await syncServerTimeOffset();
        const now = getTrueTime();

        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          const avatarUrl =
            u.avatar_url ||
            u.avatar ||
            u.photo_url ||
            u.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username || "Crew")}&background=8E1616&color=fff`;

          await fetchApi("/hr/attendance-logs", {
            method: "POST",
            body: JSON.stringify({
              employee_name: u.display_name || u.username || "Crew",
              avatar: avatarUrl,
              action: "check-out",
              time: new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              date: new Date(now).toISOString().split("T")[0],
              status: "on-time",
              lat: lat,
              lng: lng,
            }),
          });

          setIsCheckedIn(false);
          setSessionType("none");
          setStartTime(null);
          setElapsed(0);
          localStorage.removeItem("crew_checkin_active");
          localStorage.removeItem("crew_checkin_start");
          await syncBackendStatus();
        } catch (err: any) {
          const msg = err.detail || err.message || "Lỗi lấy vị trí hoặc check-out";
          setLocationError(msg);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Bạn đã từ chối cấp quyền vị trí. Vui lòng vào Cài đặt trình duyệt để cho phép.");
        } else {
          setLocationError("Không thể lấy vị trí. Vui lòng kiểm tra GPS/Mạng.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const format = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return {
    isCheckedIn,
    elapsed,
    sessionType,
    shiftName,
    shiftStartTime,
    shiftEndTime,
    scheduledAutoCheckoutTime,
    scheduledCheckoutReminderTime,
    checkIn,
    checkOut,
    format,
    isLocating,
    locationError,
    refreshStatus: syncBackendStatus,
    getTrueTime,
  };
}

export function CheckinWidget() {
  const {
    isCheckedIn,
    elapsed,
    sessionType,
    shiftName,
    shiftEndTime,
    scheduledAutoCheckoutTime,
    checkIn,
    checkOut,
    format,
    isLocating,
    locationError,
    getTrueTime,
  } = useCheckinTimer();

  const isOt = sessionType === "ot";

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: isCheckedIn
          ? isOt
            ? "linear-gradient(135deg, #241407 0%, #170E08 100%)"
            : "linear-gradient(135deg, #1a0f0f 0%, #1D1616 100%)"
          : "#141010",
        border: isCheckedIn
          ? isOt
            ? "1px solid #F59E0B"
            : "1px solid #D84040"
          : "1px solid #2A1F1F",
        transition: "all 0.4s ease",
      }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isCheckedIn ? (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                  background: isOt ? "#F59E0B" : "#10B981",
                  boxShadow: isOt ? "0 0 10px #F59E0B" : "0 0 10px #10B981",
                  animation: "pulse 2s infinite",
                }}
              />
            ) : null}

            <span
              style={{
                color: isCheckedIn ? (isOt ? "#F59E0B" : "#10B981") : "#666",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              {isCheckedIn
                ? isOt
                  ? "Đang làm việc (Ca OT 4h)"
                  : `Đang làm việc • ${shiftName || "Ca chính thức"}`
                : "Chưa check-in"}
            </span>

            {isOt && isCheckedIn && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "#FBBF24",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                <Flame size={12} /> OT 4 Giờ
              </span>
            )}
          </div>

          <div
            className="text-4xl md:text-[52px] my-1"
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: isCheckedIn ? "#EEEEEE" : "#333",
              letterSpacing: "0.05em",
              lineHeight: 1.1,
            }}
          >
            {isCheckedIn ? format(elapsed) : "00:00:00"}
          </div>

          {isCheckedIn && (
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <p style={{ color: "#888", fontSize: "12px" }}>
                Check-in lúc{" "}
                <span className="font-semibold text-white">
                  {new Date(getTrueTime() - elapsed * 1000).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>

              {scheduledAutoCheckoutTime && (
                <div
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#A1A1AA",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <Clock size={12} className="text-amber-400" />
                  <span>
                    Tự động out:{" "}
                    <strong className="text-amber-300 font-semibold">{scheduledAutoCheckoutTime}</strong> (+15p)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 items-start lg:items-end w-full lg:w-auto mt-2 lg:mt-0">
          <button
            onClick={isCheckedIn ? checkOut : checkIn}
            disabled={isLocating}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200"
            style={{
              background: isCheckedIn
                ? isOt
                  ? "#2E1A0C"
                  : "#1D1616"
                : "#D84040",
              color: isCheckedIn
                ? isOt
                  ? "#F59E0B"
                  : "#D84040"
                : "#EEEEEE",
              border: isCheckedIn
                ? isOt
                  ? "2px solid #F59E0B"
                  : "2px solid #D84040"
                : "2px solid transparent",
              fontSize: "15px",
              fontWeight: 700,
              minWidth: "160px",
              justifyContent: "center",
              opacity: isLocating ? 0.7 : 1,
              cursor: isLocating ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLocating) e.currentTarget.style.transform = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              if (!isLocating) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isLocating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Đang lấy vị trí...
              </span>
            ) : isCheckedIn ? (
              <>
                <Pause size={18} /> Check-out
              </>
            ) : (
              <>
                <Play size={18} /> Check-in
              </>
            )}
          </button>

          {locationError && (
            <p
              style={{
                color: "#EF4444",
                fontSize: "11px",
                maxWidth: "280px",
                textAlign: "right",
                marginTop: "2px",
              }}
            >
              {locationError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
