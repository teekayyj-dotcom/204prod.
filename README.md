# 204PROD

Portfolio website for a visual production house, organized around the `projects` domain as the core product surface.

## Repository Structure

```text
backend/   FastAPI API and content management domain modules
frontend/  Vite + React client organized by product modules
docs/      Architecture and content-model notes
infra/     Deployment and local infrastructure placeholders
```

## Product Priorities

- `projects` is the primary domain and content surface.
- `media` supports project galleries, covers, thumbnails, and asset metadata.
- `contact` and `about` support lead generation and brand positioning.
- `auth` and `admin` exist to support internal content management.

## Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```
