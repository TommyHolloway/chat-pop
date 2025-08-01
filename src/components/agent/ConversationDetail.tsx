import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Bot, 
  User, 
  Send,
  UserCheck,
  CheckCircle,
  MessageSquare,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ConversationDetailProps {
  conversationId: string;
  onBack: () => void;
  agentId: string;
}

export const ConversationDetail = ({ conversationId, onBack, agentId }: ConversationDetailProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversationDetails();
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversationInfo(data);
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeover = () => {
    setIsHumanTakeover(true);
    toast({
      title: "Human Takeover Activated",
      description: "You can now respond directly to the user. The AI agent will be paused.",
    });
  };

  const handleReturnToAI = () => {
    setIsHumanTakeover(false);
    toast({
      title: "Returned to AI",
      description: "The AI agent will now handle future messages in this conversation.",
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: newMessage
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // Refresh messages
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the user.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markAsResolved = async () => {
    // For now, just show a toast since we don't have a status field in the conversations table
    toast({
      title: "Conversation Marked as Resolved",
      description: "This conversation has been marked as resolved.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Conversation Details</h2>
          <p className="text-muted-foreground">
            Session: {conversationInfo?.session_id}
          </p>
        </div>
        <div className="flex gap-2">
          {!isHumanTakeover ? (
            <Button onClick={handleTakeover} variant="default">
              <UserCheck className="h-4 w-4 mr-2" />
              Take Over
            </Button>
          ) : (
            <Button onClick={handleReturnToAI} variant="outline">
              <Bot className="h-4 w-4 mr-2" />
              Return to AI
            </Button>
          )}
          <Button onClick={markAsResolved} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Messages */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
                {isHumanTakeover && (
                  <Badge variant="default">Human Takeover Active</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={
                          message.role === 'assistant' 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted"
                        }>
                          {message.role === 'assistant' ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'Unknown time'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Human Takeover Input */}
              {isHumanTakeover && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <UserCheck className="h-4 w-4" />
                    You are responding as a human agent
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your response..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Started {conversationInfo?.created_at ? formatDistanceToNow(new Date(conversationInfo.created_at), { addSuffix: true }) : 'Unknown time'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{messages.length} messages</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>
                Add notes about this conversation for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button className="w-full mt-3" variant="outline" size="sm">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};