import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Rocket, X } from 'lucide-react';
import { useBetaBanner } from '@/hooks/useBetaBanner';

export const BetaBanner = () => {
  const { isVisible, dismissBanner } = useBetaBanner();

  if (!isVisible) return null;

  return (
    <div className="animate-slide-up">
      <Alert className="border-warning bg-warning/10 text-warning-foreground rounded-none border-x-0 border-t-0 border-b border-warning/20">
        <Rocket className="h-4 w-4 text-warning" />
        <div className="flex items-center justify-between w-full">
          <AlertDescription className="text-sm font-medium">
            🚀 <strong>Coming Soon - Winter 2025!</strong> Sign up for the waitlist and we'll install your agent for you when we launch!
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissBanner}
            className="h-auto p-1 text-warning hover:text-warning/80 hover:bg-warning/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};