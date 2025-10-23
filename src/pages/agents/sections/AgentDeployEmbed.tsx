import { Deploy } from '../Deploy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, FileText, BarChart3 } from 'lucide-react';

export const AgentDeployEmbed = ({ agent }: { agent: any }) => {
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Embed Widget</h2>
        <p className="text-muted-foreground">Get embed codes to add your agent to websites</p>
      </div>
      
      <Deploy />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            E-commerce Features
          </CardTitle>
          <CardDescription>
            Shopify integration and cart tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="text-muted-foreground">
              <strong>Cart tracking works automatically</strong> when you embed the chat widget on your Shopify store.
            </p>
            
            <div className="pl-4 border-l-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                ✓ Auto-detects Shopify cart events<br/>
                ✓ Tracks abandoned carts<br/>
                ✓ Send recovery messages<br/>
                ✓ View analytics
              </p>
            </div>
          </div>
          
          <div className="pt-2 space-y-2">
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <a href="/docs/shopify-setup-guide.md" target="_blank">
                <FileText className="mr-2 h-4 w-4" />
                Shopify Setup Guide
              </a>
            </Button>
            
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <a href="/docs/cart-tracking-overview.md" target="_blank">
                <BarChart3 className="mr-2 h-4 w-4" />
                How Cart Tracking Works
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};