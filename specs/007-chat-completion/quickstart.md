# Quickstart & Validation: Chat Completion

## Prerequisites

1. Ensure the database is up-to-date with Alembic migrations:
   ```bash
   cd backend
   alembic revision --autogenerate -m "add_avatar_url_to_conversation"
   alembic upgrade head
   ```
2. Start backend server (`uvicorn app.main:app --reload`)
3. Start frontend dev server (`npm run dev`)

## Validation Scenarios

### Scenario 1: Group Chat Details & Participants
1. Log in as an Admin or Crew.
2. Open the Chat interface and select a group chat.
3. Click on the "Group Info" button/icon.
4. Verify that the list of participants (including yourself) is displayed accurately.

### Scenario 2: Group Media Gallery
1. In a group chat, send an image attachment (e.g. `.png` or `.jpg`).
2. Open the "Group Info" panel and navigate to the Media tab.
3. Verify that the image you just sent appears in the gallery.

### Scenario 3: Update Group Avatar
1. In the "Group Info" panel, click on the group's current avatar.
2. Upload a new image.
3. Verify that the avatar updates in the header of the chat, and also reflects correctly in the chat list.

### Scenario 4: Smooth Messaging
1. Open two different browser profiles/windows logged in as different users.
2. Send messages back and forth.
3. Verify that the messages appear instantly on the sender's side (optimistic UI) without lagging or jittering, and arrive promptly on the receiver's side. Verify no video/audio call buttons are present.
