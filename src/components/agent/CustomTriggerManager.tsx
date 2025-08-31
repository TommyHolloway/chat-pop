import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Globe, MousePointer, ArrowUp, Eye } from 'lucide-react';
import type { CustomTrigger } from '@/hooks/useProactiveConfig';

interface CustomTriggerManagerProps {
  triggers: CustomTrigger[];
  onAdd: () => void;
  onRemove: (triggerId: string) => void;
  onUpdate: (triggerId: string, updates: Partial<CustomTrigger>) => void;
}

export const CustomTriggerManager = ({ triggers, onAdd, onRemove, onUpdate }: CustomTriggerManagerProps) => {
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'time_based':
        return <Globe className="h-4 w-4 text-muted-foreground" />;
      case 'scroll_based':
        return <ArrowUp className="h-4 w-4 text-muted-foreground" />;
      case 'element_interaction':
        return <MousePointer className="h-4 w-4 text-muted-foreground" />;
      case 'exit_intent':
        return <Eye className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Custom Triggers
          </CardTitle>
          <Button onClick={onAdd} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Trigger
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {triggers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No custom triggers configured. Add one to get started.
          </p>
        ) : (
          triggers.map((trigger) => (
            <Card key={trigger.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTriggerIcon(trigger.trigger_type)}
                      Custom
                    </Badge>
                    <Input
                      value={trigger.name}
                      onChange={(e) => onUpdate(trigger.id, { name: e.target.value })}
                      className="font-medium border-none p-0 h-auto bg-transparent text-base"
                      placeholder="Trigger name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(enabled) => onUpdate(trigger.id, { enabled })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(trigger.id)}
                      className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {trigger.enabled && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={trigger.trigger_type}
                        onValueChange={(value: any) => onUpdate(trigger.id, { trigger_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time_based">Time Based</SelectItem>
                          <SelectItem value="scroll_based">Scroll Based</SelectItem>
                          <SelectItem value="element_interaction">Element Interaction</SelectItem>
                          <SelectItem value="exit_intent">Exit Intent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {trigger.trigger_type === 'time_based' && (
                    <div className="space-y-2">
                      <Label>Time Threshold: {trigger.time_threshold} seconds</Label>
                      <Slider
                        value={[trigger.time_threshold || 30]}
                        onValueChange={([value]) => onUpdate(trigger.id, { time_threshold: value })}
                        min={5}
                        max={300}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}

                  {trigger.trigger_type === 'scroll_based' && (
                    <div className="space-y-2">
                      <Label>Scroll Depth: {trigger.scroll_depth}%</Label>
                      <Slider
                        value={[trigger.scroll_depth || 50]}
                        onValueChange={([value]) => onUpdate(trigger.id, { scroll_depth: value })}
                        min={10}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}

                  {trigger.trigger_type === 'element_interaction' && (
                    <div className="space-y-2">
                      <Label>Element Selector</Label>
                      <Input
                        value={trigger.element_selector || ''}
                        onChange={(e) => onUpdate(trigger.id, { element_selector: e.target.value })}
                        placeholder=".button-class, #element-id"
                      />
                      <p className="text-xs text-muted-foreground">
                        CSS selector for the element to track interactions
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>URL Patterns (comma-separated)</Label>
                    <Input
                      value={(trigger.url_patterns || []).join(', ')}
                      onChange={(e) => onUpdate(trigger.id, { 
                        url_patterns: e.target.value.split(',').map(s => s.trim())
                      })}
                      onBlur={(e) => onUpdate(trigger.id, { 
                        url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="specific-page, /products, #section"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Message</Label>
                    <Textarea
                      value={trigger.message}
                      onChange={(e) => onUpdate(trigger.id, { message: e.target.value })}
                      placeholder="Message to show when this trigger activates"
                      rows={2}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};