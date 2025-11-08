import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Building2 } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchJobDetails();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
  };

  const fetchJobDetails = async () => {
    setLoading(true);
    
    // Fetch job details
    const { data: jobData } = await supabase
      .from("jobs")
      .select(`
        *,
        profiles!jobs_employer_id_fkey(company_name, full_name)
      `)
      .eq("id", id)
      .single();

    if (jobData) {
      setJob(jobData);
      
      // Check if user has already applied
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: applicationData } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", id)
          .eq("candidate_id", session.user.id)
          .maybeSingle();
        
        setHasApplied(!!applicationData);
      }
    }
    
    setLoading(false);
  };

  const handleApply = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login as a candidate to apply for jobs.",
        variant: "destructive",
      });
      navigate("/auth?role=candidate");
      return;
    }

    if (!resumeUrl.trim()) {
      toast({
        title: "Resume Required",
        description: "Please provide a link to your resume.",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);

    const { error } = await supabase
      .from("applications")
      .insert({
        job_id: id,
        candidate_id: session.user.id,
        resume_link: resumeUrl,
        status: "applied",
      });

    if (error) {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully.",
      });
      setHasApplied(true);
    }

    setApplying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <Button onClick={() => navigate("/jobs")}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/jobs")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{job.profiles?.company_name || "Company"}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.job_type}</span>
                  </div>
                  {job.salary_min && job.salary_max && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{job.experience_required} years exp.</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>
                  {hasApplied ? "Already Applied" : "Apply for this Job"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      You have already applied for this position. Track your application status in your dashboard.
                    </p>
                    <Button 
                      onClick={() => navigate("/candidate/dashboard")}
                      className="w-full"
                    >
                      View Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resumeUrl">Resume URL *</Label>
                      <Input
                        id="resumeUrl"
                        placeholder="https://drive.google.com/..."
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Share a link to your resume (Google Drive, Dropbox, etc.)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                      <Textarea
                        id="coverLetter"
                        placeholder="Tell us why you're a great fit..."
                        rows={5}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleApply}
                      disabled={applying || !session}
                      className="w-full"
                    >
                      {applying ? "Submitting..." : "Submit Application"}
                    </Button>

                    {!session && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please <button onClick={() => navigate("/auth?role=candidate")} className="text-primary underline">login</button> to apply
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobDetail;
