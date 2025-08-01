import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface StreamingChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isStreaming?: boolean;
}

export const useStreamingChat = (agentId: string) => {
  const [messages, setMessages] = useState<StreamingChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeChat = async () => {
    try {
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
      
      const welcomeMessage: StreamingChatMessage = {
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

  const sendMessage = useCallback(async (content: string, enableStreaming = true) => {
    if (!content.trim() || !conversationId) return;

    const userMessage: StreamingChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: StreamingChatMessage = {
      id: botMessageId,
      content: '',
      sender: 'bot',
      timestamp: new Date(),
      isStreaming: enableStreaming
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      if (enableStreaming) {
        // Try streaming first
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          const response = await fetch(`https://etwjtxqjcwyxdamlcorf.supabase.co/functions/v1/chat-completion`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0d2p0eHFqY3d5eGRhbWxjb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzI3MTcsImV4cCI6MjA2ODk0ODcxN30.Dji_q0KFNL8hetK_Og8k9MI4l8sZJ5iCQQxQc4j1isM'
            },
            body: JSON.stringify({
              agentId,
              message: content,
              conversationId,
              stream: true
            })
          });

          if (!response.ok) throw new Error('Streaming failed');

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            let accumulatedContent = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content && !data.done) {
                      accumulatedContent += data.content;
                      
                      setMessages(prev => prev.map(msg => 
                        msg.id === botMessageId 
                          ? { ...msg, content: accumulatedContent, isStreaming: true }
                          : msg
                      ));
                    } else if (data.done) {
                      setMessages(prev => prev.map(msg => 
                        msg.id === botMessageId 
                          ? { ...msg, isStreaming: false }
                          : msg
                      ));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }

            setIsLoading(false);
            return;
          }
        } catch (streamError) {
          console.log('Streaming failed, falling back to regular request:', streamError);
        }
      }

      // Fallback to regular request
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          agentId,
          message: content,
          conversationId,
          stream: false
        }
      });

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, content: data.message, isStreaming: false }
          : msg
      ));

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
      
      setMessages(prev => prev.filter(msg => 
        msg.id !== userMessage.id && msg.id !== botMessageId
      ));
    } finally {
      setIsLoading(false);
    }
  }, [agentId, conversationId, toast]);

  const resetChat = async () => {
    setMessages([]);
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