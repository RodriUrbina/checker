import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ExternalLink, AlertCircle, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const analysisId = params?.id ? parseInt(params.id) : 0;

  const { data: analysis, isLoading, error } = trpc.analysis.getById.useQuery(
    { id: analysisId },
    { enabled: analysisId > 0 }
  );

  const leadMutation = trpc.leads.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    leadMutation.mutate({ email, analysisId });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Card className="bg-card text-card-foreground">
            <CardContent className="pt-6">
              <p className="text-destructive">Analysis not found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const details = analysis.details as any;
  const scoreColor = analysis.score >= 70 ? "text-green-600" : analysis.score >= 40 ? "text-yellow-600" : "text-red-600";

  const checks = [
    { label: "JSON API", value: analysis.hasJsonApi },
    { label: "Text API", value: analysis.hasTextApi },
    { label: "Markdown API", value: analysis.hasMarkdownApi },
    { label: "RSS Feed", value: analysis.hasRssFeed },
    { label: "Atom Feed", value: analysis.hasAtomFeed },
    { label: "JSON Feed", value: analysis.hasJsonFeed },
    { label: "llms.txt", value: analysis.hasLlmsTxt },
    { label: "JSON-LD", value: analysis.hasJsonLd },
    { label: "Semantic HTML", value: analysis.hasSemanticHtml },
    { label: "Server-Side Rendering", value: analysis.hasServerSideRendering },
    { label: "Meta Tags", value: analysis.hasMetaTags },
    { label: "Sitemap", value: analysis.hasSitemap },
    { label: "MCP Server", value: analysis.hasMcpServer },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-12">
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-2xl text-card-foreground">Analysis Results</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {analysis.url}
                    </a>
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">
                    Analyzed on {new Date(analysis.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right space-y-2">
                  <div className={`text-4xl font-bold ${scoreColor}`}>{analysis.score}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={analysis.score} className="h-3" />
              <Button onClick={() => setShowLeadDialog(true)} size="sm">
                Take me to 100
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 1. Feature Checks */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-card-foreground">Feature Checks</CardTitle>
              <CardDescription>Individual LLM readiness features detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {checks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                    <span className="text-sm font-medium text-foreground">{check.label}</span>
                    {check.value ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Findings */}
          {details && (
            <>
              {/* 2. Recommendations (moved up) */}
              {details.recommendations && details.recommendations.length > 0 && (
                <Card className="bg-card text-card-foreground border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>How to improve your LLM readiness score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {details.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">&bull;</span>
                          <span className="text-sm text-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 3. API Endpoints */}
              {details.apiEndpoints && details.apiEndpoints.length > 0 && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">API Endpoints Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {details.apiEndpoints.map((endpoint: string, index: number) => (
                        <li key={index} className="text-sm text-foreground font-mono bg-secondary/50 p-2 rounded">
                          {endpoint}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 4. llms.txt */}
              {details.llmsTxtContent && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">llms.txt Content</CardTitle>
                    <CardDescription>First 500 characters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-secondary/50 p-4 rounded overflow-x-auto text-foreground whitespace-pre-wrap">
                      {details.llmsTxtContent}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* 5. Semantic HTML Tags */}
              {details.semanticTags && details.semanticTags.length > 0 && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Semantic HTML Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {details.semanticTags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          &lt;{tag}&gt;
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 6. Meta Tags */}
              {details.metaTags && Object.keys(details.metaTags).length > 0 && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Meta Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(details.metaTags).map(([key, value]: [string, any], index: number) => (
                        <div key={index} className="text-sm">
                          <span className="font-semibold text-foreground">{key}:</span>{" "}
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 7. Sitemap */}
              {details.sitemapUrl && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Sitemap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a href={details.sitemapUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex items-center gap-2 text-foreground">
                      <ExternalLink className="h-3 w-3" />
                      {details.sitemapUrl}
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* 8. MCP Server */}
              {details.mcpServerInfo && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">MCP Server</CardTitle>
                    <CardDescription>Model Context Protocol server detected</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {details.mcpServerInfo.name && (
                      <p className="text-sm text-foreground mb-2">
                        <span className="font-semibold">Name:</span> {details.mcpServerInfo.name}
                      </p>
                    )}
                    <a href={details.mcpServerInfo.endpoint} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex items-center gap-2 text-foreground">
                      <ExternalLink className="h-3 w-3" />
                      {details.mcpServerInfo.endpoint}
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* 9. Feeds (moved to last) */}
              {details.feeds && details.feeds.length > 0 && (
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Feeds Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {details.feeds.map((feed: string, index: number) => (
                        <li key={index} className="text-sm text-foreground">
                          <a href={feed} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            {feed}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take me to 100</DialogTitle>
            <DialogDescription>
              Enter your email and we'll reach out with a personalized plan to get your score to 100.
            </DialogDescription>
          </DialogHeader>
          {submitted ? (
            <div className="flex items-center gap-2 text-green-600 py-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Thanks! We'll be in touch soon.</span>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={leadMutation.isPending}>
                {leadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit
              </Button>
              {leadMutation.isError && (
                <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
