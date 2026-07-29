# Feature Specification: Chat Completion & Enhancements

**Feature Branch**: `[007-chat-completion]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "sửa lỗi hardcode... phân loại media... phóng to khung chat... xóa tiền tố Project... Admin đổi tên nhóm... Admin tạo nhóm và add thành viên... User tạo vote, deadline... bỏ chế độ online/offline... searchbar tìm user... upload ảnh lên R2 định dạng webp theo thư mục, video lên bunny..."
New Input: "không hiện icon message ở góc màn hình như hiện tại. để 1 box message ở side bar. Khi có tin nhắn mới thì box chat sẽ tự pop up ở góc màn hình"
New Input: "Tối ưu flow sử dụng của chat box, bất cứ user nào có trong kanban hoặc crew được assign đều xem chat được (tương tự với các crew xem được các project mà họ đã được assign)"
New Input: "Khi admin/crew up file lên hệ thống để review, hãy tự động tối giản path của cinemareviewe và admin/crew có thể share link đó cho bất cứ ai (trong trường hợp đã được admin publish trên hệ thống). Người dùng thứ 3 (người truy cập link được gửi) có thể chọn giữa option đăng nhập (nếu bấm vào link mà đã đăng nhập trong hệ thống) thì được đưa thẳng tới cinemariew, trường hợp chưa đăng nhập hoặc không muốn đăng nhập, hãy để user nhập username vào và comment với username đó."
## User Scenarios & Testing *(mandatory)*

### User Story 3 - Advanced Chat Details & Media (Priority: P1)
As a user, I want a well-organized media view and an immersive chat experience.
**Acceptance Scenarios**:
1. **Given** I am in chat details, **When** I view media, **Then** it should be categorized into Images, Videos, Links, and Files.
2. **Given** I click the Info icon, **Then** the chat frame automatically expands to accommodate the details panel optimally.
3. **Given** the chat list, **Then** chat names should not have the "Project:" prefix.
4. **Given** I search in the sidebar, **Then** I can find and select users to chat with, not just existing conversations.
5. **Given** online/offline indicators exist, **Then** they should be temporarily removed from the UI.
6. **Given** the main layout, **Then** there is no floating message icon in the bottom corner; instead, a message box/button is available in the sidebar.
7. **Given** I receive a new message, **Then** the chat widget automatically pops up in the corner if it's currently closed.

### User Story 4 - Admin Group Management & Access Control (Priority: P1)
As an admin, I want to manage groups effectively. As a user, I want to automatically access chats for projects I am involved in.
**Acceptance Scenarios**:
1. **Given** I am an admin, **When** I view group details, **Then** I can change the group chat name.
2. **Given** I am an admin, **When** I want to create a chat, **Then** I can create a new group chat and add multiple members.
3. **Given** a user is assigned to a project via Kanban or Crew list, **Then** they automatically gain access to view and participate in that project's group chat.

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

### User Story 7 - Cinemareview Public Link Sharing (Priority: P1)
As an admin or crew, I want to share a simplified review link so that third-party users can review and leave feedback.
**Acceptance Scenarios**:
1. **Given** a video is published for review, **Then** the system automatically generates a simplified, shareable path (e.g., `/review/{unique_token}`).
2. **Given** an external user visits the shared link, **When** they are not logged in, **Then** they are prompted to either log in or enter a guest username.
3. **Given** an external user enters a guest username, **When** they submit feedback, **Then** the feedback is recorded using their provided guest name.
4. **Given** a user clicks the shared link, **When** they are already logged in, **Then** they bypass the guest prompt and enter the review as their authenticated account.

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
- **FR-018**: Remove the floating chat icon from the bottom corner of the screen.
- **FR-019**: Add a message box/button to the application sidebars (AdminSidebar, CrewSidebar, etc.) to toggle the chat widget.
- **FR-020**: The chat widget must automatically pop open when a new message is received and the widget is currently closed.
- **FR-021**: Automatically sync project group chat participants with users assigned to the project (via ProjectCredit) and Kanban tasks (via ProjectTask assignees). The group chat must be reliably linked to the project (e.g. via `project_slug`).
- **FR-022**: Generate a unique, simplified sharing token/link for playback reviews (e.g. `/review/{token}`) when a file is uploaded for review.
- **FR-023**: Expose a public route for the review link that validates the token and checks if the review is published by an admin.
- **FR-024**: Provide a guest login UI on the public review page if the user is unauthenticated, allowing them to enter a display name.
- **FR-025**: Modify the feedback submission logic to accept and display guest usernames.

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
