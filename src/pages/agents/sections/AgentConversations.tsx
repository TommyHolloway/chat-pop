import { useParams } from 'react-router-dom';
import { ConversationManager } from '@/components/agent/ConversationManager';

export const AgentConversations = ({ agent }: { agent: any }) => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Conversations</h2>
        <p className="text-muted-foreground">View and manage agent conversations</p>
      </div>
      
      <ConversationManager agentId={id!} />
    </div>
  );
};