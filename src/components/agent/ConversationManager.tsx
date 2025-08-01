import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Clock,
  User,
  Bot,
  Eye,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ConversationDetail } from './ConversationDetail';

interface Conversation {
  id: string;
  session_id: string;
  created_at: string;
  message_count: number;
  last_message: string;
  status: 'active' | 'resolved' | 'needs_attention';
}

interface ConversationManagerProps {
  agentId: string;
}

export const ConversationManager = ({ agentId }: ConversationManagerProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'needs_attention'>('all');

  useEffect(() => {
    fetchConversations();
  }, [agentId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Get conversations for this agent with message counts
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          session_id,
          created_at,
          messages(count)
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get last message for each conversation
      const conversationsWithDetails = await Promise.all(
        conversationsData?.map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, role')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: conv.id,
            session_id: conv.session_id,
            created_at: conv.created_at,
            message_count: conv.messages?.[0]?.count || 0,
            last_message: lastMessage?.content || 'No messages',
            status: 'active' as const // For now, all conversations are active
          };
        }) || []
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || conv.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (selectedConversation) {
    return (
      <ConversationDetail 
        conversationId={selectedConversation}
        onBack={() => setSelectedConversation(null)}
        agentId={agentId}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <CardDescription>
            Monitor and manage conversations with your AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={filter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('resolved')}
              >
                Resolved
              </Button>
              <Button
                variant={filter === 'needs_attention' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('needs_attention')}
              >
                Needs Attention
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filter !== 'all' 
                ? 'No conversations match your filters'
                : 'No conversations yet. Once visitors start chatting with your agent, they will appear here.'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedConversation(conversation.id)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};