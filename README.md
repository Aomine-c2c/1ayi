
# AYIS — Agricultural Yield Intelligence System
# Level 0: Foundation

## Quick start (local dev, Docker)

### Prerequisites
- Docker + Docker Compose
- Python 3.14 (for local backend management commands if not using container)
- Node 26 + npm 11 (frontend)
- Rust/Cargo (Tauri)

### 1. Bootstrap environment
```bash
cp .env.example .env
# Edit .env if you want non-default passwords/keys
```

### 2. Start infrastructure
```bash
docker compose up -d db redis
```

### 3. Start backend (in container)
```bash
docker compose up -d backend
# Run migrations (first time and after model changes):
docker compose exec backend python manage.py migrate
# Create superuser:
docker compose exec backend python manage.py createsuperuser
```

### 4. Start Celery worker (in container)
```bash
docker compose up -d backend-worker
```

### 5. Frontend
```bash
cd frontend
npm install
npm run dev          # browser dev, http://localhost:3000
```

### 6. Tauri (desktop)
```bash
cd tauri
# Tauri uses the Next.js static export. Build frontend first:
cd ../frontend && npm run build && cd ../tauri
cargo tauri dev      # Tauri dev with WebView loading the built app
```

### 7. Verify
- Backend health:  curl http://localhost:8000/api/v1/health
- API docs:        http://localhost:8000/api/v1/schema/swagger-ui/
- Frontend (browser): http://localhost:3000
- Tauri desktop: launches a window pointing at the built frontend

## Environment variables (see .env.example)

| Variable | Purpose |
|---|---|
| DATABASE_URL | Django database connection (PostgreSQL) |
| REDIS_URL | Celery broker + cache |
| SECRET_KEY | Django secret key |
| DEBUG | Django DEBUG flag |
| ALLOWED_HOSTS | Django allowed hosts (comma-separated) |
| CORS_ORIGIN_WHITELIST | Frontend origins allowed to call the API |
| API_BASE_URL | Frontend API base (used by browser build; Tauri uses local) |

## Project layout

- `docker-compose.yml` — Postgres+PostGIS, Redis, backend, worker
- `backend/` — Django + DRF + Celery
- `frontend/` — Next.js (runs in browser and inside Tauri WebView)
- `tauri/` — Tauri 2 desktop shell wrapping the built frontend
- `ARCHITECTURE_PLAN.md` — full architecture, gap analysis, and roadmap

## Development levels

See `ARCHITECTURE_PLAN.md` for the full roadmap. Current target: **Level 0 — Foundation**.
# ayi
