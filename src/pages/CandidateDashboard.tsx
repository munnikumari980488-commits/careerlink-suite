import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Search, FileText, Briefcase } from "lucide-react";

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?role=candidate");
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData?.role !== "candidate") {
      toast({
        title: "Access Denied",
        description: "This area is for candidates only",
        variant: "destructive",
      });
      navigate("/auth?role=candidate");
      return;
    }

    setProfile(profileData);
    await fetchApplications(user.id);
  };

  const fetchApplications = async (userId: string) => {
    const { data: applicationsData } = await supabase
      .from("applications")
      .select(`
        *,
        jobs (
          id,
          title,
          location,
          job_type,
          company_name:profiles!jobs_employer_id_fkey(company_name)
        )
      `)
      .eq("candidate_id", userId)
      .order("created_at", { ascending: false });

    if (applicationsData) {
      setApplications(applicationsData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: "bg-muted text-muted-foreground",
      shortlisted: "bg-secondary/10 text-secondary",
      assignment: "bg-warning/10 text-warning",
      technical: "bg-accent/10 text-accent",
      hr_interview: "bg-primary/10 text-primary",
      verification: "bg-primary/10 text-primary",
      hired: "bg-success/10 text-success",
    };
    return colors[status] || "bg-muted";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      applied: "Applied",
      shortlisted: "Shortlisted",
      assignment: "Assignment Round",
      technical: "Technical Interview",
      hr_interview: "HR Interview",
      verification: "Verification",
      hired: "Hired",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-secondary" />
            <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/candidate/profile")}>
              <User className="h-4 w-4 mr-2" />
              My Profile
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name}</h2>
          <p className="text-muted-foreground">Track your applications and find new opportunities</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{applications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {applications.filter((a) => !["hired", "applied"].includes(a.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {applications.filter((a) => a.status === "hired").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">My Applications</h3>
          <Button onClick={() => navigate("/jobs")}>
            <Search className="h-4 w-4 mr-2" />
            Browse Jobs
          </Button>
        </div>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">Start applying to jobs to see them here</p>
              <Button onClick={() => navigate("/jobs")}>
                <Search className="h-4 w-4 mr-2" />
                Browse Available Jobs
              </Button>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id} className="hover:shadow-[var(--shadow-card)] transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold mb-2">{application.jobs.title}</h4>
                      <p className="text-muted-foreground mb-2">
                        {application.jobs.company_name?.company_name || "Company"} • {application.jobs.location} • {application.jobs.job_type}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/jobs/${application.job_id}`)}
                    >
                      View Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
