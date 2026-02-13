import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Users, TrendingUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: 'var(--gradient-hero)',
          }}
        />
        <div className="container relative mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Find Your Dream Career
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect talented professionals with leading companies. Your next opportunity awaits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 shadow-[var(--shadow-elegant)] hover:scale-105 transition-transform"
                onClick={() => navigate("/jobs")}
              >
                <Search className="mr-2 h-5 w-5" />
                Find Jobs
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-2 hover:scale-105 transition-transform"
                onClick={() => navigate("/auth?role=employer")}
              >
                <Briefcase className="mr-2 h-5 w-5" />
                Post Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose JobPortal?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Jobs</h3>
              <p className="text-muted-foreground">
                Access thousands of verified job opportunities from top companies
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Talent</h3>
              <p className="text-muted-foreground">
                Connect with skilled professionals ready to join your team
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Tracking</h3>
              <p className="text-muted-foreground">
                Track your applications and hiring pipeline effortlessly
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center" style={{ background: 'var(--gradient-card)' }}>
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of professionals and employers who trust JobPortal for their career journey
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started Now
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
