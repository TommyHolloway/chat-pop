import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentDeployShare = ({ agent }: { agent: any }) => {
  const { id, workspaceId } = useParams();
  const [isPublic, setIsPublic] = useState(agent?.status === 'active');
  const [customSlug, setCustomSlug] = useState(agent?.name?.toLowerCase().replace(/\s+/g, '-') || '');
  
  const publicUrl = `${window.location.origin}/chat/${id}`;
  const customUrl = customSlug ? `${window.location.origin}/chat/${customSlug}` : publicUrl;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const handleTogglePublic = async () => {
    // TODO: Implement public/private toggle
    setIsPublic(!isPublic);
    toast({
      title: "Success",
      description: `Agent is now ${!isPublic ? 'public' : 'private'}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Share Agent</h2>
        <p className="text-muted-foreground">Generate public links to share your agent with others</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Public Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Make Agent Public</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to chat with your agent
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isPublic ? 'default' : 'secondary'}>
                {isPublic ? 'Public' : 'Private'}
              </Badge>
              <Switch
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
              />
            </div>
          </div>

          {isPublic && (
            <>
              <div className="space-y-2">
                <Label>Public URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={publicUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(publicUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(publicUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-slug">Custom URL Slug (Optional)</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex">
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                      {window.location.origin}/chat/
                    </span>
                    <Input
                      id="custom-slug"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-agent"
                      className="rounded-l-none"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(customUrl)}
                    disabled={!customSlug}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a custom, memorable link for your agent
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isPublic && (
        <Card>
          <CardHeader>
            <CardTitle>Share Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  const text = `Check out my AI agent: ${agent.name}`;
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`;
                  window.open(url, '_blank');
                }}
              >
                Share on Twitter
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
                  window.open(url, '_blank');
                }}
              >
                Share on LinkedIn
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  const text = `Check out my AI agent: ${agent.name} - ${publicUrl}`;
                  const url = `mailto:?subject=${encodeURIComponent(`AI Agent: ${agent.name}`)}&body=${encodeURIComponent(text)}`;
                  window.location.href = url;
                }}
              >
                Share via Email
              </Button>

              <Button
                variant="outline"
                className="justify-start"
                onClick={() => copyToClipboard(publicUrl)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Conversations Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};