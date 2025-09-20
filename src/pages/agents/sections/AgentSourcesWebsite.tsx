import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAgentLinks } from '@/hooks/useAgentLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import { Plus, Globe2, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentSourcesWebsite = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { links, loading: linksLoading, addLink, removeLink, fetchLinks, retryCrawl } = useAgentLinks(id);

  const handleAddUrl = async () => {
    if (!url.trim()) return;

    setLoading(true);
    const result = await addLink(url.trim());
    if (result) {
      setUrl('');
    }
    setLoading(false);
  };

const handleDeleteLink = async (linkId: string) => {
    await removeLink(linkId);
  };

  const handleRetryLink = async (linkId: string, url: string) => {
    setLoading(true);
    await retryCrawl(linkId, url);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Website Knowledge</h2>
        <p className="text-muted-foreground">Add websites and URLs to scrape content for your agent's knowledge base</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Add Website URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <PlanEnforcementWrapper 
                feature="link" 
                agentId={id}
                fallbackContent={
                  <Button disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Add (Upgrade Required)
                  </Button>
                }
              >
                <Button onClick={handleAddUrl} disabled={loading || !url.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? 'Adding...' : 'Add URL'}
                </Button>
              </PlanEnforcementWrapper>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This section is for adding individual website URLs to scrape content for your agent's knowledge base. 
            For URL pattern matching in proactive engagement (like "pricing, plans, contact"), go to the 
            <strong> Proactive Engagement</strong> section in Settings.
          </p>
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
                <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {link.title || 'Untitled'}
                      </h4>
                      <Badge variant={getStatusColor(link.status)}>
                        {link.status}
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
                    {link.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryLink(link.id, link.url)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};