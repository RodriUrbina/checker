import axios from 'axios';

export interface AnalysisResult {
  score: number;
  hasJsonApi: boolean;
  hasTextApi: boolean;
  hasMarkdownApi: boolean;
  hasRssFeed: boolean;
  hasAtomFeed: boolean;
  hasJsonFeed: boolean;
  hasLlmsTxt: boolean;
  hasJsonLd: boolean;
  hasSemanticHtml: boolean;
  hasServerSideRendering: boolean;
  hasMetaTags: boolean;
  hasSitemap: boolean;
  hasMcpServer: boolean;
  details: {
    apiEndpoints: string[];
    feeds: string[];
    llmsTxtContent: string | null;
    jsonLdData: any[];
    semanticTags: string[];
    metaTags: { [key: string]: string };
    sitemapUrl: string | null;
    mcpServerInfo: { endpoint: string; name?: string } | null;
    recommendations: string[];
  };
}

export async function analyzeWebsite(url: string): Promise<AnalysisResult> {
  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  const result: AnalysisResult = {
    score: 0,
    hasJsonApi: false,
    hasTextApi: false,
    hasMarkdownApi: false,
    hasRssFeed: false,
    hasAtomFeed: false,
    hasJsonFeed: false,
    hasLlmsTxt: false,
    hasJsonLd: false,
    hasSemanticHtml: false,
    hasServerSideRendering: false,
    hasMetaTags: false,
    hasSitemap: false,
    hasMcpServer: false,
    details: {
      apiEndpoints: [],
      feeds: [],
      llmsTxtContent: null,
      jsonLdData: [],
      semanticTags: [],
      metaTags: {},
      sitemapUrl: null,
      mcpServerInfo: null,
      recommendations: [],
    },
  };

  try {
    // Fetch the main HTML page
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LLM-Readiness-Checker/1.0)',
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const html = response.data;
    const baseUrl = new URL(normalizedUrl);

    // Check for llms.txt
    await checkLlmsTxt(baseUrl, result);

    // Check for feeds
    await checkFeeds(html, baseUrl, result);

    // Check for JSON-LD structured data
    checkJsonLd(html, result);

    // Check for semantic HTML
    checkSemanticHtml(html, result);

    // Check for server-side rendering
    checkServerSideRendering(html, result);

    // Check for meta tags
    checkMetaTags(html, result);

    // Check for sitemap
    await checkSitemap(baseUrl, result);

    // Check for API endpoints (common patterns)
    await checkApiEndpoints(baseUrl, result);

    // Check for MCP server
    await checkMcpServer(baseUrl, result);

    // Calculate score
    calculateScore(result);

    // Generate recommendations
    generateRecommendations(result);

  } catch (error) {
    console.error('Error analyzing website:', error);
    throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

async function checkLlmsTxt(baseUrl: URL, result: AnalysisResult): Promise<void> {
  try {
    const llmsTxtUrl = new URL('/llms.txt', baseUrl).toString();
    const response = await axios.get(llmsTxtUrl, { timeout: 5000 });
    if (response.status === 200 && response.data) {
      result.hasLlmsTxt = true;
      result.details.llmsTxtContent = response.data.substring(0, 500); // Store first 500 chars
    }
  } catch {
    // llms.txt not found
  }
}

async function checkFeeds(html: string, baseUrl: URL, result: AnalysisResult): Promise<void> {
  // Check for RSS feed
  const rssMatch = html.match(/<link[^>]*type=["']application\/rss\+xml["'][^>]*>/i);
  if (rssMatch) {
    result.hasRssFeed = true;
    const hrefMatch = rssMatch[0].match(/href=["']([^"']+)["']/);
    if (hrefMatch) {
      result.details.feeds.push(new URL(hrefMatch[1], baseUrl).toString());
    }
  }

  // Check for Atom feed
  const atomMatch = html.match(/<link[^>]*type=["']application\/atom\+xml["'][^>]*>/i);
  if (atomMatch) {
    result.hasAtomFeed = true;
    const hrefMatch = atomMatch[0].match(/href=["']([^"']+)["']/);
    if (hrefMatch) {
      result.details.feeds.push(new URL(hrefMatch[1], baseUrl).toString());
    }
  }

  // Check for JSON feed
  const jsonFeedMatch = html.match(/<link[^>]*type=["']application\/feed\+json["'][^>]*>/i);
  if (jsonFeedMatch) {
    result.hasJsonFeed = true;
    const hrefMatch = jsonFeedMatch[0].match(/href=["']([^"']+)["']/);
    if (hrefMatch) {
      result.details.feeds.push(new URL(hrefMatch[1], baseUrl).toString());
    }
  }
}

function checkJsonLd(html: string, result: AnalysisResult): void {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      result.hasJsonLd = true;
      result.details.jsonLdData.push(jsonData);
    } catch {
      // Invalid JSON-LD, skip
    }
  }
}

function checkSemanticHtml(html: string, result: AnalysisResult): void {
  const semanticTags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
  const foundTags: string[] = [];
  
  for (const tag of semanticTags) {
    const regex = new RegExp(`<${tag}[^>]*>`, 'i');
    if (regex.test(html)) {
      foundTags.push(tag);
    }
  }
  
  result.details.semanticTags = foundTags;
  // Consider semantic if at least 4 different semantic tags are used
  result.hasSemanticHtml = foundTags.length >= 4;
}

function checkServerSideRendering(html: string, result: AnalysisResult): void {
  // Check if there's meaningful content in the HTML (not just a div with id="root")
  const hasContent = html.length > 5000; // Reasonable threshold
  const hasTextContent = /<p[^>]*>[\s\S]*?<\/p>/i.test(html) || 
                         /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/i.test(html);
  
  // Check if it's not just a SPA shell
  const isSpaShell = /<div id=["']root["'][^>]*><\/div>/i.test(html) && html.length < 3000;
  
  result.hasServerSideRendering = hasContent && hasTextContent && !isSpaShell;
}

function checkMetaTags(html: string, result: AnalysisResult): void {
  const metaTags: { [key: string]: string } = {};
  
  // Check for essential meta tags
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    metaTags.title = titleMatch[1];
  }
  
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descriptionMatch) {
    metaTags.description = descriptionMatch[1];
  }
  
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    metaTags.ogTitle = ogTitleMatch[1];
  }
  
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) {
    metaTags.ogDescription = ogDescMatch[1];
  }
  
  result.details.metaTags = metaTags;
  // Consider has meta tags if at least title and description are present
  result.hasMetaTags = !!metaTags.title && !!metaTags.description;
}

async function checkSitemap(baseUrl: URL, result: AnalysisResult): Promise<void> {
  const sitemapUrls = [
    new URL('/sitemap.xml', baseUrl).toString(),
    new URL('/sitemap_index.xml', baseUrl).toString(),
  ];
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await axios.head(sitemapUrl, { timeout: 5000 });
      if (response.status === 200) {
        result.hasSitemap = true;
        result.details.sitemapUrl = sitemapUrl;
        break;
      }
    } catch {
      // Sitemap not found at this URL
    }
  }
}

async function checkApiEndpoints(baseUrl: URL, result: AnalysisResult): Promise<void> {
  const commonApiPaths = ['/api', '/api/v1', '/graphql'];
  
  for (const path of commonApiPaths) {
    try {
      const apiUrl = new URL(path, baseUrl).toString();
      const response = await axios.get(apiUrl, { 
        timeout: 5000,
        validateStatus: (status) => status < 500, // Accept any status < 500
      });
      
      const contentType = response.headers['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        result.hasJsonApi = true;
        result.details.apiEndpoints.push(`${apiUrl} (JSON)`);
      } else if (contentType.includes('text/plain')) {
        result.hasTextApi = true;
        result.details.apiEndpoints.push(`${apiUrl} (Text)`);
      } else if (contentType.includes('text/markdown')) {
        result.hasMarkdownApi = true;
        result.details.apiEndpoints.push(`${apiUrl} (Markdown)`);
      }
    } catch {
      // API endpoint not accessible
    }
  }
}

async function checkMcpServer(baseUrl: URL, result: AnalysisResult): Promise<void> {
  try {
    const mcpUrl = new URL('/.well-known/mcp.json', baseUrl).toString();
    const response = await axios.get(mcpUrl, {
      timeout: 5000,
      headers: { 'Accept': 'application/json' },
    });
    if (response.status === 200 && response.data) {
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      result.hasMcpServer = true;
      result.details.mcpServerInfo = {
        endpoint: data.endpoint || mcpUrl,
        name: data.name || undefined,
      };
    }
  } catch {
    // MCP server not found
  }
}

function calculateScore(result: AnalysisResult): void {
  let score = 0;
  
  // Weighted scoring system
  if (result.hasJsonApi) score += 10;
  if (result.hasTextApi) score += 8;
  if (result.hasMarkdownApi) score += 8;
  if (result.hasRssFeed) score += 10;
  if (result.hasAtomFeed) score += 8;
  if (result.hasJsonFeed) score += 10;
  if (result.hasLlmsTxt) score += 15; // High value for LLM-specific feature
  if (result.hasJsonLd) score += 12;
  if (result.hasSemanticHtml) score += 10;
  if (result.hasServerSideRendering) score += 12;
  if (result.hasMetaTags) score += 9;
  if (result.hasSitemap) score += 8;
  if (result.hasMcpServer) score += 15; // High value for MCP-specific feature

  result.score = Math.min(score, 100); // Cap at 100
}

function generateRecommendations(result: AnalysisResult): void {
  const recommendations: string[] = [];
  
  if (!result.hasLlmsTxt) {
    recommendations.push('Add an llms.txt file at the root of your site to provide a compact overview for LLMs');
  }
  
  if (!result.hasJsonApi && !result.hasTextApi && !result.hasMarkdownApi) {
    recommendations.push('Expose API endpoints (JSON, text, or markdown) to allow programmatic access to your content');
  }
  
  if (!result.hasRssFeed && !result.hasAtomFeed && !result.hasJsonFeed) {
    recommendations.push('Add RSS, Atom, or JSON feeds to make your content easily discoverable and consumable');
  }
  
  if (!result.hasJsonLd) {
    recommendations.push('Implement JSON-LD structured data to provide machine-readable summaries of your content');
  }
  
  if (!result.hasSemanticHtml) {
    recommendations.push('Use semantic HTML5 tags (header, nav, main, article, section, footer) to improve content structure');
  }
  
  if (!result.hasServerSideRendering) {
    recommendations.push('Implement server-side rendering to ensure content is immediately accessible without JavaScript');
  }
  
  if (!result.hasMetaTags) {
    recommendations.push('Add proper meta tags (title, description, Open Graph) for better discoverability');
  }
  
  if (!result.hasSitemap) {
    recommendations.push('Create a sitemap.xml file to help LLMs and search engines discover all your pages');
  }

  if (!result.hasMcpServer) {
    recommendations.push('Expose an MCP server at /.well-known/mcp.json to let AI agents interact with your site via the Model Context Protocol');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent! Your website is well-prepared for LLM interactions');
  }
  
  result.details.recommendations = recommendations;
}
