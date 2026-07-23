# Tasks: Chat Completion & Enhancements

**Input**: Design documents from `/specs/007-chat-completion/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify backend dependencies for image upload handling (if needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update `Conversation` model to include `avatar_url` in `backend/app/modules/messaging/models.py`
- [x] T003 Generate Alembic migration for adding `avatar_url` to `messaging_conversations` table
- [x] T004 Apply database migration using Alembic

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Group Chat Details & Settings (Priority: P1) 🎯 MVP

**Goal**: View the details of a group chat to see members, media, and update the group avatar.

**Independent Test**: Click "Group Info" in a group chat, verify participants/media load, and successfully update the group avatar.

### Implementation for User Story 1

- [x] T005 [P] [US1] Create API endpoint `GET /api/messaging/{id}/media` in `backend/app/modules/messaging/router.py`
- [x] T006 [P] [US1] Create API endpoint `PATCH /api/messaging/{id}/avatar` in `backend/app/modules/messaging/router.py`
- [x] T007 [P] [US1] Update `GET /api/messaging/{id}` to return participants and avatar in `backend/app/modules/messaging/router.py`
- [x] T008 [US1] Implement business logic for fetching media/participants and updating avatar in `backend/app/modules/messaging/service.py`
- [x] T009 [P] [US1] Create `ParticipantList` component in `frontend/src/modules/messaging/components/ParticipantList.tsx`
- [x] T010 [P] [US1] Create `MediaGallery` component in `frontend/src/modules/messaging/components/MediaGallery.tsx`
- [x] T011 [US1] Create `ChatDetailsPanel` component in `frontend/src/modules/messaging/components/ChatDetailsPanel.tsx` that integrates participants and media
- [x] T012 [US1] Add avatar upload functionality to `ChatDetailsPanel.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Smooth Messaging Experience (Priority: P1)

**Goal**: Send and receive messages smoothly in real-time, without lag or layout issues.

**Independent Test**: Send a message and verify it appears instantly on the sender's side. Verify no call buttons are visible.

### Implementation for User Story 2

- [x] T013 [P] [US2] Update `frontend/src/modules/messaging/store/ChatContext.tsx` to handle optimistic UI updates for sent messages
- [x] T014 [US2] Update scroll behavior in the message list component to scroll smoothly on new messages
- [x] T015 [US2] Remove or hide video/audio call buttons from the chat layout component

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T016 Run quickstart.md validation tests
- [x] T017 Verify responsive design of ChatDetailsPanel on mobile

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - independent of US1

### Parallel Opportunities

- Foundation tasks can be done before user stories.
- US1 backend endpoints and frontend components can be developed in parallel initially (e.g., mock UI while backend is being built).
- US2 frontend state management can be built in parallel with US1.

---

## Parallel Example: User Story 1

```bash
# Launch frontend and backend tasks in parallel:
Task: "Create API endpoint GET /api/messaging/{id}/media in backend/app/modules/messaging/router.py"
Task: "Create ParticipantList component in frontend/src/modules/messaging/components/ParticipantList.tsx"
```
