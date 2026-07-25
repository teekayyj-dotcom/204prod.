<!-- Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- List of modified principles:
  - Initialized Principle 1: API-First Backend
  - Initialized Principle 2: Component-Driven Frontend
  - Initialized Principle 3: Strict Typing
  - Initialized Principle 4: UI/UX Consistency
  - Initialized Principle 5: Test-Driven & Validation
- Added sections:
  - Architecture & Deployment
  - Code Review & Quality Gates
- Removed sections: None
- Templates requiring updates: None at this initialization stage.
- Follow-up TODOs: None
-->
# 204prod. Constitution

## Core Principles

### I. API-First Backend
The backend (Python) MUST be built API-first. Endpoints, request schemas, and response schemas MUST be clearly defined before implementing business logic.

### II. Component-Driven Frontend
The frontend (Vite/React) MUST follow a component-driven architecture. Components MUST be modular, reusable, and grouped by feature modules.

### III. Strict Typing
Strict typing MUST be enforced across the stack. The frontend MUST use TypeScript. The backend MUST use Python type hints and data validation frameworks.

### IV. UI/UX Consistency
The UI MUST follow a consistent design system. We MUST utilize `ui-ux-pro-max-skill` to generate and enforce design tokens and ensure responsive interfaces.

### V. Test-Driven & Validation
All critical business logic MUST be accompanied by automated tests. Data entering the system MUST be strictly validated at the boundary layers.

## Architecture & Deployment

The system is a full-stack application composed of a Python-based backend and a React (Vite) frontend. Database interactions MUST use a standardized approach, and schema changes MUST be tracked via migrations.

## Code Review & Quality Gates

All new features MUST be developed in isolated branches and reviewed before merging. Reviews MUST verify adherence to these Core Principles, ensuring typing strictness and visual consistency.

## Governance

This Constitution supersedes all other practices. All code reviews MUST verify compliance with these principles. Any amendments to this Constitution require version bumps.

**Version**: 1.0.0 | **Ratified**: 2026-07-21 | **Last Amended**: 2026-07-21
