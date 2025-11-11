import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, Upload, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentSettingsGeneral = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateAgent, deleteAgent } = useAgents();
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    description: agent?.description || '',
    status: agent?.status || 'active',
    profile_image_url: agent?.profile_image_url || '',
    instructions: agent?.instructions || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        status: agent.status || 'active',
        profile_image_url: agent.profile_image_url || '',
        instructions: agent.instructions || '',
      });
    }
  }, [agent]);

  // Handle Shopify subscription lifecycle callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chargeApproved = params.get('shopify_charge_approved');
    const chargeDeclined = params.get('shopify_charge_declined');
    const subscriptionCancelled = params.get('subscription_cancelled');
    const trialExpired = params.get('trial_expired');
    const subscriptionUpdated = params.get('subscription_updated');

    if (chargeApproved === 'true') {
      toast({
        title: 'Subscription Activated!',
        description: 'Your Shopify subscription is now active.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (chargeDeclined === 'true') {
      toast({
        title: 'Subscription Not Activated',
        description: 'The subscription charge was declined. Please try again or contact support.',
        variant: 'destructive'
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (subscriptionCancelled === 'true') {
      toast({
        title: 'Subscription Cancelled',
        description: "Your subscription has been cancelled and you've been downgraded to the free plan.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (trialExpired === 'true') {
      toast({
        title: 'Trial Expired',
        description: 'Your free trial has ended. Upgrade to continue using premium features.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (subscriptionUpdated === 'true') {
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription plan has been updated successfully.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Agent name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateAgent(id!, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        profile_image_url: formData.profile_image_url || null,
        instructions: formData.instructions.trim() || null,
      });

      toast({
        title: "Success",
        description: "Agent settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      await deleteAgent(id);
      
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
      
      // Navigate back to agents list
      navigate('/agents');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('agent-avatars')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('agent-avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, profile_image_url: publicUrl }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">General Settings</h2>
        <p className="text-muted-foreground">Configure basic information about your agent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.profile_image_url} />
              <AvatarFallback className="text-lg">
                {formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a profile image for your agent (optional)
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter agent name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="agent-description">Description</Label>
            <Textarea
              id="agent-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your agent (optional)"
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active - Agent is live and can receive messages</SelectItem>
                <SelectItem value="inactive">Inactive - Agent is disabled</SelectItem>
                <SelectItem value="maintenance">Maintenance - Agent shows maintenance message</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* AI Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">System Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={8}
              placeholder="You are a helpful assistant that..."
            />
            <p className="text-sm text-muted-foreground">
              Define your agent's personality, role, and behavior guidelines.
            </p>
          </div>
          
          <Button onClick={handleSave} disabled={loading || !formData.name.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Delete Agent</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete this agent and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={loading}>
                  Delete Agent
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your agent 
                    "{agent?.name}" and remove all associated data including conversations, 
                    knowledge files, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive hover:bg-destructive/90">
                    Delete Agent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};