import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Download,
  Eye,
  MessageSquare,
  MapPin,
  Building,
  Ruler,
  Car,
  TreePine,
  Send,
  RefreshCw,
  Info,
  Target,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import MissingInfoDetector from "./missing-info-detector";

interface ApplicationDetails {
  id: number;
  city: string;
  fileName: string;
  originalName: string;
  submissionDate: string;
  status: string;
  applicationType: string;
  complianceStatus: string;
  analysis?: {
    id: number;
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
      example_value: string;
    }>;
    zoningInfo: {
      currentZone: string;
      compliance: string;
      missingRequirements: any[];
      recommendations: string[];
      nextSteps: string[];
    };
  };
  activityLog: Array<{
    date: string;
    action: string;
    description: string;
    user?: string;
  }>;
}

interface ApplicationReviewProps {
  applicationId: number;
  onBack: () => void;
}

export default function EnhancedApplicationReview({ applicationId, onBack }: ApplicationReviewProps) {
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch application details
  const { data: application, isLoading, refetch } = useQuery<ApplicationDetails>({
    queryKey: [`/api/documents/${applicationId}`],
    queryFn: () => apiRequest("GET", `/api/documents/${applicationId}`),
    enabled: !!applicationId,
  });

  // Submit decision
  const decisionMutation = useMutation({
    mutationFn: (data: { decision: string; notes: string }) => 
      apiRequest("POST", `/api/applications/${applicationId}/decision`, data),
    onSuccess: () => {
      toast({
        title: "Decision Submitted",
        description: "Application decision has been recorded successfully.",
      });
      setDecision("");
      setNotes("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit decision",
        variant: "destructive",
      });
    },
  });

  const handleSubmitDecision = () => {
    if (!decision) {
      toast({
        title: "Decision Required",
        description: "Please select a decision before submitting.",
        variant: "destructive",
      });
      return;
    }

    decisionMutation.mutate({ decision, notes });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-4">The requested application could not be found.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Application #{application.id}</h1>
              <p className="text-gray-600">{application.originalName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(application.status)}>
              {application.status.toUpperCase()}
            </Badge>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Application Details */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                <TabsTrigger value="missing">Missing Info</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Application Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">City/Jurisdiction</Label>
                          <p className="text-sm text-gray-900 mt-1">{application.city}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Application Type</Label>
                          <p className="text-sm text-gray-900 mt-1">{application.applicationType}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">File Name</Label>
                          <p className="text-sm text-gray-900 mt-1">{application.fileName}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Submission Date</Label>
                          <p className="text-sm text-gray-900 mt-1">
                            {new Date(application.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Compliance Status</Label>
                          <Badge className={`${getStatusColor(application.complianceStatus)} mt-1`}>
                            {application.complianceStatus}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Compliance Score</Label>
                          {application.analysis ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress value={application.analysis.complianceScore} className="w-24 h-2" />
                              <span className={`text-sm font-medium ${getComplianceColor(application.analysis.complianceScore)}`}>
                                {application.analysis.complianceScore.toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">Analyzing...</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button className="bg-forest hover:bg-forest/90">
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="mt-6">
                {application.analysis ? (
                  <div className="space-y-6">
                    {/* Document Summary */}
                    <Card className="bg-white border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">AI Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Document Classification</Label>
                            <p className="text-sm text-gray-900 mt-1">{application.analysis.classification}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Extracted Information</Label>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                              {Object.entries(application.analysis.keyInformation).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="text-xs font-medium text-gray-600 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
                                  </span>
                                  <span className="text-xs text-gray-900">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compliance Issues */}
                    {application.analysis.complianceIssues.length > 0 && (
                      <Card className="bg-white border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900">Compliance Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {application.analysis.complianceIssues.map((issue, index) => (
                              <div key={index} className={`p-3 rounded-lg border ${
                                issue.severity === 'error' ? 'bg-red-50 border-red-200' :
                                issue.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-start space-x-3">
                                  {issue.severity === 'error' ? (
                                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                  ) : issue.severity === 'warning' ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                  ) : (
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{issue.issue}</p>
                                    <p className="text-xs text-gray-600 mt-1">Section: {issue.section}</p>
                                    {issue.example_value && (
                                      <p className="text-xs text-gray-500 mt-1">Example: {issue.example_value}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {application.analysis.zoningInfo.recommendations.length > 0 && (
                      <Card className="bg-white border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900">AI Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {application.analysis.zoningInfo.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                                <p className="text-sm text-blue-800">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-600">AI analysis in progress...</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="missing" className="mt-6">
                <MissingInfoDetector 
                  documentId={application.id} 
                  onInfoSubmitted={() => refetch()}
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Activity Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {application.activityLog.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                          <div className="w-2 h-2 bg-forest rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                              <span className="text-xs text-gray-500">{activity.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            {activity.user && (
                              <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Staff Decision */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Staff Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="decision" className="text-sm font-medium text-gray-700">Decision</Label>
                  <Select value={decision} onValueChange={setDecision}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select decision..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="return">Return for More Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSubmitDecision}
                  disabled={decisionMutation.isPending || !decision}
                  className="w-full bg-forest hover:bg-forest/90"
                >
                  {decisionMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Decision
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing Time</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.ceil((new Date().getTime() - new Date(application.submissionDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Document Type</span>
                  <span className="text-sm font-medium text-gray-900">{application.analysis?.classification || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Confidence</span>
                  <span className="text-sm font-medium text-green-600">High</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

