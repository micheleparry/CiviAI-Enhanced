#!/bin/bash

# Oregon MCP Integration Setup Script for CiviAI Enhanced
# This script sets up the Oregon MCP integration with all necessary components

set -e

echo "🚀 Setting up Oregon MCP Integration for CiviAI Enhanced..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the CiviAI Enhanced project root directory"
    exit 1
fi

print_status "Starting Oregon MCP integration setup..."

# Step 1: Install dependencies
print_status "Installing Node.js dependencies..."
npm install

print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Step 2: Create necessary directories
print_status "Creating Oregon planning directories..."
mkdir -p oregon-planning/{statewide-goals,administrative-rules,local-plans,applications,compliance-reports}
mkdir -p oregon-planning/statewide-goals/{goal-1,goal-2,goal-3,goal-4,goal-5,goal-6,goal-7,goal-8,goal-9,goal-10,goal-11,goal-12,goal-13,goal-14,goal-15,goal-16,goal-17,goal-18,goal-19}
mkdir -p oregon-planning/administrative-rules/{oar-660,oar-661,oar-662,oar-663,recent-updates}
mkdir -p oregon-planning/local-plans/{comprehensive-plans,zoning-ordinances,amendments}
mkdir -p oregon-planning/applications/{pending,approved,denied}
mkdir -p oregon-planning/compliance-reports/{city-reports,county-reports}
mkdir -p logs

print_success "Directory structure created"

# Step 3: Set up environment file
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp env.oregon.example .env
    print_warning "Please edit .env file with your actual configuration values"
else
    print_status ".env file already exists"
fi

# Step 4: Database setup
print_status "Setting up PostgreSQL database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    print_status "For Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    print_status "For macOS: brew install postgresql"
    print_status "For Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if database exists
DB_NAME="civiai_enhanced"
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_status "Database $DB_NAME already exists"
else
    print_status "Creating database $DB_NAME..."
    createdb $DB_NAME
    print_success "Database created"
fi

# Step 5: Run database migrations
print_status "Running database migrations..."
if [ -f "src/server/mcp/oregon-database.sql" ]; then
    psql -d $DB_NAME -f src/server/mcp/oregon-database.sql
    print_success "Database schema created"
else
    print_error "Database schema file not found"
    exit 1
fi

# Step 6: Create sample data
print_status "Creating sample Oregon planning data..."

# Create a sample application
cat > sample-application.json << EOF
{
  "applicationNumber": "OR-2024-001",
  "applicantName": "Sample Development LLC",
  "projectType": "Residential Subdivision",
  "jurisdiction": "Portland",
  "submissionDate": "2024-01-15",
  "status": "pending"
}
EOF

print_success "Sample data created"

# Step 7: Test the integration
print_status "Testing Oregon MCP integration..."

# Test database connection
if psql -d $DB_NAME -c "SELECT COUNT(*) FROM oregon_planning_goals;" > /dev/null 2>&1; then
    print_success "Database connection test passed"
else
    print_error "Database connection test failed"
    exit 1
fi

# Test file system
if [ -d "oregon-planning" ] && [ -d "oregon-planning/statewide-goals" ]; then
    print_success "File system test passed"
else
    print_error "File system test failed"
    exit 1
fi

# Step 8: Build the application
print_status "Building CiviAI Enhanced with Oregon MCP..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 9: Create startup script
print_status "Creating startup script..."

cat > start-oregon-mcp.sh << 'EOF'
#!/bin/bash

# Oregon MCP Startup Script
echo "Starting Oregon MCP Integration..."

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start the application
npm run dev
EOF

chmod +x start-oregon-mcp.sh
print_success "Startup script created"

# Step 10: Create health check script
print_status "Creating health check script..."

cat > health-check-oregon.sh << 'EOF'
#!/bin/bash

# Oregon MCP Health Check Script
echo "Checking Oregon MCP Integration Health..."

# Check database
if psql -d civiai_enhanced -c "SELECT COUNT(*) FROM oregon_planning_goals;" > /dev/null 2>&1; then
    echo "✅ Database: OK"
else
    echo "❌ Database: FAILED"
fi

# Check file system
if [ -d "oregon-planning" ] && [ -d "oregon-planning/statewide-goals" ]; then
    echo "✅ File System: OK"
else
    echo "❌ File System: FAILED"
fi

# Check API endpoint (if server is running)
if curl -s http://localhost:5000/api/oregon/health > /dev/null 2>&1; then
    echo "✅ API: OK"
else
    echo "⚠️  API: Not responding (server may not be running)"
fi

echo "Health check completed"
EOF

chmod +x health-check-oregon.sh
print_success "Health check script created"

# Step 11: Create documentation
print_status "Creating documentation..."

cat > OREGON_MCP_README.md << 'EOF'
# Oregon MCP Integration for CiviAI Enhanced

## Overview
This integration provides comprehensive Oregon land planning and development management capabilities through Model Context Protocol (MCP) tools.

## Features
- Real-time monitoring of Oregon DLCD updates
- Automated compliance analysis against all 19 statewide planning goals
- Document management for planning applications
- Regulatory update notifications
- Automated deadline tracking

## Quick Start

1. **Start the application:**
   ```bash
   ./start-oregon-mcp.sh
   ```

2. **Check health status:**
   ```bash
   ./health-check-oregon.sh
   ```

3. **Access Oregon MCP Dashboard:**
   Navigate to `/oregon-mcp` in your browser

## API Endpoints

- `GET /api/oregon/goals` - Get all statewide planning goals
- `GET /api/oregon/applications` - Get planning applications
- `POST /api/oregon/applications` - Create new application
- `POST /api/oregon/applications/:id/analyze` - Analyze application compliance
- `GET /api/oregon/updates` - Get regulatory updates
- `POST /api/oregon/monitor` - Trigger manual monitoring
- `GET /api/oregon/notifications` - Get notifications

## Configuration

Edit the `.env` file to configure:
- Database connection
- Monitoring schedules
- Notification settings
- Security settings

## Monitoring Schedules

- **DLCD Updates:** Daily at 9 AM
- **Administrative Rules:** Weekly on Monday at 10 AM
- **Statute Updates:** Monthly on 1st at 11 AM
- **Local Amendments:** Daily at 8 AM
- **Deadline Checks:** Hourly

## Troubleshooting

1. **Database Connection Issues:**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Run `./health-check-oregon.sh`

2. **Monitoring Not Working:**
   - Check timezone settings
   - Verify cron jobs are running
   - Check logs in `./logs/oregon-mcp.log`

3. **API Errors:**
   - Ensure server is running
   - Check environment variables
   - Verify database schema

## Support

For issues or questions, check the main CiviAI Enhanced documentation or create an issue in the project repository.
EOF

print_success "Documentation created"

# Final summary
echo ""
print_success "Oregon MCP Integration setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual configuration values"
echo "2. Start the application: ./start-oregon-mcp.sh"
echo "3. Check health status: ./health-check-oregon.sh"
echo "4. Access the Oregon MCP dashboard in your browser"
echo ""
echo "Documentation: OREGON_MCP_README.md"
echo ""

print_status "Setup complete! 🎉" 