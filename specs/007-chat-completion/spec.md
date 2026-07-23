# Feature Specification: Chat Completion & Enhancements

**Feature Branch**: `[007-chat-completion]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "sửa lỗi hardcode... phân loại media... phóng to khung chat... xóa tiền tố Project... Admin đổi tên nhóm... Admin tạo nhóm và add thành viên... User tạo vote, deadline... bỏ chế độ online/offline... searchbar tìm user... upload ảnh lên R2 định dạng webp theo thư mục, video lên bunny..."

## User Scenarios & Testing *(mandatory)*

### User Story 3 - Advanced Chat Details & Media (Priority: P1)
As a user, I want a well-organized media view and an immersive chat experience.
**Acceptance Scenarios**:
1. **Given** I am in chat details, **When** I view media, **Then** it should be categorized into Images, Videos, Links, and Files.
2. **Given** I click the Info icon, **Then** the chat frame automatically expands to accommodate the details panel optimally.
3. **Given** the chat list, **Then** chat names should not have the "Project:" prefix.
4. **Given** I search in the sidebar, **Then** I can find and select users to chat with, not just existing conversations.
5. **Given** online/offline indicators exist, **Then** they should be temporarily removed from the UI.

### User Story 4 - Admin Group Management (Priority: P1)
As an admin, I want to manage groups effectively.
**Acceptance Scenarios**:
1. **Given** I am an admin, **When** I view group details, **Then** I can change the group chat name.
2. **Given** I am an admin, **When** I want to create a chat, **Then** I can create a new group chat and add multiple members.

### User Story 5 - Interactive Chat Options (Priority: P2)
As a user, I want to create interactive widgets in the chat like votes or deadline reminders.
**Acceptance Scenarios**:
1. **Given** a chat, **When** I select chat options, **Then** I can create a poll/vote for members.
2. **Given** a chat, **When** I select chat options, **Then** I can set a deadline reminder for the group.

### User Story 6 - Optimized Media Uploads (Priority: P1)
As the system, I must optimize media storage by routing to the correct CDN and converting formats.
**Acceptance Scenarios**:
1. **Given** an image is uploaded, **Then** it must be converted to `webp` format.
2. **Given** an image is uploaded to R2, **Then** it must be stored in a directory specific to the chat (e.g., `messaging/chat_{id}/images/`).
3. **Given** a video is uploaded, **Then** it must be uploaded to Bunny.net instead of R2.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-007**: Fix hardcoded "started a new conversation" on the user's chat preview (Already completed).
- **FR-008**: Media categorized into Images, Videos, Links, Files in the details panel.
- **FR-009**: Clicking Info icon automatically expands the chat frame.
- **FR-010**: Remove "Project:" prefix from chat names in the UI.
- **FR-011**: Admin can change group chat names.
- **FR-012**: Admin can create new group chats and add members. Only users with roles (admin, crew, outsource) will be displayed and available to add.
- **FR-013**: User can create options for chat: Vote, Deadline Reminder.
- **FR-014**: Temporarily remove online/offline mode indicators.
- **FR-015**: Searchbar allows finding users to start a chat.
- **FR-016**: Images uploaded to R2 MUST be converted to `.webp` and organized by chat directory.
- **FR-017**: Videos MUST be uploaded to Bunny.net.

### Key Entities
- **Message**: Needs support for custom message types (Poll/Vote, Deadline).
- **Poll / PollOption / PollVote**: Models to support voting.
- **Deadline**: Model to support deadline reminders.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-004**: Images are served as WebP from R2, saving bandwidth.
- **SC-005**: Videos are served via Bunny.net.
- **SC-006**: Users can vote on polls and see results in real-time.
- **SC-007**: Admin can manage groups and names seamlessly.
