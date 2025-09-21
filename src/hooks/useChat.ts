import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { withTimeout, withRetry } from '@/utils/apiHelpers';
import { sanitizeInput } from '@/utils/validation';

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
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
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
    if (isCreatingConversation) {
      // Wait for existing creation to complete
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!isCreatingConversation || conversationId) {
            clearInterval(checkInterval);
            resolve(void 0);
          }
        }, 50);
      });
      return conversationId;
    }
    
    setIsCreatingConversation(true);
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
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const sendMessage = async (content: string, enableStreaming = true) => {
    const sanitizedContent = sanitizeInput(content);
    if (!sanitizedContent.trim()) return;

    // Create conversation on first message
    const currentConversationId = await createConversation();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: sanitizedContent,
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
          const { data, error } = await supabase.functions.invoke('chat-completion', {
            body: {
              agentId,
              message: sanitizedContent,
              conversationId: currentConversationId,
              stream: true
            }
          });

          if (error) throw error;

          // Handle streaming response
          if (data?.message) {
            // Update the bot message with the complete response
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, content: data.message, actions: data.actions || [] }
                : msg
            ));
            
            setIsLoading(false);
            return;
          }
        } catch (streamError) {
          console.log('Streaming failed, falling back to regular request:', streamError);
          // Fall through to regular request
        }
      }

      // Fallback to regular request with retry logic
      const { data, error } = await withRetry(
        () => withTimeout(
          supabase.functions.invoke('chat-completion', {
            body: {
              agentId,
              message: sanitizedContent,
              conversationId: currentConversationId,
              stream: false
            }
          }),
          30000 // 30 second timeout
        ),
        { maxAttempts: 2 } // Only retry once for chat completion
      );

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
    setMessages([]);
    setConversationId(null);
    setIsCreatingConversation(false);
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