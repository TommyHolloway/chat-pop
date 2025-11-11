import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ExternalLink, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShopifySubscription {
  status: string;
  plan_name: string;
  current_period_end?: string;
  trial_days?: number;
  amount?: number;
  cancelled_at?: string;
}

interface ShopifyBillingCardProps {
  subscription: ShopifySubscription;
  agentId?: string;
  onRefresh: () => void;
}

export const ShopifyBillingCard = ({ subscription, agentId, onRefresh }: ShopifyBillingCardProps) => {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case 'starter':
        return 'Starter Plan';
      case 'growth':
        return 'Growth Plan';
      default:
        return planName.charAt(0).toUpperCase() + planName.slice(1);
    }
  };

  const handleCancelSubscription = async () => {
    if (!agentId) {
      toast({
        title: "Error",
        description: "Agent ID not found",
        variant: "destructive"
      });
      return;
    }

    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-cancel-subscription', {
        body: { agent_id: agentId }
      });

      if (error) throw error;

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been successfully cancelled. You'll be downgraded to the free plan.",
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const isInTrial = subscription.trial_days && subscription.trial_days > 0;
  const nextBillingDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Shopify Subscription
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(subscription.status)}
          </div>
        </div>
        <CardDescription>
          Managed through your Shopify admin panel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
            <div className="text-lg font-semibold">{getPlanDisplayName(subscription.plan_name)}</div>
            {subscription.amount && (
              <div className="text-sm text-muted-foreground">
                ${subscription.amount.toFixed(2)}/month
              </div>
            )}
          </div>
          
          {nextBillingDate && subscription.status === 'active' && (
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Next Billing Date
              </div>
              <div className="text-lg font-semibold">{nextBillingDate}</div>
            </div>
          )}
        </div>

        {/* Trial Information */}
        {isInTrial && subscription.status === 'active' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Trial Period Active
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You have {subscription.trial_days} day{subscription.trial_days > 1 ? 's' : ''} remaining in your free trial. 
                  You won't be charged until the trial ends.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled Information */}
        {subscription.cancelled_at && (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="text-sm text-destructive">
              Subscription cancelled on {new Date(subscription.cancelled_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              // Get shop domain from subscription or agent data
              // For now, link to general Shopify admin
              window.open('https://admin.shopify.com/billing', '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage in Shopify
          </Button>
          
          {subscription.status === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your {getPlanDisplayName(subscription.plan_name)}? 
                    You'll be downgraded to the free plan immediately and lose access to premium features.
                    {isInTrial && " Your trial will end immediately."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};