// Simple in-memory storage for development
// In production, this would be replaced with a proper database

interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'applicant';
  name: string;
}

interface Document {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submissionDate: string;
  city: string;
  applicationType: string;
}

interface Analysis {
  id: number;
  documentId: number;
  classification: string;
  extractedText: string;
  keyInformation: Record<string, any>;
  complianceScore: number;
  complianceIssues: Array<{
    severity: string;
    issue: string;
    section: string;
    category: string;
    field_name: string;
    example_value?: string;
  }>;
  zoningInfo: {
    currentZone: string;
    compliance: string;
    missingRequirements: any[];
    recommendations: string[];
    nextSteps: string[];
  };
}

class InMemoryStorage {
  private users: User[] = [
    {
      id: 1,
      email: 'admin@civiai.com',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User'
    },
    {
      id: 2,
      email: 'staff@civiai.com',
      password: 'staff123',
      role: 'staff',
      name: 'Staff User'
    },
    {
      id: 3,
      email: 'applicant@civiai.com',
      password: 'applicant123',
      role: 'applicant',
      name: 'Applicant User'
    }
  ];

  private documents: Document[] = [
    {
      id: 1,
      userId: 3,
      filename: 'sample-zoning-app.pdf',
      originalName: 'Zoning Application - 123 Main St.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      status: 'completed',
      submissionDate: '2025-01-15T10:30:00Z',
      city: 'Shady Cove',
      applicationType: 'zoning_application'
    },
    {
      id: 2,
      userId: 3,
      filename: 'building-permit.pdf',
      originalName: 'Building Permit Application.pdf',
      fileSize: 2048000,
      mimeType: 'application/pdf',
      status: 'pending',
      submissionDate: '2025-01-16T14:20:00Z',
      city: 'Shady Cove',
      applicationType: 'building_permit'
    }
  ];

  private analyses: Analysis[] = [
    {
      id: 1,
      documentId: 1,
      classification: 'zoning_application',
      extractedText: 'Sample zoning application text...',
      keyInformation: {
        property_address: '123 Main St, Shady Cove, OR 97520',
        parcel_number: '37-1W-25-1000',
        current_zoning: 'R-1',
        proposed_use: 'Single-family residence',
        lot_size: '0.25 acres'
      },
      complianceScore: 85,
      complianceIssues: [
        {
          severity: 'warning',
          issue: 'Missing: Building height specification',
          section: 'Project Details',
          category: 'project_details',
          field_name: 'building_height',
          example_value: '28 feet'
        }
      ],
      zoningInfo: {
        currentZone: 'R-1',
        compliance: 'Good',
        missingRequirements: [],
        recommendations: ['Add building height specification'],
        nextSteps: ['Submit building height information']
      }
    }
  ];

  // User methods
  async getUser(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  // Document methods
  async createDocument(data: Omit<Document, 'id'>): Promise<Document> {
    const document: Document = {
      ...data,
      id: this.documents.length + 1
    };
    this.documents.push(document);
    return document;
  }

  async getDocument(id: number): Promise<Document | null> {
    return this.documents.find(doc => doc.id === id) || null;
  }

  async getUserDocuments(userId: number): Promise<Document[]> {
    return this.documents.filter(doc => doc.userId === userId);
  }

  async updateDocumentStatus(id: number, status: Document['status']): Promise<void> {
    const document = this.documents.find(doc => doc.id === id);
    if (document) {
      document.status = status;
    }
  }

  // Analysis methods
  async createAnalysis(data: Omit<Analysis, 'id'>): Promise<Analysis> {
    const analysis: Analysis = {
      ...data,
      id: this.analyses.length + 1
    };
    this.analyses.push(analysis);
    return analysis;
  }

  async getAnalysisByDocumentId(documentId: number): Promise<Analysis | null> {
    return this.analyses.find(analysis => analysis.documentId === documentId) || null;
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<void> {
    const analysis = this.analyses.find(a => a.id === id);
    if (analysis) {
      Object.assign(analysis, updates);
    }
  }

  // Dashboard stats
  async getDashboardStats() {
    const totalApplications = this.documents.length;
    const pendingApplications = this.documents.filter(doc => doc.status === 'pending').length;
    const approvedApplications = this.documents.filter(doc => doc.status === 'completed').length;
    const rejectedApplications = this.documents.filter(doc => doc.status === 'failed').length;
    
    const totalMissingItems = this.analyses.reduce((sum, analysis) => 
      sum + analysis.complianceIssues.length, 0);
    
    const docsWithMissingInfo = this.analyses.filter(analysis => 
      analysis.complianceIssues.length > 0).length;
    
    const completionRate = totalApplications > 0 ? 
      Math.round(((totalApplications - docsWithMissingInfo) / totalApplications) * 100) : 0;
    
    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalMissingItems,
      docsWithMissingInfo,
      completionRate,
      averageProcessingTime: 2.3 // Mock data
    };
  }
}

export const storage = new InMemoryStorage(); 