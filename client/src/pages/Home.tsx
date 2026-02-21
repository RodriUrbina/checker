import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Brain, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: (data) => {
      setLocation(`/results/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    analyzeMutation.mutate({ url: url.trim() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-foreground">LLM Readiness Checker</span>
          </div>
          <div className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => setLocation("/history")}>
                  History
                </Button>
                <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href="/api/auth/google">Sign In with Google</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-12 md:py-24">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Is Your Website Ready for <span className="text-primary">LLMs</span>?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Evaluate how well your website is prepared to handle LLM requests and interactions. Get actionable insights to improve machine readability.
            </p>
          </div>

          {/* Analysis Form — always visible */}
          <Card className="bg-card text-card-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Globe className="h-5 w-5" />
                Analyze a Website
              </CardTitle>
              <CardDescription>Enter a URL to check its LLM readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={analyzeMutation.isPending}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </form>
              {analyzeMutation.isError && (
                <p className="text-destructive text-sm mt-2">
                  Error: {analyzeMutation.error.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg text-card-foreground">Comprehensive Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Analyzes API endpoints, feeds, structured data, semantic HTML, and more
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <AlertCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg text-card-foreground">Actionable Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get specific recommendations to improve your website's LLM readiness
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <XCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg text-card-foreground">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Save analysis history and monitor improvements over time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Check */}
          <div className="mt-16 text-left">
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">What We Check</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "JSON/Text/Markdown API endpoints",
                "RSS/Atom/JSON feeds",
                "llms.txt for compact site overview",
                "JSON-LD structured data",
                "Clean semantic HTML",
                "Server-side rendering",
                "Proper meta tags",
                "XML sitemaps",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24 py-8 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Built to help websites become more accessible to Large Language Models</p>
        </div>
      </footer>
    </div>
  );
}
