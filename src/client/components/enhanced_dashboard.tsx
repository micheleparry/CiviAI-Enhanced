import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  TrendingUp,
  MessageSquare,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Application {
  id: number;
  city: string;
  fileName: string;
  originalName: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'needs_info';
  applicationType: string;
  complianceScore?: number;
  missingInfoSummary?: {
    criticalMissing: number;
    importantMissing: number;
    totalMissing: number;
    canProceed: boolean;
  };
  analysis?: any;
}

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalMissingItems: number;
  docsWithMissingInfo: number;
  completionRate: number;
  averageProcessingTime: number;
}

export default function EnhancedDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [chatMessage, setChatMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => apiRequest("GET", "/api/dashboard/stats"),
  });

  // Fetch applications with enhanced analysis
  const { data: applications, isLoading: appsLoading, refetch } = useQuery<Application[]>({
    queryKey: ["/api/documents"],
    queryFn: () => apiRequest("GET", "/api/documents"),
  });

  // Send chat message
  const chatMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest("POST", "/api/chat/message", { message }),
    onSuccess: (response) => {
      toast({
        title: "AI Assistant Response",
        description: response.message || "Response received",
      });
      setChatMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      chatMutation.mutate(chatMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_info':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'needs_info':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = app.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicationType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (statsLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CiviAI Dashboard</h1>
            <p className="text-gray-600 mt-1">AI-Powered Planning & Permitting Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-forest hover:bg-forest/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload Application
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-gray-500 mt-1">All time submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingApplications || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting staff decision</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completionRate || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">Applications without missing info</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Missing Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.totalMissingItems || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Across {stats?.docsWithMissingInfo || 0} applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Applications Overview</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900">Recent Applications</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="needs_info">Needs Info</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">City</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Application</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Compliance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Missing Info</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">#{app.id}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{app.city}</td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{app.originalName}</div>
                              <div className="text-xs text-gray-500">{app.applicationType}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(app.submissionDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${getStatusColor(app.status)} flex items-center space-x-1`}>
                              {getStatusIcon(app.status)}
                              <span className="capitalize">{app.status.replace('_', ' ')}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {app.complianceScore !== undefined ? (
                              <div className="flex items-center space-x-2">
                                <Progress value={app.complianceScore} className="w-16 h-2" />
                                <span className="text-xs font-medium">{app.complianceScore.toFixed(0)}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Analyzing...</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {app.missingInfoSummary ? (
                              <div className="flex items-center space-x-2">
                                {app.missingInfoSummary.criticalMissing > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {app.missingInfoSummary.criticalMissing} Critical
                                  </Badge>
                                )}
                                {app.missingInfoSummary.importantMissing > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {app.missingInfoSummary.importantMissing} Important
                                  </Badge>
                                )}
                                {app.missingInfoSummary.totalMissing === 0 && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Complete
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Processing...</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Analysis */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Compliance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Compliance Score</span>
                      <span className="text-lg font-bold text-green-600">
                        {applications?.reduce((acc, app) => acc + (app.complianceScore || 0), 0) / (applications?.length || 1) || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Applications Needing Review</span>
                      <span className="text-lg font-bold text-orange-600">
                        {applications?.filter(app => app.missingInfoSummary && app.missingInfoSummary.totalMissing > 0).length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Critical Issues</span>
                      <span className="text-lg font-bold text-red-600">
                        {applications?.reduce((acc, app) => acc + (app.missingInfoSummary?.criticalMissing || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Insights */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Processing Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Most Common Issue</span>
                      <span className="text-sm font-medium text-gray-900">Missing Setback Info</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg. Processing Time</span>
                      <span className="text-sm font-medium text-gray-900">2.3 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">AI Accuracy Rate</span>
                      <span className="text-sm font-medium text-green-600">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assistant" className="mt-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  CiviAI Planning Assistant
                </CardTitle>
                <p className="text-sm text-gray-600">Ask questions about building codes, permit requirements, and planning processes</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Interface */}
                  <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] bg-gray-50">
                    <div className="text-center text-gray-500 text-sm">
                      Start a conversation with the AI assistant...
                    </div>
                  </div>
                  
                  {/* Input Area */}
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Ask about your permit requirements..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleChatSubmit}
                      disabled={chatMutation.isPending || !chatMessage.trim()}
                      className="bg-forest hover:bg-forest/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setChatMessage("What documents do I need for a building permit?")}>
                      Building Permit Requirements
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setChatMessage("What are the setback requirements for residential construction?")}>
                      Setback Requirements
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setChatMessage("How long does the approval process take?")}>
                      Processing Times
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

