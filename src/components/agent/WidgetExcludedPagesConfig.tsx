import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EyeOff } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';

interface WidgetExcludedPagesConfigProps {
  agent: any;
}

export const WidgetExcludedPagesConfig = ({ agent }: WidgetExcludedPagesConfigProps) => {
  const { updateAgent } = useAgents();
  const { toast } = useToast();
  const [localValue, setLocalValue] = React.useState((agent?.widget_excluded_pages || []).join('\n'));

  const handleExcludedPagesChange = async (value: string) => {
    setLocalValue(value);
    const pages = value ? value.split('\n').map(p => p.trim()).filter(p => p) : [];
    
    try {
      await updateAgent(agent.id, { widget_excluded_pages: pages } as any);
      toast({
        title: "Saved",
        description: "Widget visibility settings updated.",
      });
    } catch (error) {
      console.error('Error updating widget excluded pages:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOff className="h-5 w-5" />
          Widget Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Excluded Pages (Optional)</Label>
          <Textarea
            placeholder="Leave empty to show widget on all pages, or specify pages to exclude (one per line):&#10;/checkout&#10;/admin/*&#10;/account/*"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => handleExcludedPagesChange(e.target.value)}
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            Specify pages where the chat widget should NOT appear. Leave empty to show on all pages.
            The widget will be hidden on any page that matches these patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold">Examples:</h4>
            <ul className="space-y-1 text-muted-foreground font-mono text-xs">
              <li>• /checkout</li>
              <li>• /admin/*</li>
              <li>• /account</li>
              <li>• /cart</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Matching Rules:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Exact path matching</li>
              <li>• Wildcard support (*)</li>
              <li>• Case sensitive</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
