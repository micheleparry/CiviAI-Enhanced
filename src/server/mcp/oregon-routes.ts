import express from 'express';
import { OregonPlanningService, OregonApplication, OregonPlanningUpdate } from './oregon-planning.service';

const router = express.Router();
const oregonService = new OregonPlanningService();

// Oregon Planning Goals
router.get('/goals', async (req, res) => {
  try {
    const goals = await oregonService.getStatewideGoals();
    res.json({
      success: true,
      data: goals,
      message: 'Oregon statewide planning goals retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting statewide goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statewide planning goals'
    });
  }
});

router.get('/goals/:goalNumber', async (req, res) => {
  try {
    const goalNumber = parseInt(req.params.goalNumber);
    const goals = await oregonService.getStatewideGoals();
    const goal = goals.find(g => g.goal_number === goalNumber);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Planning goal not found'
      });
    }

    res.json({
      success: true,
      data: goal,
      message: `Goal ${goalNumber} retrieved successfully`
    });
  } catch (error) {
    console.error('Error getting specific goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve planning goal'
    });
  }
});

// Oregon Applications
router.post('/applications', async (req, res) => {
  try {
    const applicationData: OregonApplication = req.body;
    
    // Validate required fields
    if (!applicationData.applicationNumber || !applicationData.applicantName || !applicationData.projectType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: applicationNumber, applicantName, projectType'
      });
    }

    const applicationId = await oregonService.createApplication(applicationData);
    
    res.status(201).json({
      success: true,
      data: { id: applicationId },
      message: 'Oregon planning application created successfully'
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create planning application'
    });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const status = req.query.status as string;
    const applications = await oregonService.getApplicationsByStatus(status || 'all');
    
    res.json({
      success: true,
      data: applications,
      message: 'Oregon planning applications retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve planning applications'
    });
  }
});

router.get('/applications/:id', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const applications = await oregonService.getApplicationsByStatus('all');
    const application = applications.find(app => app.id === applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application,
      message: 'Application retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve application'
    });
  }
});

// Compliance Analysis
router.post('/applications/:id/analyze', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const analysis = await oregonService.analyzeApplicationCompliance(applicationId);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Compliance analysis completed successfully'
    });
  } catch (error) {
    console.error('Error analyzing compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze application compliance'
    });
  }
});

// Regulatory Updates
router.get('/updates', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const updates = await oregonService.getRecentUpdates(limit);
    
    res.json({
      success: true,
      data: updates,
      message: 'Recent regulatory updates retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting updates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve regulatory updates'
    });
  }
});

// Manual DLCD Monitoring
router.post('/monitor', async (req, res) => {
  try {
    const updates = await oregonService.monitorDLCDUpdates();
    
    res.json({
      success: true,
      data: {
        updatesFound: updates.length,
        updates: updates
      },
      message: `DLCD monitoring completed. Found ${updates.length} updates.`
    });
  } catch (error) {
    console.error('Error monitoring DLCD:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to monitor DLCD updates'
    });
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const notifications = await oregonService.getNotifications(userId);
    
    res.json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications'
    });
  }
});

// Document Management
router.post('/documents/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const { filename, content, metadata } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filename, content'
      });
    }

    const filePath = await oregonService.storePlanningDocument(category, filename, content, metadata);
    
    res.status(201).json({
      success: true,
      data: { filePath },
      message: 'Document stored successfully'
    });
  } catch (error) {
    console.error('Error storing document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store document'
    });
  }
});

router.get('/documents/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const document = await oregonService.getPlanningDocument(category, filename);
    
    res.json({
      success: true,
      data: {
        content: document.content.toString('base64'),
        metadata: document.metadata
      },
      message: 'Document retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document'
    });
  }
});

// Oregon Jurisdictions
router.get('/jurisdictions', async (req, res) => {
  try {
    // This would typically come from the database, but for now we'll return sample data
    const jurisdictions = [
      {
        id: 1,
        name: 'Portland',
        type: 'city',
        population: 652503,
        planning_department_contact: 'Portland Bureau of Planning and Sustainability',
        email: 'planning@portlandoregon.gov',
        phone: '503-823-7700'
      },
      {
        id: 2,
        name: 'Salem',
        type: 'city',
        population: 175535,
        planning_department_contact: 'Salem Planning Division',
        email: 'planning@cityofsalem.net',
        phone: '503-588-6178'
      },
      {
        id: 3,
        name: 'Eugene',
        type: 'city',
        population: 168916,
        planning_department_contact: 'Eugene Planning and Development',
        email: 'planning@eugene-or.gov',
        phone: '541-682-5477'
      },
      {
        id: 4,
        name: 'Multnomah County',
        type: 'county',
        population: 812855,
        planning_department_contact: 'Multnomah County Land Use Planning',
        email: 'landuse@multco.us',
        phone: '503-988-3043'
      },
      {
        id: 5,
        name: 'Lane County',
        type: 'county',
        population: 382971,
        planning_department_contact: 'Lane County Land Management',
        email: 'landmanagement@lanecountyor.gov',
        phone: '541-682-3573'
      },
      {
        id: 6,
        name: 'Marion County',
        type: 'county',
        population: 345920,
        planning_department_contact: 'Marion County Planning',
        email: 'planning@co.marion.or.us',
        phone: '503-588-5038'
      }
    ];
    
    res.json({
      success: true,
      data: jurisdictions,
      message: 'Oregon jurisdictions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting jurisdictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve jurisdictions'
    });
  }
});

// Health Check
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const goals = await oregonService.getStatewideGoals();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        goalsCount: goals.length,
        timestamp: new Date().toISOString()
      },
      message: 'Oregon MCP service is healthy'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      },
      error: 'Oregon MCP service health check failed'
    });
  }
});

export default router; 