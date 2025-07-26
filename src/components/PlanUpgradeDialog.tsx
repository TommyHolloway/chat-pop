import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

interface PlanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  currentLimit: string;
  recommendedPlan: 'hobby' | 'standard';
}

export const PlanUpgradeDialog = ({ 
  open, 
  onOpenChange, 
  feature, 
  currentLimit,
  recommendedPlan 
}: PlanUpgradeDialogProps) => {
  const { createCheckout } = useSubscription();
  const { toast } = useToast();

  const planDetails = {
    hobby: {
      name: 'Hobby',
      price: '$35/month',
      features: [
        '2,000 message credits/month',
        'Up to 20 training links',
        '2 AI agents',
        'Advanced chat features',
        'Priority support'
      ]
    },
    standard: {
      name: 'Pro',
      price: '$147/month', 
      features: [
        '12,000 message credits/month',
        'Unlimited training links',
        '5 AI agents',
        'Advanced analytics',
        'Custom integrations',
        'Phone support'
      ]
    }
  };

  const plan = planDetails[recommendedPlan];

  const handleUpgrade = async () => {
    try {
      await createCheckout(recommendedPlan);
      toast({
        title: "Redirecting to checkout",
        description: `You'll be redirected to upgrade to ${plan.name}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade Required</DialogTitle>
          <DialogDescription>
            You've reached your {feature} limit ({currentLimit}). Upgrade to {plan.name} to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{plan.name} Plan</h3>
              <Badge variant="default">{plan.price}</Badge>
            </div>
            
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpgrade} className="flex-1">
              Upgrade to {plan.name}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};