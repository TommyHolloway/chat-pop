import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  FileText,
  MessageSquare,
  Settings,
  RefreshCw,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  Zap,
  Database,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAgents, useKnowledgeFiles } from '@/hooks/useAgents';
import { ActionButtons } from '@/components/chat/ActionButtons';

export const Playground = () => {
  const { id } = useParams();
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getAgent } = useAgents();
  const { files } = useKnowledgeFiles(id || '');
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

  // Calculate training metrics
  const storageUsed = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0;
  const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const sourcesCount = files?.length || 0;
  const lastTraining = files?.length > 0 ? new Date().toLocaleDateString() : 'Never';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Playground</h1>
              </div>
              <Button variant="outline" size="sm">
                Compare agents
              </Button>
            </div>
            
            {/* Training Status */}
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Trained</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last: {lastTraining}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>{storageUsedMB} MB used</span>
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Instructions */}
            <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Instructions</span>
                </div>
                {instructionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Textarea 
                  value={agent?.instructions || 'Loading instructions...'}
                  readOnly
                  className="min-h-[100px] resize-none bg-muted/30"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Sources */}
            <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Sources</span>
                  <Badge variant="secondary" className="text-xs">{sourcesCount}</Badge>
                </div>
                {sourcesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {files?.slice(0, 5).map((file) => (
                  <div key={file.id} className="p-2 bg-muted/30 rounded text-sm">
                    <div className="font-medium truncate">{file.filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {((file.file_size || 0) / 1024).toFixed(1)} KB
                    </div>
                  </div>
                )) || (
                  <div className="text-sm text-muted-foreground p-2">No sources uploaded</div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* AI Actions */}
            <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">AI Actions</span>
                  <Badge variant="secondary" className="text-xs">3</Badge>
                </div>
                {actionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <div className="p-2 bg-muted/30 rounded text-sm">
                  <div className="font-medium">Search Knowledge</div>
                  <div className="text-xs text-muted-foreground">Search through uploaded files</div>
                </div>
                <div className="p-2 bg-muted/30 rounded text-sm">
                  <div className="font-medium">Generate Response</div>
                  <div className="text-xs text-muted-foreground">Create contextual replies</div>
                </div>
                <div className="p-2 bg-muted/30 rounded text-sm">
                  <div className="font-medium">Follow Instructions</div>
                  <div className="text-xs text-muted-foreground">Execute custom instructions</div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Test Scenarios */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Test Scenarios</h3>
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
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="p-4 border-t">
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-card border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{agent?.name || 'Loading...'}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {messages.length > 0 ? messages.length - 1 : 0} messages
                </Badge>
                <Button variant="outline" size="sm" onClick={resetChat}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Link to={`/agents/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <div className={`max-w-[70%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                  <div
                     className={`rounded-lg px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                     }`}
                   >
                     {message.content}
                   </div>
                   {message.sender === 'bot' && message.actions && (
                     <ActionButtons 
                       actions={message.actions}
                       agentId={id || ''}
                       conversationId={messages.find(m => m.sender === 'bot')?.id || ''}
                     />
                   )}
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
                <div className="bg-muted rounded-lg px-4 py-3">
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
          <div className="border-t p-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};