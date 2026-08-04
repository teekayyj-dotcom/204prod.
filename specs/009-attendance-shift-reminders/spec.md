# Feature Specification: Shift-Based Attendance Notifications, Auto-Checkout & OT Management

**Feature Branch**: `009-attendance-shift-reminders`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Setup thông báo cho user theo giờ chấm công: Đầu tiên, chi chuẩn bị đến ca làm (ca mà user đăng ký trong hệ thống) (trước 15 phút) hãy có 1 thông báo nhắc user chấm công cho ca làm việc. Khi gần hết ca làm (trước 5 phút) hãy có 1 thông báo nhắc user chấm công out cho ca làm việc. Nếu user quên chấm công out, hãy tự động checkout cho user khi quá ca thời gian cuối cùng của ca làm việc 15 phút. Nếu user chấm công out và chấm công in 1 lần nữa mà không trong ca làm việc của user, hãy tính bắt đầu 1 ca OT cho user, thời gian của 1 ca OT sẽ là 4 hours. cũng có thông báo tương tự với checkout ca làm việc và cũng tự động tắt chấm công nếu user không tắt chấm công trên hệ thống khi hết ca làm việc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pre-Shift Check-in Reminder (Priority: P1)
As a crew member registered for a work shift, I want to receive an automated notification 15 minutes before my shift starts if I haven't checked in, so that I never forget to clock in on time.

**Why this priority**: Core proactive notification requirement that prevents tardiness and unrecorded attendance.

**Independent Test**:
- Schedule a user for a shift starting at 09:00.
- At 08:45, verify the user receives an in-app and WebSocket notification reminder if they have not checked in.

**Acceptance Scenarios**:
1. **Given** a user has a registered shift starting at 08:30 on the current day and has not checked in, **When** current time reaches 08:15 (15 minutes prior), **Then** the system sends a check-in reminder notification to the user via WebSocket, Notification bell, and browser toast.
2. **Given** a user is scheduled for a shift at 08:30 and has *already* checked in before 08:15, **When** current time reaches 08:15, **Then** no reminder is sent (no redundant notifications).

---

### User Story 2 - Pre-Shift Checkout Reminder (Priority: P1)
As a crew member currently working a shift, I want to receive a notification 5 minutes before my shift ends reminding me to check out.

**Why this priority**: Helps employees wrap up tasks and properly clock out.

**Independent Test**:
- Set an active checked-in session during a shift ending at 12:00.
- At 11:55, verify a reminder notification is delivered to the user.

**Acceptance Scenarios**:
1. **Given** a user is actively checked in during a registered shift ending at 12:00, **When** current time reaches 11:55 (5 minutes prior), **Then** the system sends a notification reminding the user to check out.
2. **Given** a user has already checked out before 11:55, **When** current time reaches 11:55, **Then** no reminder notification is sent.

---

### User Story 3 - Automatic Checkout After Shift Expiry (Priority: P1)
As the system administrator and HR manager, I want the system to automatically check out any user who forgets to clock out 15 minutes after their shift ends, so that attendance logs remain accurate.

**Why this priority**: Essential to avoid indefinite or overnight open check-in sessions that corrupt timesheets.

**Independent Test**:
- Have a user remain checked in past shift end time + 15 minutes.
- Verify the system records an automatic check-out log, notifies the user, and synchronizes the frontend timer.

**Acceptance Scenarios**:
1. **Given** a user is checked in and their shift ended at 12:00, **When** current time reaches 12:15 (15 minutes past shift end) and no check-out log exists, **Then** the system automatically creates a `check-out` AttendanceLog record with note "Hệ thống tự động check-out (quá thời gian ca 15 phút)".
2. **Given** an auto-checkout occurs, **When** the event is processed, **Then** the system sends a notification to the user informing them of the auto-checkout and broadcasts a sync event to reset the client check-in widget.

---

### User Story 4 - Out-of-Shift Check-in -> 4-Hour OT Shift (Priority: P1)
As an employee working outside my registered shifts (or checking in again after completing my regular shift), I want the system to automatically recognize this session as a 4-hour Overtime (OT) shift with appropriate reminders and auto-checkout.

**Why this priority**: Accurately tracks overtime hours and provides the same automated lifecycle for unscheduled/extra shifts.

**Independent Test**:
- Perform a check-in outside registered shift hours (e.g. 19:00 when registered shifts ended at 18:00).
- Verify the session is recorded as an OT shift with a 4-hour duration target (ending at 23:00).

**Acceptance Scenarios**:
1. **Given** a user has finished their normal shifts (or has no registered shifts for the current time window), **When** they perform a check-in, **Then** the system marks the session as an OT shift with standard duration of 4 hours.
2. **Given** a user is on an active 4-hour OT shift (e.g., started at 19:00, ends at 23:00), **When** current time reaches 22:55 (5 minutes before OT end), **Then** the system sends a notification reminding the user to check out from OT.
3. **Given** a user on an active OT shift forgets to check out, **When** current time reaches 23:15 (15 minutes past 4h OT end), **Then** the system automatically records a check-out log with note "Hệ thống tự động check-out ca OT (quá 15 phút)" and notifies the user.

---

### User Story 5 - Real-time Status Sync across Frontend & Background Worker (Priority: P2)
As a crew member, I want my workspace timer and check-in widget to stay accurately synchronized with backend status, including instant UI reset upon auto-checkout.

**Why this priority**: Eliminates discrepancies between localStorage and actual database records.

**Acceptance Scenarios**:
1. **Given** a user has the application open, **When** an auto-checkout is triggered by the background worker, **Then** the UI widget immediately switches from "Đang làm việc" to "Chưa check-in" without requiring a hard page refresh.
2. **Given** a user opens the app on a new device/browser, **When** the workspace loads, **Then** it queries the backend active attendance status to initialize the check-in timer accurately.

---

## Edge Cases

- **Multiple consecutive shifts**: If a user registers for both Ca Sáng (08:30-12:00) and Ca Chiều (13:30-18:00), each shift has its respective check-in/check-out reminder and 15-minute auto-checkout window.
- **Custom shift naming**: Shifts configured with various names in the `shifts` table (e.g., "Ca Sáng", "Ca Chiều", "Ca Đêm", "Ca 1", "Morning", "Afternoon") must be mapped correctly to user work schedule day keys.
- **Clock drift / timezone alignment**: All timestamp calculations and cron iterations must use consistent server local time (Asia/Ho_Chi_Minh / UTC+7).
- **Duplicate notification prevention**: Deduplication records ensure reminders are never sent more than once per user per shift event.
- **Late check-ins within shift window**: If user checks in at 09:30 for a 08:30-12:00 shift, it is still treated as the registered shift (status "late"), NOT as an OT shift. OT is only triggered when check-in is outside all shift windows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST run an automated background scheduler (polling every 30-60 seconds) to evaluate shift schedules and attendance states.
- **FR-002**: System MUST send a check-in reminder notification exactly 15 minutes before the start time of each registered shift for employees who have not checked in.
- **FR-003**: System MUST send a check-out reminder notification exactly 5 minutes before the end time of an active registered shift for employees who are currently checked in.
- **FR-004**: System MUST automatically perform a check-out action exactly 15 minutes after the end of a registered shift if the employee remains checked in.
- **FR-005**: System MUST classify any check-in performed outside registered shifts (or a re-checkin after completing regular shifts) as an OT shift with a default duration of 4 hours.
- **FR-006**: System MUST send a check-out reminder notification 5 minutes before the end of the 4-hour OT shift (at check-in time + 3 hours 55 minutes).
- **FR-007**: System MUST automatically perform a check-out action 15 minutes after the 4-hour OT shift ends (at check-in time + 4 hours 15 minutes) if the employee has not checked out.
- **FR-008**: System MUST persist sent reminder records to prevent duplicate notifications for the same user, date, shift/session, and event type.
- **FR-009**: System MUST deliver notifications via in-app database records, real-time WebSockets, and toast popups.
- **FR-010**: System MUST expose an active attendance status API endpoint (`GET /hr/attendance/active-status`) allowing frontend clients to query current active session state (regular vs OT, start time, remaining time, auto-checkout time).
- **FR-011**: Frontend check-in widgets MUST synchronize real-time state with backend auto-checkout events.

### Key Entities

- **WorkSchedule**: Defines weekly registered shifts per employee (`schedule_data` mapping date strings to shift identifiers).
- **Shift**: Defines standard shift properties (`name`, `start_time`, `end_time`, `break_time`, `days`).
- **AttendanceLog**: Records attendance actions (`check-in`, `check-out`), status (`on-time`, `late`, `ot`, `wfh`, `business`, `auto-checkout`), time, date, notes, coordinates.
- **AttendanceReminderLog**: Tracks dispatched reminders and auto-checkouts (`employee_name`, `date`, `shift_id`, `event_type`, `triggered_at`) to ensure idempotency.
- **Notification**: In-app notification delivered via WebSockets and NotificationBell.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of scheduled employees receive check-in reminders 15 minutes prior to shift start if unclocked.
- **SC-002**: 100% of unclosed attendance sessions past 15 minutes after shift or OT end are automatically closed without human intervention.
- **SC-003**: 0% duplicate reminder notifications delivered for the same shift event.
- **SC-004**: Frontend widgets reflect auto-checkout state within < 1 second of event broadcast via WebSocket.
