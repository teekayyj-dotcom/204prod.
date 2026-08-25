# Feature Specification: Sort Projects by Duedate

**Feature Branch**: `[011-sort-projects-by-duedate]`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "list các project ở cả phía client view và admin dashboard theo duedate chứ không phải theo thứ tự add vào như hiện tại"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client View Sorting (Priority: P1)

As a client, I want to see projects sorted by their due date (earliest first) so that I can easily identify which projects need immediate attention.

**Why this priority**: Clients primarily interact with their projects and need to see urgent tasks first.

**Independent Test**: Can be fully tested by creating projects with different due dates and verifying they appear in chronological order (earliest due date first) on the client dashboard.

**Acceptance Scenarios**:

1. **Given** multiple projects with different due dates, **When** the client views the project list, **Then** the projects should be ordered from the earliest due date to the latest due date.
2. **Given** projects where some do not have a due date, **When** the client views the project list, **Then** projects without a due date should be placed at the end of the list.

---

### User Story 2 - Admin Dashboard Sorting (Priority: P1)

As an admin, I want to see all projects sorted by their due date (earliest first) on the admin dashboard so that I can prioritize management and support for upcoming deadlines.

**Why this priority**: Admins need to track upcoming deadlines across all clients.

**Independent Test**: Can be fully tested by creating projects with different due dates and verifying they appear in chronological order on the admin dashboard.

**Acceptance Scenarios**:

1. **Given** multiple projects with different due dates across all clients, **When** the admin views the project list, **Then** the projects should be ordered from the earliest due date to the latest due date.
2. **Given** projects where some do not have a due date, **When** the admin views the project list, **Then** projects without a due date should be placed at the end of the list.

### Edge Cases

- What happens when two projects have the exact same due date? (System should use creation date, newest first, as a secondary sorting condition).
- How does system handle projects with null or missing due dates? (Should be placed at the bottom of the list).
- What happens when a project is overdue? (Should still be at the top of the list if it's the earliest date).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST sort the project list on the Client View ascending by due date (earliest first).
- **FR-002**: System MUST sort the project list on the Admin Dashboard ascending by due date (earliest first).
- **FR-003**: System MUST place projects with null/empty due dates at the end of the list.
- **FR-004**: System MUST use creation date (newest first) as a secondary sorting condition if due dates are identical.

### Key Entities *(include if feature involves data)*

- **Project**: Represents a project in the system, has an attribute for due date and creation date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both Admin Dashboard and Client View display projects correctly sorted by due date.
- **SC-002**: No performance degradation when loading project lists (list should load in under 1 second).

## Assumptions

- Projects currently have a due date field stored in the database.
- The desired sort order is ascending (earliest due dates first, as this is standard for prioritizing work).
- The current default sorting is based on creation time or ID (order they were added).
