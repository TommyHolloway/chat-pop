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
import { Plus, X, Globe, MousePointer, ArrowUp } from 'lucide-react';
import type { CustomTrigger } from '@/hooks/useProactiveConfig';

interface CustomTriggerManagerProps {
  triggers: CustomTrigger[];
  onAdd: () => void;
  onRemove: (triggerId: string) => void;
  onUpdate: (triggerId: string, updates: Partial<CustomTrigger>) => void;
}

export const CustomTriggerManager = ({ triggers, onAdd, onRemove, onUpdate }: CustomTriggerManagerProps) => {
  const getTriggerIcon = (type: string) => {
    return <Globe className="h-4 w-4 text-muted-foreground" />;
  };

  const handleAdd = () => {
    onAdd();
  };

  const handleRemove = (triggerId: string) => {
    onRemove(triggerId);
  };

  const handleUpdate = (triggerId: string, updates: Partial<CustomTrigger>) => {
    onUpdate(triggerId, updates);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Custom Triggers
          </CardTitle>
          <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
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
                      onChange={(e) => handleUpdate(trigger.id, { name: e.target.value })}
                      className="font-medium border-none p-0 h-auto bg-transparent text-base"
                      placeholder="Trigger name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(enabled) => handleUpdate(trigger.id, { enabled })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(trigger.id)}
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
                        onValueChange={(value: any) => handleUpdate(trigger.id, { trigger_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time_based">Time Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Threshold: {trigger.time_threshold} seconds</Label>
                    <Slider
                      value={[trigger.time_threshold || 30]}
                      onValueChange={([value]) => handleUpdate(trigger.id, { time_threshold: value })}
                      min={5}
                      max={300}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL Patterns (comma-separated)</Label>
                    <Input
                      value={(trigger.url_patterns || []).join(', ')}
                      onChange={(e) => handleUpdate(trigger.id, { 
                        url_patterns: e.target.value.split(',').map(s => s.trim())
                      })}
                      onBlur={(e) => handleUpdate(trigger.id, { 
                        url_patterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      placeholder="/specific-page, /products"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Message</Label>
                    <Textarea
                      value={trigger.message}
                      onChange={(e) => handleUpdate(trigger.id, { message: e.target.value })}
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