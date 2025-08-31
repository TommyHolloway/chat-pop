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
        {/* Confidence Threshold */}
        <div className="space-y-2">
          <Label>Confidence Threshold: {config.confidence_threshold.toFixed(1)}</Label>
          <Slider
            value={[config.confidence_threshold]}
            onValueChange={([value]) => onUpdate({ confidence_threshold: value })}
            min={0.1}
            max={0.9}
            step={0.1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Minimum confidence level to trigger proactive suggestions (0.1 = less strict, 0.9 = very strict)
          </p>
        </div>

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
            How long proactive messages stay visible before auto-dismissing
          </p>
        </div>

        {/* URL Restrictions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="url-restrictions"
              checked={config.url_restrictions.enabled}
              onChange={(e) => onUpdate({ 
                url_restrictions: { 
                  ...config.url_restrictions, 
                  enabled: e.target.checked 
                }
              })}
              className="h-4 w-4"
            />
            <Label htmlFor="url-restrictions">Enable URL Restrictions</Label>
          </div>
          
          {config.url_restrictions.enabled && (
            <div className="space-y-3 ml-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="entire-website"
                  name="url-mode"
                  checked={!config.url_restrictions.restrict_to_specific_urls}
                  onChange={() => onUpdate({
                    url_restrictions: {
                      ...config.url_restrictions,
                      restrict_to_specific_urls: false
                    }
                  })}
                  className="h-4 w-4"
                />
                <Label htmlFor="entire-website">Work on entire website</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="specific-urls"
                  name="url-mode"
                  checked={config.url_restrictions.restrict_to_specific_urls}
                  onChange={() => onUpdate({
                    url_restrictions: {
                      ...config.url_restrictions,
                      restrict_to_specific_urls: true
                    }
                  })}
                  className="h-4 w-4"
                />
                <Label htmlFor="specific-urls">Work only on specific URLs</Label>
              </div>
              
              {config.url_restrictions.restrict_to_specific_urls && (
                <div className="space-y-2">
                  <Label>Allowed URLs (one per line)</Label>
                  <textarea
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Enter URLs where the widget should work:&#10;https://example.com/page1&#10;/specific-page&#10;*contact*"
                    value={config.url_restrictions.allowed_urls.join('\n')}
                    onChange={(e) => onUpdate({
                      url_restrictions: {
                        ...config.url_restrictions,
                        allowed_urls: e.target.value.split('\n').filter(url => url.trim())
                      }
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Use * for wildcards. Examples: /contact, *pricing*, https://example.com/page
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};