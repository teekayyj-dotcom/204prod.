# Implementation Plan: Shift-Based Attendance Notifications, Auto-Checkout & OT Management

**Branch**: `009-attendance-shift-reminders` | **Date**: 2026-08-04 | **Spec**: [spec.md](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./specs/009-attendance-shift-reminders/spec.md)

## Summary

Implement an automated attendance lifecycle management system that:
1. Sends proactive check-in notifications 15 minutes before an employee's registered shift start.
2. Sends check-out reminder notifications 5 minutes before the end of the shift.
3. Automatically clocks out employees who forget to check out 15 minutes past their shift end time.
4. Detects unscheduled check-ins or re-checkins as 4-Hour Overtime (OT) shifts, sending a 5-minute pre-end reminder and a 15-minute auto-checkout.
5. Employs a background scheduler with idempotent reminder logging to prevent duplicates and synchronizes real-time status across frontend check-in widgets via WebSockets.

---

## Technical Context

**Language/Version**: Python 3.11 (Backend), TypeScript 5.x / React 18 (Frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy, Pydantic, Redis, Lucide React, Sonner (Toasts), Date-fns  
**Storage**: SQLite (dev) / PostgreSQL (prod), SQLAlchemy ORM  
**Testing**: Pytest, Vitest  
**Target Platform**: Web Application (Desktop & Mobile Responsive)  
**Project Type**: Full-Stack Web Application (FastAPI + Vite/React)  
**Performance Goals**: Scheduler cycle completes in < 500ms; notification latency < 1s  
**Constraints**: Zero duplicate notifications; automatic checkouts must accurately update database logs without requiring active browser connections  
**Scale/Scope**: All internal crew members, admins, and outsource freelancers  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (API-First Backend)**: PASS. All new endpoints (`/hr/attendance/active-status`), schemas (`ActiveAttendanceStatus`), and database models are defined upfront.
- **Principle II (Component-Driven Frontend)**: PASS. Check-in logic and timer hooks (`useCheckinTimer`, `CheckinWidget`) are modular and reuse shared components.
- **Principle III (Strict Typing)**: PASS. Full Python type annotations and TypeScript interfaces provided across API requests, responses, and state objects.
- **Principle IV (UI/UX Consistency)**: PASS. Consistent design system colors, toasts, and micro-interactions adhere to established dark mode standards.
- **Principle V (Test-Driven & Validation)**: PASS. Automated test suite provided in `tests/test_attendance_scheduler.py`.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-attendance-shift-reminders/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 research & technical decisions
├── data-model.md        # Phase 1 data model & state transitions
├── contracts/
│   └── attendance-reminders.yaml # OpenAPI / WebSocket contract definitions
└── quickstart.md        # Phase 1 validation & run guide
```

### Source Code Layout

```text
backend/
├── app/
│   ├── modules/
│   │   ├── hr/
│   │   │   ├── models.py                # [MODIFY] Add AttendanceReminderLog model
│   │   │   ├── schemas.py               # [MODIFY] Add ActiveAttendanceStatus schema
│   │   │   ├── service.py               # [MODIFY] OT detection, auto-checkout logic
│   │   │   ├── api.py                   # [MODIFY] Add /active-status endpoint
│   │   │   └── attendance_scheduler.py  # [NEW] Background scheduler & reminder rules
│   │   └── notifications/
│   │       ├── crud.py                  # [MODIFY] Enhanced notification dispatch
│   │       └── manager.py               # [MODIFY] WebSocket connection management
│   └── main.py                          # [MODIFY] Register attendance scheduler in lifespan
└── tests/
    └── test_attendance_scheduler.py     # [NEW] Unit & integration tests

frontend/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   └── dashboard/
│   │   │       └── CheckinWidget.tsx    # [MODIFY] Active status sync & auto-checkout listener
│   │   └── crew/
│   │       └── pages/
│   │           └── CrewWorkspacePage.tsx # [MODIFY] Active status sync & timer handling
│   └── shared/
│       └── components/
│           └── NotificationBell.tsx     # [MODIFY] Handle auto-checkout WebSocket event & broadcast
```

---

## Proposed Changes

### Backend

#### [NEW] [attendance_scheduler.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/modules/hr/attendance_scheduler.py)
- Periodic evaluation loop running every 30 seconds.
- Evaluates registered shifts for all users today.
- Triggers 15m pre-shift check-in reminder if user hasn't checked in.
- Triggers 5m pre-shift check-out reminder if user is checked in.
- Triggers 15m auto-checkout if user forgot to check out after shift end.
- Triggers 5m pre-OT check-out reminder and 15m OT auto-checkout for active 4-hour OT sessions.
- Logs every event to `AttendanceReminderLog` to prevent duplicates.

#### [MODIFY] [models.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/modules/hr/models.py)
- Define `AttendanceReminderLog` table with unique constraint on `(date, employee_name, shift_identifier, event_type)`.

#### [MODIFY] [schemas.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/modules/hr/schemas.py)
- Add `ActiveAttendanceStatus` schema with fields: `is_checked_in`, `session_type`, `checkin_time`, `checkin_timestamp`, `shift_name`, `shift_start_time`, `shift_end_time`, `scheduled_auto_checkout_time`, `ot_target_hours`.

#### [MODIFY] [service.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/modules/hr/service.py)
- Update `create_attendance_record`:
  - When user checks in outside registered shifts (or re-checks in after completing regular shifts), set `status="ot"` and `note="OT (Ca 4h)"`.
- Add `get_active_attendance_status(db, employee_name)` to determine if user is currently clocked in, whether it's regular shift or OT, and the scheduled checkout / auto-checkout timestamps.
- Add `execute_auto_checkout(db, employee_name, shift_info, is_ot=False)` to record auto-checkout log and dispatch notifications.

#### [MODIFY] [api.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/modules/hr/api.py)
- Expose `GET /hr/attendance/active-status` endpoint.

#### [MODIFY] [main.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/main.py)
- Start `attendance_scheduler_loop()` task in FastAPI `lifespan` context and cancel cleanly on shutdown.

---

### Frontend

#### [MODIFY] [NotificationBell.tsx](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./frontend/src/shared/components/NotificationBell.tsx)
- When receiving WebSocket notification with `type: "attendance_auto_checkout"` or `type: "attendance_sync"`, dispatch `attendance_sync` custom window event and display toast message.

#### [MODIFY] [CheckinWidget.tsx](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./frontend/src/modules/admin/dashboard/CheckinWidget.tsx) & [CrewWorkspacePage.tsx](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./frontend/src/modules/crew/pages/CrewWorkspacePage.tsx)
- Refactor `useCheckinTimer` to:
  - On mount, query `GET /hr/attendance/active-status?employee_name=...` to sync timer accurately with backend state.
  - Listen for `attendance_sync` window event to immediately reset timer and set `isCheckedIn = false` upon auto-checkout.
  - Display badge for "Ca tiêu chuẩn" vs "Ca OT (4h)".

---

## Verification Plan

### Automated Tests
- Run scheduler and attendance logic tests:
  ```bash
  cd backend && pytest tests/test_attendance_scheduler.py -v
  ```

### Manual Verification
1. **15m Check-in Reminder**:
   - Register shift starting at `now + 15m`.
   - Ensure reminder notification appears in UI and toast.
2. **5m Checkout Reminder**:
   - Check in to shift ending at `now + 5m`.
   - Ensure checkout reminder notification is triggered.
3. **15m Shift Auto-checkout**:
   - Stay checked in past shift end + 15m.
   - Verify auto-checkout log is recorded and widget resets to unclocked.
4. **4-Hour OT Shift & Auto-checkout**:
   - Check in with no registered shift.
   - Verify status is marked as OT (4h).
   - Simulate OT end + 15m and verify auto-checkout.
