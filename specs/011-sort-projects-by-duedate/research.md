# Research: Sort Projects by Duedate

## Findings

### 1. How is project sorting currently handled in the backend?
**Decision**: We will update the default ordering in `backend/app/modules/projects/repository.py`.
**Rationale**: In `repository.py`, there is a default order fallback: `stmt = stmt.order_by(Project.created_at.desc())`. We need to change this default ordering to sort by `due_date` ascending with nulls last, and then `created_at` descending.
**Alternatives considered**: Sorting on the frontend. Rejected because it's better to receive sorted data directly from the API for consistency across both Admin Dashboard and Client View, and to avoid client-side performance overhead if the project list grows.

### 2. How to implement `nulls_last` in SQLAlchemy?
**Decision**: Use `nullslast()` function provided by SQLAlchemy.
**Rationale**: `Project.due_date.asc().nulls_last()` (or `nullslast(Project.due_date.asc())`) correctly translates to PostgreSQL `ORDER BY due_date ASC NULLS LAST`.

## Conclusion
All technical details are clear. We can proceed to Phase 1.
