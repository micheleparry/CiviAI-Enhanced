import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { zoningService } from "./zoning";
import { spawn } from 'child_process';
import { insertUserSchema, insertDocumentSchema, insertAnalysisSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: PDF, DOC, DOCX, TXT, JPG, PNG'));
    }
  }
});

// Session middleware and auth (keeping existing implementation)
interface UserSession {
  userId?: number;
  user?: any;
}

declare global {
  namespace Express {
    interface Request {
      session: UserSession;
    }
  }
}

const sessions = new Map<string, UserSession>();

function sessionMiddleware(req: any, res: any, next: any) {
  const sessionId = req.headers['x-session-id'] || 'default-session';
  req.session = sessions.get(sessionId) || {};
  
  res.setHeader('x-session-id', sessionId);
  
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    sessions.set(sessionId, req.session);
    originalEnd.apply(res, args);
  };
  
  next();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Enhanced document processing with missing information detection
async function processDocumentEnhanced(documentId: number) {
  const document = await storage.getDocument(documentId);
  if (!document) return;

  // Update status to processing
  await storage.updateDocumentStatus(documentId, 'processing');

  try {
    const filePath = path.join(process.cwd(), 'uploads', document.filename);
    const analyzerPath = path.join(process.cwd(), 'enhanced_document_analyzer.py');
    
    // Run enhanced document analyzer
    const pythonProcess = spawn('python3', [analyzerPath, filePath]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          const analysisResult = JSON.parse(stdout);
          
          // Store enhanced analysis results
          await storage.createAnalysis({
            documentId: document.id,
            classification: analysisResult.document_type,
            extractedText: analysisResult.extracted_text_preview,
            keyInformation: analysisResult.found_information,
            complianceScore: analysisResult.compliance_score,
            complianceIssues: analysisResult.missing_requirements.map((req: any) => ({
              severity: req.importance === 'critical' ? 'error' : req.importance === 'important' ? 'warning' : 'info',
              issue: `Missing: ${req.description}`,
              section: req.suggested_source,
              category: req.category,
              field_name: req.field_name,
              example_value: req.example_value
            })),
            zoningInfo: {
              currentZone: analysisResult.found_information.current_zoning || 'Unknown',
              compliance: analysisResult.compliance_score > 80 ? 'Good' : 'Needs Review',
              missingRequirements: analysisResult.missing_requirements,
              recommendations: analysisResult.recommendations,
              nextSteps: analysisResult.next_steps
            }
          });

          await storage.updateDocumentStatus(documentId, 'completed');
        } catch (parseError) {
          console.error('Error parsing analysis result:', parseError);
          await storage.updateDocumentStatus(documentId, 'failed');
        }
      } else {
        console.error('Document analysis failed:', stderr);
        await storage.updateDocumentStatus(documentId, 'failed');
      }
    });

  } catch (error) {
    console.error('Error processing document:', error);
    await storage.updateDocumentStatus(documentId, 'failed');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionMiddleware);

  // Auth routes (keeping existing implementation)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      req.session.user = { ...user, password: undefined };

      res.json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session = {};
    res.json({ message: 'Logout successful' });
  });

  app.get('/api/auth/user', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Enhanced Document routes
  app.post('/api/documents/upload', requireAuth, upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const document = await storage.createDocument({
        userId: req.session.userId!,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      // Start enhanced processing asynchronously
      processDocumentEnhanced(document.id);

      res.json(document);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // New route: Analyze document for missing information
  app.post('/api/documents/analyze-missing', requireAuth, async (req, res) => {
    try {
      const { documentId } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ message: 'Document ID required' });
      }

      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== req.session.userId!) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const analysis = await storage.getAnalysisByDocumentId(documentId);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found. Document may still be processing.' });
      }

      // Extract missing requirements from analysis
      const missingInfo = {
        documentId: documentId,
        documentType: analysis.classification,
        complianceScore: analysis.complianceScore,
        missingRequirements: analysis.complianceIssues.filter((issue: any) => 
          issue.severity === 'error' || issue.severity === 'warning'
        ),
        recommendations: analysis.zoningInfo?.recommendations || [],
        nextSteps: analysis.zoningInfo?.nextSteps || [],
        foundInformation: analysis.keyInformation || {}
      };

      res.json(missingInfo);
    } catch (error) {
      console.error('Analyze missing info error:', error);
      res.status(500).json({ message: 'Failed to analyze missing information' });
    }
  });

  // New route: Get document requirements template
  app.get('/api/documents/requirements/:documentType', requireAuth, async (req, res) => {
    try {
      const { documentType } = req.params;
      
      // Define requirements templates for different document types
      const requirementsTemplates = {
        'zoning_application': {
          critical: [
            { field: 'property_address', description: 'Complete property address', example: '123 Main St, Shady Cove, OR 97520' },
            { field: 'parcel_number', description: 'Tax assessor parcel number', example: '37-1W-25-1000' },
            { field: 'current_zoning', description: 'Current zoning designation', example: 'R-1 (Single Family Residential)' },
            { field: 'proposed_use', description: 'Detailed description of proposed use', example: 'Single-family residence with detached garage' },
            { field: 'lot_size', description: 'Total lot size', example: '0.25 acres (10,890 sq ft)' }
          ],
          important: [
            { field: 'building_height', description: 'Maximum building height', example: '28 feet' },
            { field: 'setbacks', description: 'Building setbacks from property lines', example: 'Front: 25ft, Rear: 20ft, Side: 10ft' },
            { field: 'parking_spaces', description: 'Number of parking spaces', example: '2 covered spaces in garage' }
          ],
          recommended: [
            { field: 'landscaping_plan', description: 'Landscaping and green space plan', example: 'Native plant landscaping with 25% green space' },
            { field: 'architectural_style', description: 'Architectural style and materials', example: 'Craftsman style with wood siding' }
          ]
        },
        'building_permit': {
          critical: [
            { field: 'construction_type', description: 'Type of construction', example: 'New single-family residence' },
            { field: 'building_value', description: 'Estimated construction value', example: '$350,000' },
            { field: 'square_footage', description: 'Total building square footage', example: '2,400 sq ft' },
            { field: 'occupancy_type', description: 'Building occupancy classification', example: 'R-3 Single Family' }
          ],
          important: [
            { field: 'structural_plans', description: 'Structural engineering plans', example: 'Stamped structural drawings' },
            { field: 'electrical_plans', description: 'Electrical system plans', example: '200-amp service with modern wiring' },
            { field: 'plumbing_plans', description: 'Plumbing system plans', example: 'Full bathroom and kitchen plumbing' }
          ],
          recommended: [
            { field: 'energy_efficiency', description: 'Energy efficiency measures', example: 'ENERGY STAR appliances and insulation' }
          ]
        }
      };

      const template = requirementsTemplates[documentType as keyof typeof requirementsTemplates];
      if (!template) {
        return res.status(404).json({ message: 'Document type not found' });
      }

      res.json({
        documentType,
        requirements: template,
        totalFields: Object.values(template).flat().length
      });
    } catch (error) {
      console.error('Get requirements error:', error);
      res.status(500).json({ message: 'Failed to get requirements' });
    }
  });

  // New route: Submit missing information
  app.post('/api/documents/submit-missing', requireAuth, async (req, res) => {
    try {
      const { documentId, missingInfo } = req.body;
      
      if (!documentId || !missingInfo) {
        return res.status(400).json({ message: 'Document ID and missing information required' });
      }

      const document = await storage.getDocument(documentId);
      if (!document || document.userId !== req.session.userId!) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Update the document analysis with the provided information
      const analysis = await storage.getAnalysisByDocumentId(documentId);
      if (analysis) {
        // Merge the new information with existing key information
        const updatedKeyInfo = { ...analysis.keyInformation, ...missingInfo };
        
        // Recalculate compliance score based on newly provided information
        const totalFields = Object.keys(missingInfo).length + Object.keys(analysis.keyInformation).length;
        const providedFields = Object.keys(updatedKeyInfo).filter(key => updatedKeyInfo[key]).length;
        const newComplianceScore = Math.min(100, (providedFields / Math.max(totalFields, 10)) * 100);

        // Update analysis with new information
        await storage.updateAnalysis(analysis.id, {
          keyInformation: updatedKeyInfo,
          complianceScore: newComplianceScore
        });

        res.json({
          message: 'Missing information submitted successfully',
          updatedComplianceScore: newComplianceScore,
          providedFields: Object.keys(missingInfo)
        });
      } else {
        res.status(404).json({ message: 'Analysis not found' });
      }
    } catch (error) {
      console.error('Submit missing info error:', error);
      res.status(500).json({ message: 'Failed to submit missing information' });
    }
  });

  // Enhanced document listing with missing info summary
  app.get('/api/documents', requireAuth, async (req, res) => {
    try {
      const documents = await storage.getUserDocuments(req.session.userId!);
      
      const documentsWithAnalysis = await Promise.all(
        documents.map(async (doc) => {
          if (doc.status === 'completed') {
            const analysis = await storage.getAnalysisByDocumentId(doc.id);
            
            // Add missing info summary
            let missingInfoSummary = null;
            if (analysis) {
              const criticalMissing = analysis.complianceIssues.filter((issue: any) => issue.severity === 'error').length;
              const importantMissing = analysis.complianceIssues.filter((issue: any) => issue.severity === 'warning').length;
              
              missingInfoSummary = {
                criticalMissing,
                importantMissing,
                totalMissing: criticalMissing + importantMissing,
                canProceed: criticalMissing === 0
              };
            }
            
            return { ...doc, analysis, missingInfoSummary };
          }
          return doc;
        })
      );

      res.json(documentsWithAnalysis);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: 'Failed to get documents' });
    }
  });

  // Existing routes (keeping all the original functionality)
  app.get('/api/documents/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document || document.userId !== req.session.userId!) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const analysis = await storage.getAnalysisByDocumentId(id);
      res.json({ ...document, analysis });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ message: 'Failed to get document' });
    }
  });

  // Zoning routes (keeping existing)
  app.get('/api/zoning/rules', async (req, res) => {
    try {
      const rules = await storage.getZoningRules();
      res.json(rules);
    } catch (error) {
      console.error('Get zoning rules error:', error);
      res.status(500).json({ message: 'Failed to get zoning rules' });
    }
  });

  app.get('/api/zoning/rules/:code', async (req, res) => {
    try {
      const rule = await storage.getZoningRuleByCode(req.params.code);
      if (!rule) {
        return res.status(404).json({ message: 'Zoning rule not found' });
      }
      res.json(rule);
    } catch (error) {
      console.error('Get zoning rule error:', error);
      res.status(500).json({ message: 'Failed to get zoning rule' });
    }
  });

  // Dashboard stats with missing info metrics
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const baseStats = await storage.getUserStats(req.session.userId!);
      
      // Add missing information statistics
      const userDocuments = await storage.getUserDocuments(req.session.userId!);
      const completedDocs = userDocuments.filter(doc => doc.status === 'completed');
      
      let totalMissingItems = 0;
      let docsWithMissingInfo = 0;
      
      for (const doc of completedDocs) {
        const analysis = await storage.getAnalysisByDocumentId(doc.id);
        if (analysis && analysis.complianceIssues) {
          const missingCount = analysis.complianceIssues.filter((issue: any) => 
            issue.severity === 'error' || issue.severity === 'warning'
          ).length;
          
          if (missingCount > 0) {
            docsWithMissingInfo++;
            totalMissingItems += missingCount;
          }
        }
      }

      const enhancedStats = {
        ...baseStats,
        totalMissingItems,
        docsWithMissingInfo,
        completionRate: completedDocs.length > 0 ? 
          Math.round(((completedDocs.length - docsWithMissingInfo) / completedDocs.length) * 100) : 100
      };

      res.json(enhancedStats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ message: 'Failed to get dashboard stats' });
    }
  });

  // All other existing routes (zoning analysis, etc.)
  app.post("/api/zoning/analyze", requireAuth, async (req, res) => {
    try {
      const { zoneType, propertyType, projectData } = req.body;
      
      if (!zoneType || !propertyType || !projectData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await zoningService.analyzeCompliance({
        zoneType,
        propertyType,
        projectData
      });

      res.json(result);
    } catch (error) {
      console.error("Zoning analysis error:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Keep all other existing routes...
  // (zoning analysis, requirements, zones, etc.)

  const httpServer = createServer(app);
  return httpServer;
}

