import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Briefcase, Users, ExternalLink, Mail } from "lucide-react";

const ManageApplications = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assignmentData, setAssignmentData] = useState<{ [key: string]: { name: string; link: string } }>({});

  useEffect(() => {
    checkAuth();
    fetchJobAndApplications();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?role=employer");
    }
  };

  const fetchJobAndApplications = async () => {
    setLoading(true);

    // Fetch job details
    const { data: jobData } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobData) {
      setJob(jobData);

      // Fetch applications with candidate profiles
      const { data: applicationsData } = await supabase
        .from("applications")
        .select(`
          *,
          profiles!applications_candidate_id_fkey(
            full_name,
            email,
            phone
          )
        `)
        .eq("job_id", id)
        .order("created_at", { ascending: false });

      if (applicationsData) {
        setApplications(applicationsData);
      }
    }

    setLoading(false);
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    setUpdatingStatus(applicationId);
    
    try {
      const application = applications.find(app => app.id === applicationId);
      const updateData: any = { status: newStatus };
      
      // If status is "assignment", include assignment details
      if (newStatus === "assignment" && assignmentData[applicationId]) {
        updateData.assignment_name = assignmentData[applicationId].name;
        updateData.assignment_link = assignmentData[applicationId].link;
      }

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke("send-application-email", {
          body: {
            to: application.profiles?.email,
            candidateName: application.profiles?.full_name || "Candidate",
            jobTitle: job?.title,
            status: newStatus,
            assignmentName: updateData.assignment_name,
            assignmentLink: updateData.assignment_link,
          },
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      toast({
        title: "Status Updated",
        description: "Application status updated and email sent to candidate.",
      });
      
      fetchJobAndApplications();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleNotesUpdate = async (applicationId: string, notes: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ notes })
      .eq("id", applicationId);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Notes Saved",
        description: "Your notes have been saved.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      shortlisted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      assignment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      technical_interview: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      hr_interview: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      verification: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      hired: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      applied: "Applied",
      shortlisted: "Shortlisted",
      assignment: "Assignment Round",
      technical_interview: "Technical Interview",
      hr_interview: "HR Interview",
      verification: "Verification",
      hired: "Hired",
      rejected: "Rejected",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <Button onClick={() => navigate("/employer/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/employer/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Job Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">{job.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{job.job_type}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{applications.length} Applications</span>
              </div>
            </div>
            <p className="text-muted-foreground">{job.description}</p>
          </CardContent>
        </Card>

        {/* Applications */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Applications</h2>
        </div>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">Candidates will appear here once they apply</p>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Candidate Info */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {application.profiles?.full_name || "Candidate"}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {application.profiles?.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {application.profiles.email}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Applied {new Date(application.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                      </span>
                    </div>

                    {/* Resume Link */}
                    {application.resume_link && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(application.resume_link, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Resume
                        </Button>
                      </div>
                    )}

                    {/* Assignment Display (if exists) */}
                    {application.assignment_name && application.assignment_link && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <Label className="text-sm font-medium">Assignment Given</Label>
                        <p className="text-sm mt-1"><strong>Name:</strong> {application.assignment_name}</p>
                        <a 
                          href={application.assignment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {application.assignment_link}
                        </a>
                      </div>
                    )}

                    {/* Status Update and Assignment */}
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Update Status</Label>
                          <Select
                            value={application.status}
                            onValueChange={(value) => handleStatusUpdate(application.id, value)}
                            disabled={updatingStatus === application.id}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="assignment">Assignment Round</SelectItem>
                              <SelectItem value="technical_interview">Technical Interview</SelectItem>
                              <SelectItem value="hr_interview">HR Interview</SelectItem>
                              <SelectItem value="verification">Verification</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Notes */}
                        <div>
                          <Label>Private Notes</Label>
                          <Textarea
                            placeholder="Add private notes about this candidate..."
                            defaultValue={application.notes || ""}
                            onBlur={(e) => handleNotesUpdate(application.id, e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Assignment Input (shows for assignment status) */}
                      {application.status === "assignment" && (
                        <div className="bg-primary/5 p-4 rounded-lg space-y-3">
                          <Label>Assignment Details (will be emailed to candidate)</Label>
                          <Input
                            placeholder="Assignment Name (e.g., React Component Task)"
                            value={assignmentData[application.id]?.name || application.assignment_name || ""}
                            onChange={(e) => setAssignmentData({
                              ...assignmentData,
                              [application.id]: {
                                ...assignmentData[application.id],
                                name: e.target.value,
                                link: assignmentData[application.id]?.link || application.assignment_link || ""
                              }
                            })}
                          />
                          <Input
                            placeholder="Assignment Link (e.g., https://docs.google.com/...)"
                            value={assignmentData[application.id]?.link || application.assignment_link || ""}
                            onChange={(e) => setAssignmentData({
                              ...assignmentData,
                              [application.id]: {
                                ...assignmentData[application.id],
                                link: e.target.value,
                                name: assignmentData[application.id]?.name || application.assignment_name || ""
                              }
                            })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Click "Submit" in the status dropdown above to save and send email
                          </p>
                        </div>
                      )}
                    </div>
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

export default ManageApplications;
