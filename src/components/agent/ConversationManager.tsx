import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { ConversationDetail } from './ConversationDetail';
import { ConversationFilters } from './ConversationFilters';
import { ConversationCard } from './ConversationCard';
import { useConversations } from '@/hooks/useConversations';

interface ConversationManagerProps {
  agentId: string;
}

export const ConversationManager = ({ agentId }: ConversationManagerProps) => {
  const { 
    conversations, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    filter, 
    setFilter 
  } = useConversations(agentId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

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
          <ConversationFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filter={filter}
            onFilterChange={setFilter}
          />

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filter !== 'all' 
                ? 'No conversations match your filters'
                : 'No conversations yet. Once visitors start chatting with your agent, they will appear here.'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  onSelect={setSelectedConversation}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};