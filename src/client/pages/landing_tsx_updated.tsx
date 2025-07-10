import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Brain, 
  Clock, 
  Users, 
  MapPin, 
  Building, 
  Zap,
  Shield,
  TrendingUp,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const { toast } = useToast();

  // Waitlist signup mutation
  const waitlistMutation = useMutation({
    mutationFn: (data: { email: string; name: string; organization: string }) => 
      apiRequest("POST", "/api/waitlist/signup", data),
    onSuccess: () => {
      toast({
        title: "Welcome to the Waitlist!",
        description: "We'll notify you when CiviAI is available for your community.",
      });
      setEmail("");
      setName("");
      setOrganization("");
      setShowWaitlistForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWaitlistSignup = () => {
    if (!email || !name) {
      toast({
        title: "Required Fields",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    waitlistMutation.mutate({ email, name, organization });
  };

  const features = [
    {
      icon: <Brain className="h-6 w-6 text-forest" />,
      title: "AI-Powered Document Analysis",
      description: "Automatically analyze planning documents, identify missing information, and provide compliance scores in real-time."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-forest" />,
      title: "Conversational AI Assistant",
      description: "24/7 AI assistant helps citizens understand permit requirements and guides them through the application process."
    },
    {
      icon: <Clock className="h-6 w-6 text-forest" />,
      title: "Faster Processing Times",
      description: "Reduce application review time by 76% with intelligent pre-screening and automated compliance checking."
    },
    {
      icon: <Shield className="h-6 w-6 text-forest" />,
      title: "Compliance Assurance",
      description: "Ensure all applications meet local zoning requirements with comprehensive regulatory database integration."
    },
    {
      icon: <Users className="h-6 w-6 text-forest" />,
      title: "Rural Community Focus",
      description: "Designed specifically for small rural planning departments with limited staff and resources."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-forest" />,
      title: "Improved Accuracy",
      description: "Eliminate incorrect submissions with intelligent application routing and missing information detection."
    }
  ];

  const benefits = [
    {
      title: "For Planning Departments",
      items: [
        "Reduce staff workload by 60%",
        "Improve application accuracy",
        "Faster decision making",
        "Comprehensive audit trails",
        "Professional AI assistance"
      ]
    },
    {
      title: "For Citizens & Developers",
      items: [
        "24/7 permit guidance",
        "Clear requirements checklist",
        "Real-time compliance feedback",
        "Faster approval process",
        "Reduced application errors"
      ]
    },
    {
      title: "For Rural Communities",
      items: [
        "Affordable SaaS pricing",
        "No IT staff required",
        "Professional-grade tools",
        "Economic development support",
        "Attract investment"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-forest to-forest/80 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                AI-Powered Planning & Permitting
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Transform Your Planning Department with
                <span className="text-sage block">CiviAI</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                The first AI-driven SaaS platform designed specifically for rural planning departments. 
                Analyze documents, detect missing information, and guide citizens through the permitting process with intelligent automation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-sage hover:bg-sage/90 text-forest font-semibold px-8 py-4 text-lg"
                  onClick={() => setShowWaitlistForm(true)}
                >
                  Get on our Wait List
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-forest px-8 py-4 text-lg"
                >
                  Watch Demo
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-sage" />
                    <span className="text-white/90">76% reduction in wrong applications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-sage" />
                    <span className="text-white/90">60% faster processing times</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-sage" />
                    <span className="text-white/90">24/7 AI-powered assistance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-sage" />
                    <span className="text-white/90">Designed for rural communities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Modal */}
      {showWaitlistForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Join the CiviAI Waitlist</CardTitle>
              <p className="text-gray-600">Be the first to know when CiviAI is available for your community.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <Input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="City/County/Organization (optional)"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={handleWaitlistSignup}
                  disabled={waitlistMutation.isPending}
                  className="flex-1 bg-forest hover:bg-forest/90"
                >
                  {waitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowWaitlistForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful AI Features for Modern Planning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CiviAI combines cutting-edge artificial intelligence with deep understanding of rural planning challenges 
              to deliver unprecedented efficiency and accuracy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {feature.icon}
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Benefits for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CiviAI creates value for planning departments, citizens, and rural communities through intelligent automation and expert guidance.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gray-50 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {benefit.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center space-x-3">
                        <CheckCircle2 className="h-4 w-4 text-forest flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantage Section */}
      <section className="py-20 bg-forest text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why CiviAI vs. Traditional Solutions?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Unlike enterprise-focused solutions like Tyler Technologies, CiviAI is built specifically for rural communities with AI-first approach.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-sage">Traditional Solutions</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/90">Rule-based wizard forms</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/90">No document analysis</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/90">Enterprise pricing</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/90">Complex implementation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/90">Limited rural focus</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-sage">CiviAI Advantage</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-sage mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">AI-powered document analysis</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-sage mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Conversational AI interface</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-sage mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Rural-friendly pricing</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-sage mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Simple setup & maintenance</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-sage mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Built for small communities</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sage">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-forest mb-6">
            Ready to Transform Your Planning Department?
          </h2>
          <p className="text-xl text-forest/80 mb-8">
            Join the waitlist to be among the first rural communities to experience the power of AI-driven planning and permitting.
          </p>
          <Button 
            size="lg" 
            className="bg-forest hover:bg-forest/90 text-white font-semibold px-12 py-4 text-lg"
            onClick={() => setShowWaitlistForm(true)}
          >
            Get on our Wait List
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-sage">CiviAI</h3>
              <p className="text-gray-400">
                AI-powered planning and permitting solutions designed specifically for rural communities.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-sage" />
                  <span className="text-gray-400">hello@civiai.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-sage" />
                  <span className="text-gray-400">1-800-CIVI-AI</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-sage transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-sage transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-sage transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-sage transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2025 CiviAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

