import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Coffee, Flame } from "lucide-react";
import { fetchApi } from "../utils/apiClient";

export function useCheckinTimer() {
  const [isCheckedIn, setIsCheckedIn] = useState(() => {
    return localStorage.getItem("crew_checkin_active") === "true";
  });
  const [startTime, setStartTime] = useState<number | null>(() => {
    const s = localStorage.getItem("crew_checkin_start");
    return s ? parseInt(s) : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isCheckedIn && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
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

        const now = Date.now();
        
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          const avatarUrl = u.avatar_url || u.avatar || u.photo_url || u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username || "Crew")}&background=8E1616&color=fff`;
          await fetchApi("/hr/attendance-logs", {
            method: "POST",
            body: JSON.stringify({
              employee_name: u.display_name || u.username || "Crew",
              avatar: avatarUrl,
              action: "check-in",
              time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              date: new Date().toISOString().split("T")[0],
              status: "on-time",
              note: "Office",
              lat: lat,
              lng: lng
            })
          });

          setIsCheckedIn(true);
          setStartTime(now);
          setElapsed(0);
          localStorage.setItem("crew_checkin_active", "true");
          localStorage.setItem("crew_checkin_start", String(now));
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

        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          const avatarUrl = u.avatar_url || u.avatar || u.photo_url || u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username || "Crew")}&background=8E1616&color=fff`;
          await fetchApi("/hr/attendance-logs", {
            method: "POST",
            body: JSON.stringify({
              employee_name: u.display_name || u.username || "Crew",
              avatar: avatarUrl,
              action: "check-out",
              time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              date: new Date().toISOString().split("T")[0],
              status: "on-time",
              lat: lat,
              lng: lng
            })
          });

          setIsCheckedIn(false);
          setStartTime(null);
          setElapsed(0);
          localStorage.removeItem("crew_checkin_active");
          localStorage.removeItem("crew_checkin_start");
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

  return { isCheckedIn, elapsed, checkIn, checkOut, format, isLocating, locationError };
}

export function CheckinWidget() {
  const { isCheckedIn, elapsed, checkIn, checkOut, format, isLocating, locationError } = useCheckinTimer();

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: isCheckedIn
          ? "linear-gradient(135deg, #1a0f0f 0%, #1D1616 100%)"
          : "#141010",
        border: isCheckedIn ? "1px solid #D84040" : "1px solid #2A1F1F",
        transition: "all 0.4s ease",
      }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCheckedIn ? (
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                  animation: "pulse 2s infinite",
                }}
              />
            ) : null}
            <span
              style={{
                color: isCheckedIn ? "#10B981" : "#555",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              {isCheckedIn ? "Đang làm việc" : "Chưa check-in"}
            </span>
          </div>
          <div
            className="text-4xl md:text-[52px] my-2 md:my-0"
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: isCheckedIn ? "#EEEEEE" : "#333",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            {isCheckedIn ? format(elapsed) : "00:00:00"}
          </div>
          {isCheckedIn && (
            <p style={{ color: "#666", fontSize: "12px", marginTop: "6px" }}>
              Check-in lúc{" "}
              {new Date(Date.now() - elapsed * 1000).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 items-start lg:items-end w-full lg:w-auto mt-2 lg:mt-0">
          <button
            onClick={isCheckedIn ? checkOut : checkIn}
            disabled={isLocating}
            className="w-full lg:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200"
            style={{
              background: isCheckedIn ? "#1D1616" : "#D84040",
              color: isCheckedIn ? "#D84040" : "#EEEEEE",
              border: isCheckedIn ? "2px solid #D84040" : "2px solid transparent",
              fontSize: "15px",
              fontWeight: 700,
              minWidth: "160px",
              justifyContent: "center",
              opacity: isLocating ? 0.7 : 1,
              cursor: isLocating ? "not-allowed" : "pointer"
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
            <p style={{ color: "#D84040", fontSize: "11px", maxWidth: "100%", textAlign: "right", marginTop: "4px" }}>
              {locationError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
