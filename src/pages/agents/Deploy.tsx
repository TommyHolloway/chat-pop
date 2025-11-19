import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  Code, 
  Globe, 
  Smartphone,
  Check,
  Eye,
  Settings,
  Palette,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAgents } from '@/hooks/useAgents';

export const Deploy = () => {
  const { id, workspaceId } = useParams();
  const { toast } = useToast();
  const { analytics } = useAnalytics(id!);
  const { agents } = useAgents();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState('');
  const [agent, setAgent] = useState<any>(null);
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetTheme, setWidgetTheme] = useState('light');
  const [widgetPages, setWidgetPages] = useState('');
  const [proactivePages, setProactivePages] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { updateAgent } = useAgents();

  useEffect(() => {
    if (agents && id) {
      const currentAgent = agents.find(a => a.id === id);
      setAgent(currentAgent);
      // Load existing widget page restrictions
      if (currentAgent?.widget_page_restrictions) {
        setWidgetPages(currentAgent.widget_page_restrictions.join('\n'));
      }
    }
  }, [agents, id]);

  // Track changes for unsaved indicator
  useEffect(() => {
    if (agent) {
      const existingPages = agent.widget_page_restrictions?.join('\n') || '';
      setHasUnsavedChanges(widgetPages !== existingPages);
    }
  }, [widgetPages, agent]);

  const saveConfiguration = async () => {
    if (!agent || !id) return;
    
    setSaving(true);
    try {
      const pageArray = widgetPages
        .split('\n')
        .map(page => page.trim())
        .filter(page => page.length > 0);
      
      await updateAgent(id, {
        widget_page_restrictions: pageArray.length > 0 ? pageArray : null,
      });
      
      setHasUnsavedChanges(false);
      toast({
        title: "Configuration Saved",
        description: "Widget page restrictions have been updated.",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const agentUrl = `${window.location.origin}/agents/${id}/chat`;
  const embedCode = `<iframe
  src="${agentUrl}"
  width="400"
  height="600"
  frameborder="0"
  title="ChatPop Agent">
</iframe>`;

  const scriptCode = `<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/chat-widget?agentId=${id}&position=${widgetPosition}&theme=${widgetTheme}';
  document.head.appendChild(script);
})();
</script>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Deploy Your Shopify Shopping Assistant</h1>
              <p className="text-muted-foreground">
                Add your AI agent to your Shopify store to enable product recommendations and abandoned cart recovery
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/workspace/${workspaceId}/agents/${id}/playground`}>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </Link>
              <Link to={`/workspace/${workspaceId}/agents/${id}/settings/general`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Agent Status */}
          <Card>
            <CardHeader>
             <CardTitle className="flex items-center justify-between">
                 <span>{agent?.name || 'Loading...'}</span>
                 <Badge variant={agent?.status === 'active' ? 'default' : 'secondary'}>
                   {agent?.status === 'active' ? 'Live' : 'Private'}
                 </Badge>
               </CardTitle>
               <CardDescription>
                 {agent?.status === 'active' 
                   ? 'Your agent is live and ready to be deployed. Choose from the options below to integrate it into your website or share it with users.'
                   : 'Your agent is currently private. To deploy it, please activate it in the agent settings first.'
                 }
               </CardDescription>
            </CardHeader>
          </Card>

          {/* Shopify Connection Status */}
          <Card className={agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-amber-500 bg-amber-50 dark:bg-amber-950"}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`h-6 w-6 ${agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token ? "text-green-600" : "text-amber-600"}`} />
                  <div>
                    {agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token ? (
                      <>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          ✓ Shopify Connected: {agent?.shopify_config?.store_domain}
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          E-commerce features are active. Cart tracking will work automatically when you deploy the widget.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                          ⚠️ Shopify Not Connected
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Connect your Shopify store to enable product recommendations and cart tracking
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {!(agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token) && (
                  <Link to={`/workspace/${workspaceId}/agents/${id}/settings/integrations`}>
                    <Button variant="default">
                      Connect Shopify
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deployment - Chat Widget Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Chat Widget
                <Badge variant="default" className="ml-1 bg-green-600">🛒 E-commerce</Badge>
              </CardTitle>
              <CardDescription>
                Add a floating chat widget to your Shopify store. Automatically tracks cart activity, recommends products, and recovers abandoned carts—no coding required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shopify App Embed Recommendation Banner - Only show if Shopify connected */}
              {agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token && (
                <Alert className="border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <AlertDescription className="ml-2">
                    <div className="space-y-2">
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        ✨ Recommended: Use Shopify App Embed (No Code Required)
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Since you've connected Shopify, your widget is automatically available as an App Embed. 
                        Simply enable it in your theme editor - scroll up to see instructions!
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2 border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        <Sparkles className="mr-2 h-3 w-3" />
                        View App Embed Instructions
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Widget Customization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={widgetTheme} onValueChange={setWidgetTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Helpful Note */}
              <div className="bg-muted/50 border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Customize colors, avatar, and messages</strong> in{' '}
                  <Link 
                    to={`/workspace/${workspaceId}/agents/${id}/settings/chat`}
                    className="text-primary hover:underline font-medium"
                  >
                    Settings → Chat Interface
                  </Link>
                </p>
              </div>

              {/* Conditional: Collapsible for Shopify-connected, normal section for others */}
              {agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token ? (
                // Shopify Connected: Show as collapsible advanced option
                <Collapsible className="space-y-2">
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Label className="text-base">Manual Installation (Advanced)</Label>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Use this method only if you need to embed on non-Shopify pages or have special requirements.
                    </p>
                    
                    {/* Embed Script Code */}
                    <div className="space-y-2">
                      <Label>Embed Script</Label>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono border">
                          <code>{scriptCode}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(scriptCode, 'script')}
                        >
                          {copiedCode === 'script' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Manual Setup Instructions */}
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg space-y-3">
                        <p className="text-sm font-semibold">Manual Setup Steps:</p>
                        <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                          <li>Copy the script code above</li>
                          <li>Go to <strong>Shopify Admin → Online Store → Themes</strong></li>
                          <li>Click <strong>Actions → Edit code</strong></li>
                          <li>Find and open the <code className="bg-background px-1 py-0.5 rounded">theme.liquid</code> file in the Layout folder</li>
                          <li>Scroll to the bottom and paste the script right before the <code className="bg-background px-1 py-0.5 rounded">&lt;/body&gt;</code> closing tag</li>
                          <li>Click <strong>Save</strong> and your widget will be live!</li>
                        </ol>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                // Not Shopify Connected: Show normal section
                <>
                  {/* Embed Script Code */}
                  <div className="space-y-2">
                    <Label>Embed Script</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono border">
                        <code>{scriptCode}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(scriptCode, 'script')}
                      >
                        {copiedCode === 'script' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label>How to Add to Your Website</Label>
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <p className="text-sm font-semibold">Setup Steps:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                        <li>Copy the script code above</li>
                        <li>Paste it in your website's HTML, right before the <code className="bg-background px-1 py-0.5 rounded">&lt;/body&gt;</code> closing tag</li>
                        <li>Save and publish - your widget will appear instantly!</li>
                      </ol>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>⚡ Setup time:</strong> Less than 2 minutes • <strong>No coding required</strong>
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Widget Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-6 border-t">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Customization:
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Position on page</li>
                    <li>• Light/Dark theme</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    E-commerce Features:
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Automatic cart tracking</li>
                    <li>• Product recommendations</li>
                    <li>• Abandoned cart recovery</li>
                    <li>• Revenue analytics</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Setup:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Under 2 minutes</li>
                    <li>• No coding required</li>
                    <li>• Works instantly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};