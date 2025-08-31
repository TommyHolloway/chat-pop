import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ImageUpload } from '@/components/agent/ImageUpload';
import { ColorPicker } from '@/components/agent/ColorPicker';
import { MessageSquare, Brain, Palette, Settings } from 'lucide-react';
import type { AgentFormData } from '@/hooks/useAgentForm';

interface AgentBasicInfoProps {
  formData: AgentFormData;
  updateFormData: (updates: Partial<AgentFormData>) => void;
}

export const AgentBasicInfo = ({ formData, updateFormData }: AgentBasicInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Agent Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="e.g., Customer Support Bot"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(status: 'active' | 'inactive' | 'draft') => 
                  updateFormData({ status })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="Brief description of what this agent does..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-image">Profile Image</Label>
            <ImageUpload
              currentImage={formData.profile_image_url}
              onImageChange={(url) => updateFormData({ profile_image_url: url || '' })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chat Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initial-message">Initial Message</Label>
            <Textarea
              id="initial-message"
              value={formData.initial_message}
              onChange={(e) => updateFormData({ initial_message: e.target.value })}
              placeholder="Hi! How can I help you today?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Agent Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => updateFormData({ instructions: e.target.value })}
              placeholder="Detailed instructions for how the agent should behave..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Creativity Level: {formData.creativity_level}</Label>
            <Slider
              value={[formData.creativity_level]}
              onValueChange={([value]) => updateFormData({ creativity_level: value })}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              1 = Very focused, 10 = Very creative
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Chat Interface Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ColorPicker
                label="Message Bubble Color"
                value={formData.message_bubble_color}
                onChange={(color) => updateFormData({ message_bubble_color: color })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme">Interface Theme</Label>
              <Select
                value={formData.chat_interface_theme}
                onValueChange={(theme) => updateFormData({ chat_interface_theme: theme })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};