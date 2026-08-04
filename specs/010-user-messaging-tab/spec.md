# Feature Specification: User Messaging Tab & Global Search

**Feature Branch**: `010-user-messaging-tab`
**Created**: 2026-08-04
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Dedicated Messaging Tab
As an Admin, Crew member, or Client, I want a dedicated "Messages" tab in my sidebar navigation, so that I can easily access a full-page messaging interface instead of just a small widget.

**Acceptance Scenarios**:
1. **Given** a user is logged in as an Admin, Crew, or Client, **When** they look at the sidebar, **Then** they see a standard navigation link (tab) for "Messages" or "Tin nhắn".
2. **Given** the user clicks the "Messages" tab, **Then** they are navigated to the `/messages` route (e.g., `/admin/messages`) which displays the full-screen `MessagingPage`.

### User Story 2 - Global User Search for Private Messaging
As any user, I want to search for other users (Admins, Crew, Clients) in the system and start a 1-on-1 private message with them.

**Acceptance Scenarios**:
1. **Given** a user is on the Messages page, **When** they click "New Message" or use the search bar, **Then** they can search all users in the system by name.
2. **Given** the user selects another user from the search results, **When** they click to message, **Then** a 1-on-1 conversation is created or opened, and they can send a message.

## Requirements

### Functional Requirements
- **FR-001**: The system MUST provide a standard navigation tab pointing to the respective `/messages` route in Admin, Crew, and Client sidebars.
- **FR-002**: The `ChatSidebar` component MUST provide a "New Chat" UI that queries the backend `/api/v1/messaging/contacts` endpoint.
- **FR-003**: The system MUST allow a user to start a 1-on-1 conversation (`is_group: false`) with a selected contact from the search results.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Users can navigate to the messaging tab in 1 click from their respective dashboard.
- **SC-002**: Users can search and start a chat with any other registered user in under 5 seconds.
