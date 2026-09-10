# Agricultural Yield Intelligence System (AYIS)

## Architecture — REFINE 02

**Status:** Post-refactor. Service layer extracted; views are thin; all domain models defined.
**Date:** 2026-09-08
**Stack:** Tauri 2 → Next.js/TypeScript → Django/DRF → PostgreSQL/PostGIS → Redis → Celery

---

## 1. Layered Architecture

```
                    ┌─────────────────────────┐
                    │   Presentation Layer    │
                    │  ┌───────────────────┐  │
                    │  │   Tauri 2 Shell   │  │  ← Native desktop shell
                    │  │   (WebView)       │  │     Secure wrapper, no business logic
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │  Next.js + React  │  │  ← UI only: components, state, API client
                    │  │  TypeScript       │  │     Runs in browser AND Tauri WebView
                    │  └───────────────────┘  │
                    └────────────┬────────────┘
                                 │ REST (JSON)
                    ┌────────────▼────────────┐
                    │     API Layer           │
                    │  ┌───────────────────┐  │
                    │  │  Django REST      │  │  ← URL routing, serializers, auth, permissions
                    │  │  Framework        │  │     Thin views: validate → call service → respond
                    │  └───────────────────┘  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Service Layer         │
                    │  ┌───────────────────┐  │
                    │  │  ayis.farms       │  │  ← Farm business logic (scope, ownership, GIS queries)
                    │  │  ayis.users       │  │  ← User registration, profile, role-based access
                    │  │  ayis.weather     │  │  ← Weather sync orchestration
                    │  │  ayis.intelligence│  │  ← Suitability, yield estimation, recommendations
                    │  │  ayis.reports     │  │  ← Report generation (data structures)
                    │  │  ayis.notifications│ │ ← Notification creation, preferences
                    │  │  ayis.audit       │  │  ← Audit logging
                    │  │  ayis.settings_manager│ ← System settings
                    │  └───────────────────┘  │
                    │  STATELESS · testable    │
                    │  No HTTP, no models,    │
                    │  pure business logic    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Data Access Layer      │
                    │  ┌───────────────────┐  │
                    │  │  Django ORM       │  │  ← Models, queries, PostGIS operations
                    │  │  Django Migrations│  │  ← Schema versioning
                    │  └───────────────────┘  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Storage              │
                    │  ┌───────────────────┐  │
                    │  │ PostgreSQL 18     │  │  ← Relational data, ACID
                    │  │ + PostGIS 3.4     │  │  ← Geographic data, spatial queries
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │ Redis / Valkey 7  │  │  ← Celery broker, cache, rate-limit store
                    │  └───────────────────┘  │
                    └─────────────────────────┘

   Parallel track:
  ┌──────────────────────────────┐
  │ Background Processing        │
  │  Celery workers              │  ← Async tasks: weather sync, intelligence recalc,
  │  (ayis worker)               │     report generation, notification delivery
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │ External Integrations        │
  │  ayis.integrations           │  ← Weather API clients (Open-Meteo adapter)
  │  (provider adapters)         │     Isolated behind base contract
  └──────────────────────────────┘
```

### 1.1 Layer Responsibilities

| Layer | Responsibility | What it MUST NOT do |
|---|---|---|
| **Presentation** (Next.js/Tauri) | Render UI, capture user input, call API, display results, handle UX state | Contain business rules, talk to DB, compute intelligence, know about model structure |
| **API** (Django/DRF) | Route requests, authenticate, authorize, validate input via serializers, call services, serialize responses, handle errors | Contain business logic (views are thin), access DB beyond what services orchestrate, compute intelligence |
| **Service** | Own all business logic: calculations, decisions, orchestration, data classification, explanations | Know about HTTP, serializers, views, URLs, frontend state |
| **Data Access** (Models/ORM) | Define schema, enforce constraints, provide query interface, PostGIS operations | Contain business rules, format responses, know about API concerns |
| **Background** (Celery) | Run long-running tasks: weather sync, intelligence recalculation, report generation, notification dispatch | Block request/response cycle, contain UI logic |
| **Integrations** | Adapt external APIs to internal data shapes (ObservationRecord), handle provider-specific quirks | Leak provider-specific types into the rest of the system |

---

## 2. Domain Model

### 2.1 Users & Auth
- `User` (custom): role (`farmer` | `officer` | `admin`), username, email, password
- Auth: JWT (SimpleJWT) — token obtain, refresh, blacklist (logout)
- Registration: public, defaults to farmer role
- Profile: `/me/` endpoint for current user

### 2.2 Farms
- `Farm`: owner (FK→User), name, location (PostGIS Point), area_ha, notes
- GeoJSON export, bounding box queries via PostGIS

### 2.3 Crops & Varieties
- `Crop`: name, scientific_name, category, growing_days, planting requirements, environmental requirements (temp, rainfall, humidity, soil pH, sunlight), expected yield characteristics, seasonal info
- `Variety`: crop FK, name, breeder, maturity, yield range, disease/pest resistance, adaptation zones
- `CropRequirement`: context-specific requirements (irrigated/rainfed, soil type, fertility recommendations)

### 2.4 Crop Cycles
- `CropCycle`: farm FK, crop FK, variety FK, planting_date, expected_harvest_date, actual_harvest_date, current_stage (GrowthStage), status (CycleStatus), area_ha, planting density
- Accumulated inputs: seeds, fertilizer (N/P/K), irrigation, pesticide, labor — all with quantities and costs
- Notes, intelligence results (M2M)

### 2.5 Weather
- `WeatherSource`: provider name, API endpoint, active flag, priority
- `WeatherObservation`: source FK, observed_at, lat/lon, PostGIS point, temperature, rainfall, humidity, wind, pressure, data_quality, raw_payload — OBSERVED
- `WeatherForecast`: source FK, forecast_at, forecast_for, lat/lon, temperatures, rainfall probability, weather_code, data_quality — PREDICTED
- `WeatherSyncJob`: source FK, started_at, completed_at, status, records_processed/created/updated, error_message

### 2.6 Intelligence
- `IntelligenceResult`: result_type (weather_suitability | crop_suitability | yield_estimate | recommendation), farm FK, crop FK, variety FK, cycle FK, generated_by FK, data_classification, score, value (JSON), confidence, factors (JSON), explanation, model_name, input_data_snapshot — CALCULATED / PREDICTED / RECOMMENDED
- `PredictionPerformance`: intelligence_result FK, actual_value, absolute_error, relative_error_pct, recorded_at — tracks prediction vs actual
- `RecommendationRule`: name, description, condition_expression, action_template, rationale_template, priority, is_active
- `RecommendationEngineVersion`: version, description, is_active, rules (M2M)

### 2.7 Production
- `Harvest`: cycle FK, harvest_date, production_area_ha, quantity_kg, actual_yield_kg_ha (auto-calculated), quality_grade, sale_price, total_revenue, storage info, predicted_intelligence FK (links to the prediction this harvest validates) — OBSERVED

### 2.8 Reporting
- Report data classes (`WeatherReportData`, `FarmReportData`, `YieldReportData`, `RecommendationReportData`, `SystemReportData`) — data structures for rendering to PDF/HTML/CSV
- `ReportService` — generates report data from domain data

### 2.9 Notifications
- `Notification`: recipient FK, notification_type, title, body, data (JSON), delivery_methods, delivered_at, read_at, is_read, is_deliverable
- `NotificationPreference`: per-user preferences (enabled types per channel, global toggles, quiet hours)
- `NotificationDeliveryLog`: notification FK, method, attempted_at, succeeded, response_info

### 2.10 Audit
- `AuditLogEntry`: actor FK, action (ActionType), action_object_type, action_object_id, description, old_values, new_values, ip_address, user_agent, created_at — immutable, append-only

### 2.11 Settings
- `SystemSetting`: key (unique), name, description, category, value_type, value, default_value, is_public, is_dynamic, requires_restart, set_by FK, set_at
- `SettingService` — get/set settings, category queries, default value helpers

---

## 3. Service Layer Catalogue

### 3.1 `ayis.farms.services`
| Method | Purpose |
|---|---|
| `get_visible_queryset(user)` | Scope farms by role (admin: all, officer: placeholder→own, farmer: own) |
| `can_edit(user, farm)` | Ownership check for editing |
| `can_delete(user, farm)` | Ownership check for deletion |
| `create_farm(user, name, location, area_ha, notes)` | Create a farm for a user |
| `update_farm(farm, user, **updates)` | Update with permission check |
| `delete_farm(farm, user)` | Delete with permission check |
| `get_geojson_feature_collection(user)` | GeoJSON for map rendering |
| `filter_by_bbox(user, min_lon, min_lat, max_lon, max_lat)` | PostGIS bbox query |

### 3.2 `ayis.users.services`
| Method | Purpose |
|---|---|
| `create_user(username, email, password, ...)` | Register with password validation |
| `update_user_profile(user, **updates)` | Update editable fields only |
| `list_users_for_role(user)` | Admin/officer see all; farmer sees none |

### 3.3 `ayis.weather.services`
| Method | Purpose |
|---|---|
| `sync_current_for_farm(farm)` | Fetch + persist current weather for a farm's location |
| `sync_current_for_coordinates(lat, lon, source)` | Fetch + persist for arbitrary coordinates |
| `sync_historical_for_farm(farm, days)` | Fetch + persist historical weather |
| `sync_historical_for_coordinates(lat, lon, start, end)` | Fetch + persist historical for coordinates |
| `fetch_current_raw(lat, lon)` | Fetch without persisting (for API responses) |

### 3.4 `ayis.intelligence.services`
| Method | Purpose |
|---|---|
| `calculate_weather_suitability(observations, crop_requirements)` | Score weather against crop requirements ( CALCULATED) |
| `calculate_crop_suitability(farm, crop_reqs, observations)` | Combine weather + location suitability |
| `estimate_yield(farm, crop, variety, planting_date, area_ha, observations, model_name)` | Predict yield with confidence + explanation ( PREDICTED) |
| `generate_recommendation(farm, crop, suitability, yield_estimate, date)` | Recommend action with evidence ( RECOMMENDED) |

### 3.5 `ayis.reports.services`
| Method | Purpose |
|---|---|
| `generate_weather_report(...)` | Weather report data structure |
| `generate_farm_report(...)` | Farm summary report |
| `generate_yield_report(...)` | Yield comparison (predicted vs actual) |
| `generate_recommendation_report(...)` | Recommendation report |
| `generate_system_report(...)` | System-wide summary |

### 3.6 `ayis.notifications.services`
| Method | Purpose |
|---|---|
| `create_notification(recipient, type, title, body, data, methods)` | Create a notification |
| `mark_read(notification)` | Mark as read |
| `mark_all_read(user)` | Bulk mark read |
| `get_unread_count(user)` | Unread count |
| `get_unread_notifications(user, limit)` | Unread list |
| `get_preferences(user)` | Get/create preferences |
| `set_preferences(user, **updates)` | Update preferences |

### 3.7 `ayis.audit.services`
| Method | Purpose |
|---|---|
| `log_create(actor, type, id, ...)` | Log a create |
| `log_update(actor, type, id, ...)` | Log an update |
| `log_delete(actor, type, id, ...)` | Log a delete |
| `log_login(actor, ...)` | Log login |
| `log_login_failure(username, ...)` | Log failed login |
| `log_permission_denied(actor, type, id, ...)` | Log access denial |

### 3.8 `ayis.settings_manager.services`
| Method | Purpose |
|---|---|
| `get_setting(key, default)` | Get a setting value |
| `set_setting(key, value, ...)` | Set/create a setting |
| `get_settings_by_category(category)` | List settings by category |
| `get_yield_model_defaults()` | Yield model parameter defaults |
| `get_suitability_thresholds()` | Suitability threshold settings |
| `get_recommendation_settings()` | Recommendation engine settings |

---

## 4. Data Classification

Every intelligence result and weather observation is tagged with one of:

| Classification | Source | Stored on |
|---|---|---|
| `observed` | External API or user entry | `WeatherObservation`, user-entered cycle data |
| `calculated` | Deterministic derivation | `IntelligenceResult` (weather_suitability, crop_suitability) |
| `predicted` | Predictive model output | `IntelligenceResult` (yield_estimate), `WeatherForecast` |
| `recommended` | Interpretation of evidence | `IntelligenceResult` (recommendation) |

The `data_classification` field is attached at the serialization layer via `DataClassificationMixin`. The frontend MUST label results accordingly and never present predictions as guarantees.

---

## 5. External Integrations

### 5.1 Weather (`ayis.integrations.weather.client`)
- `BaseIntegrationClient` — abstract contract: `health_check`, `fetch_current`, `fetch_historical`, `fetch_forecast`
- `WeatherClient` — Open-Meteo implementation
  - No API key required for basic usage
  - Returns `ObservationRecord` (normalized)
  - Configurable via `WEATHER_SOURCE`, `OPEN_METEO_API_BASE_URL` env vars
- Future providers: add a new class implementing `BaseIntegrationClient`, register via factory

### 5.2 ObservationRecord (normalized internal shape)
```python
@dataclass
class ObservationRecord:
    source: str
    observed_at: datetime
    latitude: float
    longitude: float
    temperature_celsius: float | None
    rainfall_mm: float | None
    humidity_percent: float | None
    wind_speed_ms: float | None
    data_quality: str
    raw_payload: dict | None
```

---

## 6. Background Processing (Celery)

| Task Category | Example Tasks | Trigger |
|---|---|---|
| Weather sync | Sync current/historical weather for farms | Periodic (cron) or on-demand |
| Intelligence recalculation | Recalculate suitability/yield when observed data changes | Triggered by data change |
| Report generation | Generate PDF/HTML reports | On-demand (user request) |
| Notification delivery | Deliver notifications via configured channels | Triggered by notification creation |
| Yield model evaluation | Compare predictions to actuals, update confidence calibration | Periodic (batch) |

---

## 7. API Design

### 7.1 Versioning
- All endpoints under `/api/v1/`
- OpenAPI 3.1 schema at `/api/v1/schema/`
- Swagger UI at `/api/v1/schema/swagger-ui/`

### 7.2 Authentication
- JWT via SimpleJWT
- Token obtain: `POST /api/v1/auth/token/`
- Token refresh: `POST /api/v1/auth/token/refresh/`
- Token blacklist (logout): `POST /api/v1/auth/token/blacklist/`
- Registration: `POST /api/v1/auth/register/`
- Auth header: `Authorization: Bearer <token>`

### 7.3 Current Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/health/` | No | Readiness probe |
| GET | `/api/v1/info/` | No | API metadata + data classification legend |
| GET | `/api/v1/` | Yes | API discovery root |
| GET | `/api/v1/users/me/` | Yes (self) | Current user profile |
| GET | `/api/v1/users/` | Yes (admin/officer) | User list |
| POST | `/api/v1/auth/register/` | No | User registration |
| GET/POST/PUT/DELETE | `/api/v1/farms/` | Yes | Farm CRUD |
| GET | `/api/v1/farms/geojson/` | Yes | GeoJSON farm list |
| GET | `/api/v1/farms/within/` | Yes | Bbox query |
| GET | `/api/v1/schema/` | No | OpenAPI schema |
| GET | `/api/v1/schema/swagger-ui/` | No | Swagger UI |

### 7.4 Error Handling
- Custom exception handler (`ayis.api.exceptions.custom_exception_handler`)
- All errors return structured JSON: `{"error": "...", "details": {...}}` or `{"error": "...", "message": "..."}`
- Unhandled exceptions → 500 with generic message (real error logged server-side)
- Validation errors → field-level detail

### 7.5 Permissions
- `DEFAULT_PERMISSION_CLASSES`: `IsAuthenticated`
- Unauthenticated endpoints explicitly decorated with `@permission_classes([AllowAny])`
- Role-based scoping in service layer (`FarmService.get_visible_queryset`)
- Object-level ownership checks in service layer (`can_edit`, `can_delete`)

---

## 8. Frontend Architecture

### 8.1 Single Codebase, Two Contexts
```
frontend/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Tauri vs browser detection via env)
│   ├── page.tsx            # Landing / dashboard
│   ├── login/              # Auth pages
│   ├── register/
│   ├── farms/              # Farm list, detail, map, create/edit
│   ├── cycles/             # Crop cycle management
│   ├── weather/            # Weather data + forecasts
│   ├── intelligence/       # Suitability, yield estimates, recommendations
│   ├── reports/            # Report generation + viewing
│   └── settings/           # App settings
├── components/             # Reusable UI components
│   ├── ui/                 # Primitive components (Button, Input, Card, Table, etc.)
│   ├── map/                # Leaflet map components
│   ├── charts/             # Recharts chart components
│   ├── forms/              # Form components
│   └── layout/             # Header, sidebar, navigation
├── lib/
│   ├── api/                # API client (typed, uses OpenAPI-generated or hand-written types)
│   │   ├── client.ts       # Base client with auth, error handling
│   │   ├── farms.ts        # Farm API calls
│   │   ├── users.ts        # User/auth API calls
│   │   ├── weather.ts      # Weather API calls
│   │   ├── intelligence.ts # Intelligence API calls
│   │   └── reports.ts      # Report API calls
│   ├── types/              # TypeScript interfaces (generated from OpenAPI or hand-written)
│   ├── utils/              # Pure utility functions (no business logic)
│   └── constants/          # App constants
├── hooks/                  # React hooks (API data fetching, state)
├── styles/                 # Global styles, Tailwind config
└── public/                 # Static assets
```

### 8.2 Tauri Integration
- Tauri loads the Next.js static export from the filesystem
- Tauri IPC used for: native notifications, file export (PDF/CSV), system info
- All business logic stays on the backend — Tauri never computes intelligence

### 8.3 API Base URL
- Browser: `NEXT_PUBLIC_API_BASE` env var (e.g. `http://localhost:8000/api/v1`)
- Tauri: resolved to local backend via Tauri config (localhost)
- Single configurable base — works in both contexts

---

## 9. Tauri Desktop Shell

```
tauri/
├── src/                      # Rust backend
│   ├── main.rs               # Entry point, window setup
│   ├── lib.rs                # Tauri commands (native features)
│   └── ...
├── src-tauri/                # Cargo project
│   ├── Cargo.toml
│   ├── tauri.conf.json       # Window, security, build config
│   ├── capabilities/         # Permission profiles
│   └── ...
├── build/                    # Build output
└── ...
```

Tauri capabilities:
- Window management (size, menu, system tray if needed)
- Native notifications (via Tauri notification plugin)
- File system access for export (PDF/CSV download)
- App logging

Tauri does NOT:
- Contain business logic
- Talk directly to the database
- Make intelligence calculations

---

## 10. Database Design

### 10.1 PostGIS Integration
- `Farm.location`: `PointField(srid=4326)` — farm center coordinates
- `WeatherObservation.location`: `PointField(srid=4326)` — observation location
- `WeatherForecast.location`: `PointField(srid=4326)` — forecast location
- Spatial indexes on all PointFields for bbox/distance queries
- PostGIS functions used via Django ORM (`location__within`, etc.)

### 10.2 Indexes
- B-tree on foreign keys, timestamps, status fields
- Spatial (GIST) on PointFields
- Composite indexes on common query patterns (farm + status, farm + crop + planting_date)

### 10.3 Constraints
- `unique_together` on `(source, observed_at, latitude, longitude)` for weather observations
- `unique_together` on `(crop, name)` for varieties
- `unique` on `SystemSetting.key`, `WeatherSource.name`
- `unique` on `Crop.name`
- Check constraints via model validators

### 10.4 Cascading
- `on_delete=CASCADE` for owned resources (farms → user, cycles → farm)
- `on_delete=PROTECT` for referenced data that shouldn't be deleted (weather sources, crops)
- `on_delete=SET_NULL` for optional references (variety, generated_by)

### 10.5 Soft Deletion
- Not implemented yet. When needed, add `deleted_at` field and filter on `deleted_at__isnull=True` in querysets.

---

## 11. Configuration

### 11.1 Environment Variables
| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | DB connection | `postgres://ayis:ayis-dev-password@localhost:5432/ayis` |
| `REDIS_URL` | Celery broker + cache | `redis://localhost:6379/0` |
| `SECRET_KEY` | Django secret | `change-me-in-local-dev` (dev only) |
| `DEBUG` | Debug mode | `true` (dev) |
| `ALLOWED_HOSTS` | Allowed hosts | `localhost,127.0.0.1` |
| `CORS_ORIGIN_WHITELIST` | CORS origins | `http://localhost:3000,http://localhost:1420` |
| `SIMPLE_JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | JWT lifetime | `60` |
| `SIMPLE_JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh lifetime | `7` |
| `API_BASE_URL` | Frontend API base | `http://localhost:8000/api/v1` |
| `WEATHER_SOURCE` | Weather provider | `open-meteo` |
| `OPEN_METEO_API_BASE_URL` | Open-Meteo base URL | `https://api.open-meteo.com/v1` |

### 11.2 Settings Split
- `base.py`: shared defaults
- `dev.py`: DEBUG=True, CORS_ALLOW_ALL=True, eager Celery
- `prod.py`: DEBUG=False, HTTPS, strict hosts, no CORS wildcard

### 11.3 Secrets
- Never hard-coded
- `.env.example` committed; real `.env` in `.gitignore`
- Docker Compose uses env var substitution

---

## 12. Security

### 12.1 Authentication & Authorization
- JWT tokens with configurable lifetime
- Refresh token blacklist for logout
- Role-based access in service layer
- Object-level ownership checks

### 12.2 API Security
- CORS configured (whitelist in dev, strict in prod)
- Custom exception handler (no error leakage)
- DRF serializers for input validation
- Django ORM prevents SQL injection

### 12.3 Future Security Improvements (deferred)
- Rate limiting on auth endpoints
- Security headers middleware
- Password policy enforcement beyond Django defaults
- Email verification on registration
- Audit log monitoring

---

## 13. Development Workflow

### 13.1 Local Development
```bash
# 1. Start infrastructure
docker compose up -d db redis

# 2. Start backend + worker
docker compose up -d backend backend-worker

# 3. Run migrations (first time)
docker compose exec backend python manage.py migrate

# 4. Create superuser
docker compose exec backend python manage.py createsuperuser

# 5. Frontend (browser)
cd frontend && npm install && npm run dev   # http://localhost:3000

# 6. Tauri (desktop)
cd tauri && cargo tauri dev                   # Desktop window
```

### 13.2 Testing Strategy
- Unit tests: service layer (pure functions, no DB needed for most)
- Integration tests: API endpoints with test client
- Model tests: model validation, constraints
- Frontend tests: component tests (future)

---

## 14. Known Limitations (Post-Refactor)

1. **Backend not yet running** — the refactor added many new models/apps. Migrations need to be generated and applied before the backend can serve requests again.

2. **Weather sync not wired to Celery** — `WeatherService` exists but no Celery tasks yet. Weather data won't auto-sync until tasks are created.

3. **Intelligence not exposed via API** — `IntelligenceService` exists but no API endpoints yet. Intelligence results can be generated in code but not accessed via HTTP.

4. **No report rendering** — `ReportService` generates data structures but no PDF/HTML/CSV rendering pipeline yet.

5. **No notification delivery** — Notifications can be created but no Celery tasks deliver them via email/SMS/push yet.

6. **Frontend is two empty tsconfig files** — no Next.js app, no components, no API client.

7. **Tauri shell doesn't exist** — no Tauri project.

8. **Officer region filtering is a placeholder** — `FarmService.get_visible_queryset` returns officer's own farms; region-based filtering requires officer region assignment which doesn't exist yet.

---

## 15. What Changed in This Refactor

### Files Added (service layer + domain models)
- `backend/ayis/farms/serializers.py` — **FIXED THE CRASH** (was missing)
- `backend/ayis/farms/services.py` — new service layer
- `backend/ayis/users/services.py` — new service layer
- `backend/ayis/services/__init__.py` — service layer registry
- `backend/ayis/services_registry.py` — service registry
- `backend/ayis/integrations/__init__.py`
- `backend/ayis/integrations/base.py` — integration contract
- `backend/ayis/integrations/weather/client.py` — Open-Meteo adapter
- `backend/ayis/weather/models.py` — weather domain models
- `backend/ayis/weather/apps.py`
- `backend/ayis/weather/__init__.py`
- `backend/ayis/weather/services.py` — weather service layer
- `backend/ayis/intelligence/models.py` — intelligence domain models
- `backend/ayis/intelligence/apps.py`
- `backend/ayis/intelligence/__init__.py`
- `backend/ayis/intelligence/services.py` — intelligence service layer
- `backend/ayis/production/models.py` — harvest/production models
- `backend/ayis/production/apps.py`
- `backend/ayis/production/__init__.py`
- `backend/ayis/production/services.py` — production service layer
- `backend/ayis/reports/services.py` — report generation service
- `backend/ayis/reports/apps.py`
- `backend/ayis/reports/__init__.py`
- `backend/ayis/notifications/models.py` — notification models
- `backend/ayis/notifications/apps.py`
- `backend/ayis/notifications/__init__.py`
- `backend/ayis/audit/models.py` — audit log models
- `backend/ayis/audit/apps.py`
- `backend/ayis/audit/__init__.py`
- `backend/ayis/settings_manager/models.py` — system settings models
- `backend/ayis/settings_manager/apps.py`
- `backend/ayis/settings_manager/__init__.py`
- `backend/ayis/crops/models.py` — crop/variety models
- `backend/ayis/crops/apps.py`
- `backend/ayis/crops/__init__.py`
- `backend/ayis/cycles/models.py` — crop cycle models
- `backend/ayis/cycles/apps.py`
- `backend/ayis/cycles/__init__.py`

### Files Modified
- `backend/ayis/farms/views.py` — refactored to use `farm_service`
- `backend/ayis/users/views.py` — refactored to use `user_service`
- `backend/ayis/settings/base.py` — added all new apps to INSTALLED_APPS
- `backend/ayis/settings/dev.py` — updated
- `backend/ayis/settings/prod.py` — updated
- `backend/ayis/settings.py` — settings loader updated
- `backend/ayis/__init__.py` — project package updated

### Architecture Changes
- Business logic extracted from views into service layer
- Views are now thin: validate → call service → respond
- Services are stateless and testable
- Data classification framework in place (mixin + constants)
- External integration isolated behind abstract contract
- Complete domain model defined (even if not all exposed via API yet)

---

## 16. Next Steps (Post-Refactor)

1. **Generate and apply migrations** — `python manage.py makemigrations` for all new apps, then `migrate`
2. **Verify backend starts** — `docker compose up -d backend` and check health endpoint
3. **Build the frontend** — Next.js app with TypeScript, Tailwind, Leaflet, Recharts, API client
4. **Build the Tauri shell** — Rust backend, WebView, native notifications, file export
5. **Expose intelligence via API** — endpoints for suitability, yield estimates, recommendations
6. **Wire weather sync to Celery** — periodic tasks for weather data ingestion
7. **Build report rendering** — PDF/HTML/CSV output from report data structures
8. **Add notification delivery** — Celery tasks for email/SMS/push
9. **Add tests** — service layer unit tests, API integration tests, model tests
10. **Iterate on officer region filtering** — add officer region assignment when needed
