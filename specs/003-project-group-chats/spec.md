# Feature Specification: Project Group Chats

**Feature Branch**: `[003-project-group-chats]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "những crew/admin ở chung 1 dự án thì sẽ có 1 nhóm chat chung. user cũng có thể tìm được user khác trong hệ thống để nhắn tin riêng"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Project Group Chat (Priority: P1)

As a Crew member or Admin working on a specific project, I want a dedicated group chat to automatically exist for our project team, so that we can discuss project-specific details without mixing them up with other conversations.

**Why this priority**: It is the core requirement of this feature to link communications directly to projects.

**Independent Test**: Create a project and assign multiple crew members and an admin to it. Verify that a group chat is created with these exact participants.

**Acceptance Scenarios**:

1. **Given** a new project is created with assigned team members, **When** I view my chat list, **Then** I should see a group chat named after the project.
2. **Given** an existing project group chat, **When** a crew member is added to or removed from the project team, **Then** they should be correspondingly added or removed from the group chat.

---

### User Story 2 - Global User Search for Direct Messages (Priority: P2)

As any authenticated user, I want to be able to search the entire system's user directory so that I can initiate a 1-on-1 private conversation with anyone.

**Why this priority**: Ensures seamless cross-departmental and client-to-crew communications (reinforcing the decisions made in 002-dashboard-chat-integration).

**Independent Test**: Log in as a User, search for another user's name who is not on your project, and successfully send them a direct message.

**Acceptance Scenarios**:

1. **Given** I want to contact someone directly, **When** I use the search bar in the chat widget, **Then** I see a list of all active users in the system to choose from.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a Group Conversation (where `is_group=true`) linked to a Project.
- **FR-002**: System MUST restrict project group chats to internal staff only (Admins and Crew). Clients will not be included in these group chats.
- **FR-003**: System MUST automatically create a new group chat immediately when a new project is created, adding the assigned Admin and Crew members to it.
- **FR-004**: System MUST sync group chat participants whenever the project's assigned team members change.
- **FR-005**: System MUST allow users to search a global directory of all active users to initiate private 1-on-1 chats.

### Key Entities

- **Project**: The core project entity that binds Admin and Crew assignments.
- **Conversation**: The group chat entity that will now have a direct or semantic relationship to a Project (e.g., using the project name).
- **ConversationParticipant**: The bridge table that needs to stay in sync with Project Assignments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of projects have an accurate corresponding group chat that matches the current team roster.
- **SC-002**: Adding/removing a user from a project updates their chat access in under 2 seconds.
- **SC-003**: Users can successfully search and message any other user in the system within 3 clicks.

## Assumptions

- The backend architecture already supports `is_group=true` and multiple participants (built in `001-internal-messaging`).
- 1-on-1 messaging and user search API was partially implemented in `002`, but will be fully utilized here.
