import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, TrendingUp, Map } from 'lucide-react';
import type { ProactiveTrigger } from '@/hooks/useProactiveConfig';

interface ProactiveTriggerCardProps {
  title: string;
  icon: React.ReactNode;
  trigger: ProactiveTrigger;
  onUpdate: (updates: Partial<ProactiveTrigger>) => void;
  config?: {
    timeThreshold?: { min: number; max: number; step: number };
    pageViews?: { min: number; max: number; step: number };
    pageThreshold?: { min: number; max: number; step: number };
    showUrlPatterns?: boolean;
  };
}

export const ProactiveTriggerCard = ({ 
  title, 
  icon, 
  trigger, 
  onUpdate,
  config = {}
}: ProactiveTriggerCardProps) => {
  const {
    timeThreshold = { min: 10, max: 120, step: 5 },
    pageViews = { min: 3, max: 15, step: 1 },
    pageThreshold = { min: 2, max: 10, step: 1 },
    showUrlPatterns = true
  } = config;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{title}</Badge>
          {icon}
        </div>
        <Switch
          checked={trigger.enabled}
          onCheckedChange={(enabled) => onUpdate({ enabled })}
        />
      </div>
      
      {trigger.enabled && (
        <div className="ml-4 space-y-3 border-l-2 pl-4">
          {trigger.time_threshold !== undefined && (
            <div className="space-y-2">
              <Label>Time Threshold: {trigger.time_threshold} seconds</Label>
              <Slider
                value={[trigger.time_threshold]}
                onValueChange={([value]) => onUpdate({ time_threshold: value })}
                min={timeThreshold.min}
                max={timeThreshold.max}
                step={timeThreshold.step}
                className="w-full"
              />
            </div>
          )}
          
          {trigger.page_views_threshold !== undefined && (
            <div className="space-y-2">
              <Label>Page Views: {trigger.page_views_threshold}</Label>
              <Slider
                value={[trigger.page_views_threshold]}
                onValueChange={([value]) => onUpdate({ page_views_threshold: value })}
                min={pageViews.min}
                max={pageViews.max}
                step={pageViews.step}
                className="w-full"
              />
            </div>
          )}
          
          {trigger.page_threshold !== undefined && (
            <div className="space-y-2">
              <Label>Feature Pages Visited: {trigger.page_threshold}</Label>
              <Slider
                value={[trigger.page_threshold]}
                onValueChange={([value]) => onUpdate({ page_threshold: value })}
                min={pageThreshold.min}
                max={pageThreshold.max}
                step={pageThreshold.step}
                className="w-full"
              />
            </div>
          )}
          
          {showUrlPatterns && (
            <div className="space-y-2">
              <Label>URL Patterns (comma-separated)</Label>
              <Input
                value={(trigger.url_patterns || []).join(', ')}
                onChange={(e) => onUpdate({ 
                  url_patterns: e.target.value.split(',').map(s => s.trim())
                })}
                onBlur={(e) => onUpdate({ 
                  url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="pricing, plans, cost, #pricing"
              />
              <p className="text-xs text-muted-foreground">
                Patterns to match in URLs. Use # for sections (e.g., #pricing)
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Trigger Message</Label>
            <Textarea
              value={trigger.message}
              onChange={(e) => onUpdate({ message: e.target.value })}
              placeholder="Message to show when this trigger activates"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};