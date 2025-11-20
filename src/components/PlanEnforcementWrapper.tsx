import React, { ReactNode, useState } from 'react';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { PlanUpgradeDialog } from './PlanUpgradeDialog';
import { Button } from './ui/button';
import { Lock, Crown, Store } from 'lucide-react';
import { useUserPlan } from '@/hooks/useUserPlan';

interface PlanEnforcementWrapperProps {
  children: ReactNode;
  feature: 'agent' | 'message' | 'link' | 'storage' | 'visitor_analytics' | 'cart_recovery';
  agentId?: string;
  fileSize?: number;
  fallbackContent?: ReactNode;
}

export const PlanEnforcementWrapper = ({ 
  children, 
  feature, 
  agentId,
  fileSize,
  fallbackContent 
}: PlanEnforcementWrapperProps) => {
  const enforcement = usePlanEnforcement();
  const { billingProvider } = useUserPlan();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const isShopifyBilling = billingProvider === 'shopify';
  
  const canPerformAction = async () => {
    // Debug logging
    console.log('PlanEnforcementWrapper Debug:', {
      feature,
      agentId,
      enforcementLimits: enforcement.limits,
      enforcementLoading: enforcement.isLoading,
      canViewVisitorAnalytics: enforcement.canViewVisitorAnalytics
    });

    switch (feature) {
      case 'agent':
        return enforcement.canCreateAgent;
      case 'message':
        return enforcement.canSendMessage;
      case 'visitor_analytics':
        return enforcement.canViewVisitorAnalytics;
      case 'cart_recovery':
        return enforcement.canUseCartRecovery;
      case 'link':
        if (!agentId) return false;
        const linkResult = await enforcement.canAddLink(agentId);
        console.log('Link check result:', { agentId, canAdd: linkResult, limits: enforcement.limits });
        return linkResult;
      case 'storage':
        return fileSize ? await enforcement.canUploadFile(fileSize) : false;
      default:
        return true;
    }
  };

  const getFeatureLimit = () => {
    switch (feature) {
      case 'agent':
        return `${enforcement.usage.currentAgents}/${enforcement.limits.agents === -1 ? '∞' : enforcement.limits.agents} agents`;
      case 'message':
        return `${enforcement.usage.currentMessageCredits}/${enforcement.limits.messageCredits === -1 ? '∞' : enforcement.limits.messageCredits} credits`;
      case 'visitor_analytics':
        return 'Pro plan required';
      case 'cart_recovery':
        return `${enforcement.usage.currentCartRecovery}/${enforcement.limits.cartRecovery === -1 ? '∞' : enforcement.limits.cartRecovery} cart recovery attempts`;
      case 'link':
        return `${enforcement.limits.links === -1 ? '∞' : enforcement.limits.links} links per agent`;
      case 'storage':
        return `${(enforcement.usage.currentStorageBytes / (1024 * 1024 * 1024)).toFixed(1)}/${enforcement.limits.storageGB}GB storage`;
      default:
        return '';
    }
  };

  const getRecommendedPlan = (): 'hobby' | 'standard' => {
    if (feature === 'visitor_analytics') return 'standard';
    const currentPlan = enforcement.limits.messageCredits;
    if (currentPlan <= 50) return 'hobby'; // Free -> Starter (hobby is the internal name)
    return 'standard'; // Starter -> Growth (standard is the internal name)
  };

  const [canPerform, setCanPerform] = useState<boolean | null>(null);

  // Check permission when component mounts or dependencies change
  React.useEffect(() => {
    if (enforcement.isLoading) {
      setCanPerform(null);
      return;
    }
    
    let mounted = true;
    canPerformAction().then(result => {
      if (mounted) {
        console.log('Permission check result:', { feature, result, agentId });
        setCanPerform(result);
      }
    }).catch(error => {
      console.error('Permission check error:', error);
      if (mounted) {
        setCanPerform(false);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [enforcement.isLoading, enforcement.limits, enforcement.canViewVisitorAnalytics, agentId, fileSize]);

  if (enforcement.isLoading || canPerform === null) {
    return <div>Loading...</div>;
  }

  if (canPerform) {
    return <>{children}</>;
  }

  // Show upgrade prompt or Shopify-specific message
  const defaultFallback = isShopifyBilling && feature === 'agent' ? (
    <div className="flex flex-col items-center gap-4 p-8 border border-dashed rounded-lg bg-blue-500/10 border-blue-500/50">
      <Store className="h-12 w-12 text-blue-500" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          Shopify Store Limit
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Shopify stores are limited to 1 agent per workspace to ensure optimal performance and seamless integration with your storefront.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-4 p-8 border border-dashed rounded-lg bg-muted/50">
      <Crown className="h-12 w-12 text-yellow-500" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          {feature === 'visitor_analytics' ? 'Visitor Intelligence' : 'Plan Limit Reached'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {feature === 'visitor_analytics' 
            ? 'Unlock visitor behavior analytics, proactive chat triggers, and advanced conversion insights with Growth.'
            : `You've reached your ${feature} limit (${getFeatureLimit()})`
          }
        </p>
      </div>
      <Button onClick={() => setShowUpgradeDialog(true)} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
        <Crown className="h-4 w-4 mr-2" />
        {enforcement.limits.messageCredits <= 50 ? 'Upgrade to Starter' : 'Upgrade to Growth'}
      </Button>
    </div>
  );

  return (
    <>
      {fallbackContent || defaultFallback}
      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature={feature}
        currentLimit={getFeatureLimit()}
        recommendedPlan={getRecommendedPlan()}
      />
    </>
  );
};