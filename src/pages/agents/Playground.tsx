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

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const Playground = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Customer Support Bot. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Mock AI response - replace with actual API call
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('pricing') || input.includes('cost') || input.includes('price')) {
      return "Our pricing starts at $29/month for the Basic plan, which includes up to 1,000 conversations. We also offer Pro ($99/month) and Enterprise plans. Would you like me to provide more details about any specific plan?";
    }
    
    if (input.includes('refund') || input.includes('cancel')) {
      return "I understand you're asking about refunds or cancellations. We offer a 30-day money-back guarantee for all new customers. For existing customers, you can cancel your subscription at any time. Would you like me to connect you with our billing team for assistance?";
    }
    
    if (input.includes('support') || input.includes('help') || input.includes('problem')) {
      return "I'm here to help! Can you tell me more about the specific issue you're experiencing? The more details you provide, the better I can assist you.";
    }
    
    if (input.includes('features') || input.includes('what can') || input.includes('capabilities')) {
      return "Our platform offers many powerful features including: AI-powered chat responses, knowledge base integration, custom branding, analytics dashboard, and multi-platform deployment. Is there a specific feature you'd like to learn more about?";
    }
    
    return "Thank you for your message! I understand you're asking about: \"" + userInput + "\". Based on our knowledge base, I'd recommend checking our documentation or I can connect you with a human agent for more specialized assistance. Is there anything specific I can help clarify?";
  };

  const resetChat = () => {
    setMessages([{
      id: '1',
      content: 'Hello! I\'m your Customer Support Bot. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
                  <h3 className="font-semibold">Customer Support Bot</h3>
                  <p className="text-sm text-muted-foreground">
                    Handles general customer inquiries and support tickets.
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
                  onClick={() => setInputValue("What are your pricing plans?")}
                >
                  <div>
                    <div className="font-medium">Pricing Inquiry</div>
                    <div className="text-xs text-muted-foreground">Ask about pricing plans</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInputValue("I need help with my account")}
                >
                  <div>
                    <div className="font-medium">Support Request</div>
                    <div className="text-xs text-muted-foreground">General support inquiry</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setInputValue("How do I cancel my subscription?")}
                >
                  <div>
                    <div className="font-medium">Cancellation</div>
                    <div className="text-xs text-muted-foreground">Cancellation request</div>
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
                  <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
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