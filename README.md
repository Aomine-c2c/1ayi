# Agricultural Yield Intelligence System (AYIS)

> **Precision Agriculture & Decision Support Platform**  
> Built with a high-performance **C# ASP.NET Core Minimal API (.NET 8.0)** backend, **MySQL 8 with native GIS spatial engine**, and a responsive **Vanilla Web Frontend (HTML5, CSS3, ES6 JavaScript)** without bloated JavaScript framework runtimes.

> **Comprehensive User Manual:** For persona breakdowns, operational workflows, and step-by-step role guides, consult the [System Architecture & User Manual](file:///home/sila/Projects/ayi/SYSTEM_USER_MANUAL.md).

---

## 📋 Table of Contents

0. [Comprehensive User & Operational Manual](file:///home/sila/Projects/ayi/SYSTEM_USER_MANUAL.md)
1. [System Overview](#-system-overview)
2. [Architecture & Technology Stack](#-architecture--technology-stack)
3. [Repository Layout](#-repository-layout)
4. [Prerequisites](#-prerequisites)
5. [Quick Start (Unified Runner)](#-quick-start-unified-runner)
6. [Database Setup & Schema](#-database-setup--schema)
7. [Running Services Independently](#-running-services-independently)
8. [Backend Minimal APIs & Swagger Spec](#-backend-minimal-apis--swagger-spec)
9. [Frontend Features & Role-Based Access Control (RBAC)](#-frontend-features--role-based-access-control-rbac)
10. [Default Seed Credentials & Test Accounts](#-default-seed-credentials--test-accounts)
11. [Configuration & Environment Variables](#-configuration--environment-variables)
12. [Port Management & Automatic Fallback](#-port-management--automatic-fallback)
13. [Troubleshooting](#-troubleshooting)
14. [License & Contribution](#-license--contribution)

---

## 🌾 System Overview

The **Agricultural Yield Intelligence System (AYIS)** is an end-to-end agrotechnology platform designed to empower agricultural organizations, farm managers, extension officers, agronomists, and smallholder farmers.

AYIS aggregates and processes:
- **Geospatial Parcel Boundaries**: Polygon/Point geometry with SRID 4326 for farms and sub-fields.
- **Microclimate & Weather Intelligence**: Live and historical weather observation recording, agro-meteorological indices, and regional advisory alerts.
- **Crop Lifecycle & Varietal Catalogs**: Scientific crop definitions, maturity schedules, drought/disease resistance profiles, and phenological stage monitoring.
- **Yield Forecasting & Soil Suitability**: Multi-factor suitability scoring (temperature, rainfall, soil chemistry) with predictive yield modeling and confidence ranges.
- **Actionable Agronomic Recommendations**: Timely interventions categorized by Irrigation, Fertilizer, Pest Control, Planting, and Harvest schedules.

---

## 🏛️ Architecture & Technology Stack

AYIS is built around clean architectural boundaries, low memory footprints, and native platform runtimes:

```
┌────────────────────────────────────────────────────────┐
│               Frontend (Vanilla Web)                   │
│   • Pure HTML5 + Semantic Elements                     │
│   • Modern Vanilla CSS (Tokens, CSS Grid, Glassmorphism)│
│   • Modular ES6 JavaScript (No React/Next/Node bundle) │
│   • Dynamic Hash Router (#farms, #crops, #weather, etc)│
└──────────────────────────▲─────────────────────────────┘
                           │ JSON REST / Bearer JWT
┌──────────────────────────▼─────────────────────────────┐
│             Backend (C# ASP.NET Core 8)                │
│   • C# Minimal API Endpoints                           │
│   • Dapper Micro-ORM for high-speed query execution   │
│   • BCrypt.Net password hashing + HMAC-SHA256 JWT auth │
│   • Built-in Swagger/OpenAPI Interactive Explorer      │
│   • CORS Policy for web & local desktop runtimes       │
└──────────────────────────▲─────────────────────────────┘
                           │ Connection Pool / Spatial SQL
┌──────────────────────────▼─────────────────────────────┐
│              Database (MySQL 8 Community)              │
│   • Native Spatial Types (POINT, POLYGON, SRID 4326)   │
│   • Spatial R-Tree Indexing (SPATIAL INDEX)            │
│   • InnoDB transactional storage engine with foreign   │
│     keys, cascades, and temporal microsecond precision │
└────────────────────────────────────────────────────────┘
```

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | Vanilla Web | Zero-build HTML5, CSS3 with modern CSS custom properties, responsive drawer layout, ES6 modules, and dynamic SVG icons. |
| **Backend** | .NET 8 Minimal APIs | High-throughput C# microservices framework with zero MVC boilerplate and fast startup time. |
| **Data Access** | Dapper | Micro-ORM executing optimized SQL queries directly with type mapping. |
| **Database** | MySQL 8.0+ | Native GIS database storing boundary polygons, coordinate points, and transactional domain records. |
| **Authentication** | JWT + BCrypt | Stateless Bearer token authentication with role claims. |
| **Documentation**| OpenAPI / Swagger | Self-documenting interactive API console enabled at `/swagger`. |

---

## 📁 Repository Layout

```
.
├── backend/
│   ├── Ayis.Api/                       # C# ASP.NET Core Web API Project
│   │   ├── Ayis.Api.csproj             # .NET 8 Project configuration & NuGet dependencies
│   │   ├── Program.cs                  # Dependency injection, middleware & Minimal API routes
│   │   ├── appsettings.json            # Database connection string, JWT secrets, CORS settings
│   │   ├── Data/
│   │   │   └── MySqlConnectionFactory.cs # Thread-safe MySQL connection factory
│   │   ├── Models/                     # Domain & Data Transfer Object (DTO) models
│   │   ├── Repositories/               # Dapper data access repositories
│   │   │   ├── UserRepository.cs       # User profile and authentication queries
│   │   │   ├── FarmRepository.cs       # Farms, fields and geospatial queries
│   │   │   ├── CropRepository.cs       # Crop catalog, varieties and cycles
│   │   │   └── WeatherAndIntelligenceRepository.cs # Observations, predictions & alerts
│   │   └── Services/
│   │       └── AuthService.cs          # BCrypt verification & JWT token generator
│   └── Database/
│       ├── schema.sql                  # Complete DDL: Tables, spatial indexes & constraints
│       └── seed.sql                    # Initial seed data: Users, farms, crops, cycles
├── frontend/                           # Pure Vanilla Web Application (Zero npm dependencies)
│   ├── index.html                      # Single-Page Application (SPA) entrypoint & shell
│   ├── css/
│   │   └── styles.css                  # Design system, glassmorphism, responsive styles
│   └── js/
│       ├── api.js                      # Centralized Fetch client with JWT interceptor
│       ├── router.js                   # Client-side hash routing system
│       ├── views.js                    # Component views & dashboard renderers
│       ├── auth/                       # Login modal, user profile & farmer onboarding
│       ├── components/                 # Reusable UI widgets & notifications
│       ├── domain/                     # Domain modules (farms, crops, intelligence, weather)
│       └── roles/                      # RBAC definitions & contextual menu configs
├── run.sh                              # Unified Linux / macOS runner (backend + frontend)
├── run.ps1                             # Unified Windows PowerShell runner
├── run-backend.sh                      # Standalone Linux/macOS backend launcher
├── run-backend.ps1                     # Standalone Windows backend launcher
├── run-frontend.sh                     # Standalone Linux/macOS frontend server
├── run-frontend.ps1                    # Standalone Windows frontend server
├── setup-database.ps1                  # PowerShell database provisioner
├── ARCHITECTURE.md                     # Deep architectural specifications & domain models
└── README.md                           # Master project guide (this document)
```

---

## ⚙️ Prerequisites

Ensure the following tools are installed on your machine:

1. **.NET 8 SDK**:
   ```bash
   dotnet --version
   # Expected: 8.0.xxx
   ```
2. **MySQL Server 8.0+** (Community Server or MariaDB 10.5+ with Spatial support):
   - MySQL service must be running locally on port `3306`.
3. **Python 3** (Used as a lightweight zero-config HTTP server for the frontend):
   ```bash
   python3 --version
   ```
   *(Alternatively, Node's `npx serve` can be used if Python is not present).*

---

## 🚀 Quick Start (Unified Runner)

The fastest way to start both the backend API and frontend web client is using the root unified runner script.

### On Linux / macOS:

```bash
chmod +x run.sh run-backend.sh run-frontend.sh
./run.sh
```

### On Windows (PowerShell):

```powershell
.\run.ps1
```

### What Happens Automatically:
1. **Port conflict prevention**: Checks whether ports `8000` (backend) or `8080` (frontend) are held by stale processes and frees or re-routes them.
2. **Backend initialization**: Restores NuGet dependencies and compiles `Ayis.Api`, launching on `http://localhost:8000`.
3. **Health verification**: Polls `/api/v1/health` until the API is responding.
4. **Frontend server**: Serves the `frontend/` directory via Python HTTP server on `http://localhost:8080`.
5. **Graceful shutdown**: Hitting `Ctrl+C` cleans up both the frontend and backend processes cleanly.

---

## 🗄️ Database Setup & Schema

AYIS uses MySQL 8 with native spatial extensions (`POINT` and `POLYGON` with SRID 4326).

### 1. Automated Initialization (Windows PowerShell)

```powershell
.\setup-database.ps1 -MySqlUser "root" -MySqlPassword "your_mysql_password"
```

### 2. Manual Initialization (Linux / macOS / MySQL Workbench)

Run the SQL scripts in order using the `mysql` CLI or MySQL Workbench:

```bash
# 1. Apply schema (creates `ayis_db` and tables)
mysql -u root -p < backend/Database/schema.sql

# 2. Populate reference and demonstration seed data
mysql -u root -p < backend/Database/seed.sql
```

### Database Tables Overview:

| Table | Purpose |
| :--- | :--- |
| `users` | System users, credentials (BCrypt), roles (`admin`, `agricultural_officer`, `farmer`). |
| `farm_regions` | Administrative regional definitions, counties, and macro-climate zones. |
| `farms` | Farm boundaries (`POLYGON`), centroid (`POINT`), soil class, owner ID. |
| `fields` | Specific sub-parcels with individual soil pH, slope, and drainage attributes. |
| `crops` | Crop catalog with thermal thresholds, optimal rainfall ranges, and typical yields. |
| `crop_varieties` | Hybrid varieties with maturity duration and disease resistance metadata. |
| `crop_cycles` | Planted seasons, growth stages, target yields, and status (`PLANNED`, `ACTIVE`, `HARVESTED`). |
| `weather_stations` | Weather monitoring station locations (`POINT`). |
| `weather_observations` | Time-series telemetry (temperature, humidity, precipitation, solar radiation). |
| `weather_alerts` | Regional alerts with severity classification (`ADVISORY`, `WARNING`, `CRITICAL`). |
| `suitability_assessments` | Evaluated compatibility scores for crops against field characteristics. |
| `yield_predictions` | Predictive yield forecasts with confidence intervals. |
| `recommendations` | Actionable agronomic advice (Irrigation, Fertilizer, Pest Control). |
| `notifications` | Role-targeted notifications with read/unread tracking. |
| `audit_logs` | Audit trail of administrative and operational actions. |

---

## 🔧 Running Services Independently

If you prefer to run services in separate terminal sessions:

### Backend Only

**Linux / macOS:**
```bash
./run-backend.sh
# Or specify an alternate port:
./run-backend.sh 8005
```

**Windows:**
```powershell
.\run-backend.ps1
```

### Frontend Only

**Linux / macOS:**
```bash
./run-frontend.sh
# Or specify an alternate port:
./run-frontend.sh 8085
```

**Windows:**
```powershell
.\run-frontend.ps1 -Port 8085
```

---

## 🔌 Backend Minimal APIs & Swagger Spec

Once the backend is running, the interactive Swagger UI is available at:
👉 **[http://localhost:8000/swagger](http://localhost:8000/swagger)**  
Raw OpenAPI JSON: `http://localhost:8000/swagger/v1/swagger.json`

### Key Endpoint Reference:

#### System & Diagnostics
- `GET /api/v1/health` — Verifies backend and database connectivity status.

#### Authentication & Profiles
- `POST /api/v1/auth/token` — Authenticates credentials and returns a Bearer JWT.
- `GET /api/v1/auth/me` *(Authorized)* — Returns authenticated user details and role.

#### Farms & Geospatial
- `GET /api/v1/farms` — Lists registered farms with location points and boundaries.
- `GET /api/v1/farms/{id}` — Retrieves details for a specific farm.
- `GET /api/v1/farms/{id}/fields` — Retrieves parcel field boundaries and soil parameters.

#### Crops & Agronomy
- `GET /api/v1/crops` — Catalog of supported crops with climate parameters.
- `GET /api/v1/crops/{id}` — Crop profile including variety specifications.
- `GET /api/v1/cycles?fieldId={fieldId}` — Active and historical crop production cycles.

#### Weather & Intelligence
- `GET /api/v1/weather/recent` — Recent station readings across regions.
- `GET /api/v1/intelligence/suitability?fieldId={id}` — Multi-variable crop suitability breakdown.
- `GET /api/v1/intelligence/yield-predictions?cycleId={id}` — Yield projection with confidence bands.
- `GET /api/v1/recommendations?fieldId={id}` — Agronomic advisory actions.
- `GET /api/v1/notifications` — Notification queue for alerts and tasks.

---

## 👥 Frontend Features & Role-Based Access Control (RBAC)

The frontend features an interactive, dynamic role switcher in the top navigation bar. Switching roles instantly updates navigation items, permission scopes, and data views without reloading:

| Role | Accessible Views & Capabilities |
| :--- | :--- |
| **🏛️ Super Administrator** | Global system metrics, farm registry, security governance, user directory, system configuration. |
| **🔐 System Administrator** | Infrastructure health, database maintenance, audit logs, user provisioning. |
| **🌾 Agronomist** | Crop catalog authoring, suitability matrix analysis, regional phenology models, recommendations. |
| **👥 Extension Officer** | Farmer onboarding wizard, regional advisory distribution, field inspection logging. |
| **🔍 Field Officer** | Farm ground surveys, soil data collection, field boundary mapping, incident reporting. |
| **📡 Weather Analyst** | Station telemetry analysis, extreme weather alert authoring, rainfall pattern charts. |
| **📋 Farm Manager** | Multi-farm operational dashboards, crop cycle scheduling, input allocation, yield tracking. |
| **🚜 Farmer** | My Farm overview, current field stages, weather forecasts, actionable alerts, recommended tasks. |

### Additional Frontend Features:
- **Global Search (`#search?q=...`)**: Search across registered farms, crops, alerts, and advisories with instant results.
- **Notification Center (`#notifications`)**: Categorized alert center (Critical, Advisory, Task, Recommendation).
- **Responsive Drawer**: Built-in mobile menu drawer with smooth backdrop transitions for tablet and smartphone devices.

---

## 🔑 Default Seed Credentials & Test Accounts

The included `backend/Database/seed.sql` creates pre-configured accounts for testing:

| Username | Email | Role | Default Password |
| :--- | :--- | :--- | :--- |
| `admin` | `admin@ayis.org` | `admin` | `Password123!` |
| `officer_sarah` | `sarah.mwangi@ayis.org` | `agricultural_officer` | `Password123!` |
| `farmer_john` | `john.kamau@farms.ke` | `farmer` | `Password123!` |

*(In production, update these passwords immediately and store production secrets securely).*

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration (`backend/Ayis.Api/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=ayis_db;User=root;Password=your_password;SslMode=Preferred;"
  },
  "Jwt": {
    "Issuer": "Ayis.Api",
    "Audience": "Ayis.Frontend",
    "Key": "YOUR_STRONG_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG",
    "ExpiryMinutes": 1440
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000"
    ]
  }
}
```

---

## 🛡️ Port Management & Automatic Fallback

To prevent startup crashes caused by `Address already in use` errors (e.g. from terminated sessions or background daemons), the AYIS scripts include intelligent port safety:

1. **Pre-flight Port Cleaning**: `run.sh` proactively frees orphaned listeners on the chosen backend and frontend ports before starting new processes.
2. **Dynamic Port Scan**: `run-frontend.sh`, `run-frontend.ps1`, and `run-backend.sh` inspect if the desired port is open. If occupied, they automatically select the next available port (e.g., `8081`, `8082`) and update the runtime URLs on the fly.
3. **Exit Traps**: Pressing `Ctrl+C` cleanly tears down both the backend background job and the frontend web server.

---

## 🛠️ Troubleshooting

### 1. MySQL Connection Failed
**Symptom:** Backend logs show `MySqlException: Unable to connect to any of the specified MySQL hosts.`  
**Solution:**
- Verify MySQL service is active: `sudo systemctl status mysql` (Linux) or check Services app (Windows).
- Ensure credentials in `backend/Ayis.Api/appsettings.json` match your MySQL root or user credentials.

### 2. Address Already in Use (`Errno 98` / `SocketException 98`)
**Symptom:** `Failed to bind to address http://...: Address already in use.`  
**Solution:**
- Run `./run.sh` — it automatically kills lingering processes from previous crashed sessions.
- Or manually terminate listeners:
  ```bash
  fuser -k 8000/tcp 8080/tcp
  ```

### 3. Missing .NET SDK
**Symptom:** `dotnet: command not found`  
**Solution:**
- Install .NET 8.0 SDK from Microsoft's official portal: [https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0).

---

## 📄 License & Contribution

This project is licensed under the MIT License. Contributions, issue submissions, and feature proposals are welcome via pull requests and issue tickets.
