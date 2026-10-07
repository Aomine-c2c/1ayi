# AYIS — Universal Cross-Platform Setup & Run Guide
**Agricultural Yield Intelligence System (AYIS)**  
*Run seamlessly on Windows, Linux (Ubuntu/Debian, Fedora, Arch), and macOS.*

---

## 🚀 1. Quick Start (Zero-Configuration)

Clone the repository and run the unified runner for your operating system:

### 🐧 Linux & 🍏 macOS
```bash
chmod +x run.sh run-backend.sh run-frontend.sh
./run.sh
```

### 🪟 Windows (PowerShell)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\run.ps1
```

---

## ⚡ What the Unified Runners Do Automatically

When you execute `./run.sh` or `.\run.ps1`, the runner executes the following sequence:

1. **Prerequisite & Dependency Audit**:
   - Inspects whether **.NET 8 SDK**, **MySQL 8+**, and **Python 3 / Node** are available.
   - If missing, it invokes your operating system package manager silently:
     - **Windows**: Uses `winget` (or `choco`).
     - **macOS**: Uses Homebrew (`brew`).
     - **Linux**: Uses `apt-get` (Debian/Ubuntu), `dnf` (Fedora/RHEL), or `pacman` (Arch).
2. **Database Auto-Detection & Initialization**:
   - Checks if MySQL is running locally on port `3306`.
   - Probes credentials from `.env` or development defaults.
   - If `ayis_db` is unseeded or missing, it automatically loads `backend/Database/schema.sql` and `seed.sql`.
   - *If MySQL is not active*, the backend automatically falls back to an embedded SQLite dev database (`ayis.db`).
3. **Port Safety & Conflict Auto-Resolution**:
   - Frees any orphaned listeners on ports `5050` (backend) or `8080` (frontend).
   - If requested ports are held by other system processes, it dynamically increments to the next available port.
4. **Service Launch & Multi-PC Display**:
   - Launches the C# ASP.NET Core Minimal API on port `5050`.
   - Serves the Vanilla web client on port `8080`.
   - Automatically outputs your local IP address so any PC, phone, or tablet on your Wi-Fi/LAN can connect.

---

## 📦 2. Manual Dependency Installation (Reference)

If you prefer installing prerequisites manually or work in an air-gapped environment:

### Windows
1. **.NET 8 SDK**:
   ```powershell
   winget install --id Microsoft.DotNet.SDK.8 -e
   # Or download MSI: https://dotnet.microsoft.com/download/dotnet/8.0
   ```
2. **MySQL 8 Community Server**:
   ```powershell
   winget install --id Oracle.MySQL -e
   ```
3. **Python 3**:
   ```powershell
   winget install --id Python.Python.3.11 -e
   ```

### macOS (Homebrew)
```bash
# 1. Install Homebrew (if not present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install dependencies
brew install --cask dotnet-sdk
brew install mysql python3
brew services start mysql
```

### Linux (Ubuntu / Debian)
```bash
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0 mysql-server python3
sudo systemctl enable --now mysql
```

### Linux (Fedora / RHEL)
```bash
sudo dnf install -y dotnet-sdk-8.0 community-mysql-server python3
sudo systemctl enable --now mysqld
```

### Linux (Arch Linux)
```bash
sudo pacman -Syu --noconfirm dotnet-sdk-8.0 mariadb python
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
sudo systemctl enable --now mariadb
```

---

## 🌐 3. Standardized Ports & Endpoints

| Component | Default Port | URL / Spec | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `8080` | `http://localhost:8080` | Zero-build Vanilla HTML5/CSS3/ES6 web app |
| **Backend API** | `5050` | `http://localhost:5050/api/v1` | C# ASP.NET Core 8 Minimal API |
| **Swagger Explorer** | `5050` | `http://localhost:5050/swagger` | Interactive OpenAPI documentation & testing |
| **MySQL Database** | `3306` | `127.0.0.1:3306` | Database schema `ayis_db` |

---

## 📱 4. Multi-PC / Mobile Local Network Access

Once started on a host computer, the runner displays your LAN IP address:

```text
==========================================================
    AYIS is running and ready for MULTI-PC OPERATION!     
==========================================================
 Access locally on this machine:
   -> Frontend: http://localhost:8080
   -> Backend:  http://localhost:5050

 Access from any other PC / laptop / tablet on the same LAN:
   -> Frontend: http://192.168.1.104:8080
   -> Backend:  http://192.168.1.104:5050/api/v1
   -> Swagger:  http://192.168.1.104:5050/swagger
==========================================================
```

1. Connect client devices (iPhone, iPad, Android phone, laptop) to the same Wi-Fi network.
2. Open the browser on the client device and go to `http://<HOST_IP>:8080` (e.g. `http://192.168.1.104:8080`).
3. The frontend automatically detects the central host API.

---

## 🔧 5. Troubleshooting & FAQ

### Issue: PowerShell execution policy prevents running `.ps1`
**Solution**: Run PowerShell as Administrator or bypass for current process:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Issue: `dotnet: command not found` after auto-installation
**Solution**: Restart your terminal window to reload your system `$PATH` / `%PATH%`.
- On Linux/macOS, .NET installs to `$HOME/.dotnet` or `/usr/share/dotnet`.
- On Windows, .NET installs to `C:\Program Files\dotnet`.

### Issue: MySQL Authentication Failure
**Symptom**: `Access denied for user 'root'@'localhost'`  
**Solution**:
1. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Set your MySQL credentials in `.env`:
   ```ini
   DB_USER=root
   DB_PASSWORD=your_actual_password
   ```
3. When running `run.sh` or `run.ps1`, you will be prompted if authentication fails. Alternatively, leave credentials as default and AYIS will use the SQLite development database.

### Issue: Port 5050 or 8080 already in use
**Solution**: Both `run.sh` and `run.ps1` automatically terminate orphaned listeners. If another process is holding the port, pass custom ports:
```bash
./run.sh 8085 5055
```
```powershell
.\run.ps1 -FrontendPort 8085 -BackendPort 5055
```
