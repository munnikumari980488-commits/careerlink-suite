import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ArrowLeft } from "lucide-react";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [hrName, setHrName] = useState("");
  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    salary_min: "",
    salary_max: "",
    experience_required: "",
    location: "",
    job_type: "Work From Office",
    department: "",
  });

  useEffect(() => {
    checkAuth();
    fetchJobData();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?role=employer");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, full_name")
      .eq("id", session.user.id)
      .single();
    if (profile) {
      setCompanyName(profile.company_name || "");
      setHrName(profile.full_name || "");
    }
  };

  const fetchJobData = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
      navigate("/employer/dashboard");
    } else if (data) {
      setJobData({
        title: data.title,
        description: data.description,
        salary_min: data.salary_min?.toString() || "",
        salary_max: data.salary_max?.toString() || "",
        experience_required: data.experience_required || "",
        location: data.location,
        job_type: data.job_type,
        department: data.department || "",
      });
    }
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        title: jobData.title,
        description: jobData.description,
        salary_min: jobData.salary_min ? parseInt(jobData.salary_min) : null,
        salary_max: jobData.salary_max ? parseInt(jobData.salary_max) : null,
        experience_required: jobData.experience_required,
        location: jobData.location,
        job_type: jobData.job_type,
        department: jobData.department || null,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Job updated successfully",
      });
      navigate(`/employer/jobs/${id}`);
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(`/employer/jobs/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Pencil className="h-6 w-6" />
              Edit Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input value={companyName} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>HR / Posted By</Label>
                  <Input value={hrName} disabled className="bg-muted" />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={jobData.title}
                  onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary_min">Minimum Salary (₹)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={jobData.salary_min}
                    onChange={(e) => setJobData({ ...jobData, salary_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max">Maximum Salary (₹)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={jobData.salary_max}
                    onChange={(e) => setJobData({ ...jobData, salary_max: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Required Experience</Label>
                <Input
                  id="experience"
                  placeholder="e.g., 2-5 years"
                  value={jobData.experience_required}
                  onChange={(e) => setJobData({ ...jobData, experience_required: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering, Marketing"
                  value={jobData.department}
                  onChange={(e) => setJobData({ ...jobData, department: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={jobData.location}
                  onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="job_type">Job Type *</Label>
                <Select value={jobData.job_type} onValueChange={(value) => setJobData({ ...jobData, job_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Work From Home">Work From Home</SelectItem>
                    <SelectItem value="Work From Office">Work From Office</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditJob;
