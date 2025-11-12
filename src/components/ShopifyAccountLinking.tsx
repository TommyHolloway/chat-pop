import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingBag, Link2, UserPlus } from 'lucide-react';

interface ShopifyAccountLinkingProps {
  email: string;
  shopDomain: string;
  onLinkExisting: () => void;
  onCreateNew: () => void;
}

export const ShopifyAccountLinking = ({
  email,
  shopDomain,
  onLinkExisting,
  onCreateNew,
}: ShopifyAccountLinkingProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Connect Your Shopify Store</CardTitle>
          </div>
          <CardDescription>
            We found an existing account with this email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Shop Domain: {shopDomain}</p>
                <p className="font-medium">Email: {email}</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Would you like to link this shop to your existing account or create a separate account?
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Button
                onClick={onLinkExisting}
                variant="default"
                size="lg"
                className="h-auto py-6 flex flex-col items-center gap-2"
              >
                <Link2 className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Link to Existing Account</div>
                  <div className="text-xs opacity-90">Connect to your agents</div>
                </div>
              </Button>

              <Button
                onClick={onCreateNew}
                variant="outline"
                size="lg"
                className="h-auto py-6 flex flex-col items-center gap-2"
              >
                <UserPlus className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Create Separate Account</div>
                  <div className="text-xs opacity-90">New account for this shop</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t text-sm text-muted-foreground">
            <p>
              <strong>Tip:</strong> Most users link to their existing account to manage multiple shops in one place.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
