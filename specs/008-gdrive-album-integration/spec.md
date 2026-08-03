# Feature Specification: Google Drive Photo Album Integration

**Feature Branch**: `008-gdrive-album-integration`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Trong phần media của project, user sẽ có thêm 1 layer nữa để lựa chọn. Ngoại trừ việc up video demo thì user cũng có thể insert vào hệ thống 1 link google drive. Hệ thống sẽ lấy api từ google drive và tạo ra 1 album trong hệ thống từ link ảnh đó. Bằng album đó, user có thể xem được trong file có tổng bao nhiêu ảnh, star và like ảnh, comment vào ảnh. Giao diện của album sẽ giống như 1 galary hiển thị tất cả các ảnh. Khi tạo album như vậy, hệ thống sẽ yêu cầu admin/crew phải nhập tên album. Optional là admin/crew có thể thay đổi background của album, nếu admin/crew không thực hiện thao tác đó thì hệ thống sẽ lấy ảnh bất kỳ trong file đó để làm background. Bên cạnh đó, hệ thống sẽ có thể tự động tạo link shorten để user có thể gửi cho client xem. Khi client truy cập, chỉ cần nhập username vào thì user có thể thực hiện những tương tác như mô tả ở trên. Ngoài ra hãy nghiên cứu sao cho hệ thống có thể tổng hợp xem user đã tương tác với bao nhiêu ảnh và gửi lại thông báo cho admin/crew."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Google Drive Album (Priority: P1)

Admin or Crew can insert a Google Drive folder link into the Media section of a project, provide an album name, and optionally set a background image. The system will fetch all photos from the Google Drive folder and generate a Photo Album gallery within the system.

**Why this priority**: Core functionality required to kick off the feature.

**Independent Test**: Can be fully tested by providing a public Google Drive folder link, and observing the system successfully fetching the images and rendering a new Album entity.

**Acceptance Scenarios**:

1. **Given** a valid Google Drive folder link, **When** Admin inputs it along with a title, **Then** the system fetches image metadata via Google Drive API and creates a Photo Album in the project's media library.
2. **Given** no background image is uploaded, **When** creating the album, **Then** the system picks a random image from the fetched folder to serve as the background.

---

### User Story 2 - Client Album Interaction (Priority: P1)

Clients can access the photo album via a shortened shareable link. Upon entering their username, they can view the entire gallery, see total photo counts, star/like individual photos, and leave comments on specific photos.

**Why this priority**: Delivers the primary value of the feature for client collaboration.

**Independent Test**: Can be tested by navigating to the shortened link, entering a name, and interacting with the gallery UI.

**Acceptance Scenarios**:

1. **Given** a generated shortened link, **When** a client opens it, **Then** they are prompted to enter their name before viewing the album.
2. **Given** a client is viewing the album, **When** they click "Like" or "Star" on an image, **Then** the interaction is saved and associated with their name.

---

### User Story 3 - Notification & Interaction Summary (Priority: P2)

Admins and Crew receive notifications or summaries detailing how many photos a specific client interacted with (liked, starred, or commented on).

**Why this priority**: Vital for feedback loop, but secondary to the core album creation and viewing.

**Independent Test**: Can be tested by checking the Admin dashboard/notifications after a client interacts with the gallery.

**Acceptance Scenarios**:

1. **Given** a client interacts with multiple photos, **When** they finish their session, **Then** Admin/Crew receives an aggregated notification summarizing the client's interactions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate with Google Drive API to fetch image files (names, IDs, thumbnail URLs) from a provided folder link.
- **FR-002**: System MUST allow Admin/Crew to name the album and optionally set a custom background image.
- **FR-003**: System MUST automatically select a random image as the background if a custom one is not provided.
- **FR-004**: System MUST generate a unique, short, shareable URL for each album.
- **FR-005**: System MUST require clients to input their username/identity before interacting with the album.
- **FR-006**: System MUST allow clients to view, like, star, and comment on individual photos.
- **FR-007**: System MUST track client interactions and summarize them for Admin/Crew notifications.

### Key Entities

- **PhotoAlbum**: Represents the gallery created from Google Drive. Contains project relation, title, background_url, google_drive_folder_id, and short_link_token.
- **AlbumPhoto**: Represents individual photos within the album (synced from Google Drive). Contains file_id, thumbnail_url, web_content_url.
- **AlbumInteraction**: Represents a client's like/star/comment on a specific `AlbumPhoto`. Contains client_name, interaction_type (like/star/comment), content (if comment), and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System successfully syncs up to 500 images from a Google Drive folder within 10 seconds.
- **SC-002**: Clients can access the gallery smoothly with responsive lazy-loading of images.
- **SC-003**: Interactions (likes, comments) are saved reliably in real-time or near real-time.

## Assumptions

- Users will provide Google Drive folders that are set to "Anyone with the link can view". If the folder is restricted, the Google Drive API fetch will fail.
- The system will only fetch and display image files (`image/jpeg`, `image/png`, etc.) from the folder.
- Google Drive API credentials (Server-to-Server or API Key) will be configured in the backend environment.
