import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/useAgents';
import { toast } from '@/hooks/use-toast';

export const AgentSettingsAI = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { updateAgent } = useAgents();
  
  const [instructions, setInstructions] = useState(agent?.instructions || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setInstructions(agent.instructions || '');
    }
  }, [agent]);

  const handleSave = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Only update the instructions field for now, as other fields may not exist in the schema
      await updateAgent(id, {
        name: agent.name, // Required field
        instructions,
      });
      
      toast({
        title: "Success",
        description: "AI configuration updated successfully",
      });
    } catch (error) {
      console.error('Error updating AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to update AI configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Configuration</h2>
        <p className="text-muted-foreground">
          Configure your agent's AI behavior and responses.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Instructions</CardTitle>
            <CardDescription>
              Define your agent's personality, role, and behavior guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                placeholder="You are a helpful assistant that..."
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};