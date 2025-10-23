import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAgents } from '@/hooks/useAgents';

export const Deploy = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { analytics } = useAnalytics(id!);
  const { agents } = useAgents();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState('');
  const [agent, setAgent] = useState<any>(null);
  const [widgetPosition, setWidgetPosition] = useState('bottom-right');
  const [widgetTheme, setWidgetTheme] = useState('light');
  const [widgetColor, setWidgetColor] = useState('#84cc16');
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
  script.src = 'https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/chat-widget-enhanced?agentId=${id}&position=${widgetPosition}&theme=${widgetTheme}&color=${encodeURIComponent(widgetColor)}';
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
              <Link to={`/agents/${id}/playground`}>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </Link>
              <Link to={`/agents/${id}/edit`}>
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
                  <Link to={`/agents/${id}/edit/integrations`}>
                    <Button variant="default">
                      Connect Shopify
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deployment Options */}
          <Tabs defaultValue="widget" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="widget" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Chat Widget
                <Badge variant="default" className="ml-1 bg-green-600">🛒 E-commerce</Badge>
              </TabsTrigger>
              <TabsTrigger value="iframe" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Iframe Embed
                <Badge variant="outline" className="ml-1 text-xs">No cart tracking</Badge>
              </TabsTrigger>
              <TabsTrigger value="direct" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Direct Link
                <Badge variant="outline" className="ml-1 text-xs">No cart tracking</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Limited E-commerce Features
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Iframe embeds <strong>do not support automatic cart tracking</strong> or Shopify integration. 
                      For full e-commerce features, use the <strong>Chat Widget</strong> instead.
                    </p>
                  </div>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Iframe Embed</CardTitle>
                  <CardDescription>
                    Embed your chatbot as an iframe on any webpage. Perfect for dedicated support pages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>HTML Code</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono border">
                        <code>{embedCode}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(embedCode, 'iframe')}
                      >
                        {copiedCode === 'iframe' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Customization Options:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Adjust width and height</li>
                        <li>• Responsive design</li>
                        <li>• Custom styling</li>
                        <li>• Theme matching</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Best For:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Support pages</li>
                        <li>• FAQ sections</li>
                        <li>• Help centers</li>
                        <li>• Dedicated chat pages</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="widget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Widget</CardTitle>
                  <CardDescription>
                    Add a floating chat widget to your Shopify store. Automatically tracks cart activity, recommends products, and recovers abandoned carts—no coding required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Widget Customization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          value={widgetColor}
                          onChange={(e) => setWidgetColor(e.target.value)}
                          placeholder="#84cc16"
                        />
                        <div 
                          className="w-10 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: widgetColor }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'color';
                            input.value = widgetColor;
                            input.onchange = (e) => setWidgetColor((e.target as HTMLInputElement).value);
                            input.click();
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Widget Loading Restrictions */}
                   <div className="space-y-2">
                     <Label>Widget Loading Pages (Optional)</Label>
                     <Textarea
                       placeholder="Leave empty for all pages, or specify URL patterns (one per line):&#10;/&#10;/landing&#10;/home&#10;/product/*"
                       value={widgetPages}
                       onChange={(e) => setWidgetPages(e.target.value)}
                       rows={3}
                     />
                     <p className="text-sm text-muted-foreground">
                       Control which pages the widget loads on. Leave empty to load on all pages.
                     </p>
                   </div>

                   {/* Save Configuration Button */}
                   <div className="flex items-center gap-2 pt-2">
                     <Button 
                       onClick={saveConfiguration}
                       disabled={saving || !hasUnsavedChanges}
                       size="sm"
                     >
                       {saving ? 'Saving...' : 'Save Configuration'}
                     </Button>
                     {hasUnsavedChanges && (
                       <span className="text-sm text-muted-foreground">
                         Unsaved changes
                       </span>
                     )}
                   </div>

                  {/* Proactive Engagement Restrictions */}
                  <div className="space-y-2">
                    <Label>Proactive Triggers Pages (Optional)</Label>
                    <Textarea
                      placeholder="Leave empty for all pages where widget loads, or specify URL patterns:&#10;/pricing&#10;/contact&#10;/features/*"
                      value={proactivePages}
                      onChange={(e) => setProactivePages(e.target.value)}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Control which pages show proactive suggestions. Separate from widget loading.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>JavaScript Code</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono border">
                        <code>{scriptCode}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(scriptCode, 'widget')}
                      >
                        {copiedCode === 'widget' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Shopify E-commerce Features (Automatic)
                    </h4>
                    <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span><strong>Auto-detects Shopify:</strong> Widget automatically hooks into your store's cart events</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span><strong>Product recommendations:</strong> AI searches your catalog and suggests products in real-time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span><strong>Cart tracking:</strong> Monitors abandoned carts without any custom code</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span><strong>Recovery messages:</strong> Send personalized messages to recover lost sales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span><strong>Analytics dashboard:</strong> Track conversions, revenue, and cart recovery rates</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Widget Customization:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Choose corner position</li>
                        <li>• Light/dark/auto themes</li>
                        <li>• Match your brand colors</li>
                        <li>• Control which pages it appears on</li>
                        <li>• Mobile-friendly design</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Setup Time:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Copy script below</li>
                        <li>• Paste in Shopify theme</li>
                        <li>• Widget goes live immediately</li>
                        <li>• Cart tracking starts automatically</li>
                        <li>• Takes less than 2 minutes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="direct" className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Limited E-commerce Features
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Direct links <strong>do not support automatic cart tracking</strong> or Shopify integration. 
                      Best for sharing outside your store. For e-commerce features, embed the <strong>Chat Widget</strong> on your Shopify site.
                    </p>
                  </div>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Direct Link</CardTitle>
                  <CardDescription>
                    Share a direct link to your chatbot for email campaigns, social media, or QR codes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chat URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={agentUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(agentUrl, 'url')}
                      >
                        {copiedCode === 'url' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={agentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-domain"
                          placeholder="chat.yourcompany.com"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                        />
                        <Button variant="outline">
                          Setup
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use your own domain for a more professional look
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Use Cases:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Email signatures</li>
                        <li>• Social media bio</li>
                        <li>• QR codes</li>
                        <li>• Business cards</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Features:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Mobile optimized</li>
                        <li>• Standalone interface</li>
                        <li>• Shareable URL</li>
                        <li>• Analytics tracking</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Analytics Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Deployment Analytics</CardTitle>
              <CardDescription>
                Track how your deployed agent is performing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.isLoading ? '...' : analytics.totalConversations.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Conversations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.isLoading ? '...' : `${analytics.resolutionRate}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">Resolution Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.isLoading ? '...' : `${analytics.avgResponseTime}s`}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};