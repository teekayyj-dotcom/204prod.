# Quickstart Validation: Attendance Shift Notifications, Auto-Checkout & OT Management

**Branch**: `009-attendance-shift-reminders`  
**Date**: 2026-08-04  

This guide provides step-by-step instructions to validate and test the shift notification, auto-checkout, and OT lifecycle.

---

## 1. Prerequisites

1. Backend running:
   ```bash
   cd backend
   source .venv/bin/activate # if using virtualenv
   uvicorn app.main:app --reload --port 8000
   ```
2. Frontend running:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 2. Test Scenarios

### Scenario A: Check-in Reminder (15 Minutes Prior)
1. **Setup**: Create or assign a shift in `Shift` (e.g. Ca Sáng 08:30 - 12:00) and register this shift for a test user on today's date in `WorkSchedule`.
2. **Action**: Simulate current time reaching 08:15 (or set shift start to `current_time + 15 minutes`).
3. **Expected Outcome**:
   - Backend `AttendanceReminderLog` receives a record with `event_type="checkin_reminder_15m"`.
   - User receives WebSocket toast & in-app notification: *"Ca làm việc Ca Sáng của bạn bắt đầu lúc 08:30 (còn 15 phút). Hãy nhớ check-in đúng giờ!"*.

---

### Scenario B: Check-out Reminder (5 Minutes Prior)
1. **Setup**: User checks in to their registered shift (08:30 - 12:00).
2. **Action**: Simulate current time reaching 11:55 (or set shift end to `current_time + 5 minutes`).
3. **Expected Outcome**:
   - Backend `AttendanceReminderLog` receives a record with `event_type="checkout_reminder_5m"`.
   - User receives notification: *"Ca làm việc Ca Sáng sắp kết thúc lúc 12:00 (còn 5 phút). Hãy nhớ check-out nhé!"*.

---

### Scenario C: Automatic Check-out (15 Minutes After Shift Expiry)
1. **Setup**: User remains checked in past shift end time (12:00).
2. **Action**: Current time reaches 12:15.
3. **Expected Outcome**:
   - System automatically inserts a `check-out` AttendanceLog with note *"Hệ thống tự động check-out (quá thời gian ca 15 phút)"*.
   - User receives notification *"Tự động Check-out ca làm việc"*.
   - Frontend `CheckinWidget` immediately switches to "Chưa check-in" state.

---

### Scenario D: Unscheduled / Re-Checkin -> 4-Hour OT Shift
1. **Setup**: User has no registered shift for the evening (or already checked out of regular shifts), and performs a check-in at 19:00.
2. **Action**: User clicks "Check-in".
3. **Expected Outcome**:
   - Check-in log is marked with `status="ot"` and note *"OT (Ca 4h)"*.
   - Scheduled OT end is 23:00.
   - At 22:55 (3h55m later), user receives reminder: *"Ca OT (4 giờ) của bạn sắp kết thúc lúc 23:00 (còn 5 phút). Hãy nhớ check-out nhé!"*.
   - At 23:15 (4h15m later), if still unclocked, system automatically logs `check-out` with note *"Hệ thống tự động check-out ca OT (quá 15 phút)"*.

---

## 3. Automated Verification Commands

Run unit and integration tests:
```bash
pytest backend/tests/test_attendance_scheduler.py -v
```
