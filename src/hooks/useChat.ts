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
    console.log('🔄 [useChat] initializeChat called for agent:', agentId);
    try {
      // Add welcome message without creating conversation yet
      const welcomeMessage: ChatMessage = {
        id: '1',
        content: 'Hello! How can I help you today?',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      console.log('✅ [useChat] Welcome message set successfully');
    } catch (error) {
      console.error('❌ [useChat] Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat",
        variant: "destructive",
      });
    }
  };

  const createConversation = async () => {
    console.log('🔄 [useChat] createConversation called, current state:', { 
      conversationId, 
      isCreatingConversation, 
      agentId 
    });
    
    if (conversationId) {
      console.log('✅ [useChat] Conversation already exists:', conversationId);
      return conversationId;
    }
    
    if (isCreatingConversation) {
      console.log('⏳ [useChat] Conversation creation in progress, waiting...');
      // Wait for existing creation to complete
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!isCreatingConversation || conversationId) {
            clearInterval(checkInterval);
            resolve(void 0);
          }
        }, 50);
      });
      console.log('✅ [useChat] Conversation creation completed:', conversationId);
      return conversationId;
    }
    
    setIsCreatingConversation(true);
    try {
      console.log('🔄 [useChat] Creating new conversation for agent:', agentId);
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          session_id: `session_${Date.now()}`
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useChat] Database error creating conversation:', error);
        throw error;
      }
      
      console.log('✅ [useChat] New conversation created successfully:', conversation);
      setConversationId(conversation.id);
      return conversation.id;
    } catch (error) {
      console.error('❌ [useChat] Error creating conversation:', error);
      throw error;
    } finally {
      setIsCreatingConversation(false);
      console.log('🔄 [useChat] createConversation cleanup complete');
    }
  };

  const sendMessage = async (content: string, enableStreaming = true) => {
    console.log('🚀 [useChat] sendMessage called with:', { content, enableStreaming, agentId });
    
    // Validate agentId first
    if (!agentId) {
      console.error('❌ [useChat] No agentId provided');
      toast({
        title: "Error",
        description: "Agent ID is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const sanitizedContent = sanitizeInput(content);
    console.log('🔄 [useChat] Content sanitized:', { original: content, sanitized: sanitizedContent });
    
    if (!sanitizedContent.trim()) {
      console.log('⚠️ [useChat] Empty content after sanitization');
      return;
    }

    try {
      // Create conversation on first message
      console.log('🔄 [useChat] Creating conversation...');
      const currentConversationId = await createConversation();
      console.log('✅ [useChat] Conversation created/retrieved:', currentConversationId);

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
        console.log('📤 [useChat] Sending message to agent:', agentId);
        
        if (enableStreaming) {
          // Try streaming first
          try {
            console.log('🔄 [useChat] Attempting streaming request...');
            const { data, error } = await supabase.functions.invoke('chat-completion', {
              body: {
                agentId,
                message: sanitizedContent,
                conversationId: currentConversationId,
                stream: true
              }
            });

            console.log('📥 [useChat] Streaming response:', { data, error });
            if (error) throw error;

            // Handle streaming response
            if (data?.message) {
              console.log('✅ [useChat] Streaming successful, updating message');
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
            console.log('⚠️ [useChat] Streaming failed, falling back to regular request:', streamError);
            // Fall through to regular request
          }
        }

        // Fallback to regular request with retry logic
        console.log('🔄 [useChat] Attempting fallback request...');
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

        console.log('📥 [useChat] Fallback response:', { data, error });
        if (error) throw error;

        // Update the bot message with the complete response and actions
        console.log('✅ [useChat] Fallback successful, updating message');
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: data.message, actions: data.actions || [] }
            : msg
        ));

        // Log successful response
        if (data.cached) {
          console.log('💾 [useChat] Response served from cache');
        }
        
      } catch (error) {
        console.error('❌ [useChat] Error in API call:', error);
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
      
    } catch (conversationError) {
      console.error('❌ [useChat] Error creating conversation:', conversationError);
      toast({
        title: "Connection Error",
        description: "Failed to initialize conversation. Please try again.",
        variant: "destructive",
      });
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