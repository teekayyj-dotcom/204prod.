# Tasks: Chat Enhancements (Avatar, Poll Notification, Toast)

## Phase 1: Setup
- [ ] T001 Verify project state

## Phase 2: User Story 1 - Sender Avatar (Priority: P1)
**Goal**: Display the sender's own avatar on the right side of their messages.
- [x] T002 [US1] Add avatar block to `MessageBubble.tsx` for `isOwn === true`
- [x] T003 [US1] Apply `hideAvatar` logic to sender's avatar in `MessageBubble.tsx`

## Phase 3: User Story 2 - Poll Vote Notifications (Priority: P2)
**Goal**: Broadcast a system message when a user votes in a poll.
- [x] T004 [US2] Update `api.py` `websocket_endpoint` to intercept `poll_vote`
- [x] T005 [US2] Fetch original poll message and extract `option_text`
- [x] T006 [US2] Determine action ("voted for" or "changed their vote to") and create system message
- [x] T007 [US2] Broadcast system message to all participants via `manager.broadcast_to_users`

## Phase 4: User Story 3 - Advanced Toast Notifications (Priority: P1)
**Goal**: Show detailed and clickable toast notifications for new messages.
- [x] T008 [US3] Extract `groupName` in `ChatContext.tsx`'s `handleNewMessage`
- [x] T009 [US3] Format toast title with `sender_name`, `groupName`, and `created_at` time
- [x] T010 [US3] Add `action` button to toast in `ChatContext.tsx` to open the specific chat (`setIsWidgetOpen(true)`, `setActiveConversationId()`)

## Dependencies & Execution Order
- T002 and T003 can be executed independently.
- T004 - T007 should be executed together in the backend.
- T008 - T010 should be executed together in the frontend.

## Phase 5: Poll Management & Bumping (Priority: P1)
**Goal**: Allow creators to edit/delete polls and bump polls to the bottom when voted on.
- [x] T011 [US4] Backend: Add websocket handler for `delete_message` in `api.py`
- [x] T012 [US4] Backend: Add websocket handler for `edit_poll` in `api.py`
- [x] T013 [US4] Backend: Include `poll_reference_id` in system message metadata when voting
- [x] T014 [US4] Frontend: Add 3-dot menu to Poll widget in `MessageBubble.tsx` for creator
- [x] T015 [US4] Frontend: Implement `EditPollModal` and trigger on Edit action
- [x] T016 [US4] Frontend: Handle `poll_reference_id` to render poll in `MessageBubble.tsx`
- [x] T017 [US4] Frontend: Handle `message_deleted` and `message_updated` in `ChatContext.tsx`

## Phase 6: Media Gallery UI (Priority: P2)
**Goal**: Fix the tabs overflow issue in `MediaGallery.tsx`
- [x] T018 [US5] Frontend: Change tab container classes to `flex-wrap gap-2` in `MediaGallery.tsx`

## Phase 7: Chat Notification Redesign & Route Restriction (Priority: P1)
**Goal**: Restrict chat to dashboard routes and redesign the notification toast.
- [x] T019 [US6] Frontend: Prevent websocket connection on landing page routes in `ChatContext.tsx`
- [x] T020 [US6] Frontend: Redesign sonner toast with custom JSX in `ChatContext.tsx`
