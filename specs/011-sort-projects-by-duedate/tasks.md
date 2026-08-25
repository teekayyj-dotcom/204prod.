# Tasks: Sort Projects by Duedate

**Input**: Design documents from `/specs/011-sort-projects-by-duedate/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No setup tasks required. Project structure is existing.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*(No foundational tasks required for this feature as it uses existing tables.)*

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Client View Sorting (Priority: P1) 🎯 MVP

**Goal**: As a client, I want to see projects sorted by their due date (earliest first) so that I can easily identify which projects need immediate attention.

**Independent Test**: Can be fully tested by creating projects with different due dates and verifying they appear in chronological order (earliest due date first) on the client dashboard.

### Implementation for User Story 1

- [X] T001 [US1] Update default ordering in `backend/app/modules/projects/repository.py` to sort by `due_date` ascending (nulls last) and then `created_at` descending.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. This single backend change will actually solve both User Story 1 and User Story 2 simultaneously.

---

## Phase 4: User Story 2 - Admin Dashboard Sorting (Priority: P1)

**Goal**: As an admin, I want to see all projects sorted by their due date (earliest first) on the admin dashboard so that I can prioritize management and support for upcoming deadlines.

**Independent Test**: Can be fully tested by creating projects with different due dates and verifying they appear in chronological order on the admin dashboard.

### Implementation for User Story 2

*(No additional tasks required. T001 satisfies this user story as well.)*

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T002 Run quickstart.md validation to confirm sorting behavior across the app.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A
- **Foundational (Phase 2)**: N/A
- **User Stories (Phase 3+)**: US1 and US2 are satisfied by T001.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies.
- **User Story 2 (P1)**: Implemented concurrently with US1 via shared backend logic.

### Parallel Opportunities

- No parallel opportunities identified as this feature consists of a single modification in one file.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001)
2. **STOP and VALIDATE**: Test User Story 1 independently. (Also validates User Story 2).
3. Deploy/demo.
