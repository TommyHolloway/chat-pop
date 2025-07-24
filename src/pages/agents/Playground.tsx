import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  FileText,
  MessageSquare,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAgents } from '@/hooks/useAgents';

export const Playground = () => {
  const { id } = useParams();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getAgent } = useAgents();
  const [agent, setAgent] = useState<any>(null);
  
  const { messages, isLoading, sendMessage, resetChat, initializeChat } = useChat(id || '');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadAgent = async () => {
      if (id) {
        try {
          const agentData = await getAgent(id);
          setAgent(agentData);
        } catch (error) {
          console.error('Error loading agent:', error);
        }
      }
    };
    
    loadAgent();
    initializeChat();
  }, [id]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Agent Playground</h1>
              <p className="text-muted-foreground">
                Test your AI agent in a safe environment
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetChat}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Chat
              </Button>
              <Link to={`/agents/${id}/edit`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Agent Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agent Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{agent?.name || 'Loading...'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {agent?.description || 'Loading agent details...'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Live</Badge>
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Knowledge Files: 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Conversations: 234</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => setInputValue("Hello, what can you help me with?")}
                  >
                    <div>
                      <div className="font-medium">General Greeting</div>
                      <div className="text-xs text-muted-foreground">Start a conversation</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => setInputValue("Can you tell me about your features?")}
                  >
                    <div>
                      <div className="font-medium">Feature Inquiry</div>
                      <div className="text-xs text-muted-foreground">Ask about capabilities</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => setInputValue("I need help with something specific")}
                  >
                    <div>
                      <div className="font-medium">Support Request</div>
                      <div className="text-xs text-muted-foreground">General support inquiry</div>
                    </div>
                  </Button>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat Testing
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {messages.length - 1} messages
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={
                          message.sender === 'bot' 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted"
                        }>
                          {message.sender === 'bot' ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[80%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};