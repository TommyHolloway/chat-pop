import React, { ReactNode, useState } from 'react';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { PlanUpgradeDialog } from './PlanUpgradeDialog';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

interface PlanEnforcementWrapperProps {
  children: ReactNode;
  feature: 'agent' | 'message' | 'link' | 'storage';
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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  const canPerformAction = async () => {
    switch (feature) {
      case 'agent':
        return enforcement.canCreateAgent;
      case 'message':
        return enforcement.canSendMessage;
      case 'link':
        return agentId ? await enforcement.canAddLink(agentId) : false;
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
      case 'link':
        return `${enforcement.limits.links === -1 ? '∞' : enforcement.limits.links} links per agent`;
      case 'storage':
        return `${(enforcement.usage.currentStorageBytes / (1024 * 1024 * 1024)).toFixed(1)}/${enforcement.limits.storageGB}GB storage`;
      default:
        return '';
    }
  };

  const getRecommendedPlan = (): 'hobby' | 'standard' => {
    const currentPlan = enforcement.limits.messageCredits;
    if (currentPlan <= 100) return 'hobby'; // Free -> Hobby
    return 'standard'; // Hobby -> Pro
  };

  const [canPerform, setCanPerform] = useState<boolean | null>(null);

  // Check permission when component mounts or dependencies change
  React.useEffect(() => {
    canPerformAction().then(setCanPerform);
  }, [enforcement, agentId, fileSize]);

  if (enforcement.isLoading || canPerform === null) {
    return <div>Loading...</div>;
  }

  if (canPerform) {
    return <>{children}</>;
  }

  // Show upgrade prompt
  const defaultFallback = (
    <div className="flex flex-col items-center gap-3 p-6 border border-dashed rounded-lg bg-muted/50">
      <Lock className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <h3 className="font-medium">Plan Limit Reached</h3>
        <p className="text-sm text-muted-foreground">
          You've reached your {feature} limit ({getFeatureLimit()})
        </p>
      </div>
      <Button onClick={() => setShowUpgradeDialog(true)}>
        Upgrade Plan
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

