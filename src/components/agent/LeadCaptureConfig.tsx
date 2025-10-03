import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { LeadCaptureConfig as ILeadCaptureConfig, LeadCaptureField } from '@/types/leadCapture';

interface LeadCaptureConfigProps {
  config: ILeadCaptureConfig;
  onChange: (config: ILeadCaptureConfig) => void;
}

const defaultField: LeadCaptureField = {
  key: '',
  label: '',
  type: 'text',
  required: false,
  placeholder: ''
};

export const LeadCaptureConfig: React.FC<LeadCaptureConfigProps> = ({ config, onChange }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addField = () => {
    const newField = { ...defaultField, key: `field_${Date.now()}`, label: 'New Field' };
    onChange({
      ...config,
      fields: [...config.fields, newField]
    });
  };

  const removeField = (index: number) => {
    onChange({
      ...config,
      fields: config.fields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, updates: Partial<LeadCaptureField>) => {
    const updatedFields = config.fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    );
    onChange({ ...config, fields: updatedFields });
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const fields = [...config.fields];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    onChange({ ...config, fields });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null) {
      moveField(draggedIndex, dropIndex);
      setDraggedIndex(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Capture</CardTitle>
        <CardDescription>
          Configure lead capture forms to collect visitor information during conversations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="lead-capture-enabled" className="text-base">
              Enable Lead Capture
            </Label>
            <p className="text-sm text-muted-foreground">
              Collect visitor information during conversations
            </p>
          </div>
          <Switch
            id="lead-capture-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ ...config, enabled })}
          />
        </div>

        {config.enabled && (
          <>
            <div className="space-y-3">
              <Label>When to Show Lead Form</Label>
              <Select
                value={config.trigger_type || 'ai_detection'}
                onValueChange={(value: 'immediate' | 'after_messages' | 'ai_detection') => 
                  onChange({ ...config, trigger_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediately when chat opens</SelectItem>
                  <SelectItem value="after_messages">After X messages</SelectItem>
                  <SelectItem value="ai_detection">When AI detects interest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.trigger_type === 'after_messages' && (
              <div className="space-y-2">
                <Label>Number of Messages Before Showing Form</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.trigger_after_messages || 2}
                  onChange={(e) => onChange({ ...config, trigger_after_messages: parseInt(e.target.value) })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Lead Capture Prompt</Label>
              <Input
                placeholder="I'd love to help you further! Could you share your contact info?"
                value={config.prompt || ''}
                onChange={(e) => onChange({ ...config, prompt: e.target.value })}
              />
            </div>

            {/* Form Configuration */}
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button_text">Button Text</Label>
              <Input
                id="button_text"
                value={config.button_text}
                onChange={(e) => onChange({ ...config, button_text: e.target.value })}
                placeholder="Get in Touch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="success_message">Success Message</Label>
              <Input
                id="success_message"
                value={config.success_message}
                onChange={(e) => onChange({ ...config, success_message: e.target.value })}
                placeholder="Thank you! We'll be in touch soon."
              />
            </div>
          </div>

          {/* Fields Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Form Fields</Label>
              <Button onClick={addField} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {config.fields.map((field, index) => (
                <div
                  key={`${field.key}-${index}`}
                  className="border rounded-lg p-4 space-y-3 bg-background/50"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <Badge variant={field.required ? "default" : "secondary"}>
                        {field.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => removeField(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Field Key</Label>
                      <Input
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value })}
                        placeholder="field_name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Field Label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: LeadCaptureField['type']) => updateField(index, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="tel">Phone</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(required) => updateField(index, { required })}
                    />
                    <Label className="text-sm">Required field</Label>
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <Label>Options (one per line)</Label>
                      <Textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(Boolean) })}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {config.fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields configured. Add a field to get started.</p>
              </div>
            )}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};