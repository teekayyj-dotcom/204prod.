# Implementation Plan: Sort Projects by Duedate

**Branch**: `[011-sort-projects-by-duedate]` | **Date**: 2026-08-25 | **Spec**: [spec.md](file:///Users/macbook/Documents/Documents%20-%20Teekayyj/204prod./specs/011-sort-projects-by-duedate/spec.md)

**Input**: Feature specification from `/specs/011-sort-projects-by-duedate/spec.md`

## Summary

System MUST sort the project list on the Client View and Admin Dashboard ascending by due date (earliest first), placing projects with null/empty due dates at the end of the list, and using creation date (newest first) as a secondary sorting condition.

## Technical Context

**Language/Version**: Python 3.11, TypeScript

**Primary Dependencies**: FastAPI, SQLAlchemy, React, Vite

**Storage**: PostgreSQL

**Testing**: pytest, Jest

**Target Platform**: Web App (Client Site + Admin Dashboard)

**Project Type**: full-stack web application

**Performance Goals**: Project lists load in under 1 second

**Constraints**: N/A

**Scale/Scope**: Standard app size

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The backend (Python) MUST be built API-first. (Yes)
- Strict typing MUST be enforced across the stack. (Yes)
- UI/UX Consistency (N/A, no UI changes, only data sorting)
- Test-Driven & Validation (Yes, need to test sorting logic)

**All gates passed.**

## Project Structure

### Documentation (this feature)

```text
specs/011-sort-projects-by-duedate/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
└── tasks.md             
```

### Source Code (repository root)

```text
backend/
├── app/modules/projects/
│   ├── repository.py

frontend/
├── src/modules/client-site/
│   └── pages/ 
└── src/modules/admin-dashboard/
    └── pages/ 
```

**Structure Decision**: The changes will primarily be in the `backend/app/modules/projects/repository.py` to change the default sorting behavior of projects for all endpoints (admin and client).
