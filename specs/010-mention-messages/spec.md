# Feature Specification: Mention Messages

**Feature Branch**: `010-mention-messages`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "tạo cho tôi tính năng mention ở tin nhắn. Ở phần hiển thị, nếu user được mention thì phần tin nhắn có mention đó sẽ hiện nổi với background khác mà (tương tự discord)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mention a User in Chat (Priority: P1)

As a user, I want to mention another user in a chat message by typing `@` followed by their name, so that I can direct their attention to my message.

**Why this priority**: Core functionality of the feature. Mentioning is the first step before any special display can happen.

**Independent Test**: Can be fully tested by typing `@` in the chat input and sending a message containing a mention.

**Acceptance Scenarios**:

1. **Given** I am in a group chat or direct message, **When** I type `@` and a user's name (e.g., `@Lê Tuấn Kiệt`) and send the message, **Then** the message is sent and the system recognizes the mention.

---

### User Story 2 - Highlight Mentioned Messages (Priority: P1)

As a mentioned user, I want the message where I am mentioned to have a distinct highlighted background (like Discord), so that I can quickly spot messages directed at me.

**Why this priority**: This fulfills the specific visual requirement requested by the user.

**Independent Test**: Can be fully tested by receiving a message containing a mention of the current user.

**Acceptance Scenarios**:

1. **Given** I am viewing a chat, **When** another user sends a message mentioning me, **Then** the message bubble or container displays with a highlighted background (e.g., a light yellow or distinct brand color) to stand out from normal messages.
2. **Given** I am viewing a chat, **When** another user sends a message mentioning someone else, **Then** the message appears with the standard background.

### Edge Cases

- What happens if a user changes their display name after being mentioned?
- What happens if the mentioned user is not in the current chat room? (Should we allow mentioning anyone, or only participants?)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to input mentions using the `@` symbol (frontend UI for selecting users).
- **FR-002**: System MUST parse sent messages to identify mentioned users and store this relationship.
- **FR-003**: System MUST apply a distinct CSS background style to messages where the currently logged-in user is mentioned.
- **FR-004**: System MUST NOT highlight messages for users who are not the target of the mention.
- **FR-005**: Backend API for sending messages must accept mention data.

### Key Entities

- **Message**: Needs to support storing mention data (e.g., a relationship to users or a JSON array of `mentioned_user_ids`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully mention other users in chat rooms.
- **SC-002**: Messages containing a mention of the current user are visually distinct from regular messages.
- **SC-003**: Mention parsing does not introduce noticeable latency when sending messages.

## Assumptions

- We assume mentions are primarily for visual highlighting in the chat UI first.
- We assume the frontend will handle the `@` autocomplete dropdown to select users.
- The highlight color will be determined based on the current theme (e.g., a distinct but subtle highlight background).
