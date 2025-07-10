# Oregon MCP Implementation Guide for CiviAI Enhanced

## Quick Start Setup

### 1. Web Search MCP Setup

**Installation**:
```bash
npm install @modelcontextprotocol/server-web-search
```

**Configuration for Oregon DLCD**:
```typescript
// mcp-config.ts
export const oregonWebSearchConfig = {
  primarySources: [
    'https://www.oregon.gov/lcd/pages/index.aspx',
    'https://www.oregon.gov/lcd/Pages/laws-rules.aspx',
    'https://www.oregon.gov/lcd/Pages/planning-goals.aspx',
    'https://www.oregon.gov/lcd/Pages/comprehensive-planning.aspx'
  ],
  monitoringSchedule: {
    dlcdNews: '0 9 * * *',        // Daily at 9 AM
    ruleUpdates: '0 10 * * 1',    // Weekly on Monday at 10 AM
    statuteChanges: '0 11 1 * *', // Monthly on 1st at 11 AM
    localAmendments: '0 8 * * *'  // Daily at 8 AM
  },
  keywords: [
    'statewide planning goals',
    'OAR Chapter 660',
    'ORS Chapter 197',
    'comprehensive plan amendment',
    'PAPA',
    'land use planning',
    'zoning ordinance',
    'development code'
  ]
};
```

### 2. File System MCP Setup

**Installation**:
```bash
npm install @modelcontextprotocol/server-filesystem
```

**Oregon Planning Directory Structure**:
```bash
mkdir -p oregon-planning/{statewide-goals,administrative-rules,local-plans,applications,compliance-reports}
mkdir -p oregon-planning/statewide-goals/{goal-1,goal-2,goal-3,goal-4,goal-5,goal-6,goal-7,goal-8,goal-9,goal-10,goal-11,goal-12,goal-13,goal-14,goal-15,goal-16,goal-17,goal-18,goal-19}
mkdir -p oregon-planning/administrative-rules/{oar-660,oar-661,oar-662,oar-663,recent-updates}
mkdir -p oregon-planning/local-plans/{comprehensive-plans,zoning-ordinances,amendments}
mkdir -p oregon-planning/applications/{pending,approved,denied}
mkdir -p oregon-planning/compliance-reports/{city-reports,county-reports}
```

**File System Configuration**:
```typescript
// filesystem-config.ts
export const oregonFileSystemConfig = {
  rootPath: './oregon-planning',
  allowedExtensions: ['.pdf', '.docx', '.doc', '.txt', '.json', '.xml'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  backupSchedule: '0 2 * * *',   // Daily at 2 AM
  retentionPolicy: {
    applications: '7 years',
    complianceReports: '10 years',
    planningDocuments: 'permanent'
  }
};
```

### 3. PostgreSQL MCP Setup

**Installation**:
```bash
npm install @modelcontextprotocol/server-postgres
```

**Database Setup**:
```sql
-- Create Oregon Planning Database
CREATE DATABASE oregon_planning_db;
\c oregon_planning_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create Oregon-specific tables
CREATE TABLE oregon_jurisdictions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'city', 'county', 'special_district'
  population INTEGER,
  planning_department_contact VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE oregon_planning_goals (
  id SERIAL PRIMARY KEY,
  goal_number INTEGER UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  last_updated DATE,
  status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE oregon_applications (
  id SERIAL PRIMARY KEY,
  application_number VARCHAR(50) UNIQUE NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  jurisdiction_id INTEGER REFERENCES oregon_jurisdictions(id),
  submission_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  compliance_score DECIMAL(5,2),
  missing_items TEXT[],
  ai_analysis_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE goal_compliance (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES oregon_applications(id),
  goal_number INTEGER REFERENCES oregon_planning_goals(goal_number),
  compliance_status VARCHAR(50),
  compliance_notes TEXT,
  reviewer_id INTEGER,
  review_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE regulatory_updates (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  update_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  effective_date DATE,
  impact_level VARCHAR(20),
  affected_jurisdictions INTEGER[],
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_oregon_applications_jurisdiction ON oregon_applications(jurisdiction_id);
CREATE INDEX idx_oregon_applications_status ON oregon_applications(status);
CREATE INDEX idx_goal_compliance_application ON goal_compliance(application_id);
CREATE INDEX idx_regulatory_updates_effective_date ON regulatory_updates(effective_date);
```

**PostgreSQL Configuration**:
```typescript
// postgres-config.ts
export const oregonPostgresConfig = {
  host: process.env.OREGON_DB_HOST || 'localhost',
  port: parseInt(process.env.OREGON_DB_PORT || '5432'),
  database: 'oregon_planning_db',
  user: process.env.OREGON_DB_USER,
  password: process.env.OREGON_DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

### 4. GitHub MCP Setup

**Installation**:
```bash
npm install @modelcontextprotocol/server-github
```

**Repository Setup**:
```bash
# Create Oregon Planning Repository
git init oregon-planning-repo
cd oregon-planning-repo

# Create initial structure
mkdir -p {statewide-goals,administrative-rules,local-plans,applications,compliance-reports,templates}

# Create README
cat > README.md << EOF
# Oregon Planning Repository

This repository contains planning documents, applications, and compliance reports for Oregon land use planning.

## Structure
- statewide-goals/: Oregon's 19 statewide planning goals
- administrative-rules/: OAR chapters and updates
- local-plans/: Comprehensive plans and zoning ordinances
- applications/: Planning applications and reviews
- compliance-reports/: City and county reporting
- templates/: Standard templates and forms

## Updates
This repository is automatically updated via MCP integration with Oregon DLCD.
EOF

git add .
git commit -m "Initial Oregon planning repository structure"
```

**GitHub Configuration**:
```typescript
// github-config.ts
export const oregonGitHubConfig = {
  owner: process.env.GITHUB_OWNER,
  repo: 'oregon-planning-repo',
  token: process.env.GITHUB_TOKEN,
  branch: 'main',
  autoCommit: true,
  commitMessage: 'Auto-update: Oregon planning documents',
  fileTypes: ['.pdf', '.docx', '.json', '.md', '.txt']
};
```

## Integration Implementation

### 1. Oregon Planning Service

```typescript
// services/oregon-planning.service.ts
import { WebSearchMCP } from '@modelcontextprotocol/server-web-search';
import { FileSystemMCP } from '@modelcontextprotocol/server-filesystem';
import { PostgresMCP } from '@modelcontextprotocol/server-postgres';
import { GitHubMCP } from '@modelcontextprotocol/server-github';

export class OregonPlanningService {
  private webSearch: WebSearchMCP;
  private fileSystem: FileSystemMCP;
  private postgres: PostgresMCP;
  private github: GitHubMCP;

  constructor() {
    this.webSearch = new WebSearchMCP(oregonWebSearchConfig);
    this.fileSystem = new FileSystemMCP(oregonFileSystemConfig);
    this.postgres = new PostgresMCP(oregonPostgresConfig);
    this.github = new GitHubMCP(oregonGitHubConfig);
  }

  async monitorDLCDUpdates(): Promise<void> {
    try {
      // Monitor DLCD website for updates
      const updates = await this.webSearch.search({
        query: 'Oregon DLCD planning updates',
        sources: oregonWebSearchConfig.primarySources
      });

      // Process and store updates
      for (const update of updates) {
        await this.processRegulatoryUpdate(update);
      }
    } catch (error) {
      console.error('Error monitoring DLCD updates:', error);
    }
  }

  async processRegulatoryUpdate(update: any): Promise<void> {
    // Store in database
    await this.postgres.query(`
      INSERT INTO regulatory_updates (source, update_type, title, description, effective_date, impact_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [update.source, update.type, update.title, update.description, update.effectiveDate, update.impactLevel]);

    // Store document in file system
    const filePath = `oregon-planning/administrative-rules/recent-updates/${Date.now()}-${update.title}.json`;
    await this.fileSystem.writeFile(filePath, JSON.stringify(update, null, 2));

    // Commit to GitHub
    await this.github.createOrUpdateFile({
      path: filePath,
      content: JSON.stringify(update, null, 2),
      message: `Update: ${update.title}`
    });
  }

  async analyzeApplicationCompliance(applicationId: number): Promise<any> {
    // Get application details
    const application = await this.postgres.query(
      'SELECT * FROM oregon_applications WHERE id = $1',
      [applicationId]
    );

    // Analyze against statewide goals
    const goals = await this.postgres.query('SELECT * FROM oregon_planning_goals WHERE status = $1', ['active']);
    
    const complianceResults = [];
    for (const goal of goals) {
      const compliance = await this.analyzeGoalCompliance(application, goal);
      complianceResults.push(compliance);
    }

    // Update application with compliance score
    const overallScore = this.calculateOverallCompliance(complianceResults);
    await this.postgres.query(
      'UPDATE oregon_applications SET compliance_score = $1, ai_analysis_result = $2 WHERE id = $3',
      [overallScore, JSON.stringify(complianceResults), applicationId]
    );

    return {
      applicationId,
      overallScore,
      goalCompliance: complianceResults
    };
  }

  private async analyzeGoalCompliance(application: any, goal: any): Promise<any> {
    // AI-powered analysis of goal compliance
    // This would integrate with your existing document analyzer
    return {
      goalNumber: goal.goal_number,
      goalTitle: goal.title,
      complianceStatus: 'compliant', // or 'non-compliant', 'needs-review'
      complianceNotes: 'AI analysis notes...',
      confidence: 0.85
    };
  }

  private calculateOverallCompliance(complianceResults: any[]): number {
    const compliantGoals = complianceResults.filter(r => r.complianceStatus === 'compliant').length;
    return (compliantGoals / complianceResults.length) * 100;
  }
}
```

### 2. Automated Monitoring Setup

```typescript
// cron/oregon-monitoring.cron.ts
import cron from 'node-cron';
import { OregonPlanningService } from '../services/oregon-planning.service';

const oregonService = new OregonPlanningService();

// Daily DLCD monitoring
cron.schedule('0 9 * * *', async () => {
  console.log('Starting daily DLCD monitoring...');
  await oregonService.monitorDLCDUpdates();
});

// Weekly rule updates check
cron.schedule('0 10 * * 1', async () => {
  console.log('Starting weekly administrative rules check...');
  await oregonService.monitorAdministrativeRules();
});

// Monthly statute updates
cron.schedule('0 11 1 * *', async () => {
  console.log('Starting monthly statute updates check...');
  await oregonService.monitorStatuteUpdates();
});
```

### 3. Environment Variables

```bash
# .env
# Oregon Database
OREGON_DB_HOST=localhost
OREGON_DB_PORT=5432
OREGON_DB_USER=oregon_planning_user
OREGON_DB_PASSWORD=secure_password_here

# GitHub Integration
GITHUB_OWNER=your-organization
GITHUB_TOKEN=your_github_token_here

# Web Search API
WEB_SEARCH_API_KEY=your_api_key_here

# File System
OREGON_PLANNING_ROOT=./oregon-planning
```

## Testing the Integration

### 1. Test Web Search MCP

```typescript
// tests/web-search.test.ts
import { OregonPlanningService } from '../services/oregon-planning.service';

describe('Oregon Planning Service - Web Search', () => {
  let service: OregonPlanningService;

  beforeEach(() => {
    service = new OregonPlanningService();
  });

  test('should monitor DLCD updates', async () => {
    const result = await service.monitorDLCDUpdates();
    expect(result).toBeDefined();
  });
});
```

### 2. Test Database Integration

```typescript
// tests/database.test.ts
import { OregonPlanningService } from '../services/oregon-planning.service';

describe('Oregon Planning Service - Database', () => {
  let service: OregonPlanningService;

  beforeEach(() => {
    service = new OregonPlanningService();
  });

  test('should analyze application compliance', async () => {
    const result = await service.analyzeApplicationCompliance(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
```

## Deployment Checklist

- [ ] Set up PostgreSQL database with Oregon-specific schema
- [ ] Configure Web Search MCP for DLCD monitoring
- [ ] Set up File System MCP with Oregon planning directory structure
- [ ] Configure GitHub MCP for version control
- [ ] Set environment variables for all MCP connections
- [ ] Test automated monitoring schedules
- [ ] Validate compliance analysis accuracy
- [ ] Set up backup and retention policies
- [ ] Configure security and access controls
- [ ] Test notification system for regulatory updates

## Next Steps

1. **Phase 1**: Implement core MCP integrations
2. **Phase 2**: Add Oregon-specific compliance logic
3. **Phase 3**: Integrate with existing CiviAI Enhanced features
4. **Phase 4**: Deploy and monitor in production

This implementation guide provides a comprehensive foundation for integrating MCP tools with Oregon's land planning requirements, ensuring real-time updates and compliance tracking for your CiviAI Enhanced platform. 