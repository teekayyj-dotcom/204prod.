# Feature Specification: Realtime Kanban Notifications

**Feature Branch**: `[006-realtime-kanban-notifications]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "hãy thực hiện update livetime cho phần kanban (user đổi ở dashboard thì dashboard của user khác cũng được cập nhật tương tự) tính năng này cũng sẽ nhảy thông báo hệ thống cho những user được assign vào task đó."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Realtime Kanban Board Updates (Priority: P1)

As a team member viewing the Kanban board, I want to see updates made by other users instantly, so that I always have the most up-to-date view of the project's progress without needing to refresh the page.

**Why this priority**: Immediate synchronization of project tasks prevents duplicated work and ensures all team members have an accurate picture of task statuses.

**Independent Test**: Can be fully tested by opening the Kanban dashboard in two different browsers for the same project. Moving a task in browser A should instantly reflect in browser B.

**Acceptance Scenarios**:

1. **Given** User A and User B are viewing the same project's Kanban board, **When** User A drags and drops a task to a new column, **Then** User B's Kanban board immediately updates to show the task in the new column.
2. **Given** User A and User B are viewing the same project's Kanban board, **When** User A creates a new task, **Then** User B's Kanban board immediately shows the new task.

---

### User Story 2 - System Notifications for Assigned Tasks (Priority: P2)

As a user assigned to a task, I want to receive a system notification when my assigned task is updated, so that I am promptly aware of changes that affect my work.

**Why this priority**: It keeps assigned users informed about critical changes (e.g., a task moving to "In Progress" or "Done") without requiring them to constantly monitor the board.

**Independent Test**: Can be fully tested by assigning User B to a task and having User A update that task. User B should receive a notification.

**Acceptance Scenarios**:

1. **Given** User B is assigned to Task X, **When** User A moves Task X to a new column, **Then** User B receives an instant system notification indicating the change.
2. **Given** User B is assigned to Task X, **When** User A changes the details of Task X, **Then** User B receives an instant system notification.

### Edge Cases

- What happens when a user's network connection drops briefly and reconnects? (Should sync missed updates or re-fetch board state).
- How does the system handle concurrent updates (e.g., User A and User B move the same task simultaneously)?
- What happens if a user is assigned to a task but is currently offline? (Notification should be queued or sent via email fallback).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST broadcast Kanban board updates (task moves, creations, updates, deletions) to all active clients viewing the same project dashboard in real-time.
- **FR-002**: System MUST push a real-time system notification to the assigned user(s) of a task whenever that task is updated by someone else.
- **FR-003**: System MUST NOT send a notification to the user who performed the update themselves.
- **FR-004**: System MUST handle reconnection scenarios by ensuring the client's board is fully synchronized with the latest server state upon reconnection.
- **FR-005**: System MUST validate permissions before accepting a task update and before broadcasting it.

### Key Entities *(include if feature involves data)*

- **Kanban Task**: Represents a unit of work on the board. Needs attributes like `status`/`column_id`, `assignee_id`, `project_id`.
- **System Notification**: Represents an alert sent to a user. Needs attributes like `user_id`, `message`, `read_status`, `related_entity_id`.
- **WebSocket Connection / Subscription**: Represents an active connection to a project's realtime update channel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kanban board updates made by one user appear on other users' screens in under 500ms.
- **SC-002**: System notifications are delivered to assigned users in under 500ms when they are online.
- **SC-003**: System handles 100 concurrent users modifying tasks on various project boards without performance degradation.
- **SC-004**: Zero instances of board state desynchronization requiring manual page refresh under normal network conditions.

## Assumptions

- Users have stable internet connectivity for the real-time websocket connection to function optimally.
- The existing authentication and WebSocket infrastructure can be extended to support Kanban subscriptions.
- Notification delivery will utilize the existing in-app notification system (toast notifications and OS notifications).
- Real-time updates apply at the project level (only users viewing the specific project receive its updates).
