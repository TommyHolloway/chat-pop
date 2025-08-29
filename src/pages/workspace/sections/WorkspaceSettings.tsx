import { useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export const WorkspaceSettings = () => {
  const { currentWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [description, setDescription] = useState(currentWorkspace?.description || '');

  const handleSave = async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    try {
      await updateWorkspace(currentWorkspace.id, { name, description });
      toast({
        title: "Workspace updated",
        description: "Your workspace settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentWorkspace.name}"? This action cannot be undone and will delete all agents and data in this workspace.`
    );
    
    if (confirmed) {
      try {
        await deleteWorkspace(currentWorkspace.id);
        toast({
          title: "Workspace deleted",
          description: "Your workspace has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete workspace. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">
          Manage settings for {currentWorkspace.name}
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Information
          </CardTitle>
          <CardDescription>
            Update your workspace name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter workspace description (optional)"
              rows={3}
            />
          </div>
          
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Delete Workspace</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete a workspace, there is no going back. All agents, conversations, 
                and data will be permanently deleted.
              </p>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Workspace
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};