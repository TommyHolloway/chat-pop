import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, CheckCircle, AlertCircle } from 'lucide-react';

interface TrainingProgressProps {
  agentId: string;
  onTrainingComplete?: () => void;
}

export const TrainingProgress: React.FC<TrainingProgressProps> = ({ 
  agentId, 
  onTrainingComplete 
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const { toast } = useToast();

  const trainAgent = async () => {
    setIsTraining(true);
    setProgress(0);
    setStatus('processing');
    setStatusMessage('Initializing training...');

    try {
      // Step 1: Start training
      setProgress(20);
      setStatusMessage('Analyzing knowledge sources...');
      
      const { data, error } = await supabase.functions.invoke('train-agent', {
        body: { agentId }
      });

      if (error) throw error;

      // Step 2: Processing
      setProgress(60);
      setStatusMessage('Chunking content for optimal performance...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Complete
      setProgress(100);
      setStatus('success');
      setStatusMessage(`Training complete! Created ${data?.chunks_created || 0} knowledge chunks.`);

      toast({
        title: "Training Complete",
        description: "Your agent has been trained with the latest knowledge base.",
      });

      onTrainingComplete?.();

    } catch (error) {
      console.error('Training failed:', error);
      setStatus('error');
      setStatusMessage(`Training failed: ${error.message}`);
      
      toast({
        title: "Training Failed",
        description: "There was an error training your agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Brain className="h-5 w-5 animate-pulse text-primary" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Brain className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Agent Training
        </CardTitle>
        <CardDescription>
          Train your agent with the latest knowledge base for improved responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTraining && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            {statusMessage}
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {statusMessage}
          </div>
        )}

        <Button 
          onClick={trainAgent}
          disabled={isTraining}
          className="w-full"
        >
          {isTraining ? 'Training...' : 'Train Agent'}
        </Button>
      </CardContent>
    </Card>
  );
};