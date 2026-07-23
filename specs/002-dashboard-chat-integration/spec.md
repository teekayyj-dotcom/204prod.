# Feature Specification: Dashboard Chat Integration

**Feature Branch**: `[002-dashboard-chat-integration]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "hãy tích hợp trực tiếp hệ thống chat vào trong dashboard của crew/admin/client để có hệ thống user name, role"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Chat Access in Dashboard (Priority: P1)

As an authenticated user (Admin, Crew, or Client), I want to access the messaging system directly from my respective dashboard so that I can communicate without leaving my workflow.

**Why this priority**: Essential for making the internal messaging system actually accessible and useful to users in their daily tasks.

**Independent Test**: Log in as any role, navigate to the dashboard, and verify that the chat interface is accessible and displays the correct user sessions.

**Acceptance Scenarios**:

1. **Given** I am logged in as an Admin, **When** I navigate to my dashboard, **Then** I should see an entry point (e.g., a "Messages" menu item or a floating chat widget) to open the messaging system.
2. **Given** I open the chat interface, **When** I view my profile or send a message, **Then** my display name and role should be accurately reflected from the core user system.

---

### User Story 2 - Role-Based Context and Permissions (Priority: P2)

As a system user, I want the chat system to respect my role (Admin, Crew, Client) so that I know who I am talking to and only communicate with appropriate parties.

**Why this priority**: Ensures professional boundaries and security, preventing unauthorized direct messaging between unrelated clients and crew.

**Independent Test**: Log in as a Client and verify that the directory or "New Chat" list only shows authorized contacts (e.g., assigned project managers/admins).

**Acceptance Scenarios**:

1. **Given** I am a Client, **When** I attempt to start a new chat, **Then** I should only see Admins or Crew members assigned to my active projects.
2. **Given** I receive a message, **When** I look at the sender's details, **Then** I should clearly see their Role (e.g., "Admin", "Crew - Videographer").

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST embed the messaging interface into the Admin, Crew, and Client dashboard layouts.
- **FR-002**: System MUST sync the user's `display_name` and `role` from the core `users` table to the chat interface.
- **FR-003**: System MUST provide dual interfaces: a persistent floating widget in the bottom-right corner across all dashboard pages for quick access, and a dedicated "Messages" page for full-screen history viewing.
- **FR-004**: System MUST allow Clients to search for and start a conversation with any registered Crew member or Admin within the system.

### Key Entities

- **User**: The existing core entity containing `username`, `display_name`, and `role`.
- **Dashboard Layout**: The UI shell for Admin, Crew, and Client where the chat component will be mounted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of messages sent display the correct sender's name and role in the UI.
- **SC-002**: Users can open the chat interface from their dashboard in under 1 second.
- **SC-003**: Unauthorized users (e.g., unassigned clients attempting to message internal crew) are blocked by the backend API.

## Assumptions

- The underlying messaging infrastructure (WebSockets, APIs, Database Models) built in `001-internal-messaging` is fully functional and ready to be imported.
- All users (Admin, Crew, Client) exist in the single `users` table and share the same authentication token mechanism.
