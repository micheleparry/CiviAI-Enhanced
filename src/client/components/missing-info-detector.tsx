import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Info, 
  Send, 
  RefreshCw,
  ClipboardList,
  Target,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MissingRequirement {
  category: string;
  field_name: string;
  description: string;
  importance: string;
  suggested_source: string;
  example_value?: string;
}

interface MissingInfoData {
  documentId: number;
  documentType: string;
  complianceScore: number;
  missingRequirements: MissingRequirement[];
  recommendations: string[];
  nextSteps: string[];
  foundInformation: Record<string, any>;
}

interface MissingInfoDetectorProps {
  documentId: number;
  onInfoSubmitted?: () => void;
}

export default function MissingInfoDetector({ documentId, onInfoSubmitted }: MissingInfoDetectorProps) {
  const [missingInfo, setMissingInfo] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch missing information analysis
  const { data: analysisData, isLoading, refetch } = useQuery<MissingInfoData>({
    queryKey: [`/api/documents/analyze-missing`, documentId],
    queryFn: () => apiRequest("POST", "/api/documents/analyze-missing", { documentId }),
    enabled: !!documentId,
  });

  // Submit missing information
  const submitMutation = useMutation({
    mutationFn: (data: Record<string, string>) => 
      apiRequest("POST", "/api/documents/submit-missing", { 
        documentId, 
        missingInfo: data 
      }),
    onSuccess: (data) => {
      toast({
        title: "Information Submitted",
        description: `Missing information submitted successfully. Compliance score updated to ${data.updatedComplianceScore}%.`,
      });
      setMissingInfo({});
      refetch();
      onInfoSubmitted?.();
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit missing information",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (fieldName: string, value: string) => {
    setMissingInfo(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = () => {
    const filledFields = Object.entries(missingInfo).filter(([_, value]) => value.trim());
    
    if (filledFields.length === 0) {
      toast({
        title: "No Information Provided",
        description: "Please fill in at least one field before submitting.",
        variant: "destructive",
      });
      return;
    }

    const submitData = Object.fromEntries(filledFields);
    submitMutation.mutate(submitData);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'recommended':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'important':
        return <Info className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const { criticalMissing, importantMissing, recommendedMissing } = useMemo(() => {
    if (!analysisData?.missingRequirements) {
      return { criticalMissing: [], importantMissing: [], recommendedMissing: [] };
    }
    return {
      criticalMissing: analysisData.missingRequirements.filter(req => req.importance === 'critical'),
      importantMissing: analysisData.missingRequirements.filter(req => req.importance === 'important'),
      recommendedMissing: analysisData.missingRequirements.filter(req => req.importance === 'recommended')
    };
  }, [analysisData?.missingRequirements]);

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-forest">
            <ClipboardList className="h-5 w-5 mr-2" />
            Analyzing Missing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
            <span className="ml-3 text-gray-600">Analyzing document requirements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-forest">
            <ClipboardList className="h-5 w-5 mr-2" />
            Missing Information Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to analyze missing information. The document may still be processing.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-4"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-forest">
          <div className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Missing Information Analysis
          </div>
          <Badge variant="outline" className="text-sm">
            {analysisData.documentType.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
        
        {/* Compliance Score */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Compliance Score</span>
            <span className={`text-lg font-bold ${
              analysisData.complianceScore >= 90 ? 'text-green-600' :
              analysisData.complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysisData.complianceScore.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={analysisData.complianceScore} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {criticalMissing.length} critical, {importantMissing.length} important, {recommendedMissing.length} recommended items missing
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="missing">
              Missing Info
              {(criticalMissing.length + importantMissing.length) > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {criticalMissing.length + importantMissing.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="found">Found Info</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-4">
              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{criticalMissing.length}</div>
                  <div className="text-sm text-red-700">Critical Missing</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{importantMissing.length}</div>
                  <div className="text-sm text-yellow-700">Important Missing</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.keys(analysisData.foundInformation).length}
                  </div>
                  <div className="text-sm text-green-700">Items Found</div>
                </div>
              </div>

              {/* Quick Actions */}
              {criticalMissing.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Action Required:</strong> {criticalMissing.length} critical items must be provided before your application can proceed.
                  </AlertDescription>
                </Alert>
              )}

              {criticalMissing.length === 0 && importantMissing.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Recommended:</strong> Providing {importantMissing.length} additional items will improve your application.
                  </AlertDescription>
                </Alert>
              )}

              {criticalMissing.length === 0 && importantMissing.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Great!</strong> Your document appears to have all required information.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="missing" className="mt-6">
            <div className="space-y-6">
              {/* Critical Missing Items */}
              {criticalMissing.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Critical Requirements ({criticalMissing.length})
                  </h4>
                  <div className="space-y-3">
                    {criticalMissing.map((req, index) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Label htmlFor={req.field_name} className="text-sm font-medium text-red-800">
                              {req.description}
                            </Label>
                            <p className="text-xs text-red-600 mt-1">Source: {req.suggested_source}</p>
                          </div>
                          <Badge className={getImportanceColor(req.importance)}>
                            {req.importance}
                          </Badge>
                        </div>
                        <Input
                          id={req.field_name}
                          placeholder={req.example_value || `Enter ${req.description.toLowerCase()}`}
                          value={missingInfo[req.field_name] || ''}
                          onChange={(e) => handleInputChange(req.field_name, e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Missing Items */}
              {importantMissing.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Important Requirements ({importantMissing.length})
                  </h4>
                  <div className="space-y-3">
                    {importantMissing.map((req, index) => (
                      <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Label htmlFor={req.field_name} className="text-sm font-medium text-yellow-800">
                              {req.description}
                            </Label>
                            <p className="text-xs text-yellow-600 mt-1">Source: {req.suggested_source}</p>
                          </div>
                          <Badge className={getImportanceColor(req.importance)}>
                            {req.importance}
                          </Badge>
                        </div>
                        <Input
                          id={req.field_name}
                          placeholder={req.example_value || `Enter ${req.description.toLowerCase()}`}
                          value={missingInfo[req.field_name] || ''}
                          onChange={(e) => handleInputChange(req.field_name, e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Missing Items */}
              {recommendedMissing.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Recommended Information ({recommendedMissing.length})
                  </h4>
                  <div className="space-y-3">
                    {recommendedMissing.map((req, index) => (
                      <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Label htmlFor={req.field_name} className="text-sm font-medium text-blue-800">
                              {req.description}
                            </Label>
                            <p className="text-xs text-blue-600 mt-1">Source: {req.suggested_source}</p>
                          </div>
                          <Badge className={getImportanceColor(req.importance)}>
                            {req.importance}
                          </Badge>
                        </div>
                        <Input
                          id={req.field_name}
                          placeholder={req.example_value || `Enter ${req.description.toLowerCase()}`}
                          value={missingInfo[req.field_name] || ''}
                          onChange={(e) => handleInputChange(req.field_name, e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {(criticalMissing.length > 0 || importantMissing.length > 0 || recommendedMissing.length > 0) && (
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="bg-forest hover:bg-forest/90"
                  >
                    {submitMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit Information
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="found" className="mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Information Found in Document
              </h4>
              
              {Object.keys(analysisData.foundInformation).length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No specific information was automatically extracted from the document.
                </p>
              ) : (
                <div className="grid gap-3">
                  {Object.entries(analysisData.foundInformation).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-800 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
                      </span>
                      <span className="text-sm text-green-700 font-mono">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="guidance" className="mt-6">
            <div className="space-y-6">
              {/* Recommendations */}
              {analysisData.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {analysisData.nextSteps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Next Steps
                  </h4>
                  <div className="space-y-2">
                    {analysisData.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 rounded-full bg-forest text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-800">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

