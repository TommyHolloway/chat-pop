import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Play, User, Bot, FileText, TestTube } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { useKnowledgeFiles } from '@/hooks/useAgents';
import { useAgentTextKnowledge } from '@/hooks/useAgentTextKnowledge';
import { useAgentQnAKnowledge } from '@/hooks/useAgentQnAKnowledge';
import { useAgentLinks } from '@/hooks/useAgentLinks';
import { supabase } from '@/integrations/supabase/client';

interface CompletionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  route: string;
}

interface AgentCompletionProgressProps {
  agent: any;
}

export const AgentCompletionProgress = ({ agent }: AgentCompletionProgressProps) => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [hasPlaygroundActivity, setHasPlaygroundActivity] = useState(false);
  
  const { files } = useKnowledgeFiles(agent?.id);
  const { textKnowledge } = useAgentTextKnowledge(agent?.id);
  const { qnaKnowledge } = useAgentQnAKnowledge(agent?.id);
  const { links } = useAgentLinks(agent?.id);

  // Check if agent has had playground activity
  useEffect(() => {
    const checkPlaygroundActivity = async () => {
      if (!agent?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('agent_id', agent.id)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setHasPlaygroundActivity(true);
        }
      } catch (error) {
        console.error('Error checking playground activity:', error);
      }
    };

    checkPlaygroundActivity();
  }, [agent?.id]);

  const steps: CompletionStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Agent name and description',
      icon: User,
      completed: !!(agent?.name && agent?.description),
      route: 'settings/general'
    },
    {
      id: 'ai-config',
      title: 'AI Configuration',
      description: 'Instructions configured',
      icon: Bot,
      completed: !!(agent?.instructions),
      route: 'settings/ai'
    },
    {
      id: 'knowledge',
      title: 'Knowledge Sources',
      description: 'At least one knowledge source added',
      icon: FileText,
      completed: (files?.length > 0) || (textKnowledge?.length > 0) || (qnaKnowledge?.length > 0) || (links?.length > 0),
      route: 'sources/files'
    },
    {
      id: 'testing',
      title: 'Test in Playground',
      description: 'Send at least one test message',
      icon: TestTube,
      completed: hasPlaygroundActivity,
      route: 'playground'
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const isFullyComplete = completedSteps === steps.length;

  const handleStepClick = (step: CompletionStep) => {
    navigate(`/workspace/${workspaceId}/agents/${agent.id}/${step.route}`);
  };

  const handleTestNow = () => {
    navigate(`/workspace/${workspaceId}/agents/${agent.id}/playground`);
  };

  // Hide the component if fully complete
  if (isFullyComplete) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Agent Setup Progress</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete these steps to get your agent ready
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{completedSteps} of {steps.length} steps completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              onClick={() => handleStepClick(step)}
              className={`
                p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                ${step.completed 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-muted/50 hover:bg-muted'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <div className={`
                  p-1.5 rounded-full 
                  ${step.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}
                `}>
                  {step.completed ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`
                    font-medium text-xs 
                    ${step.completed ? 'text-green-900' : 'text-foreground'}
                  `}>
                    {step.title}
                  </h4>
                  <p className={`
                    text-xs mt-0.5 
                    ${step.completed ? 'text-green-700' : 'text-muted-foreground'}
                  `}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Click on any step above to complete it. Your agent will be ready to deploy once all steps are finished.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};