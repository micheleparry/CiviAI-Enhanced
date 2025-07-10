import cron from 'node-cron';
import { OregonPlanningService } from './oregon-planning.service';

export class OregonMonitoringService {
  private oregonService: OregonPlanningService;
  private isRunning: boolean = false;

  constructor() {
    this.oregonService = new OregonPlanningService();
  }

  // Start all monitoring schedules
  startMonitoring(): void {
    if (this.isRunning) {
      console.log('Oregon monitoring service is already running');
      return;
    }

    console.log('Starting Oregon MCP monitoring service...');

    // Daily DLCD monitoring at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Starting daily DLCD monitoring...');
      await this.monitorDLCDUpdates();
    }, {
      scheduled: true,
      timezone: 'America/Los_Angeles'
    });

    // Weekly administrative rules check on Monday at 10 AM
    cron.schedule('0 10 * * 1', async () => {
      console.log('Starting weekly administrative rules check...');
      await this.monitorAdministrativeRules();
    }, {
      scheduled: true,
      timezone: 'America/Los_Angeles'
    });

    // Monthly statute updates on the 1st at 11 AM
    cron.schedule('0 11 1 * *', async () => {
      console.log('Starting monthly statute updates check...');
      await this.monitorStatuteUpdates();
    }, {
      scheduled: true,
      timezone: 'America/Los_Angeles'
    });

    // Daily local amendments monitoring at 8 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('Starting daily local amendments monitoring...');
      await this.monitorLocalAmendments();
    }, {
      scheduled: true,
      timezone: 'America/Los_Angeles'
    });

    // Hourly compliance deadline checks
    cron.schedule('0 * * * *', async () => {
      console.log('Checking compliance deadlines...');
      await this.checkComplianceDeadlines();
    }, {
      scheduled: true,
      timezone: 'America/Los_Angeles'
    });

    this.isRunning = true;
    console.log('Oregon monitoring service started successfully');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('Oregon monitoring service is not running');
      return;
    }

    cron.getTasks().forEach(task => {
      if (task.getStatus() === 'scheduled') {
        task.stop();
      }
    });

    this.isRunning = false;
    console.log('Oregon monitoring service stopped');
  }

  // Monitor DLCD website for updates
  private async monitorDLCDUpdates(): Promise<void> {
    try {
      const updates = await this.oregonService.monitorDLCDUpdates();
      
      if (updates.length > 0) {
        console.log(`Found ${updates.length} DLCD updates:`);
        updates.forEach(update => {
          console.log(`- ${update.type}: ${update.title}`);
        });

        // Create high-priority notification for new updates
        await this.oregonService.createNotification({
          type: 'regulatory_update',
          priority: 'high',
          title: `New DLCD Updates: ${updates.length} found`,
          message: `DLCD monitoring detected ${updates.length} new regulatory updates. Please review for compliance implications.`,
          affectedUsers: ['all'],
          actionRequired: true
        });
      } else {
        console.log('No new DLCD updates found');
      }
    } catch (error) {
      console.error('Error in DLCD monitoring:', error);
      
      // Create alert notification for monitoring failure
      await this.oregonService.createNotification({
        type: 'compliance_alert',
        priority: 'high',
        title: 'DLCD Monitoring Failure',
        message: 'Automated DLCD monitoring failed. Manual review recommended.',
        affectedUsers: ['admin'],
        actionRequired: true
      });
    }
  }

  // Monitor administrative rules specifically
  private async monitorAdministrativeRules(): Promise<void> {
    try {
      // Focus on OAR Chapter 660 (Land Use Planning)
      const oarSources = [
        'https://www.oregon.gov/lcd/Pages/laws-rules.aspx',
        'https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=660'
      ];

      console.log('Monitoring Oregon Administrative Rules (OAR)...');
      
      // This would integrate with the web search MCP for more sophisticated monitoring
      const updates = await this.oregonService.monitorDLCDUpdates();
      
      const oarUpdates = updates.filter(update => 
        update.type === 'Administrative Rule' || 
        update.title.toLowerCase().includes('oar') ||
        update.title.toLowerCase().includes('administrative rule')
      );

      if (oarUpdates.length > 0) {
        console.log(`Found ${oarUpdates.length} OAR updates`);
        
        await this.oregonService.createNotification({
          type: 'regulatory_update',
          priority: 'medium',
          title: `OAR Updates: ${oarUpdates.length} found`,
          message: `Administrative rules monitoring detected ${oarUpdates.length} updates. Review for compliance requirements.`,
          affectedUsers: ['all'],
          actionRequired: true
        });
      }
    } catch (error) {
      console.error('Error in administrative rules monitoring:', error);
    }
  }

  // Monitor statute updates
  private async monitorStatuteUpdates(): Promise<void> {
    try {
      console.log('Monitoring Oregon Revised Statutes (ORS)...');
      
      // Focus on ORS Chapter 197 (Comprehensive Land Use Planning)
      const orsSources = [
        'https://www.oregon.gov/lcd/Pages/laws-rules.aspx',
        'https://www.oregonlegislature.gov/bills_laws/Pages/ors.aspx'
      ];

      const updates = await this.oregonService.monitorDLCDUpdates();
      
      const orsUpdates = updates.filter(update => 
        update.type === 'Statute' || 
        update.title.toLowerCase().includes('ors') ||
        update.title.toLowerCase().includes('statute')
      );

      if (orsUpdates.length > 0) {
        console.log(`Found ${orsUpdates.length} ORS updates`);
        
        await this.oregonService.createNotification({
          type: 'regulatory_update',
          priority: 'high',
          title: `ORS Updates: ${orsUpdates.length} found`,
          message: `Statute monitoring detected ${orsUpdates.length} updates. These may have significant compliance implications.`,
          affectedUsers: ['all'],
          actionRequired: true
        });
      }
    } catch (error) {
      console.error('Error in statute monitoring:', error);
    }
  }

  // Monitor local plan amendments
  private async monitorLocalAmendments(): Promise<void> {
    try {
      console.log('Monitoring local plan amendments (PAPAs)...');
      
      const updates = await this.oregonService.monitorDLCDUpdates();
      
      const papaUpdates = updates.filter(update => 
        update.type === 'Plan Amendment' || 
        update.title.toLowerCase().includes('papa') ||
        update.title.toLowerCase().includes('comprehensive plan') ||
        update.title.toLowerCase().includes('amendment')
      );

      if (papaUpdates.length > 0) {
        console.log(`Found ${papaUpdates.length} local plan amendments`);
        
        await this.oregonService.createNotification({
          type: 'regulatory_update',
          priority: 'medium',
          title: `Local Plan Amendments: ${papaUpdates.length} found`,
          message: `Local plan amendment monitoring detected ${papaUpdates.length} updates. Review for local compliance requirements.`,
          affectedUsers: ['all'],
          actionRequired: true
        });
      }
    } catch (error) {
      console.error('Error in local amendments monitoring:', error);
    }
  }

  // Check compliance deadlines
  private async checkComplianceDeadlines(): Promise<void> {
    try {
      console.log('Checking compliance deadlines...');
      
      // Get recent regulatory updates with deadlines
      const recentUpdates = await this.oregonService.getRecentUpdates(50);
      const now = new Date();
      
      const upcomingDeadlines = recentUpdates.filter(update => {
        if (!update.complianceDeadline) return false;
        
        const deadline = new Date(update.complianceDeadline);
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert if deadline is within 7 days
        return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
      });

      if (upcomingDeadlines.length > 0) {
        console.log(`Found ${upcomingDeadlines.length} upcoming compliance deadlines`);
        
        for (const update of upcomingDeadlines) {
          const deadline = new Date(update.complianceDeadline!);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          await this.oregonService.createNotification({
            type: 'deadline_reminder',
            priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
            title: `Compliance Deadline: ${update.title}`,
            message: `Compliance deadline for "${update.title}" is in ${daysUntilDeadline} day(s). Action required.`,
            affectedUsers: ['all'],
            actionRequired: true,
            deadline: deadline
          });
        }
      }
    } catch (error) {
      console.error('Error checking compliance deadlines:', error);
    }
  }

  // Manual trigger for immediate monitoring
  async triggerManualMonitoring(): Promise<{
    dlcdUpdates: number;
    oarUpdates: number;
    orsUpdates: number;
    papaUpdates: number;
  }> {
    console.log('Triggering manual monitoring...');
    
    const results = {
      dlcdUpdates: 0,
      oarUpdates: 0,
      orsUpdates: 0,
      papaUpdates: 0
    };

    try {
      // Run all monitoring tasks
      const dlcdUpdates = await this.oregonService.monitorDLCDUpdates();
      results.dlcdUpdates = dlcdUpdates.length;

      const oarUpdates = dlcdUpdates.filter(update => 
        update.type === 'Administrative Rule' || 
        update.title.toLowerCase().includes('oar')
      );
      results.oarUpdates = oarUpdates.length;

      const orsUpdates = dlcdUpdates.filter(update => 
        update.type === 'Statute' || 
        update.title.toLowerCase().includes('ors')
      );
      results.orsUpdates = orsUpdates.length;

      const papaUpdates = dlcdUpdates.filter(update => 
        update.type === 'Plan Amendment' || 
        update.title.toLowerCase().includes('papa')
      );
      results.papaUpdates = papaUpdates.length;

      console.log('Manual monitoring completed:', results);
      
      return results;
    } catch (error) {
      console.error('Error in manual monitoring:', error);
      throw error;
    }
  }

  // Get monitoring status
  getStatus(): {
    isRunning: boolean;
    nextScheduledRuns: {
      dlcd: string;
      oar: string;
      ors: string;
      papa: string;
      deadlines: string;
    };
  } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(10, 0, 0, 0);

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 11, 0, 0, 0);

    return {
      isRunning: this.isRunning,
      nextScheduledRuns: {
        dlcd: tomorrow.toISOString(),
        oar: nextMonday.toISOString(),
        ors: nextMonth.toISOString(),
        papa: tomorrow.toISOString(), // Same as DLCD for now
        deadlines: new Date(now.getTime() + 60 * 60 * 1000).toISOString() // Next hour
      }
    };
  }
} 