import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  Building2, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  MapPin,
  Users,
  TrendingUp,
  Bell
} from 'lucide-react';

interface OregonPlanningGoal {
  goal_number: number;
  title: string;
  description: string;
  status: string;
}

interface OregonApplication {
  id: number;
  application_number: string;
  applicant_name: string;
  project_type: string;
  jurisdiction_name: string;
  submission_date: string;
  status: string;
  compliance_score?: number;
}

interface RegulatoryUpdate {
  id: number;
  source: string;
  update_type: string;
  title: string;
  description: string;
  effective_date: string;
  impact_level: string;
  created_at: string;
}

interface Notification {
  id: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  action_required: boolean;
  deadline?: string;
  created_at: string;
}

interface MonitoringStatus {
  isRunning: boolean;
  nextScheduledRuns: {
    dlcd: string;
    oar: string;
    ors: string;
    papa: string;
    deadlines: string;
  };
}

export function OregonMCPDashboard() {
  const [goals, setGoals] = useState<OregonPlanningGoal[]>([]);
  const [applications, setApplications] = useState<OregonApplication[]>([]);
  const [updates, setUpdates] = useState<RegulatoryUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = '/api/oregon';

      // Fetch all data in parallel
      const [goalsRes, applicationsRes, updatesRes, notificationsRes] = await Promise.all([
        fetch(`${baseUrl}/goals`),
        fetch(`${baseUrl}/applications`),
        fetch(`${baseUrl}/updates?limit=5`),
        fetch(`${baseUrl}/notifications`)
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.data || []);
      }

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        setApplications(applicationsData.data || []);
      }

      if (updatesRes.ok) {
        const updatesData = await updatesRes.json();
        setUpdates(updatesData.data || []);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.data || []);
      }

    } catch (err) {
      setError('Failed to fetch Oregon planning data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerMonitoring = async () => {
    try {
      const response = await fetch('/api/oregon/monitor', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Monitoring completed! Found ${result.data.updatesFound} updates.`);
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error triggering monitoring:', err);
      alert('Failed to trigger monitoring');
    }
  };

  const analyzeApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/oregon/applications/${applicationId}/analyze`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Analysis completed! Compliance score: ${result.data.overallScore}%`);
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error analyzing application:', err);
      alert('Failed to analyze application');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Oregon planning data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const approvedApplications = applications.filter(app => app.status === 'approved');
  const highPriorityNotifications = notifications.filter(n => n.priority === 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Oregon Planning MCP</h1>
          <p className="text-gray-600">AI-Powered Oregon Land Planning & Development Management</p>
        </div>
        <Button onClick={triggerMonitoring} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Trigger Monitoring
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planning Goals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">Statewide Goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting Decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regulatory Updates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
            <p className="text-xs text-muted-foreground">Recent Updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="goals">Planning Goals</TabsTrigger>
          <TabsTrigger value="updates">Regulatory Updates</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oregon Planning Applications</CardTitle>
              <CardDescription>Manage and track planning applications across Oregon jurisdictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{app.application_number}</h3>
                        <Badge variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'destructive'}>
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{app.applicant_name}</p>
                      <p className="text-sm text-gray-500">{app.project_type} • {app.jurisdiction_name}</p>
                      {app.compliance_score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Compliance Score:</span>
                            <Progress value={app.compliance_score} className="w-24" />
                            <span className="text-sm font-medium">{app.compliance_score}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => analyzeApplication(app.id)}
                        disabled={app.status !== 'pending'}
                      >
                        Analyze
                      </Button>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No applications found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oregon Statewide Planning Goals</CardTitle>
              <CardDescription>All 19 statewide planning goals for Oregon land use planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <div key={goal.goal_number} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Goal {goal.goal_number}</Badge>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{goal.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{goal.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Regulatory Updates</CardTitle>
              <CardDescription>Latest updates from Oregon DLCD and regulatory sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={update.impact_level === 'High' ? 'destructive' : update.impact_level === 'Medium' ? 'default' : 'secondary'}>
                          {update.impact_level}
                        </Badge>
                        <Badge variant="outline">{update.update_type}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(update.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2">{update.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Source: {update.source}</span>
                      {update.effective_date && (
                        <span>• Effective: {new Date(update.effective_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
                {updates.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No recent updates</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>System notifications and alerts for Oregon planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <Badge variant={notification.priority === 'high' ? 'destructive' : notification.priority === 'medium' ? 'default' : 'secondary'}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline">{notification.type}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    {notification.action_required && (
                      <Badge variant="destructive" className="text-xs">Action Required</Badge>
                    )}
                    {notification.deadline && (
                      <p className="text-xs text-gray-500 mt-2">
                        Deadline: {new Date(notification.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No notifications</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* High Priority Alerts */}
      {highPriorityNotifications.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Priority Alerts</AlertTitle>
          <AlertDescription>
            You have {highPriorityNotifications.length} high priority notifications that require immediate attention.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 