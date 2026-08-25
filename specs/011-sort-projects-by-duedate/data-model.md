# Data Model: Sort Projects by Duedate

No new data models or fields are introduced. The existing `Project` model in `backend/app/modules/projects/models.py` already contains the necessary fields:

- `due_date`: `Mapped[date | None] = mapped_column(Date, nullable=True)`
- `created_at`: `Mapped[datetime]`

The feature only alters the query logic to sort by these existing fields.
