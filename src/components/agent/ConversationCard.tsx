import { formatDistanceToNow } from 'date-fns';
import { Clock, MessageSquare, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/hooks/useConversations';

interface ConversationCardProps {
  conversation: Conversation;
  onSelect: (conversationId: string) => void;
}

export function ConversationCard({ conversation, onSelect }: ConversationCardProps) {
  return (
    <div
      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">Session {conversation.session_id.slice(-8)}</h4>
            <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
              {conversation.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {conversation.last_message.length > 100 
              ? `${conversation.last_message.slice(0, 100)}...`
              : conversation.last_message
            }
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {conversation.created_at ? formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true }) : 'Unknown time'}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {conversation.message_count} messages
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}