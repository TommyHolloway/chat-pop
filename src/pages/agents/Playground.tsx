import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  CheckCircle2,
  Save,
  AlertCircle
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useAgents, useKnowledgeFiles } from '@/hooks/useAgents';
import { useAgentActions } from '@/hooks/useAgentActions';
import { ActionButtons } from '@/components/chat/ActionButtons';
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import { toast } from '@/hooks/use-toast';


export const Playground = () => {
  const { id } = useParams();
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getAgent, updateAgent } = useAgents();
  const { files } = useKnowledgeFiles(id || '');
  const { actions } = useAgentActions(id);
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
          setInstructions(agentData?.instructions || '');
        } catch (error) {
          console.error('Error loading agent:', error);
        }
      }
    };
    
    loadAgent();
    initializeChat();
  }, [id]);

  // Update instructions when agent changes (from external updates)
  useEffect(() => {
    if (agent?.instructions !== undefined && agent.instructions !== instructions) {
      setInstructions(agent.instructions);
      setHasUnsavedChanges(false);
    }
  }, [agent?.instructions]);

  // Keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSaveInstructions();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges]);

  const handleSendMessage = async () => {
    console.log('🚀 [Playground] handleSendMessage called with input:', inputValue);
    if (!inputValue.trim()) {
      console.log('⚠️ [Playground] Empty input value, returning early');
      return;
    }
    await sendMessage(inputValue);
    setInputValue('');
    console.log('✅ [Playground] Message sent and input cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('⌨️ [Playground] Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('📨 [Playground] Enter pressed, calling handleSendMessage');
      handleSendMessage();
    }
  };

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    setHasUnsavedChanges(value !== (agent?.instructions || ''));
  };

  const handleSaveInstructions = async () => {
    if (!id || !hasUnsavedChanges) return;

    setSavingInstructions(true);
    try {
      await updateAgent(id, {
        name: agent.name, // Required field
        instructions,
      });

      // Update local agent state
      setAgent((prev: any) => prev ? { ...prev, instructions } : null);
      setHasUnsavedChanges(false);

      toast({
        title: "Instructions saved",
        description: "Your AI instructions have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving instructions:', error);
      toast({
        title: "Error saving instructions",
        description: "Failed to update AI instructions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingInstructions(false);
    }
  };

  // Calculate training metrics
  const storageUsed = files?.reduce((total, file) => total + (file.file_size || 0), 0) || 0;
  const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const sourcesCount = files?.length || 0;
  const lastTraining = files?.length > 0 ? new Date().toLocaleDateString() : 'Never';
  
  // Get enabled AI actions
  const enabledActions = actions?.filter(action => action.is_enabled) || [];
  const actionsCount = enabledActions.length;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="h-[calc(100vh-4rem)] bg-background flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b flex-shrink-0">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {/* Instructions */}
            <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Instructions</span>
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Unsaved</span>
                    </div>
                  )}
                </div>
                {instructionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <Textarea 
                  value={instructions}
                  onChange={(e) => handleInstructionsChange(e.target.value)}
                  placeholder="Enter your AI instructions here..."
                  className="min-h-[100px] resize-none"
                />
                {hasUnsavedChanges && (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Press Ctrl+S to save or click the save button
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSaveInstructions}
                      disabled={savingInstructions}
                      className="h-7"
                    >
                      {savingInstructions ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      {savingInstructions ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
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
                  <Badge variant="secondary" className="text-xs">{actionsCount}</Badge>
                </div>
                {actionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {enabledActions.length > 0 ? (
                  enabledActions.map((action) => (
                    <div key={action.id} className="p-2 bg-muted/30 rounded text-sm">
                      <div className="font-medium">
                        {action.action_type === 'calendar_booking' ? 'Calendar Booking' : 
                         action.action_type === 'custom_button' ? action.config_json.button_text : 
                         action.action_type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {action.action_type === 'calendar_booking' ? 'Book appointments with users' :
                         action.action_type === 'custom_button' ? 'Custom action button' :
                         'AI Action'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-2">0 active actions</div>
                )}
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
          <div className="p-4 border-t flex-shrink-0">
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Chat Interface - Widget Style */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 p-8">
          <div className="w-full max-w-[500px] h-[700px] flex flex-col bg-background rounded-2xl shadow-2xl border overflow-hidden">
            {/* Chat Header */}
            <div className="bg-background border-b p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback 
                    style={{ 
                      backgroundColor: agent?.message_bubble_color + '20' || '#3B82F620',
                      color: agent?.message_bubble_color || '#3B82F6'
                    }}
                  >
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-base">{agent?.name || 'Loading...'}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">
                  {messages.length > 0 ? messages.length - 1 : 0} messages
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetChat}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Link to={`/agents/${id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback 
                    className={message.sender === 'bot' ? "" : "bg-muted"}
                    style={message.sender === 'bot' ? {
                      backgroundColor: agent?.message_bubble_color + '20' || '#3B82F620',
                      color: agent?.message_bubble_color || '#3B82F6'
                    } : {}}
                  >
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
                        ? 'text-white'
                        : 'bg-muted'
                     }`}
                     style={message.sender === 'user' ? {
                       backgroundColor: agent?.message_bubble_color || '#3B82F6'
                     } : {}}
                   >
                     <MarkdownMessage content={message.content} />
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
                  <AvatarFallback 
                    style={{ 
                      backgroundColor: agent?.message_bubble_color + '20' || '#3B82F620',
                      color: agent?.message_bubble_color || '#3B82F6'
                    }}
                  >
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

            {/* Message Input */}
            <div className="border-t bg-background p-4 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-muted/50 border-muted"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-green-500 hover:bg-green-600 h-10 w-10 p-0"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};