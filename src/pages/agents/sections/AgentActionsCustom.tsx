import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgentActions } from '@/hooks/useAgentActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Edit2, MousePointer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomButton {
  id: string;
  text: string;
  action: string;
  description: string;
  enabled: boolean;
}

export const AgentActionsCustom = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { actions, loading, createAction, updateAction, deleteAction } = useAgentActions(id);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);
  const [newButton, setNewButton] = useState({
    text: '',
    action: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const customActions = actions.filter(action => action.action_type === 'custom_button');
    const buttons = customActions.map(action => ({
      id: action.id,
      text: action.config_json.text || '',
      action: action.config_json.action || '',
      description: action.config_json.description || '',
      enabled: action.is_enabled,
    }));
    setCustomButtons(buttons);
  }, [actions]);

  const handleSaveButton = async () => {
    if (!newButton.text.trim() || !newButton.action.trim()) {
      toast({
        title: "Error",
        description: "Please provide button text and action",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await createAction({
        agent_id: id!,
        action_type: 'custom_button',
        config_json: {
          text: newButton.text.trim(),
          action: newButton.action.trim(),
          description: newButton.description.trim(),
        },
        is_enabled: true,
      });

      setNewButton({ text: '', action: '', description: '' });
      toast({
        title: "Success",
        description: "Custom button created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create custom button",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleButton = async (button: CustomButton) => {
    const action = actions.find(a => a.id === button.id);
    if (!action) return;

    try {
      await updateAction(action.id, {
        is_enabled: !button.enabled,
      });
      toast({
        title: "Success",
        description: `Button ${!button.enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update button",
        variant: "destructive",
      });
    }
  };

  const handleDeleteButton = async (buttonId: string) => {
    try {
      await deleteAction(buttonId);
      toast({
        title: "Success",
        description: "Custom button deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete button",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Custom Actions</h2>
        <p className="text-muted-foreground">Create custom buttons and actions for your agent's chat interface</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Custom Button
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="button-text">Button Text</Label>
            <Input
              id="button-text"
              value={newButton.text}
              onChange={(e) => setNewButton(prev => ({ ...prev, text: e.target.value }))}
              placeholder="e.g., Get Quote, Download Brochure"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-action">Action/URL</Label>
            <Input
              id="button-action"
              value={newButton.action}
              onChange={(e) => setNewButton(prev => ({ ...prev, action: e.target.value }))}
              placeholder="https://example.com/action or custom action description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-description">Description (Optional)</Label>
            <Textarea
              id="button-description"
              value={newButton.description}
              onChange={(e) => setNewButton(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this button does"
              rows={2}
            />
          </div>

          <Button 
            onClick={handleSaveButton} 
            disabled={saving || !newButton.text.trim() || !newButton.action.trim()}
          >
            <Plus className="mr-2 h-4 w-4" />
            {saving ? 'Creating...' : 'Create Button'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          {customButtons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MousePointer className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No custom buttons created yet</p>
              <p className="text-sm">Create your first custom button to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customButtons.map((button) => (
                <div key={button.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{button.text}</h4>
                        <Badge variant={button.enabled ? 'default' : 'secondary'}>
                          {button.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Action: {button.action}
                      </p>
                      {button.description && (
                        <p className="text-sm text-muted-foreground">
                          {button.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={button.enabled}
                        onCheckedChange={() => handleToggleButton(button)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(button.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteButton(button.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {customButtons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-3">Custom buttons will appear in the chat interface:</p>
              <div className="flex flex-wrap gap-2">
                {customButtons.filter(b => b.enabled).map(button => (
                  <Button key={button.id} variant="outline" size="sm" disabled>
                    {button.text}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};