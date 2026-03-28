# Learnova

eLearning platform — React (Vite + TypeScript) frontend and FastAPI backend.

## Layout

- `frontend/` — web app
- `backend/` — API
- `docs/` — setup guides

## Marketing site (`website/`)

Static landing pages and **role screenshot tours** (`tour.html?role=learner|instructor|admin`). Images live under `website/screenshots/` (synced from the repo `Screenshots/` folder). Deploy the whole `website/` directory so `screenshots/` and `images/` resolve correctly.

## Backend: demo data

From `backend/` after migrations and `.env` are set:

1. **`python demo_seed.py`** — **full reset**: truncates app tables and loads realistic demo data (Indian names, varied metrics, gamification points, enrollments, reviews). Use this for screenshots and clean demos.
2. `python seed.py` — creates only the three default accounts (no courses). Safe if you are not using `demo_seed.py`.
3. `python seed_bulk.py` — **load testing only** (hundreds of rows). Hidden from normal API lists (tagged `bulk-seed`).
4. `python cleanup_bulk_seed.py` — removes bulk seed rows only (does not truncate the whole DB).
