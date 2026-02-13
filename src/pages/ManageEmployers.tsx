import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, UserPlus, Building2, Globe, MapPin, Mail, Phone, Search, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ManageEmployers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    companyDescription: "",
    companyWebsite: "",
    companyAddress: "",
    phone: "",
  });

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth?role=employer"); return; }

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      toast({ title: "Access Denied", description: "Admin access required", variant: "destructive" });
      navigate("/employer/dashboard");
      return;
    }

    fetchEmployers();
  };

  const fetchEmployers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employer")
      .order("created_at", { ascending: false });

    if (data) setEmployers(data);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-employer-user", {
        body: {
          email: newUserData.email,
          password: newUserData.password,
          fullName: newUserData.fullName,
          companyName: newUserData.companyName,
          companyDescription: newUserData.companyDescription,
          companyWebsite: newUserData.companyWebsite,
          companyAddress: newUserData.companyAddress,
          phone: newUserData.phone,
        },
      });

      if (error) throw error;

      toast({ title: "User Created", description: `Employer account created for ${newUserData.email}` });
      setCreateUserOpen(false);
      setNewUserData({ email: "", password: "", fullName: "", companyName: "", companyDescription: "", companyWebsite: "", companyAddress: "", phone: "" });
      fetchEmployers();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredEmployers = employers.filter(emp =>
    (emp.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/employer/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Employer Management</h1>
          </div>
          <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Employer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Employer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={newUserData.fullName} onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Company Name *</Label>
                    <Input value={newUserData.companyName} onChange={(e) => setNewUserData({ ...newUserData, companyName: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} required minLength={6} />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={newUserData.phone} onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })} placeholder="+91 9876543210" />
                </div>
                <div>
                  <Label>Company Website</Label>
                  <Input value={newUserData.companyWebsite} onChange={(e) => setNewUserData({ ...newUserData, companyWebsite: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Company Address</Label>
                  <Input value={newUserData.companyAddress} onChange={(e) => setNewUserData({ ...newUserData, companyAddress: e.target.value })} placeholder="Office address..." />
                </div>
                <div>
                  <Label>Company Description</Label>
                  <Textarea value={newUserData.companyDescription} onChange={(e) => setNewUserData({ ...newUserData, companyDescription: e.target.value })} rows={3} placeholder="About the company..." />
                </div>
                <Button type="submit" className="w-full" disabled={creatingUser}>
                  {creatingUser ? "Creating..." : "Create Employer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employers..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredEmployers.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No employers found</h3>
            <p className="text-muted-foreground">Create your first employer account</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployers.map((emp) => (
              <Card key={emp.id} className="hover:shadow-[var(--shadow-card)] transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={emp.company_logo_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {(emp.company_name || "C")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{emp.company_name || "No Company"}</h3>
                      <p className="text-sm text-muted-foreground truncate">{emp.full_name}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    {emp.company_address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{emp.company_address}</span>
                      </div>
                    )}
                    {emp.company_website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <a href={emp.company_website} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">{emp.company_website}</a>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate(`/employer/profile/${emp.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageEmployers;
