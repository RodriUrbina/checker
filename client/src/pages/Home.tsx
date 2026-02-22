import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Brain,
  Globe,
  Loader2,
  Search,
  Lightbulb,
  TrendingUp,
  Code,
  Rss,
  Braces,
  FileCode,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Home() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: (data) => {
      setLocation(`/results/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    analyzeMutation.mutate({ url: trimmed });
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
          <div className="flex items-center gap-4" />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-12 md:py-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" aria-hidden="true" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
        <svg
          className="absolute top-12 right-1/4 w-64 h-64 text-primary/10 dark:text-primary/15"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" />
        </svg>

        <div className="mx-auto max-w-3xl text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              If AI agents can't read your site, <span className="text-primary">you are irrelevant</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Make sure agents can find, understand, and recommend you.
            </p>
          </div>

          {/* Analysis Form */}
          <Card className="bg-card text-card-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Globe className="h-5 w-5" />
                Analyze your Website
              </CardTitle>
              <CardDescription>Enter a URL to check its LLM readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="example.com"
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

          {/* Result Preview Mock */}
          <div className="mt-8 space-y-3">
            <p className="text-lg md:text-xl font-semibold text-foreground">Our Analysis will provide you with a score based on these web technologies:</p>
            <Card className="bg-card/50 text-card-foreground border-dashed opacity-90 overflow-hidden">
              <CardContent className="pt-6 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <div className="text-sm font-semibold text-card-foreground">Analysis Results</div>
                    <div className="text-xs text-muted-foreground">example.com</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">72</div>
                    <div className="text-xs text-muted-foreground">/ 100</div>
                  </div>
                </div>
                <Progress value={72} className="h-2" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "JSON API", pass: true },
                    { label: "RSS Feed", pass: true },
                    { label: "llms.txt", pass: false },
                    { label: "JSON-LD", pass: true },
                    { label: "Semantic HTML", pass: true },
                    { label: "Sitemap", pass: false },
                  ].map((check, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded border bg-background/50 text-xs">
                      <span className="text-muted-foreground">{check.label}</span>
                      {check.pass ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1 border-t text-left">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                  <span>Add an llms.txt file to improve machine readability...</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: Search,
                title: "Comprehensive Checks",
                description: "Analyzes API endpoints, feeds, structured data, semantic HTML, and more",
                iconBg: "bg-primary/10 dark:bg-primary/20",
                iconColor: "text-primary",
              },
              {
                icon: Lightbulb,
                title: "Actionable Insights",
                description: "Get specific recommendations to improve your website's LLM readiness",
                iconBg: "bg-amber-100 dark:bg-amber-500/20",
                iconColor: "text-amber-600 dark:text-amber-400",
              },
              {
                icon: TrendingUp,
                title: "Track Progress",
                description: "Save analysis history and monitor improvements over time",
                iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
            ].map((feature, index) => (
              <Card key={index} className="bg-card text-card-foreground transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.iconBg} flex items-center justify-center mb-3`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg text-card-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* What We Check */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-2 text-foreground">What We Check</h2>
            <p className="text-muted-foreground text-center mb-8">
              We evaluate your site across four key areas of LLM readiness
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              {[
                {
                  category: "API & Data Access",
                  icon: Code,
                  iconBg: "bg-blue-100 dark:bg-blue-500/20",
                  iconColor: "text-blue-600 dark:text-blue-400",
                  items: ["JSON / Text / Markdown API endpoints", "llms.txt for compact site overview"],
                },
                {
                  category: "Content Feeds",
                  icon: Rss,
                  iconBg: "bg-orange-100 dark:bg-orange-500/20",
                  iconColor: "text-orange-600 dark:text-orange-400",
                  items: ["RSS / Atom / JSON feeds", "XML sitemaps"],
                },
                {
                  category: "Structured Data",
                  icon: Braces,
                  iconBg: "bg-violet-100 dark:bg-violet-500/20",
                  iconColor: "text-violet-600 dark:text-violet-400",
                  items: ["JSON-LD structured data", "Proper meta tags"],
                },
                {
                  category: "Rendering & Semantics",
                  icon: FileCode,
                  iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
                  iconColor: "text-emerald-600 dark:text-emerald-400",
                  items: ["Clean semantic HTML", "Server-side rendering"],
                },
              ].map((group, index) => (
                <Card key={index} className="bg-card text-card-foreground">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${group.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <group.icon className={`h-5 w-5 ${group.iconColor}`} />
                      </div>
                      <CardTitle className="text-base text-card-foreground">{group.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 ml-12">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary/60 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
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
