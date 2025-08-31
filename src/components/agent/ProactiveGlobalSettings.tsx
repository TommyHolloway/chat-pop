import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Target } from 'lucide-react';
import type { ProactiveConfig } from '@/hooks/useProactiveConfig';

interface ProactiveGlobalSettingsProps {
  config: ProactiveConfig;
  onUpdate: (updates: Partial<ProactiveConfig>) => void;
}

export const ProactiveGlobalSettings = ({ config, onUpdate }: ProactiveGlobalSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Global Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timing Delay */}
        <div className="space-y-2">
          <Label>Initial Delay: {(config.timing_delay / 1000)} seconds</Label>
          <Slider
            value={[config.timing_delay]}
            onValueChange={([value]) => onUpdate({ timing_delay: value })}
            min={2000}
            max={30000}
            step={1000}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            How long to wait before showing the first proactive suggestion
          </p>
        </div>

        {/* Frequency Limit */}
        <div className="space-y-2">
          <Label>Maximum Suggestions per Session: {config.frequency_limit}</Label>
          <Slider
            value={[config.frequency_limit]}
            onValueChange={([value]) => onUpdate({ frequency_limit: value })}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Limit how many proactive suggestions to show during one visitor session
          </p>
        </div>

        {/* Message Display Duration */}
        <div className="space-y-2">
          <Label>Message Display Duration: {(config.message_display_duration / 1000)} seconds</Label>
          <Slider
            value={[config.message_display_duration]}
            onValueChange={([value]) => onUpdate({ message_display_duration: value })}
            min={5000}
            max={60000}
            step={5000}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            How long proactive popup messages stay visible before auto-hiding
          </p>
        </div>
      </CardContent>
    </Card>
  );
};