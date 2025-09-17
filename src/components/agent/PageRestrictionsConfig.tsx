import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe } from 'lucide-react';
import type { ProactiveConfig } from '@/hooks/useProactiveConfig';

interface PageRestrictionsConfigProps {
  config: ProactiveConfig;
  onUpdate: (updates: Partial<ProactiveConfig>) => void;
}

export const PageRestrictionsConfig = ({ config, onUpdate }: PageRestrictionsConfigProps) => {
  const handlePageRestrictionsChange = (value: string) => {
    const pages = value ? value.split('\n').map(p => p.trim()).filter(p => p) : [];
    onUpdate({ allowed_pages: pages });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Page Restrictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!config.enabled && (
          <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Proactive engagement is currently disabled. Enable it above to configure page restrictions.
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Allowed Pages (Optional)</Label>
          <Textarea
            placeholder="Leave empty for all pages, or specify URL patterns (one per line):&#10;/landing&#10;/home&#10;pricing&#10;/product/*&#10;#pricing"
            value={(config.allowed_pages || []).join('\n')}
            onChange={(e) => handlePageRestrictionsChange(e.target.value)}
            rows={5}
            disabled={!config.enabled}
          />
          <p className="text-sm text-muted-foreground">
            Specify URL patterns where proactive engagement should appear. Leave empty to show on all pages.
            You can use exact paths, partial matches, or anchor links.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold">Examples:</h4>
            <ul className="space-y-1 text-muted-foreground font-mono text-xs">
              <li>• /landing</li>
              <li>• /product</li>
              <li>• pricing</li>
              <li>• #pricing</li>
              <li>• /docs/*</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Matching Rules:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Checks URL path and full URL</li>
              <li>• Case sensitive matching</li>
              <li>• Partial string matching</li>
              <li>• Supports anchor links (#)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};