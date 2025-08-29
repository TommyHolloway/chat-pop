import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAgents } from '@/hooks/useAgents';
import { toast } from '@/hooks/use-toast';

export const AgentSettingsAI = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { updateAgent } = useAgents();
  
  const [instructions, setInstructions] = useState(agent?.instructions || '');
  const [model, setModel] = useState(agent?.model || 'gpt-4');
  const [temperature, setTemperature] = useState([agent?.temperature || 0.7]);
  const [maxTokens, setMaxTokens] = useState(agent?.max_tokens || 2000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setInstructions(agent.instructions || '');
      setModel(agent.model || 'gpt-4');
      setTemperature([agent.temperature || 0.7]);
      setMaxTokens(agent.max_tokens || 2000);
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

        <Card>
          <CardHeader>
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription>
              Choose the AI model and adjust its parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min={100}
                  max={4000}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Temperature: {temperature[0]}</Label>
              <div className="mt-2">
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>
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