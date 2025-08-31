import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actions?: any[];
}

export const useChat = (agentId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeChat = async () => {
    try {
      // Add welcome message without creating conversation yet
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

  const createConversation = async () => {
    if (conversationId) return conversationId;
    
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
      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const sendMessage = async (content: string, enableStreaming = true) => {
    if (!content.trim()) return;

    // Create conversation on first message
    const currentConversationId = await createConversation();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder bot message for streaming
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: ChatMessage = {
      id: botMessageId,
      content: '',
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      console.log('Sending message to agent:', agentId);
      
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
              conversationId: currentConversationId,
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
                      
                      // Update the bot message with accumulated content
                      setMessages(prev => prev.map(msg => 
                        msg.id === botMessageId 
                          ? { ...msg, content: accumulatedContent }
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
          // Fall through to regular request
        }
      }

      // Fallback to regular request
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          agentId,
          message: content,
          conversationId: currentConversationId,
          stream: false
        }
      });

      if (error) throw error;

      // Update the bot message with the complete response and actions
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, content: data.message, actions: data.actions || [] }
          : msg
      ));

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
      
      // Remove both user and bot messages on error
      setMessages(prev => prev.filter(msg => 
        msg.id !== userMessage.id && msg.id !== botMessageId
      ));
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