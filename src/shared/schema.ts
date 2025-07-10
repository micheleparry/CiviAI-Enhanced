// Shared types and validation schemas for CiviAI Enhanced

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'applicant';
  name: string;
}

export interface Document {
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

export interface Analysis {
  id: number;
  documentId: number;
  classification: string;
  extractedText: string;
  keyInformation: Record<string, any>;
  complianceScore: number;
  complianceIssues: ComplianceIssue[];
  zoningInfo: ZoningInfo;
}

export interface ComplianceIssue {
  severity: 'error' | 'warning' | 'info';
  issue: string;
  section: string;
  category: string;
  field_name: string;
  example_value?: string;
}

export interface ZoningInfo {
  currentZone: string;
  compliance: string;
  missingRequirements: any[];
  recommendations: string[];
  nextSteps: string[];
}

export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalMissingItems: number;
  docsWithMissingInfo: number;
  completionRate: number;
  averageProcessingTime: number;
}

export interface MissingInfoData {
  documentId: number;
  documentType: string;
  complianceScore: number;
  missingRequirements: MissingRequirement[];
  recommendations: string[];
  nextSteps: string[];
  foundInformation: Record<string, any>;
}

export interface MissingRequirement {
  category: string;
  field_name: string;
  description: string;
  importance: string;
  suggested_source: string;
  example_value?: string;
}

// Validation schemas (using Zod-like structure for simplicity)
export const insertUserSchema = {
  email: { type: 'string', required: true },
  password: { type: 'string', required: true },
  role: { type: 'string', enum: ['admin', 'staff', 'applicant'], required: true },
  name: { type: 'string', required: true }
};

export const insertDocumentSchema = {
  userId: { type: 'number', required: true },
  filename: { type: 'string', required: true },
  originalName: { type: 'string', required: true },
  fileSize: { type: 'number', required: true },
  mimeType: { type: 'string', required: true },
  city: { type: 'string', required: true },
  applicationType: { type: 'string', required: true }
};

export const insertAnalysisSchema = {
  documentId: { type: 'number', required: true },
  classification: { type: 'string', required: true },
  extractedText: { type: 'string', required: true },
  keyInformation: { type: 'object', required: true },
  complianceScore: { type: 'number', required: true },
  complianceIssues: { type: 'array', required: true },
  zoningInfo: { type: 'object', required: true }
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: Omit<User, 'password'>;
}

export interface ChatMessage {
  message: string;
  timestamp: string;
  userId: number;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
  suggestions?: string[];
} 