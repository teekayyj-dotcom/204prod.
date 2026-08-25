# Quickstart: Sort Projects by Duedate

## Prerequisites

- Backend is running (e.g. `npm run dev:backend` or equivalent uvicorn command).
- Frontend is running (e.g. `npm run dev`).
- A PostgreSQL database is seeded with some test projects that have different `due_date` values, as well as some projects with `due_date = null`.

## Validation Steps

1. **Verify Client Dashboard**
   - Navigate to the Client Dashboard or Landing Page where projects are listed.
   - Verify that projects with the earliest due date appear first.
   - Verify that projects with no due date appear at the very bottom of the list.

2. **Verify Admin Dashboard**
   - Navigate to the Admin Dashboard project list.
   - Verify that projects are ordered by earliest due date first.
   - Verify that projects with no due date appear at the very bottom of the list.

3. **Verify Identical Due Dates**
   - For any two projects that share the exact same due date, verify that the one created more recently appears before the older one (secondary sort by `created_at` descending).
