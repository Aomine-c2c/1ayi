# Agricultural Yield Intelligence System (AYIS)

## Architecture Review, Gap Analysis & Development Plan

**Date:** 2026-09-08
**Status:** Greenfield — no existing code, schema, or configuration.
**Stack:** Tauri 2 + Next.js/TypeScript + Django/DRF + PostgreSQL/PostGIS + Celery/Redis + Docker Compose

---

## 1. AUDIT — Current State

### What exists
- Empty working directory at `/home/sila`
- No repository, no source code, no database, no configuration

### What's installed on the host
| Component | Status |
|---|---|
| Node 26.8 / npm 11.19 | ✅ available |
| Python 3.14.7 | ✅ available |
| Rust 1.98 / Cargo 1.98 (stable) | ✅ installed (`rustup`) |
| Valkey/Redis 9.1 | ✅ installed (`redis-server` available) |
| PostgreSQL 18.6 (psql) | ✅ client present; server install TBD |
| Docker / Docker Compose | ✅ available |
| Django 6.1 + DRF 3.18 + Celery 5.6 + psycopg2 + redis + drf-spectacular | ✅ installed in `/home/sila/ayi-venv` |

### What's missing
- Rust Tauri toolchain components (templating, CLI)
- PostgreSQL server (Docker preferred for dev)
- PostGIS extension
- Project scaffolding (all of it)

---

## 2. ARCHITECTURE

### 2.1 Deployment Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Tauri 2 Desktop App                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Next.js (React 19)                     ││
│  │   - Same codebase runs in browser & Tauri shell        ││
│  │   - Tauri IPC for native features (file, notification) ││
│  └─────────────────────────────────────────────────────────┘│
│                              │ REST API                      │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────┐
│  Backend: Django 6 + DRF   │  PostgreSQL 18 + PostGIS       │
│  - Models, serializers      │  - Farms, crops, cycles         │
│  - Services (business logic)│  - Weather, intelligence        │
│  - Celery tasks             │  - Production, reporting        │
│  - Auth (JWT or session)    │                                 │
│  - drf-spectacular OpenAPI  │  Redis (Valkey)                 │
│                             │  - Celery broker                │
│                             │  - Cache, rate-limit            │
└──────────────────────────────┴────────────────────────────────┘
```

### 2.2 Repository Layout

```
ayi-system/
├── docker-compose.yml            # Postgres + Redis + Django dev
├── frontend/                     # Next.js (shared — browser + Tauri)
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/           # UI components
│   │   ├── lib/                  # API client, types, utils
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── tailwind.config.ts / or other styling
├── backend/                      # Django + DRF
│   ├── ayis/                     # Project settings
│   │   ├── settings/             # base.py, dev.py, prod.py
│   │   ├── urls.py
│   │   └── wsgi.py / asgi.py
│   ├── apps/
│   │   ├── users/                # Auth, roles, profiles
│   │   ├── farms/                # Farms, locations, PostGIS
│   │   ├── crops/                # Crop, variety, requirements
│   │   ├── cycles/               # Crop cycles, stages, status
│   │   ├── weather/              # Current, historical, forecast
│   │   ├── intelligence/         # Suitability, yield estimates,
│   │   │                         #   recommendations, explanations
│   │   ├── production/           # Harvest, actual yield, comparison
│   │   ├── reports/              # Report generation
│   │   └── api/                  # Root API, versioning, docs
│   ├── celery_app.py
│   ├── manage.py
│   └── requirements.txt / pyproject.toml
├── tauri/                        # Tauri 2 wrapper
│   ├── src/                      # Rust backend (native features)
│   ├── src-tauri/                # Cargo project
│   ├── tauri.conf.json
│   ├── capabilities/
│   └── build/
├── scripts/                      # Dev helpers, DB seed, GIS loading
├── tests/                        # Cross-cutting integration tests
├── docs/                         # Architecture, API, decisions
├── .env.example                  # Environment template
├── .gitignore
└── README.md
```

### 2.3 Multi-Platform Frontend Strategy

The Next.js app is the single UI layer. It runs in two contexts:

| Context | How it runs | API base URL |
|---|---|---|
| Browser | `next dev` / `next build` + `next start` or static export | Configurable via env (`VITE_API_BASE` / `NEXT_PUBLIC_API_BASE`) |
| Tauri desktop | `tauri dev` / `tauri build` — Tauri serves the built Next.js as a WebView | Tauri resolves to `http://localhost:<backend-port>` or via local IPC where appropriate |

**Critical rule:** All business logic stays in the backend. The frontend contains:
- Presentation components
- API client (typed, using OpenAPI-generated or hand-written TypeScript interfaces)
- State management (minimal, server-state driven)
- Tauri-specific native integrations (notifications, file export, offline cache) behind feature flags so the browser build still works

**Future Tauri mobile:** Same frontend bundle, different Tauri capabilities. No UI rewrite needed.

### 2.4 API Design Principles

- RESTful, versioned (`/api/v1/...`)
- OpenAPI 3.1 generated via `drf-spectacular` — frontend types can be generated from this
- Every intelligence result includes:
  - `result_type`: `observed` | `calculated` | `predicted` | `recommended`
  - `confidence` / `quality` indicator where applicable
  - `explanation`: human-readable derivation
- Errors: structured, never swallowed. Validation errors return field-level detail.
- Auth: token-based (JWT) with role-scoped permissions from day one.

### 2.5 Data Classification (mandatory)

Every model and API response that carries derived data must declare its classification:

| Classification | Source | Example |
|---|---|---|
| `observed` | User entry or external source | Farmer-reported planting date, weather station observation |
| `calculated` | Deterministic derivation from observed data | Growing-degree-days from temperature observations, area from coordinates |
| `predicted` | Predictive model output | Yield forecast from crop model + weather + soil |
| `recommended` | Interpretation / decision rule over evidence | "Plant maize this week" from suitability scores |

UI must label predicted/recommendation data clearly. Never present a prediction as a fact.

### 2.6 Background Processing (Celery)

- Weather data ingestion (polling external sources) — periodic
- Intelligence recalculation when observed data changes — triggered
- Report generation — on demand, long-running
- Yield model evaluation / batch prediction — scheduled or on-demand

### 2.7 Security From Day One

- HTTPS in production (Tauri desktop uses localhost; browser deployment terminates TLS at reverse proxy)
- Authentication required for all `/api/v1/` endpoints except public docs/health
- Role-based permissions: farmer sees own farms, officer sees assigned farms/region, admin sees all
- Destructive operations (delete farm, crop cycle, production record) require confirmation + authorization check
- Environment variables for all secrets; `.env.example` committed, real `.env` never
- Input validation at API layer (serializers) and at DB layer (constraints)
- SQL injection prevented by Django ORM / parameterized queries
- PostGIS functions used safely (no raw SQL with user input concatenated)

---

## 3. GAP ANALYSIS

### Missing — by system

| Layer | Gap |
|---|---|
| Repository | No project, no VCS, no CI |
| Backend | No Django project, no apps, no models, no serializers, no API, no auth, no Celery config |
| Database | No PostgreSQL server running, no database created, no PostGIS, no migrations |
| Frontend | No Next.js project, no components, no API client, no types |
| Tauri | No Tauri project, no Rust backend, no WebView config |
| Maps | No map library selected or integrated |
| Charts | No charting library selected or integrated |
| Weather data | No external source integrated, no ingestion pipeline |
| Intelligence | No suitability logic, no yield estimation, no recommendation engine |
| Reports | No report generation |
| Tests | No tests anywhere |
| Docs | No documentation |
| Infra | No Docker Compose, no env management, no production config |

### Tooling gaps to close before first feature
1. Rust toolchain for Tauri 2 (`cargo install tauri-cli` or use `npm create tauri-app`)
2. PostgreSQL + PostGIS (use Docker Compose for dev)
3. Redis server confirmed running (Valkey 9.1 installed; verify it starts)
4. Frontend TypeScript config with strict mode
5. Backend settings split (base / dev / prod)
6. OpenAPI generation pipeline

---

## 4. DEVELOPMENT PLAN — Levels

### Level 0 — Foundation (this level)

**Goal:** Everything needed to run the stack locally and ship a blank but functional multi-platform shell. No domain features yet — just the working skeleton that all future levels build on.

**Acceptance criteria:**
- [ ] Repository initialized, `.gitignore`, `README.md`, `.env.example` in place
- [ ] Docker Compose brings up PostgreSQL 18 + PostGIS + Redis/Valkey
- [ ] Django project scaffolded: settings split, DB connected, PostGIS enabled, DRF installed, CORS configured, auth foundation (custom user model with role field), health endpoint, OpenAPI schema endpoint
- [ ] Celery configured and able to start workers against Redis
- [ ] Next.js project scaffolded: TypeScript strict, API client foundation with typed base, environment-driven API base URL, styling system chosen
- [ ] Tauri 2 project scaffolded: Rust backend minimal, WebView loading the Next.js app, `tauri dev` opens the app window
- [ ] Frontend runs in browser (`next dev`) and in Tauri (`tauri dev`) — same code
- [ ] API base URL works in both contexts (Tauri uses local backend; browser uses configurable URL)
- [ ] Maps library selected and a map component rendering a bare viewport is wired (even if no data)
- [ ] Charts library selected and a bare chart component renders
- [ ] Health check: `GET /api/v1/health` returns 200 from Django; frontend shows "connected" indicator
- [ ] End-to-end smoke: farmer can't do anything useful yet, but the app launches, the API responds, and the stack is coherent
- [ ] Basic tests: Django project imports cleanly, Celery app configures, frontend builds without type errors, Tauri builds

**Deliverables:**
- Full repository scaffold
- Docker Compose for local dev
- Django foundation (settings, URLs, health, OpenAPI)
- Next.js foundation (app shell, API client, types, map + chart placeholders)
- Tauri shell (Rust backend, WebView, build config)
- Dev environment docs

### Level 1 — Core Domain Models + Auth + Farms

**Goal:** Users can register/login, create a farmer profile, and register farms with locations.

**Acceptance criteria:**
- [ ] Custom user model: role (`farmer` | `officer` | `admin`), auth via DRF
- [ ] JWT or session auth working; protected endpoints enforce role
- [ ] `Farm` model: owner (FK to user), name, location (Point, PostGIS), area (ha), notes
- [ ] API: CRUD for farms scoped to owner (farmer sees own, officer sees assigned, admin sees all)
- [ ] Frontend: login/register, dashboard with farm list, add/edit farm form with map pin placement
- [ ] Map component actually places and reads coordinates
- [ ] PostGIS queries: farms within a bounding box / radius (foundation for region queries)
- [ ] Migrations for all models
- [ ] Tests: model tests, API auth tests, farm CRUD tests

### Level 2 — Crops + Crop Cycles + Weather Foundation

**Goal:** Farmers can define what they grow and track cycles; weather data flows in.

**Acceptance criteria:**
- [ ] `Crop` and `Variety` models with growing period, requirements, expected yield characteristics
- [ ] `CropCycle` model: farm, crop/variety, planting date, expected harvest, growth stage, status
- [ ] API + UI for cycles: create, view, update stage/status
- [ ] Weather data model: observation timestamp, source, temperature, rainfall, humidity, wind, quality/status
- [ ] Weather ingestion Celery task (stub or real source — at minimum a working pipeline that writes observations)
- [ ] Weather displayed on farm detail / cycle detail
- [ ] API distinguishes observed vs calculated (e.g. growing-degree-days calculated from temperature)
- [ ] Tests

### Level 3 — Intelligence: Suitability + Yield Estimates + Recommendations

**Goal:** The system produces suitability scores, yield estimates, and recommendations that are labeled, confidence-rated, and explained.

**Acceptance criteria:**
- [ ] `WeatherSuitability` calculation: given observed weather + crop requirements → suitability score + explanation
- [ ] `CropSuitability` for a farm location: based on climate normals / current weather + crop requirements
- [ ] `YieldEstimate`: predicted yield with confidence + explanation + result_type=`predicted`
- [ ] `Recommendation`: recommended action with result_type=`recommended` + evidence trail
- [ ] Intelligence tied to crop cycle and farm context
- [ ] UI: intelligence panel on farm/cycle detail, clear labeling of predicted vs observed vs recommended
- [ ] Historical prediction performance tracking (compare predictions to eventual actuals — foundation)
- [ ] Tests: calculation logic unit tests, API integration tests

### Level 4 — Production Records + Yield Comparison

**Goal:** Harvest records feed back into the system; actual vs predicted yield is tracked.

**Acceptance criteria:**
- [ ] `Harvest` / production record model: cycle, quantity, area, actual yield, date
- [ ] API + UI for recording harvest
- [ ] Yield comparison: actual vs predicted, displayed on cycle report
- [ ] Feedback loop: actuals improve future prediction confidence (foundational)
- [ ] Tests

### Level 5 — Reporting + Alerts + Officer Workflow

**Goal:** Reports and alerts; agricultural officer view.

**Acceptance criteria:**
- [ ] Report generation: weather, farm, cycle, yield, recommendation reports (PDF or structured — at minimum structured data endpoints + UI)
- [ ] Alert system: weather extremes, stage-critical alerts, recommendation changes — delivered via Celery + notification (in-app + Tauri native notification where available)
- [ ] Officer view: see assigned farms/region, reviews, notes
- [ ] Admin view: user management, system health
- [ ] Tests

### Level 6 — Polish, Performance, Security Hardening, Docs

**Goal:** Production readiness.

**Acceptance criteria:**
- [ ] Security review: authz on every endpoint, rate limiting, input validation, secrets management
- [ ] Performance: DB indexing (PostGIS indexes, common query paths), Celery concurrency, caching where appropriate
- [ ] Error handling: structured, no swallowed errors, user-friendly messages
- [ ] Docs: architecture, API (OpenAPI), setup, contributing
- [ ] CI: lint, test, build on push
- [ ] Deployment: production Docker Compose / orchestration plan
- [ ] Full smoke test of every major workflow

---

## 5. LIBRARY CHOICES (to finalize in Level 0)

| Concern | Candidates | Selection rationale |
|---|---|---|
| Maps | Leaflet + React-Leaflet, MapLibre GL JS, OpenLayers | Leaflet is simplest for farm-point + bbox use cases; MapLibre if we need raster tiles / heavier GIS viz later. Pick Leaflet for Level 0 unless a strong reason emerges. |
| Charts | Recharts, Chart.js (react-chartjs-2), Tremor, ECharts | Recharts is React-native and lightweight; good for yield/time-series. Pick Recharts for Level 0. |
| Styling | Tailwind CSS + headless UI, or component library (Mantine, Radix) | Tailwind gives flexibility without locking to a component lib; pair with headless primitives. Confirm with user if they have a preference. |
| Auth | Simple JWT (djangorestframework-simplejwt) or session | JWT is simplest for a desktop+mobile future where cookie-based session cookies are awkward. Confirm. |
| Tauri | Tauri 2 with `@tauri-apps/api` for notifications, filesystem | Required by spec. |
| Weather source | OpenWeatherMap, Open-Meteo (free, no key for basic), NASA POWER, local station import | Open-Meteo is a strong free starting point with no API key for basic historical/forecast. Final source TBD after inspecting available data needs. |

---

## 6. RISKS / OPEN QUESTIONS

1. **Weather data source**: Need a real source before Level 2. Free option: Open-Meteo. If the user has a preferred provider (national service, commercial), that changes the ingestion design.
2. **Yield prediction model**: The spec calls for predicted yield. Real models need training data or agronomic formulas. For the system to be honest (per the data-classification rule), Level 3 should start with a transparent, explainable model (e.g. potential-yield-from-climate + user adjustments) rather than a black box. Need to confirm the user's expectation here.
3. **Tauri WebView + Next.js**: Next.js App Router with SSR is awkward inside a Tauri WebView (which is a client-side browser). Common approach: use Next.js as a static-export-like SPA or configure `output: 'export'` / disable SSR for Tauri builds, OR use the Next.js dev server and point Tauri at `localhost:3000` during dev. Need to decide the Tauri build story — static export is cleanest for distribution but loses SSR. Confirm preference.
4. **PostgreSQL/PostGIS in Docker vs host**: Docker Compose for dev is cleanest. Confirm the user is fine with Docker for the database.
5. **Desktop vs browser API base**: In Tauri, the backend runs on localhost. In browser, it's wherever deployed. The frontend needs a single configurable API base — confirm the user's deployment story (local desktop only for now, or web deployment early).

---

## 7. IMMEDIATE NEXT STEP

**Level 0 — Foundation.** Start by confirming the open questions above (items 1–5), then scaffold:
1. Docker Compose (Postgres+PostGIS, Redis)
2. Django backend foundation
3. Next.js frontend foundation
4. Tauri 2 shell
5. Map + chart integration
6. Health check + OpenAPI endpoint
7. Smoke test

Reply with any corrections to the architecture, library preferences, auth choice, Tauri build story, weather source preference, and whether Docker-for-DB is acceptable. Once confirmed, I'll build Level 0.
