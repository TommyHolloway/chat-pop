import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/agent/ColorPicker';
import { ImageUpload } from '@/components/agent/ImageUpload';
import { useAgents } from '@/hooks/useAgents';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export const AgentSettingsChat = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { updateAgent } = useAgents();
  
  const [chatSettings, setChatSettings] = useState({
    welcome_message: agent?.welcome_message || 'Hello! How can I help you today?',
    placeholder_text: agent?.placeholder_text || 'Type your message...',
    primary_color: agent?.primary_color || '#3b82f6',
    secondary_color: agent?.secondary_color || '#64748b',
    show_branding: agent?.show_branding !== false,
    enable_sound: agent?.enable_sound !== false,
    avatar_url: agent?.avatar_url || '',
    position: agent?.position || 'bottom-right',
    theme: agent?.theme || 'light',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setChatSettings({
        welcome_message: agent.welcome_message || 'Hello! How can I help you today?',
        placeholder_text: agent.placeholder_text || 'Type your message...',
        primary_color: agent.primary_color || '#3b82f6',
        secondary_color: agent.secondary_color || '#64748b',
        show_branding: agent.show_branding !== false,
        enable_sound: agent.enable_sound !== false,
        avatar_url: agent.avatar_url || '',
        position: agent.position || 'bottom-right',
        theme: agent.theme || 'light',
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Update chat settings fields that exist in the agent schema
      await updateAgent(id, {
        name: agent.name, // Required field
        instructions: agent.instructions, // Required field
        initial_message: chatSettings.welcome_message,
        message_bubble_color: chatSettings.primary_color,
        chat_interface_theme: chatSettings.theme,
        // Note: show_branding is always required and cannot be changed
      });
      
      toast({
        title: "Success",
        description: "Chat interface settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating chat settings:', error);
      toast({
        title: "Error",
        description: "Failed to update chat interface settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setChatSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Chat Interface</h2>
        <p className="text-muted-foreground">
          Customize the appearance and behavior of your chat widget.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Messages & Content</CardTitle>
            <CardDescription>
              Configure the messages and text displayed in your chat widget.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="welcome">Welcome Message</Label>
              <Textarea
                id="welcome"
                value={chatSettings.welcome_message}
                onChange={(e) => updateSetting('welcome_message', e.target.value)}
                placeholder="Hello! How can I help you today?"
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="placeholder">Input Placeholder</Label>
              <Input
                id="placeholder"
                value={chatSettings.placeholder_text}
                onChange={(e) => updateSetting('placeholder_text', e.target.value)}
                placeholder="Type your message..."
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual Design</CardTitle>
            <CardDescription>
              Customize colors, avatar, and visual elements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <ColorPicker
                  label=""
                  value={chatSettings.primary_color}
                  onChange={(color) => updateSetting('primary_color', color)}
                />
              </div>
              
              <div>
                <Label>Secondary Color</Label>
                <ColorPicker
                  label=""
                  value={chatSettings.secondary_color}
                  onChange={(color) => updateSetting('secondary_color', color)}
                />
              </div>
            </div>

            <div>
              <Label>Avatar</Label>
              <ImageUpload
                onImageChange={(url) => updateSetting('avatar_url', url)}
                currentImage={chatSettings.avatar_url}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Widget Behavior</CardTitle>
            <CardDescription>
              Configure how the chat widget behaves and appears.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Branding</Label>
                <p className="text-sm text-muted-foreground">
                  "Powered by ChatPop" branding is required for all chat widgets
                </p>
              </div>
              <Badge variant="secondary">Required</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Sound</Label>
                <p className="text-sm text-muted-foreground">Play sound notifications</p>
              </div>
              <Switch
                checked={chatSettings.enable_sound}
                onCheckedChange={(checked) => updateSetting('enable_sound', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};