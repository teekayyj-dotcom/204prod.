# Phase 0: Research & Technical Decisions

**Feature**: Shift-Based Attendance Notifications, Auto-Checkout & OT Management  
**Branch**: `009-attendance-shift-reminders`  
**Date**: 2026-08-04  

## Decision 1: Background Scheduler Engine

### Decision
Implement a non-blocking asynchronous periodic runner `attendance_scheduler_loop()` using Python `asyncio` within FastAPI's `lifespan` context in `app/main.py`, supported by a clean service module `app/modules/hr/attendance_scheduler.py`.

### Rationale
- **Zero New Dependencies**: Reuses the native `asyncio` event loop already managing FastAPI and `daily_absent_check()`.
- **Direct Access**: Has synchronous/asynchronous access to SQLAlchemy `SessionLocal`, WebSocket `ConnectionManager`, and notification services without needing Celery/Redis queue workers.
- **Precision**: Polling interval of 30 seconds provides sub-minute accuracy for 15-minute and 5-minute reminder triggers.

### Alternatives Considered
- **APScheduler (Advanced Python Scheduler)**: Adds extra library dependency and complex job store configuration without significant benefit for fixed periodic scanning.
- **Celery + Redis Beat**: Overly heavyweight for this application architecture; requires maintaining separate worker processes and brokers.
- **OS Cron (crontab)**: Cannot interactively access WebSocket in-memory connection pools to push live notifications to connected clients.

---

## Decision 2: Idempotency & Duplicate Notification Prevention

### Decision
Introduce a dedicated database model `AttendanceReminderLog` with unique constraints on `(date, employee_name, shift_identifier, event_type)`.

Supported event types:
1. `checkin_reminder_15m`: Sent 15 minutes before shift start.
2. `checkout_reminder_5m`: Sent 5 minutes before shift end.
3. `auto_checkout_15m`: Triggered 15 minutes after shift end.
4. `ot_checkout_reminder_5m`: Sent 5 minutes before 4-hour OT shift ends.
5. `ot_auto_checkout_15m`: Triggered 15 minutes after 4-hour OT shift ends.

### Rationale
- **Resilience**: Survives application restarts, container redeployments, and multiple scheduler cycles.
- **Auditability**: Administrators and developers can inspect when and why a reminder or auto-checkout was triggered.

### Alternatives Considered
- **In-Memory Set**: Volatile; lost on server restart, leading to potential duplicate notifications upon redeploy.
- **Redis Keys with TTL**: Good for ephemeral storage, but adds hard dependency on Redis state persistence and lacks relational audit trails.

---

## Decision 3: Shift Classification & 4-Hour OT Shift Algorithm

### Decision
When an employee triggers a check-in:
1. Find the employee's registered shifts in `WorkSchedule` for the current date.
2. Check if current time falls within any registered shift window `[shift_start - 30min, shift_end + 15min]`.
3. If yes, map the check-in to that registered shift (status: `on-time` if `<= shift_start`, `late` if `> shift_start`).
4. If no registered shift exists for today OR the user has already checked out of all registered shifts for today and checks in again:
   - Mark this session as **OT Shift** (`status="ot"`, `note="OT (Ca 4h)"`).
   - The OT session target duration is exactly **4 hours** (`ot_end_time = checkin_time + 4 hours`).
   - The scheduler monitors this active OT session for 5m pre-checkout reminder (at `+3h55m`) and 15m auto-checkout (at `+4h15m`).

### Rationale
- Matches user's exact specification for out-of-shift check-ins and overtime management.
- Guarantees seamless transition between standard working hours and extra project/overtime hours.

---

## Decision 4: Frontend State Synchronization & Auto-Checkout Handling

### Decision
1. **API Endpoint**: `GET /api/v1/hr/attendance/active-status?employee_name={name}`
   - Returns whether user is currently checked in, session type (`regular` vs `ot`), check-in time, elapsed seconds, shift details, and scheduled auto-checkout time.
2. **Real-time Event**: When auto-checkout is triggered by backend, it dispatches WebSocket message with `type: "attendance_auto_checkout"`.
3. **Client Handling**: In `frontend/src/shared/components/NotificationBell.tsx` & `useCheckinTimer`, upon receiving the event:
   - Clears `localStorage` check-in flags (`crew_checkin_active`, `crew_checkin_start`).
   - Sets `isCheckedIn = false`, `elapsed = 0`.
   - Triggers a toast notification to alert the user immediately.

### Rationale
- Eliminates discrepancies where browser localStorage shows a running timer while backend has auto-checked out.
- Supports multi-tab and multi-device synchronization.
