import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAgentActions } from '@/hooks/useAgentActions';
import { Calendar, Zap, TestTube, AlertCircle } from 'lucide-react';

interface ActionTestingPanelProps {
  agentId: string;
  userMessage: string;
}

export const ActionTestingPanel = ({ agentId, userMessage }: ActionTestingPanelProps) => {
  const { actions } = useAgentActions(agentId);
  const [actionTriggerAnalysis, setActionTriggerAnalysis] = useState<any[]>([]);

  // Analyze if the user message would trigger any actions
  useEffect(() => {
    if (!userMessage || !actions?.length) {
      setActionTriggerAnalysis([]);
      return;
    }

    const analysis = actions.map(action => {
      let likelihood = 0;
      let reason = '';

      if (action.action_type === 'calendar_booking') {
        const bookingKeywords = ['book', 'schedule', 'appointment', 'meeting', 'call', 'available', 'time', 'calendar'];
        const messageWords = userMessage.toLowerCase().split(/\s+/);
        const matches = messageWords.filter(word => 
          bookingKeywords.some(keyword => word.includes(keyword))
        ).length;
        
        likelihood = Math.min((matches / bookingKeywords.length) * 100, 95);
        reason = matches > 0 
          ? `Contains booking keywords: ${messageWords.filter(word => 
              bookingKeywords.some(keyword => word.includes(keyword))
            ).join(', ')}` 
          : 'No booking-related keywords detected';
      } else if (action.action_type === 'custom_button') {
        const config = action.config_json;
        if (config?.description) {
          const descriptionWords = config.description.toLowerCase().split(/\s+/);
          const messageWords = userMessage.toLowerCase().split(/\s+/);
          const matches = messageWords.filter(word => 
            descriptionWords.some(desc => desc.includes(word) || word.includes(desc))
          ).length;
          
          likelihood = Math.min((matches / Math.max(descriptionWords.length, 1)) * 100, 95);
          reason = matches > 0 
            ? `Matches action description context` 
            : 'Message does not match action description';
        }
      }

      return {
        action,
        likelihood: Math.round(likelihood),
        reason,
        wouldTrigger: likelihood > 30
      };
    });

    setActionTriggerAnalysis(analysis);
  }, [userMessage, actions]);

  if (!actions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TestTube className="h-4 w-4" />
            Action Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No actions configured</p>
            <p className="text-xs">Add calendar booking or custom actions to test triggers</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TestTube className="h-4 w-4" />
          Action Testing
          <Badge variant="outline" className="text-xs">
            {actions?.length || 0} actions configured
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!userMessage && (
          <div className="text-center py-2 text-muted-foreground">
            <p className="text-xs">Type a message to see which actions might be triggered</p>
          </div>
        )}

        {actionTriggerAnalysis.map((analysis, index) => {
          const { action, likelihood, reason, wouldTrigger } = analysis;
          const isCalendarAction = action.action_type === 'calendar_booking';
          
          return (
            <div 
              key={action.id} 
              className={`
                p-3 rounded-lg border transition-all
                ${wouldTrigger 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-muted bg-muted/30'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {isCalendarAction ? (
                    <Calendar className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Zap className="h-4 w-4 text-purple-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {isCalendarAction ? 'Calendar Booking' : action.config_json?.label || 'Custom Action'}
                      </span>
                      <Badge 
                        variant={wouldTrigger ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {likelihood}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reason}
                    </p>
                  </div>
                </div>
              </div>

              {wouldTrigger && (
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                    ✓ This action would likely be offered to the user
                  </p>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Actions with 30%+ match likelihood will be triggered. Improve action descriptions to increase accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};