import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function History() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: analyses, isLoading } = trpc.analysis.getHistory.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 70) return "default";
    if (score >= 40) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-12">
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis History</h1>
            <p className="text-muted-foreground mt-2">View all your past website analyses</p>
          </div>

          {!analyses || analyses.length === 0 ? (
            <Card className="bg-card text-card-foreground">
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No analyses yet. Start by analyzing a website!</p>
                <Button onClick={() => setLocation("/")} className="mt-4">
                  Analyze a Website
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="bg-card text-card-foreground hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/results/${analysis.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {analysis.url}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(analysis.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant={getScoreBadgeVariant(analysis.score)} className="ml-4">
                        Score: {analysis.score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.hasJsonApi && <Badge variant="outline">JSON API</Badge>}
                      {analysis.hasRssFeed && <Badge variant="outline">RSS</Badge>}
                      {analysis.hasAtomFeed && <Badge variant="outline">Atom</Badge>}
                      {analysis.hasJsonFeed && <Badge variant="outline">JSON Feed</Badge>}
                      {analysis.hasLlmsTxt && <Badge variant="outline">llms.txt</Badge>}
                      {analysis.hasJsonLd && <Badge variant="outline">JSON-LD</Badge>}
                      {analysis.hasSemanticHtml && <Badge variant="outline">Semantic HTML</Badge>}
                      {analysis.hasServerSideRendering && <Badge variant="outline">SSR</Badge>}
                      {analysis.hasMetaTags && <Badge variant="outline">Meta Tags</Badge>}
                      {analysis.hasSitemap && <Badge variant="outline">Sitemap</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
