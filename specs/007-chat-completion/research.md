# Chat Enhancements Phase 2: Technical Research

## 1. Bunny.net Video Upload
**Decision:** Use the Bunny.net Stream API to upload videos.
**Rationale:** The backend configuration already has `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_API_KEY`. Uploading to Bunny Stream involves creating a video object using `POST /library/{libraryId}/videos` to get a Video ID, then using `PUT /library/{libraryId}/videos/{videoId}` to upload the file chunks or full file payload.
**Alternatives considered:** Direct upload to R2, but Bunny Stream provides optimized video encoding and playback.

## 2. WebP Image Conversion
**Decision:** Use the `Pillow` library to convert images to `.webp` before uploading to R2.
**Rationale:** `Pillow>=10.4` is already in the `requirements.txt`. Converting images server-side using `Image.open(file.file)` and saving to a BytesIO stream with `format="WEBP"` before uploading via boto3 is efficient and straightforward.
**Alternatives considered:** Doing conversion on the frontend, but server-side conversion is more secure and ensures a unified format for all clients.

## 3. Custom Chat Options (Polls, Deadlines)
**Decision:** Extend the `Message` model to support JSON metadata for widgets (Poll, Deadline), and a new `PollVote` table for recording user votes.
**Rationale:** A chat message can have different types. We can add a `type` field to the `Message` table (e.g. `text`, `poll`, `deadline`) and a `metadata` JSON field to store the options and deadline timestamp. Votes will require a relational table `PollVote` to track which user voted for which option, ensuring real-time integrity and easy state updates.
**Alternatives considered:** Creating entirely separate tables for `Polls` and `Deadlines` independent of `Messages`, but since they are presented in the message timeline, extending `Message` makes UI ordering and WS broadcasting unified.

## 4. UI Expansion and Layout
**Decision:** Control layout state in `ChatContext` or `ChatWidget` component. When `ChatDetailsPanel` opens, adjust flex layout.
**Rationale:** Standard React state management for UI states.

## 5. Directory Routing for R2
**Decision:** Modify `upload_file_to_r2` to take a strict folder path like `messaging/chat_{id}/images/` and ensure the API layer passes `conversation_id`.
**Rationale:** Easy routing update via parameter passing.
