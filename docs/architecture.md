# Architecture

This repository uses a domain-first structure.

- `projects` is the core domain across frontend and backend.
- `media` is separated because image and video handling will grow independently.
- shared code is intentionally kept small to avoid generic utility sprawl.
