import { Deploy } from '../Deploy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, FileText, BarChart3, Check, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';

export const AgentDeployEmbed = ({ agent }: { agent: any }) => {
  const isShopifyConnected = agent?.shopify_config?.store_domain && agent?.shopify_config?.admin_api_token;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Deploy to Shopify</h2>
        <p className="text-muted-foreground">
          Add your AI shopping assistant to your Shopify store
        </p>
      </div>
      
      {/* APP EMBED CARD - Only show if Shopify connected */}
      {isShopifyConnected && (
        <Card className="border-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Automatic Widget Installation (App Embed)
            </CardTitle>
            <CardDescription>
              Your widget is ready to enable with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Enable in 3 Easy Steps:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Shopify Admin → Online Store → Themes</li>
                <li>Click "Customize" on your active theme</li>
                <li>In Theme Settings (bottom left) → App Embeds → Toggle "ChatPop Widget" ON</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Since you've connected Shopify, your ChatPop widget is automatically available as an App Embed. No code needed!
              </p>
              <Button asChild className="w-full">
                <a 
                  href={`https://${agent.shopify_config.store_domain}/admin/themes/current/editor`} 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Theme Editor
                </a>
              </Button>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                💡 The widget will appear on all pages once enabled. You can customize its behavior in Settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* E-COMMERCE FEATURES CARD - Only show if NOT connected */}
      {!isShopifyConnected && (
        <Card className="border-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-600" />
              Shopify E-commerce Features
            </CardTitle>
            <CardDescription>
              Connect Shopify to unlock these features automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Connect Shopify to enable these features
              </p>
            </div>
            
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Automatic cart tracking</strong>
                  <p className="text-muted-foreground">Detects when customers add items to cart without any code from you</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Abandoned cart recovery</strong>
                  <p className="text-muted-foreground">View all abandoned carts and send recovery messages via the widget</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Product recommendations</strong>
                  <p className="text-muted-foreground">AI searches your catalog and suggests products in conversations</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>E-commerce analytics</strong>
                  <p className="text-muted-foreground">Track recovery rate, revenue attribution, and conversion metrics</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground">LEARN MORE:</p>
              <div className="grid gap-2">
                <Button variant="outline" size="sm" asChild className="justify-start">
                  <a href="/docs/shopify-setup-guide.md" target="_blank">
                    <FileText className="mr-2 h-4 w-4" />
                    Shopify Setup Guide
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild className="justify-start">
                  <a href="/docs/cart-tracking-overview.md" target="_blank">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    How Cart Tracking Works
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* DEPLOY COMPONENT */}
      <Deploy />
    </div>
  );
};