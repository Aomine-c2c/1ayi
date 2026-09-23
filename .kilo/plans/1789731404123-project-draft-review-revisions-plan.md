# Project Draft Review & Revisions Plan

## Goal

Review the current AYIS project draft, identify inconsistencies between documentation and actual code, fix logic gaps, and produce a coherent, aligned codebase + documentation set.

## Current State

The project ships a **C# ASP.NET Core 8 + MySQL 8 + Dapper + Vanilla JS** stack on disk. However, three documentation files describe a **different stack** (Django/PostgreSQL/Tauri/Next.js), and recent frontend additions introduce a **geographical conflict** (Zimbabwe vs Kenya). The backend is partially wired — several new components (AccuWeatherService, recommendation endpoints) exist in code but are not registered or routed.

## Decision Points (must be resolved before implementation)

| # | Decision | Options | Recommended |
|---|---|---|---|
| D1 | Keep ARCHITECTURE.md/ARCHITECTURE_PLAN.md (Django/PostgreSQL/Tauri) or rewrite to match C#/MySQL/Vanilla? | Archive old docs + rewrite; Delete old docs; Keep both | **Archive old docs as historical, rewrite ARCHITECTURE.md to match actual C# stack** |
| D2 | Use 3 roles (schema ENUM) or 8 roles (frontend/UI/SUMM)? | 3 roles; 8 roles | **8 roles — matches frontend, SYSTEM_USER_MANUAL, README RBAC table** |
| D3 | Target geography: Kenya or Zimbabwe? | Kenya (seed data, SUMM, +254); Zimbabwe (new frontend files) | **Kenya — seed data, SYSTEM_USER_MANUAL, +254 phone codes, KALRO references** |
| D4 | Keep new AccuWeather integration or revert to seed-data-only weather? | Keep + wire fully; Remove | **Keep + wire fully (backend endpoints, appsettings, Program.cs registration)** |
| D5 | Align frontend API paths to backend routes, or add backend routes for frontend paths? | Align frontend; Add backend routes | **Add missing backend routes + align frontend** (both need work) |

## Issues Found (Condensed)

### Critical
1. **ARCHITECTURE.md** describes Django/PostgreSQL/Tauri/Next.js — wrong stack (618 lines)
2. **ARCHITECTURE_PLAN.md** describes a never-built Greenfield Django project (346 lines)
3. **Role conflict**: `schema.sql` ENUM has 3 roles; frontend + SYSTEM_USER_MANUAL define 8
4. **AccuWeatherService.cs** not registered in `Program.cs`, no `AccuWeather` config in `appsettings.json`, no API endpoints
5. **Seed password hashes** in `seed.sql` are not valid BCrypt format — auth will fail

### High
6. **Geographical conflict**: seed data + SUMM use Kenya; new frontend files (`zimGeoData.js`, `geolocationService.js`, `services/index.js`) use Zimbabwe
7. **`.env.example`** describes Django/PostgreSQL/Celery — wrong for C#/MySQL stack
8. **Duplicate `getRecommendations()`** in `api.js` — second definition silently overwrites the first (lines 347-359 vs 370-375)
9. **Frontend/Backend API path mismatch** — frontend calls `/fields?farmId=`, `/cycles?farmId=`, `POST /farms`, etc. but backend only has `GET /farms/{id}/fields`, `GET /cycles?fieldId=`, no POST routes
10. **`GET /api/v1/farms`** in `Program.cs` returns all farms to all users — no role-based scoping

### Medium
11. **DomainModels.cs** missing: `WeatherStation`, `WeatherAlert`, `RefreshToken`, `Report`, `AuditLog` models
12. **Missing CRUD**: `FarmRepository` has `CreateAsync` but no `UpdateAsync`/`DeleteAsync`; no `CreateFieldAsync`
13. **Mislabeled section comments** in `api.js` (line 360 mislabels "Field Operations" when it's actually Intelligence)
14. **Missing indexes**: `weather_stations.location` has no SPATIAL INDEX; `notifications.is_read` has no index
15. **Missing `audit_logs.user_id` FK** — references `users.id` but has no foreign key constraint
16. **SYSTEM_USER_MANUAL.md architecture diagram** mentions "Tauri" and "Next.js" (contradicts stated C#/Vanilla stack)

### Low
17. **Hardcoded paths** in `README.md` (`file:///home/sila/Projects/ayi/SYSTEM_USER_MANUAL.md`)
18. **Inconsistent query params**: frontend uses `farmId` for cycles, backend uses `fieldId`
19. **Emoji over-use** in code comments and documentation
20. **Hyperbolic language** in docs ("enterprise-grade", "ultra-secure", "near-instant")

## Implementation Tasks (ordered)

### Phase 1: Documentation Alignment (1-2 days)
1. **Archive `ARCHITECTURE.md`** → rename to `ARCHITECTURE_DJANGO_LEGACY.md` with header: "Historical document — describes the never-implemented Django architecture. The project was built with C# ASP.NET Core 8 + MySQL 8 + Vanilla JS. See README.md for current architecture."
2. **Archive `ARCHITECTURE_PLAN.md`** → rename to `ARCHITECTURE_PLAN_DJANGO_LEGACY.md` with same header.
3. **Fix `README.md`**: Remove hardcoded `file:///home/sila/...` paths → use relative links `[SYSTEM_USER_MANUAL.md](SYSTEM_USER_MANUAL.md)`
4. **Fix `SYSTEM_USER_MANUAL.md`**: Remove "Tauri" and "Next.js" references from architecture diagram (lines 72-97); align with C#/Vanilla/WASM stack described on line 6.
5. **Fix language/tone**: Across README.md and SYSTEM_USER_MANUAL.md, replace hyperbolic claims with factual statements.

### Phase 2: Role Model Consolidation (0.5 days)
6. **Update `schema.sql`**: Change `users.role` ENUM from `('admin', 'agricultural_officer', 'farmer')` to `('super_admin', 'system_admin', 'agronomist', 'extension_officer', 'field_officer', 'weather_analyst', 'farm_manager', 'farmer')`
7. **Update `seed.sql`**: Add seed users for additional roles (at minimum: `agronomist` = `sarah.mwangi@ayis.org`, matching the existing `officer_sarah` row). Keep `admin` and `farmer` as-is but rename `agricultural_officer` → `extension_officer` if desired.
8. **Update `DomainModels.cs`**: Change `User.Role` default from `"farmer"` to `"farmer"` (unchanged) — just ensure the 8 values are documented.
9. **Update `Program.cs`**: Replace `.RequireAuthorization()` with role-specific policies if granular control is needed; otherwise keep `.RequireAuthorization()` which works with any authenticated user.

### Phase 3: Geographical Consolidation (0.5 days)
10. **Rename `frontend/js/geo/zimGeoData.js`** → `africaGeoData.js` or `kenyaGeoData.js`. Replace Zimbabwe Natural Regions with Kenya's Natural Regions or agro-ecological zones. Update all references.
11. **Update `geolocationService.js`**: Change `ZIMBABWE_CENTER` → `EAST_AFRICA_CENTER` (use Nairobi or Nakuru coords: lat -0.3031, lon 36.0800 matching seed data). Change `ZIM_BOUNDS` → `KENYA_BOUNDS`.
12. **Update `services/index.js`**: Change `DEFAULT_LAT`/`DEFAULT_LON` from Harare (-17.8252, 31.0335) to Nakuru (-0.3031, 36.0800). Replace Zimbabwean location references in report/notification mock data.
13. **Update `views.js`**: Replace "Harare Central [ZW-HRE]" references with Kenyan location names. Replace Zimbabwean province dropdown options with Kenyan counties.

### Phase 4: Backend Completion (Auth + AccuWeather) (2-3 days)
14. **Fix `seed.sql` password hashes**: Generate valid BCrypt hashes for `Password123!` and replace the placeholder hash.
15. **Add `AccuWeather` config to `appsettings.json`**:
   ```json
   "AccuWeather": {
     "ApiKey": "YOUR_ACCUWEATHER_API_KEY",
     "BaseUrl": "https://dataservice.accuweather.com"
   }
   ```
16. **Register `AccuWeatherService` in `Program.cs`**:
   ```csharp
   builder.Services.AddMemoryCache();
   builder.Services.AddHttpClient<AccuWeatherService>();
   ```
17. **Wire `AccuWeatherService` into `WeatherAndIntelligenceRepository`** OR add direct API endpoints. Recommended: Add direct endpoints in `Program.cs` that inject `AccuWeatherService`.
18. **Add API endpoints** in `Program.cs`:
   - `GET /api/v1/weather/current?lat={lat}&lon={lon}` → calls `AccuWeatherService.GetCurrentConditionsAsync`
   - `GET /api/v1/weather/forecast?lat={lat}&lon={lon}` → calls `AccuWeatherService.GetFiveDayForecastAsync`
   - `GET /api/v1/weather/alerts?lat={lat}&lon={lon}` → calls `AccuWeatherService.GetAlertsAsync`

### Phase 5: Backend Completion (CRUD + RBAC) (2-3 days)
19. **Add `UpdateAsync` to `FarmRepository`**: SQL `UPDATE farms SET ... WHERE id = @Id`
20. **Add `DeleteAsync` to `FarmRepository`**: SQL `DELETE FROM farms WHERE id = @Id`
21. **Add `CreateFieldAsync` to `FarmRepository`**: SQL `INSERT INTO fields ...`
22. **Add API routes** in `Program.cs`:
   - `POST /api/v1/farms` → `farmRepo.CreateAsync(farm)`
   - `PUT /api/v1/farms/{id}` → `farmRepo.UpdateAsync(farm)`
   - `DELETE /api/v1/farms/{id}` → `farmRepo.DeleteAsync(id)`
   - `GET /api/v1/fields?farmId={id}` → `farmRepo.GetFieldsByFarmIdAsync(farmId)`
3. **Add role-based scoping** to `GET /api/v1/farms`: Inject `ClaimsPrincipal user`, extract `ownerId`, pass to `GetAllAsync(ownerId)`.
   ```csharp
   app.MapGet("/api/v1/farms", async (FarmRepository farmRepo, ClaimsPrincipal user) =>
   {
       var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
       var role = user.FindFirst(ClaimTypes.Role)?.Value;
       var farms = await farmRepo.GetAllAsync(userId, role);
       return Results.Ok(farms);
   }).RequireAuthorization().WithName("GetFarms").WithTags("Farms");
   ```

### Phase 6: Frontend Alignment (1-2 days)
23. **Fix `api.js` duplicate `getRecommendations`**: Merge lines 347-359 and 370-375 into single method. Remove the second definition. Keep the DEMO_STATE fallback from the first.
24. **Fix `api.js` section comments**: Remove the mislabeled `// 6. Field Operations & Inspections` comment on line 360 that precedes Intelligence section.
25. **Align `api.js` endpoint paths** with backend routes:
   - `createFarm` → `POST /farms` (add backend route in Phase 5, step 22)
   - `getFields` → `GET /farms/{farmId}/fields` (match backend)
   - `getCycles` → `GET /cycles?fieldId=...` (change param from `farmId` to `fieldId`)
   - Remove calls to `/inspections`, `/observations`, `/crop-profiles` unless backend routes are added.

### Phase 7: Domain Model & Schema Completion (1 day)
26. **Add missing model classes** to `DomainModels.cs`: `WeatherStation`, `WeatherAlert`, `RefreshToken`, `Report`, `AuditLog`
27. **Add missing repository methods** to `WeatherAndIntelligenceRepository.cs`: `GetWeatherAlertsAsync()`, `GetWeatherStationsAsync()`
28. **Fix `schema.sql`**:
   - Add `SPATIAL INDEX` on `weather_stations.location`
   - Add index on `notifications.is_read`
   - Add FK constraint on `audit_logs.user_id` → `users(id) ON DELETE SET NULL`
   - Add `updated_at` columns to `crops`, `crop_varieties`, `weather_stations`, `farm_regions`

### Phase 8: Environment Configuration (0.5 days)
29. **Rewrite `.env.example`** — replace Django/PostgreSQL/Celery variables with C#/MySQL/AccuWeather variables:
   ```
   MYSQL_CONNECTION_STRING=Server=localhost;Port=3306;Database=ayis_db;User=root;Password=root_password;SslMode=Preferred;
   JWT_KEY=AYIS_ULTRA_SECURE_SECRET_KEY_FOR_JWT_TOKEN_SIGNING_2026_CHANGE_IN_PROD!
   JWT_EXPIRY_MINUTES=1440
   ACCUWEATHER_API_KEY=YOUR_ACCUWEATHER_API_KEY
   CORS_ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
   ```

## Validation Plan

After each phase:

1. **Phase 1-3 (docs):** `grep -ri "django\|postgres\|tauri\|next.js\|harare\|zimbabwe" --include="*.md" ./` → should return nothing in main docs
2. **Phase 4 (backend):** `dotnet build` → compiles; `curl http://localhost:8000/api/v1/weather/current?lat=-0.3031&lon=36.0800` → returns JSON or 401 (not 500)
3. **Phase 5 (CRUD):** `POST /api/v1/farms` with valid JWT → creates farm in DB; `GET /api/v1/farms` as farmer returns only their farms
4. **Phase 6 (frontend):** `api.getRecommendations` returns single merged method; console shows no duplicate definition warnings
5. **Phase 7 (schema):** `mysql -e "DESCRIBE ayis_db.users"` → ENUM shows 8 roles; `SHOW INDEX FROM weather_stations` → spatial index listed
6. **Phase 8 (.env):** Copy `.env.example` → `.env`, fill values, backend runs with correct MySQL connection

## Risks

| Risk | Mitigation |
|---|---|
| Seed password hashes are invalid BCrypt — auth breaks | Generate fresh BCrypt hashes for `Password123!` using `BCrypt.Net.BCrypt.HashPassword("Password123!")` |
| AccuWeather API key not available — endpoints return 500 | Add graceful fallback: if API key is missing, return cached/demo data |
| Frontend has 100+ KB of Zimbabwe demo data to rewrite | Replace geographically-neutral mock data (farms, cycles) but keep data structure; only change location names/coordinates |
| `views.js` is 96 KB — hard to fully audit for Zimbabwe references | Use `grep -rn "Harare\|ZW-\|Zimbabwe\|Mashonaland" frontend/js/` to find all references |
