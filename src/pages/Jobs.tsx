import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase, DollarSign, LogOut, User, Calendar, Building2, UserCircle } from "lucide-react";

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, typeFilter, experienceFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select(`
        *,
        profiles!jobs_employer_id_fkey(company_name, full_name)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (data) {
      setJobs(data);
      setFilteredJobs(data);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((job) => job.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((job) => job.job_type === typeFilter);
    }

    if (experienceFilter !== "all") {
      filtered = filtered.filter((job) => {
        const exp = parseInt(job.experience_required) || 0;
        if (experienceFilter === "fresher") return exp === 0;
        if (experienceFilter === "1-2") return exp >= 1 && exp <= 2;
        if (experienceFilter === "3-5") return exp >= 3 && exp <= 5;
        if (experienceFilter === "5+") return exp > 5;
        return true;
      });
    }

    setFilteredJobs(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">JobPortal</h1>
          </div>
          <div className="flex gap-2">
            {session ? (
              <>
                <Button variant="outline" onClick={() => navigate("/candidate/dashboard")}>
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth?role=candidate")}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Find Your Next Opportunity</h2>
          
          {/* Search and Filters */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="pune">Pune</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Work From Home">Work From Home</SelectItem>
                <SelectItem value="Work From Office">Work From Office</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
                <SelectItem value="Full Time">Full Time</SelectItem>
                <SelectItem value="Part Time">Part Time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience</SelectItem>
                <SelectItem value="fresher">Fresher (0 yrs)</SelectItem>
                <SelectItem value="1-2">1-2 Years</SelectItem>
                <SelectItem value="3-5">3-5 Years</SelectItem>
                <SelectItem value="5+">5+ Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className="hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">{job.profiles?.company_name || "Company"}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-4 w-4" />
                          HR: {job.profiles?.full_name || "N/A"}
                        </div>
                        {job.department && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            Dept: {job.department}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.job_type}
                        </div>
                        {(job.salary_min || job.salary_max) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary_min && job.salary_max
                              ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`
                              : job.salary_min
                                ? `₹${job.salary_min.toLocaleString()}`
                                : `₹${job.salary_max?.toLocaleString()}`}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted: {new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2">{job.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>View Details</Button>
                      <Button onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!session) { 
                          navigate("/auth?role=candidate"); 
                        } else { 
                          navigate(`/jobs/${job.id}`); 
                        } 
                      }}>Apply Now</Button>
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

export default Jobs;
