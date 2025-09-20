import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgentLinks } from '@/hooks/useAgentLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { Plus, Globe2, Trash2, RefreshCw, ExternalLink, ChevronDown, ChevronUp, FileText, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentSourcesWebsite = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const [url, setUrl] = useState('');
  const [crawlMode, setCrawlMode] = useState<'scrape' | 'crawl'>('scrape');
  const [crawlLimit, setCrawlLimit] = useState([10]);
  const [loading, setLoading] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState<Record<string, boolean>>({});
  
  const { links, crawlPages, loading: linksLoading, addLink, removeLink, fetchLinks, fetchCrawlPages, retryCrawl } = useAgentLinks(id);

  // Get plan-based crawl limits
  const getMaxCrawlLimit = () => {
    // This would be determined by the user's plan
    // For now, let's use a simple check based on existing plan limits logic
    return 25; // Default to hobby plan limit
  };

  const handleAddUrl = async () => {
    if (!url.trim()) return;

    setLoading(true);
    const result = await addLink(url.trim(), crawlMode, crawlLimit[0]);
    if (result) {
      setUrl('');
    }
    setLoading(false);
  };

  const handleDeleteLink = async (linkId: string) => {
    await removeLink(linkId);
  };

  const handleRetryLink = async (linkId: string, linkUrl: string, linkCrawlMode: 'scrape' | 'crawl', linkCrawlLimit: number) => {
    setLoading(true);
    await retryCrawl(linkId, linkUrl, linkCrawlMode, linkCrawlLimit || 10);
    setLoading(false);
  };

  const toggleExpanded = (linkId: string) => {
    setExpandedLinks(prev => ({ ...prev, [linkId]: !prev[linkId] }));
    // Fetch crawl pages when expanding a crawl link
    const link = links.find(l => l.id === linkId);
    if (link?.crawl_mode === 'crawl' && !expandedLinks[linkId] && !crawlPages[linkId]) {
      fetchCrawlPages(linkId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'crawled':
        return 'default';
      case 'processing':
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatCrawlProgress = (link: any) => {
    if (link.crawl_mode === 'crawl' && link.pages_found && link.pages_processed) {
      return `${link.pages_processed}/${link.pages_found} pages`;
    }
    return link.crawl_mode === 'crawl' ? 'Full website crawl' : 'Single page scrape';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Website Knowledge</h2>
        <p className="text-muted-foreground">Add websites and URLs to scrape or crawl content for your agent's knowledge base</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Add Website URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-3">
              <Label>Processing Mode</Label>
              <RadioGroup value={crawlMode} onValueChange={(value: 'scrape' | 'crawl') => setCrawlMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scrape" id="scrape" />
                  <Label htmlFor="scrape" className="font-normal">Single Page Scrape</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">Extract content from just this specific URL</p>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crawl" id="crawl" />
                  <Label htmlFor="crawl" className="font-normal">Full Website Crawl</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">Discover and extract content from multiple pages across the website</p>
              </RadioGroup>
            </div>

            {crawlMode === 'crawl' && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Pages to Crawl: {crawlLimit[0]} pages</Label>
                  <Slider
                    value={crawlLimit}
                    onValueChange={setCrawlLimit}
                    max={getMaxCrawlLimit()}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 page</span>
                    <span>{getMaxCrawlLimit()} pages (plan limit)</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Note:</strong> Crawling will automatically discover and process related pages from the same domain.</p>
                  <p>This is perfect for getting comprehensive knowledge from documentation sites, blogs, or company websites.</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <PlanEnforcementWrapper 
                feature="link" 
                agentId={id}
                fallbackContent={
                  <Button disabled className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Add (Upgrade Required)
                  </Button>
                }
              >
                <Button onClick={handleAddUrl} disabled={loading || !url.trim()} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? 'Processing...' : `${crawlMode === 'crawl' ? 'Start Crawl' : 'Add URL'}`}
                </Button>
              </PlanEnforcementWrapper>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This section is for adding website content to your agent's knowledge base. 
              For URL pattern matching in proactive engagement (like "pricing, plans, contact"), go to the 
              <strong> Proactive Engagement</strong> section in Settings.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Added Websites</CardTitle>
        </CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No websites added yet</p>
              <p className="text-sm">Add your first website URL to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <Collapsible key={link.id} open={expandedLinks[link.id]}>
                  <div className="border rounded-lg">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {link.title || 'Untitled'}
                          </h4>
                          <Badge variant={getStatusColor(link.status)}>
                            {link.status === 'crawled' ? 'completed' : link.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatCrawlProgress(link)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1 truncate"
                          >
                            {link.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {link.crawl_mode === 'crawl' && (link.pages_found || 0) > 1 && (
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExpanded(link.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {expandedLinks[link.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                        {link.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryLink(link.id, link.url, link.crawl_mode, link.crawl_limit || 10)}
                            disabled={loading}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {link.crawl_mode === 'crawl' && (
                      <CollapsibleContent>
                        <div className="border-t px-4 py-3 bg-muted/20">
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Crawled Pages ({crawlPages[link.id]?.length || 0})
                          </h5>
                          {crawlPages[link.id] ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {crawlPages[link.id].map((page) => (
                                <div key={page.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{page.title || 'Untitled'}</p>
                                    <a 
                                      href={page.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-muted-foreground hover:underline flex items-center gap-1 truncate"
                                    >
                                      {page.url}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                  <Badge variant={getStatusColor(page.status)} className="text-xs">
                                    {page.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Loading crawled pages...</div>
                          )}
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};