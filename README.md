# Agricultural Yield Intelligence System (AYIS)

## Clean Architecture — C# .NET Minimal APIs + MySQL 8 + Vanilla Web

**Status:** Fully migrated & configured for native execution.
**Stack:**
- **Frontend:** Strictly Vanilla HTML5, CSS3, ES6 JavaScript (Zero React / Next.js)
- **Backend:** C# ASP.NET Core Minimal APIs (.NET 8.0) + Dapper
- **Database:** Native MySQL 8 (Community Server / Workbench) with Spatial types (`POINT`, `POLYGON`, SRID 4326)

---

## Quick Start (Run Both at the Same Time)

To start both the **C# Backend** and **Vanilla Frontend** simultaneously with a single command:

```powershell
.\run.ps1
```

### What `.\run.ps1` does:
1. **Launches the C# Backend** in its own dedicated terminal window (`http://localhost:8000`) so you can watch live request and SQL logs.
2. **Serves the Vanilla Frontend** on `http://localhost:8080`.
3. **Automatically opens your browser** directly to `http://localhost:8080`.

---

## Individual Scripts (If needed)

- **Database Setup:** 
  ```powershell
  .\setup-database.ps1 -MySqlUser "root" -MySqlPassword "your_password"
  ```
- **Backend Only:**
  ```powershell
  .\run-backend.ps1
  ```
- **Frontend Only:**
  ```powershell
  .\run-frontend.ps1
  ```
