import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  session_id: string;
  created_at: string;
  message_count: number;
  last_message: string;
  status: 'active' | 'resolved' | 'needs_attention';
}

export const useConversations = (agentId: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'needs_attention'>('all');

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get conversations for this agent with message counts (exclude empty conversations)
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

      // Get last message for each conversation and filter out empty ones
      const conversationsWithDetails = await Promise.all(
        conversationsData?.map(async (conv) => {
          const messageCount = conv.messages?.[0]?.count || 0;
          
          // Skip conversations with no messages
          if (messageCount === 0) {
            return null;
          }

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
            message_count: messageCount,
            last_message: lastMessage?.content || 'No messages',
            status: 'active' as const // For now, all conversations are active
          };
        }) || []
      );

      // Filter out null values (empty conversations)
      const filteredConversations = conversationsWithDetails.filter(conv => conv !== null);

      setConversations(filteredConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchConversations();
    
    // Set up real-time subscription for conversations
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchConversations(); // Refresh when conversations change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations(); // Refresh when messages change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  // Filter conversations based on search term and filter
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || conv.status === filter;
    return matchesSearch && matchesFilter;
  });

  return {
    conversations: filteredConversations,
    loading,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    refreshConversations: fetchConversations
  };
};