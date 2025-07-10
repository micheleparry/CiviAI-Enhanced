# Oregon MCP Integration Setup Guide for Windows

## Prerequisites Installation

### 1. Install Node.js and npm

**Option A: Download from Official Website (Recommended)**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS (Long Term Support)** version for Windows
3. Run the installer and follow the setup wizard
4. Verify installation by opening a new PowerShell window and running:
   ```powershell
   node --version
   npm --version
   ```

**Option B: Using Chocolatey (if you have it installed)**
```powershell
choco install nodejs
```

**Option C: Using Winget (Windows Package Manager)**
```powershell
winget install OpenJS.NodeJS
```

### 2. Install PostgreSQL

**Option A: Download from Official Website**
1. Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Download the PostgreSQL installer for Windows
3. Run the installer and follow the setup wizard
4. Remember the password you set for the `postgres` user
5. Add PostgreSQL to your PATH during installation

**Option B: Using Chocolatey**
```powershell
choco install postgresql
```

**Option C: Using Winget**
```powershell
winget install PostgreSQL.PostgreSQL
```

### 3. Install Python (if not already installed)

**Check if Python is installed:**
```powershell
python --version
```

**If not installed, download from:**
1. Go to [python.org/downloads](https://python.org/downloads)
2. Download the latest Python version for Windows
3. Run the installer and check "Add Python to PATH"

## Oregon MCP Integration Setup

### Step 1: Verify Prerequisites
After installing Node.js, PostgreSQL, and Python, open a new PowerShell window and run:

```powershell
# Check Node.js
node --version
npm --version

# Check PostgreSQL
psql --version

# Check Python
python --version
```

### Step 2: Navigate to Project Directory
```powershell
cd "C:\Users\mparry\Downloads\CiviAI_Enhanced_Complete_Package"
```

### Step 3: Install Dependencies
```powershell
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Set Up Environment Variables
1. Copy the environment template:
   ```powershell
   copy env.oregon.example .env
   ```

2. Edit the `.env` file with your actual values:
   ```powershell
   notepad .env
   ```

   **Required changes:**
   ```env
   OREGON_DB_HOST=localhost
   OREGON_DB_PORT=5432
   OREGON_DB_NAME=civiai_enhanced
   OREGON_DB_USER=postgres
   OREGON_DB_PASSWORD=your_postgres_password_here
   ```

### Step 5: Create Database and Schema
```powershell
# Create database
createdb civiai_enhanced

# Run database schema
psql -d civiai_enhanced -f src/server/mcp/oregon-database.sql
```

### Step 6: Create Directory Structure
```powershell
# Create Oregon planning directories
mkdir oregon-planning
mkdir oregon-planning\statewide-goals
mkdir oregon-planning\administrative-rules
mkdir oregon-planning\local-plans
mkdir oregon-planning\applications
mkdir oregon-planning\compliance-reports
mkdir logs
```

### Step 7: Build the Application
```powershell
npm run build
```

### Step 8: Start the Application
```powershell
npm run dev
```

## Testing the Integration

### 1. Health Check
Once the server is running, test the Oregon MCP endpoints:

```powershell
# Test health endpoint
curl http://localhost:5000/api/oregon/health

# Test planning goals
curl http://localhost:5000/api/oregon/goals

# Test jurisdictions
curl http://localhost:5000/api/oregon/jurisdictions
```

### 2. Manual Monitoring Test
```powershell
# Trigger manual DLCD monitoring
curl -X POST http://localhost:5000/api/oregon/monitor
```

### 3. Access the Dashboard
Open your browser and navigate to:
- **Main Dashboard:** http://localhost:3000
- **Oregon MCP API:** http://localhost:5000/api/oregon

## Troubleshooting

### Common Issues:

**1. "npm is not recognized"**
- Restart PowerShell after installing Node.js
- Check if Node.js is in your PATH

**2. "psql is not recognized"**
- Add PostgreSQL to your PATH
- Restart PowerShell after installation

**3. Database connection errors**
- Ensure PostgreSQL service is running
- Check credentials in `.env` file
- Verify database exists: `psql -l`

**4. Port already in use**
- Change ports in `.env` file
- Kill existing processes: `netstat -ano | findstr :5000`

**5. VPN Connection Issues**
- Ensure TunnelBear is connected
- Check if you can access Oregon.gov in browser
- Verify IP address shows as VPN IP

## Quick Commands Reference

```powershell
# Start the application
npm run dev

# Build for production
npm run build

# Check database
psql -d civiai_enhanced -c "SELECT COUNT(*) FROM oregon_planning_goals;"

# View logs
Get-Content logs\oregon-mcp.log -Tail 50

# Test API endpoints
Invoke-RestMethod -Uri "http://localhost:5000/api/oregon/health"
```

## Next Steps After Setup

1. **Configure monitoring schedules** in `.env`
2. **Set up notifications** for regulatory updates
3. **Add sample applications** for testing
4. **Customize compliance thresholds**
5. **Set up backup procedures**

## Support

If you encounter issues:
1. Check the logs in `logs/oregon-mcp.log`
2. Verify all prerequisites are installed
3. Ensure VPN is connected
4. Check database connectivity
5. Review the main README.md for additional help

Your VPN connection (IP: 208.115.233.120) is active and will provide secure access to Oregon government resources. 