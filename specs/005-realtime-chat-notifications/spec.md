# Feature Specification: Real-time Chat Notifications

**Feature Branch**: `[005-realtime-chat-notifications]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "hãy thực hiện thông báo live time cho mục nhắn tin" (Implement real-time notifications for messaging).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unread Message Badges (Priority: P1)

As a User, I want to see a visual indicator (badge) with the number of unread messages on the Chat Icon and on individual conversations, so that I know when I have pending messages to read.

**Why this priority**: Core UX for messaging. Users must know they have unread messages without having to open the chat window manually.

**Independent Test**: Have another user send a message. Verify the chat widget icon updates with a red dot or number badge instantly. Open the chat widget and verify the specific conversation has a visual "unread" indicator.

**Acceptance Scenarios**:
1. **Given** the chat widget is closed, **When** a new message arrives via WebSocket, **Then** the global Chat icon displays/increments an unread badge.
2. **Given** I open the conversation, **When** I view the message, **Then** the unread badge is cleared.

---

### User Story 2 - Real-time Popup / Toast (Priority: P1)

As a User, I want to see a small popup (Toast) notification on my screen when a new message arrives while my chat window is closed, so that I can quickly see who messaged me.

**Why this priority**: Keeps users engaged and aware of urgent messages while they are navigating other parts of the dashboard.

**Independent Test**: Keep the chat widget closed. Have another user send a message. Verify a small toast notification appears on the screen with the sender's name and message preview.

**Acceptance Scenarios**:
1. **Given** I am navigating the dashboard, **When** I receive a message, **Then** a toast notification appears.
2. **Given** I click the toast notification, **When** it opens, **Then** the chat widget expands and automatically opens that conversation.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST track unread messages by maintaining a `last_read_message_id` for each participant in a conversation.
- **FR-002**: Frontend MUST display an aggregated unread count badge on the floating `MessageCircle` button.
- **FR-003**: Frontend MUST trigger an in-app Toast notification for incoming WebSocket `new_message` events if the chat widget is closed or if the user is looking at a different conversation.
- **FR-004**: System MUST provide both In-App Toast notifications (via `sonner`) and OS-level Push Notifications (via Browser Notification API) for new messages.

### Key Entities

- **Message**: Trigger for notification.
- **ConversationParticipant**: Stores `last_read_message_id`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Badges update instantly (<1s) upon receiving a WebSocket message.
- **SC-002**: Unread counts accurately reflect the difference between the latest message ID and the user's `last_read_message_id`.
- **SC-003**: Toast notifications do not spam the user (e.g., if multiple messages arrive in the same second, they should be grouped or rate-limited).

## Assumptions

- WebSocket connection is already established and functioning for real-time message delivery.
- Frontend uses a state management store (Zustand/Context) where we can hook in the notification logic.
