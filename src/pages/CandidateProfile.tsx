import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface Education {
  degree: string;
  institution: string;
  year: string;
  percentage: string;
}

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string;
  link: string;
}

interface Achievement {
  title: string;
  description: string;
  date: string;
}

const CandidateProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [resumeLink, setResumeLink] = useState("");
  
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?role=candidate");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name || "");
      setPhone(profileData.phone || "");
      setBio(profileData.bio || "");
      setSkills(profileData.skills?.join(", ") || "");
      setResumeLink(profileData.resume_link || "");
      setEducation((profileData.education as any[]) || []);
      setExperience((profileData.experience as any[]) || []);
      setProjects((profileData.projects as any[]) || []);
      setAchievements((profileData.achievements as any[]) || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          bio,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          resume_link: resumeLink,
          education: education as any,
          experience: experience as any,
          projects: projects as any,
          achievements: achievements as any,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/candidate/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile?.email} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 1234567890" />
              </div>
              <div>
                <Label>Resume Link (Google Drive/Dropbox)</Label>
                <Input value={resumeLink} onChange={(e) => setResumeLink(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." />
              </div>
              <div>
                <Label>Skills (comma separated)</Label>
                <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Python..." />
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Education</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setEducation([...education, { degree: "", institution: "", year: "", percentage: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEducation(education.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].degree = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="B.Tech, MBA, etc."
                      />
                    </div>
                    <div>
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].institution = e.target.value;
                          setEducation(newEdu);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input
                        value={edu.year}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].year = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="2020-2024"
                      />
                    </div>
                    <div>
                      <Label>Percentage/CGPA</Label>
                      <Input
                        value={edu.percentage}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].percentage = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="85% or 8.5 CGPA"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Work Experience</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setExperience([...experience, { title: "", company: "", duration: "", description: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExperience(experience.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].title = e.target.value;
                          setExperience(newExp);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].company = e.target.value;
                          setExperience(newExp);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={exp.duration}
                        onChange={(e) => {
                          const newExp = [...experience];
                          newExp[index].duration = e.target.value;
                          setExperience(newExp);
                        }}
                        placeholder="Jan 2020 - Dec 2021"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...experience];
                        newExp[index].description = e.target.value;
                        setExperience(newExp);
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Projects</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setProjects([...projects, { name: "", description: "", technologies: "", link: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map((proj, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setProjects(projects.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label>Project Name</Label>
                    <Input
                      value={proj.name}
                      onChange={(e) => {
                        const newProj = [...projects];
                        newProj[index].name = e.target.value;
                        setProjects(newProj);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={proj.description}
                      onChange={(e) => {
                        const newProj = [...projects];
                        newProj[index].description = e.target.value;
                        setProjects(newProj);
                      }}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Technologies Used</Label>
                    <Input
                      value={proj.technologies}
                      onChange={(e) => {
                        const newProj = [...projects];
                        newProj[index].technologies = e.target.value;
                        setProjects(newProj);
                      }}
                      placeholder="React, Node.js, MongoDB"
                    />
                  </div>
                  <div>
                    <Label>Project Link (GitHub/Live)</Label>
                    <Input
                      value={proj.link}
                      onChange={(e) => {
                        const newProj = [...projects];
                        newProj[index].link = e.target.value;
                        setProjects(newProj);
                      }}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Achievements</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setAchievements([...achievements, { title: "", description: "", date: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Achievement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((ach, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAchievements(achievements.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label>Achievement Title</Label>
                      <Input
                        value={ach.title}
                        onChange={(e) => {
                          const newAch = [...achievements];
                          newAch[index].title = e.target.value;
                          setAchievements(newAch);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        value={ach.date}
                        onChange={(e) => {
                          const newAch = [...achievements];
                          newAch[index].date = e.target.value;
                          setAchievements(newAch);
                        }}
                        placeholder="Jan 2023"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={ach.description}
                      onChange={(e) => {
                        const newAch = [...achievements];
                        newAch[index].description = e.target.value;
                        setAchievements(newAch);
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateProfile;
