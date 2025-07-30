import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const useChat = (agentId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeChat = async () => {
    try {
      // Create a new conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          session_id: `session_${Date.now()}`
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: '1',
        content: 'Hello! How can I help you today?',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversationId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('Sending message to agent:', agentId);
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          agentId,
          message: content,
          conversationId
        }
      });

      if (error) throw error;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Log successful response
      if (data.cached) {
        console.log('Response served from cache');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = async () => {
    await initializeChat();
  };

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    initializeChat
  };
};