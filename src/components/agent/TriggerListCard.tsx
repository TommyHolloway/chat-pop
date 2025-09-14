import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, MousePointer, Eye, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { CustomTrigger } from '@/hooks/useProactiveConfig';

interface TriggerListCardProps {
  trigger: CustomTrigger;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'time_based':
      return <Clock className="h-4 w-4" />;
    case 'scroll_based':
      return <MousePointer className="h-4 w-4" />;
    case 'element_interaction':
      return <Eye className="h-4 w-4" />;
    case 'exit_intent':
      return <ArrowLeft className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getTriggerTypeLabel = (type: string) => {
  switch (type) {
    case 'time_based':
      return 'Time Based';
    case 'scroll_based':
      return 'Scroll Based';
    case 'element_interaction':
      return 'Element Interaction';
    case 'exit_intent':
      return 'Exit Intent';
    default:
      return 'Unknown';
  }
};

const getTriggerDescription = (trigger: CustomTrigger) => {
  switch (trigger.trigger_type) {
    case 'time_based':
      return `Shows after ${trigger.time_threshold || 30} seconds`;
    case 'scroll_based':
      return `Shows at ${trigger.scroll_depth || 50}% scroll`;
    case 'element_interaction':
      return `Shows on ${trigger.element_selector || 'element'} interaction`;
    case 'exit_intent':
      return 'Shows when visitor attempts to leave';
    default:
      return 'Custom trigger';
  }
};

export const TriggerListCard = ({ trigger, onToggle, onEdit, onDelete }: TriggerListCardProps) => {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-primary">
              {getTriggerIcon(trigger.trigger_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{trigger.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {getTriggerTypeLabel(trigger.trigger_type)}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {getTriggerDescription(trigger)}
              </p>
              
              {trigger.url_patterns && trigger.url_patterns.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Pages: {trigger.url_patterns.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Switch
              checked={trigger.enabled}
              onCheckedChange={onToggle}
            />
          </div>
        </div>

        {trigger.message && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{trigger.message}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};