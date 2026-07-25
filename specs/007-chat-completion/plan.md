# Implementation Plan: Chat Enhancements (Poll Management & UI Tweaks)

**Branch**: `007-chat-completion` | **Date**: 2026-07-23

## Goal Description

Enhance the chat features with the following updates:
1. **Poll Management**: Add a 3-dot menu to Poll widgets allowing the poll creator to Edit or Delete their poll.
2. **Poll Bumping**: Automatically bring a poll to the bottom of the chat view when a user votes on it, ensuring it stays visible in active chats.
3. **Media Categories UI**: Fix the scrolling issue in the Media Details panel where category tabs were cut off on smaller screens.

## User Review Required

> [!IMPORTANT]  
> **Global Notification Integration**: Regarding your question about integrating chat messages into the global system notifications—**I recommend against doing this for every message**. Chat messages occur with high frequency and would quickly spam the global notification bell, burying important system alerts (like task assignments, mentions, or approvals). 
> **Alternative**: We should only push chat notifications to the global bell if a user is explicitly `@mentioned` in a group chat, or we just keep the chat notifications entirely separate (as they are now, with toast popups and unread badges).

Please review the proposed plan below and click **Proceed** if you agree with the approach.

## Proposed Changes

### Backend (FastAPI)

#### [MODIFY] [api.py](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./backend/app/modules/messaging/api.py)
- **Delete Message**: Add WebSocket support for `{ type: "delete_message" }` which deletes the target message (if the sender matches the current user) and broadcasts `message_deleted` to participants.
- **Edit Poll**: Add WebSocket support for `{ type: "edit_poll" }` which updates a poll's `metadata_json` (adding/removing options) and broadcasts `message_updated`.
- **Poll Bumping**: When intercepting a `poll_vote`, the generated system message will now include `"poll_reference_id": msg_id` in its `metadata_json`.

### Frontend (React/Vite)

#### [MODIFY] [MessageBubble.tsx](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./frontend/src/modules/messaging/components/MessageBubble.tsx)
- Add a 3-dot (`MoreVertical`) menu to the Poll Widget, visible only to the poll creator.
- Integrate an **Edit Poll Modal** that allows the creator to modify the question or options.
- Handle `poll_reference_id` in system messages: if present, render a clickable shortcut or the poll widget itself right below the system message to "bump" it.

#### [MODIFY] [ChatContext.tsx](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./frontend/src/modules/messaging/store/ChatContext.tsx)
- Add listeners for `message_deleted` to remove messages from state.
- Add listeners for `message_updated` to update a message's content/metadata in state (used for edited polls).

#### [MODIFY] [MediaGallery.tsx](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./frontend/src/modules/messaging/components/MediaGallery.tsx)
- Change the tab container's styling from `flex space-x-2 overflow-x-auto` to `flex flex-wrap gap-2`. This ensures that if the tabs (Images, Videos, Files, Links) exceed the container width, they will gracefully wrap to the next line rather than being cut off.

## Verification Plan

### Manual Verification
- **Poll Management**: Create a poll, click the 3-dot menu, edit the poll options, and verify the UI updates for all users. Delete the poll and ensure it disappears.
- **Poll Bumping**: Vote on a poll and verify the system message appears with the poll widget bumped to the bottom.
- **Media UI**: Open Chat Details -> Media, and verify the category tabs are fully visible and wrap neatly if the space is constrained.
