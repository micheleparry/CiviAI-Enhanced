import { Pool } from 'pg';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

// Types for Oregon Planning
export interface OregonPlanningUpdate {
  source: 'DLCD' | 'ORS' | 'OAR' | 'Local Government';
  type: 'Planning Goal' | 'Administrative Rule' | 'Statute' | 'Plan Amendment' | 'Reporting';
  title: string;
  description: string;
  effectiveDate: Date;
  impactLevel: 'High' | 'Medium' | 'Low';
  affectedJurisdictions: string[];
  complianceDeadline?: Date;
  url?: string;
}

export interface OregonApplication {
  id?: number;
  applicationNumber: string;
  applicantName: string;
  projectType: string;
  jurisdiction: string;
  submissionDate: Date;
  status: 'pending' | 'approved' | 'denied' | 'under_review';
  complianceScore?: number;
  missingItems?: string[];
  aiAnalysisResult?: any;
  documents?: string[];
}

export interface GoalCompliance {
  goalNumber: number;
  goalTitle: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'needs-review';
  complianceNotes: string;
  confidence: number;
}

export interface OregonPlanningNotification {
  type: 'regulatory_update' | 'deadline_reminder' | 'compliance_alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedUsers: string[];
  actionRequired: boolean;
  deadline?: Date;
}

// Configuration
const OREGON_CONFIG = {
  dlcdBaseUrl: 'https://www.oregon.gov/lcd',
  primarySources: [
    'https://www.oregon.gov/lcd/pages/index.aspx',
    'https://www.oregon.gov/lcd/Pages/laws-rules.aspx',
    'https://www.oregon.gov/lcd/Pages/planning-goals.aspx',
    'https://www.oregon.gov/lcd/Pages/comprehensive-planning.aspx'
  ],
  keywords: [
    'statewide planning goals',
    'OAR Chapter 660',
    'ORS Chapter 197',
    'comprehensive plan amendment',
    'PAPA',
    'land use planning',
    'zoning ordinance',
    'development code'
  ],
  fileSystemRoot: './oregon-planning',
  monitoringSchedule: {
    dlcdNews: '0 9 * * *',        // Daily at 9 AM
    ruleUpdates: '0 10 * * 1',    // Weekly on Monday at 10 AM
    statuteChanges: '0 11 1 * *', // Monthly on 1st at 11 AM
    localAmendments: '0 8 * * *'  // Daily at 8 AM
  }
};

export class OregonPlanningService {
  private db: Pool;
  private lastUpdateHash: string = '';

  constructor() {
    // Initialize database connection
    this.db = new Pool({
      host: process.env.OREGON_DB_HOST || 'localhost',
      port: parseInt(process.env.OREGON_DB_PORT || '5432'),
      database: process.env.OREGON_DB_NAME || 'civiai_enhanced',
      user: process.env.OREGON_DB_USER || 'postgres',
      password: process.env.OREGON_DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production'
    });

    this.initializeFileSystem();
  }

  private async initializeFileSystem(): Promise<void> {
    try {
      const directories = [
        'statewide-goals',
        'administrative-rules',
        'local-plans',
        'applications',
        'compliance-reports',
        'statewide-goals/goal-1',
        'statewide-goals/goal-2',
        'statewide-goals/goal-3',
        'statewide-goals/goal-4',
        'statewide-goals/goal-5',
        'statewide-goals/goal-6',
        'statewide-goals/goal-7',
        'statewide-goals/goal-8',
        'statewide-goals/goal-9',
        'statewide-goals/goal-10',
        'statewide-goals/goal-11',
        'statewide-goals/goal-12',
        'statewide-goals/goal-13',
        'statewide-goals/goal-14',
        'statewide-goals/goal-15',
        'statewide-goals/goal-16',
        'statewide-goals/goal-17',
        'statewide-goals/goal-18',
        'statewide-goals/goal-19',
        'administrative-rules/oar-660',
        'administrative-rules/oar-661',
        'administrative-rules/oar-662',
        'administrative-rules/oar-663',
        'administrative-rules/recent-updates',
        'local-plans/comprehensive-plans',
        'local-plans/zoning-ordinances',
        'local-plans/amendments',
        'applications/pending',
        'applications/approved',
        'applications/denied',
        'compliance-reports/city-reports',
        'compliance-reports/county-reports'
      ];

      for (const dir of directories) {
        const fullPath = path.join(OREGON_CONFIG.fileSystemRoot, dir);
        try {
          await fs.mkdir(fullPath, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }
      }
    } catch (error) {
      console.error('Error initializing file system:', error);
    }
  }

  // Web Search MCP - Monitor DLCD Updates
  async monitorDLCDUpdates(): Promise<OregonPlanningUpdate[]> {
    try {
      const updates: OregonPlanningUpdate[] = [];
      
      for (const source of OREGON_CONFIG.primarySources) {
        try {
          const response = await axios.get(source, {
            timeout: 10000,
            headers: {
              'User-Agent': 'CiviAI-Enhanced/1.0 (Oregon Planning Monitor)'
            }
          });

          const content = response.data;
          const currentHash = createHash('md5').update(content).digest('hex');

          // Check if content has changed
          if (currentHash !== this.lastUpdateHash) {
            const detectedUpdates = this.parseDLCDContent(content, source);
            updates.push(...detectedUpdates);
            this.lastUpdateHash = currentHash;
          }
        } catch (error) {
          console.error(`Error monitoring ${source}:`, error);
        }
      }

      // Store updates in database and file system
      for (const update of updates) {
        await this.processRegulatoryUpdate(update);
      }

      return updates;
    } catch (error) {
      console.error('Error monitoring DLCD updates:', error);
      return [];
    }
  }

  private parseDLCDContent(content: string, source: string): OregonPlanningUpdate[] {
    const updates: OregonPlanningUpdate[] = [];
    
    // Parse for planning goals updates
    if (content.includes('statewide planning goals') || content.includes('planning goal')) {
      updates.push({
        source: 'DLCD',
        type: 'Planning Goal',
        title: 'Statewide Planning Goals Update',
        description: 'Updates detected in Oregon statewide planning goals',
        effectiveDate: new Date(),
        impactLevel: 'High',
        affectedJurisdictions: ['All Oregon Jurisdictions'],
        url: source
      });
    }

    // Parse for administrative rules updates
    if (content.includes('OAR') || content.includes('administrative rules')) {
      updates.push({
        source: 'DLCD',
        type: 'Administrative Rule',
        title: 'Administrative Rules Update',
        description: 'Updates detected in Oregon Administrative Rules',
        effectiveDate: new Date(),
        impactLevel: 'Medium',
        affectedJurisdictions: ['All Oregon Jurisdictions'],
        url: source
      });
    }

    // Parse for comprehensive plan updates
    if (content.includes('comprehensive plan') || content.includes('PAPA')) {
      updates.push({
        source: 'DLCD',
        type: 'Plan Amendment',
        title: 'Comprehensive Plan Amendment',
        description: 'Comprehensive plan amendment detected',
        effectiveDate: new Date(),
        impactLevel: 'Medium',
        affectedJurisdictions: ['Local Governments'],
        url: source
      });
    }

    return updates;
  }

  // File System MCP - Document Management
  async storePlanningDocument(
    category: string,
    filename: string,
    content: string | Buffer,
    metadata?: any
  ): Promise<string> {
    try {
      const filePath = path.join(OREGON_CONFIG.fileSystemRoot, category, filename);
      await fs.writeFile(filePath, content);
      
      // Store metadata if provided
      if (metadata) {
        const metadataPath = filePath + '.meta.json';
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      return filePath;
    } catch (error) {
      console.error('Error storing planning document:', error);
      throw error;
    }
  }

  async getPlanningDocument(category: string, filename: string): Promise<{ content: Buffer; metadata?: any }> {
    try {
      const filePath = path.join(OREGON_CONFIG.fileSystemRoot, category, filename);
      const content = await fs.readFile(filePath);
      
      // Try to load metadata
      let metadata;
      try {
        const metadataPath = filePath + '.meta.json';
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch {
        // Metadata file doesn't exist
      }

      return { content, metadata };
    } catch (error) {
      console.error('Error reading planning document:', error);
      throw error;
    }
  }

  // PostgreSQL MCP - Database Operations
  async processRegulatoryUpdate(update: OregonPlanningUpdate): Promise<void> {
    try {
      // Store in database
      const result = await this.db.query(`
        INSERT INTO regulatory_updates (source, update_type, title, description, effective_date, impact_level, affected_jurisdictions)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        update.source,
        update.type,
        update.title,
        update.description,
        update.effectiveDate,
        update.impactLevel,
        update.affectedJurisdictions
      ]);

      // Store document in file system
      const filename = `${Date.now()}-${update.title.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      await this.storePlanningDocument(
        'administrative-rules/recent-updates',
        filename,
        JSON.stringify(update, null, 2),
        { databaseId: result.rows[0].id }
      );

      // Create notification
      await this.createNotification({
        type: 'regulatory_update',
        priority: update.impactLevel === 'High' ? 'high' : 'medium',
        title: `New ${update.type}: ${update.title}`,
        message: update.description,
        affectedUsers: ['all'],
        actionRequired: true,
        deadline: update.complianceDeadline
      });

    } catch (error) {
      console.error('Error processing regulatory update:', error);
    }
  }

  async createApplication(application: OregonApplication): Promise<number> {
    try {
      const result = await this.db.query(`
        INSERT INTO oregon_applications (application_number, applicant_name, project_type, jurisdiction, submission_date, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        application.applicationNumber,
        application.applicantName,
        application.projectType,
        application.jurisdiction,
        application.submissionDate,
        application.status
      ]);

      return result.rows[0].id;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  async analyzeApplicationCompliance(applicationId: number): Promise<{
    applicationId: number;
    overallScore: number;
    goalCompliance: GoalCompliance[];
  }> {
    try {
      // Get application details
      const appResult = await this.db.query(
        'SELECT * FROM oregon_applications WHERE id = $1',
        [applicationId]
      );

      if (appResult.rows.length === 0) {
        throw new Error('Application not found');
      }

      const application = appResult.rows[0];

      // Get statewide planning goals
      const goalsResult = await this.db.query(
        'SELECT * FROM oregon_planning_goals WHERE status = $1 ORDER BY goal_number',
        ['active']
      );

      const goals = goalsResult.rows;
      const complianceResults: GoalCompliance[] = [];

      // Analyze against each goal
      for (const goal of goals) {
        const compliance = await this.analyzeGoalCompliance(application, goal);
        complianceResults.push(compliance);

        // Store compliance result in database
        await this.db.query(`
          INSERT INTO goal_compliance (application_id, goal_number, compliance_status, compliance_notes, confidence)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          applicationId,
          goal.goal_number,
          compliance.complianceStatus,
          compliance.complianceNotes,
          compliance.confidence
        ]);
      }

      // Calculate overall compliance score
      const overallScore = this.calculateOverallCompliance(complianceResults);

      // Update application with compliance score
      await this.db.query(
        'UPDATE oregon_applications SET compliance_score = $1, ai_analysis_result = $2 WHERE id = $3',
        [overallScore, JSON.stringify(complianceResults), applicationId]
      );

      return {
        applicationId,
        overallScore,
        goalCompliance: complianceResults
      };
    } catch (error) {
      console.error('Error analyzing application compliance:', error);
      throw error;
    }
  }

  private async analyzeGoalCompliance(application: any, goal: any): Promise<GoalCompliance> {
    // AI-powered analysis of goal compliance
    // This integrates with your existing document analyzer
    const complianceKeywords = this.getGoalComplianceKeywords(goal.goal_number);
    
    // Simulate AI analysis (replace with actual AI integration)
    const complianceStatus = Math.random() > 0.3 ? 'compliant' : 'needs-review';
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

    return {
      goalNumber: goal.goal_number,
      goalTitle: goal.title,
      complianceStatus,
      complianceNotes: `AI analysis for ${goal.title}: ${complianceStatus} with ${(confidence * 100).toFixed(1)}% confidence`,
      confidence
    };
  }

  private getGoalComplianceKeywords(goalNumber: number): string[] {
    const goalKeywords: { [key: number]: string[] } = {
      1: ['agricultural', 'farmland', 'agriculture', 'farming'],
      2: ['open space', 'scenic', 'historic', 'natural resources'],
      3: ['agricultural', 'farmland', 'agriculture'],
      4: ['forest', 'forestry', 'timber', 'woodland'],
      5: ['natural resources', 'scenic', 'historic', 'open space'],
      6: ['air quality', 'water quality', 'land quality', 'environmental'],
      7: ['natural disasters', 'hazards', 'flood', 'earthquake', 'wildfire'],
      8: ['recreational', 'parks', 'trails', 'outdoor recreation'],
      9: ['economic development', 'business', 'employment', 'industry'],
      10: ['housing', 'residential', 'affordable housing', 'housing needs'],
      11: ['public facilities', 'services', 'infrastructure', 'utilities'],
      12: ['transportation', 'roads', 'transit', 'traffic'],
      13: ['energy conservation', 'energy efficiency', 'renewable energy'],
      14: ['urbanization', 'urban growth', 'development', 'growth management'],
      15: ['Willamette River', 'greenway', 'river corridor'],
      16: ['estuarine', 'estuary', 'coastal', 'marine'],
      17: ['coastal shorelands', 'coastal zone', 'shoreline'],
      18: ['beaches', 'dunes', 'coastal', 'sand'],
      19: ['ocean resources', 'marine', 'fisheries', 'coastal']
    };

    return goalKeywords[goalNumber] || [];
  }

  private calculateOverallCompliance(complianceResults: GoalCompliance[]): number {
    if (complianceResults.length === 0) return 0;
    
    const compliantGoals = complianceResults.filter(r => r.complianceStatus === 'compliant').length;
    return (compliantGoals / complianceResults.length) * 100;
  }

  // Notification System
  async createNotification(notification: OregonPlanningNotification): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO oregon_notifications (type, priority, title, message, affected_users, action_required, deadline)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        notification.affectedUsers,
        notification.actionRequired,
        notification.deadline
      ]);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async getNotifications(userId?: string): Promise<OregonPlanningNotification[]> {
    try {
      let query = 'SELECT * FROM oregon_notifications ORDER BY created_at DESC LIMIT 50';
      let params: any[] = [];

      if (userId && userId !== 'all') {
        query = 'SELECT * FROM oregon_notifications WHERE $1 = ANY(affected_users) ORDER BY created_at DESC LIMIT 50';
        params = [userId];
      }

      const result = await this.db.query(query, params);
      return result.rows.map(row => ({
        type: row.type,
        priority: row.priority,
        title: row.title,
        message: row.message,
        affectedUsers: row.affected_users,
        actionRequired: row.action_required,
        deadline: row.deadline
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Utility Methods
  async getStatewideGoals(): Promise<any[]> {
    try {
      const result = await this.db.query('SELECT * FROM oregon_planning_goals ORDER BY goal_number');
      return result.rows;
    } catch (error) {
      console.error('Error getting statewide goals:', error);
      return [];
    }
  }

  async getRecentUpdates(limit: number = 10): Promise<OregonPlanningUpdate[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM regulatory_updates ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting recent updates:', error);
      return [];
    }
  }

  async getApplicationsByStatus(status: string): Promise<OregonApplication[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM oregon_applications WHERE status = $1 ORDER BY submission_date DESC',
        [status]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  }

  // Cleanup
  async close(): Promise<void> {
    await this.db.end();
  }
} 