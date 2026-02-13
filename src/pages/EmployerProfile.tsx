import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, Upload, Building2, Globe, MapPin, Mail, Phone, User } from "lucide-react";

const EmployerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const targetId = id || user?.id;
    if (!targetId) { navigate("/auth?role=employer"); return; }

    // Check ownership and admin
    if (user) {
      setIsOwner(user.id === targetId);
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!role);
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .single();

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setCompanyName(data.company_name || "");
      setCompanyDescription((data as any).company_description || "");
      setCompanyWebsite((data as any).company_website || "");
      setCompanyAddress((data as any).company_address || "");
      setPhone(data.phone || "");
      setProfileImageUrl((data as any).profile_image_url || "");
      setCompanyLogoUrl((data as any).company_logo_url || "");
    }
    setLoading(false);
  };

  const canEdit = isOwner || isAdmin;

  const handleImageUpload = async (file: File, type: "profile" | "logo") => {
    const setter = type === "profile" ? setUploadingImage : setUploadingLogo;
    setter(true);

    const targetId = profile?.id;
    const filePath = `${targetId}/${type}-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      setter(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    if (type === "profile") {
      setProfileImageUrl(publicUrl);
    } else {
      setCompanyLogoUrl(publicUrl);
    }

    setter(false);
    toast({ title: "Uploaded!", description: `${type === "profile" ? "Profile image" : "Company logo"} uploaded.` });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName,
        phone,
        profile_image_url: profileImageUrl,
        company_logo_url: companyLogoUrl,
        company_description: companyDescription,
        company_website: companyWebsite,
        company_address: companyAddress,
      } as any)
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile Saved", description: "Employer profile updated successfully." });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Image */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={profileImageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                {canEdit && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "profile")}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploadingImage}>
                      <span><Upload className="h-3 w-3 mr-1" />{uploadingImage ? "Uploading..." : "Photo"}</span>
                    </Button>
                  </label>
                )}
              </div>

              {/* Company Logo */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-28 w-28 rounded-lg">
                  <AvatarImage src={companyLogoUrl} className="rounded-lg" />
                  <AvatarFallback className="bg-secondary/10 text-secondary text-3xl rounded-lg">
                    <Building2 className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                {canEdit && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo")}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploadingLogo}>
                      <span><Upload className="h-3 w-3 mr-1" />{uploadingLogo ? "Uploading..." : "Logo"}</span>
                    </Button>
                  </label>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">{companyName || "Company Name"}</h1>
                <p className="text-lg text-muted-foreground mb-3">{fullName}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Mail className="h-4 w-4" />{profile.email}</div>
                  {phone && <div className="flex items-center gap-1"><Phone className="h-4 w-4" />{phone}</div>}
                  {companyAddress && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{companyAddress}</div>}
                  {companyWebsite && <div className="flex items-center gap-1"><Globe className="h-4 w-4" /><a href={companyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyWebsite}</a></div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {canEdit ? (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" /></div>
                </div>
                <div><Label>Email</Label><Input value={profile.email} disabled /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
                  <div><Label>Website</Label><Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." /></div>
                </div>
                <div><Label>Address</Label><Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></div>
                <div><Label>Company Description</Label><Textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={4} placeholder="About the company..." /></div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle>About the Company</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{companyDescription || "No description available."}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default EmployerProfile;
