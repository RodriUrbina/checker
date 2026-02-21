import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ExternalLink, AlertCircle, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute, useSearch } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const hasTriggeredDownload = useRef(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const analysisId = params?.id ? parseInt(params.id) : 0;
  const searchParams = new URLSearchParams(search);
  const shouldDownload = searchParams.get("download") === "true";

  const { data: analysis, isLoading, error } = trpc.analysis.getById.useQuery(
    { id: analysisId },
    { enabled: analysisId > 0 }
  );

  const claimMutation = trpc.analysis.claim.useMutation();

  // Handle post-auth download flow
  useEffect(() => {
    if (!shouldDownload || !isAuthenticated || !analysis || hasTriggeredDownload.current) return;
    hasTriggeredDownload.current = true;

    // Claim the analysis for this user
    claimMutation.mutate(
      { id: analysisId },
      {
        onSuccess: () => {
          triggerDownload(analysis);
          // Clean up the URL
          setLocation(`/results/${analysisId}`, { replace: true });
        },
        onError: () => {
          // Still allow download even if claim fails (might already be owned)
          triggerDownload(analysis);
          setLocation(`/results/${analysisId}`, { replace: true });
        },
      }
    );
  }, [shouldDownload, isAuthenticated, analysis, analysisId]);

  function triggerDownload(data: NonNullable<typeof analysis>) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `llm-readiness-${new URL(data.url).hostname}-${data.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownload() {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    if (analysis) {
      // Claim then download
      claimMutation.mutate(
        { id: analysisId },
        {
          onSuccess: () => triggerDownload(analysis),
          onError: () => triggerDownload(analysis),
        }
      );
    }
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
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </CardContent>
          </Card>

          {/* Checks Grid */}
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
              {/* API Endpoints */}
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

              {/* Feeds */}
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

              {/* llms.txt */}
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

              {/* Semantic Tags */}
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

              {/* Meta Tags */}
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

              {/* Sitemap */}
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
            </>
          )}

          {/* Recommendations */}
          {details?.recommendations && details.recommendations.length > 0 && (
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
        </div>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to download</DialogTitle>
            <DialogDescription>
              Sign in with your Google account to download the analysis report.
            </DialogDescription>
          </DialogHeader>
          <Button asChild>
            <a href={`/api/auth/google?returnTo=${encodeURIComponent(`/results/${analysisId}?download=true`)}`}>
              Sign In with Google
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
