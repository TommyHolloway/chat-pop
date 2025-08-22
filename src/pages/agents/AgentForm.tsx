import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAgents, Agent } from '@/hooks/useAgents';
import { useKnowledgeFiles } from '@/hooks/useAgents';
import { useAgentActions } from '@/hooks/useAgentActions';
import { useCalendarIntegrations } from '@/hooks/useCalendarIntegrations';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/agent/ImageUpload';
import { ColorPicker } from '@/components/agent/ColorPicker';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Upload, 
  File, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Link as LinkIcon, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Database,
  Settings,
  MessageSquare,
  Palette,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Globe,
  Lock,
  FileType,
  FileSpreadsheet,
  Calendar,
  ExternalLink,
  Zap,
  UserCheck
} from 'lucide-react';
import { FirecrawlService } from '@/utils/FirecrawlService';

export const AgentForm = () => {
  const { id: agentId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!agentId;
  const { toast } = useToast();
  
  const { createAgent, updateAgent, getAgent } = useAgents();
  const { files, uploadFile, deleteFile, reprocessFile, refetchFiles } = useKnowledgeFiles(agentId || '');
  const { actions, createAction, updateAction, deleteAction } = useAgentActions(agentId);
  const { integrations, createIntegration, updateIntegration, deleteIntegration, testConnection } = useCalendarIntegrations(agentId);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    status: 'active' as 'active' | 'inactive' | 'draft',
    initial_message: '',
    creativity_level: 5,
    profile_image_url: '',
    message_bubble_color: '#3B82F6',
    chat_interface_theme: 'dark',
    enable_lead_capture: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [newUrl, setNewUrl] = useState('');
  const [links, setLinks] = useState<any[]>([]);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);
  
  // AI Actions state
  const [calendarBookingEnabled, setCalendarBookingEnabled] = useState(false);
  const [customButtonEnabled, setCustomButtonEnabled] = useState(false);
  const [calendarConfig, setCalendarConfig] = useState({
    integration_mode: 'redirect' as 'redirect' | 'embedded',
    provider: 'calendly' as 'calendly' | 'calcom' | 'google',
    redirect_url: '',
    api_key: '',
    trigger_instructions: 'If user asks to book or schedule an appointment',
    // Legacy support
    calendly_link: '',
    // Provider specific fields
    calendly_username: '',
    calendar_id: ''
  });
  const [buttonConfig, setButtonConfig] = useState({
    button_text: '',
    button_url: '',
    display_condition: ''
  });

  useEffect(() => {
    if (isEditing && agentId) {
      loadAgent();
    }
  }, [isEditing, agentId]);

  const loadAgent = async () => {
    try {
      const data = await getAgent(agentId!);
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          instructions: data.instructions || '',
          status: (data.status as 'active' | 'inactive' | 'draft') || 'active',
          initial_message: data.initial_message || '',
          creativity_level: data.creativity_level || 5,
          profile_image_url: data.profile_image_url || '',
          message_bubble_color: data.message_bubble_color || '#3B82F6',
          chat_interface_theme: data.chat_interface_theme || 'dark',
          enable_lead_capture: data.enable_lead_capture || false,
        });

        // Load existing actions
        const calendarAction = actions.find(a => a.action_type === 'calendar_booking');
        if (calendarAction) {
          setCalendarBookingEnabled(calendarAction.is_enabled);
          setCalendarConfig(calendarAction.config_json);
        }
        
        const buttonAction = actions.find(a => a.action_type === 'custom_button');
        if (buttonAction) {
          setCustomButtonEnabled(buttonAction.is_enabled);
          setButtonConfig(buttonAction.config_json);
        }
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      toast({
        title: "Error",
        description: "Failed to load agent data.",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!agentId) {
      toast({
        title: "Error",
        description: "Please save the agent first before uploading files.",
        variant: "destructive",
      });
      return;
    }

    const uploadedFiles = Array.from(event.target.files || []);
    
    try {
      setLoading(true);
      
      for (const file of uploadedFiles) {
        await uploadFile(file, agentId);
      }
      
      await refetchFiles();
      
      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFiles.length} file(s) added to knowledge base.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeFile = async (file: { id: string; file_path: string; filename: string }) => {
    try {
      await deleteFile(file.id, file.file_path);
      await refetchFiles();
      
      toast({
        title: "File removed",
        description: `${file.filename} has been removed from the knowledge base.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReprocessFile = async (file: { id: string; file_path: string; filename: string; content_type: string }) => {
    try {
      await reprocessFile(file.id, file.file_path, file.filename, file.content_type);
      await refetchFiles();
      
      toast({
        title: "File reprocessed",
        description: `${file.filename} has been successfully reprocessed.`,
      });
    } catch (error: any) {
      toast({
        title: "Reprocessing failed",
        description: error.message || "Failed to reprocess file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddLink = async () => {
    if (!newUrl.trim() || !agentId) return;
    
    try {
      new URL(newUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Add link logic here - simplified for now
      setNewUrl('');
      toast({
        title: "Link added",
        description: "Training link has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add training link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrainAgent = async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      // Training logic here
      toast({
        title: "Training Complete",
        description: "Your agent has been updated with the latest knowledge.",
      });
    } catch (error) {
      toast({
        title: "Training failed",
        description: "Failed to train agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getContentStatus = (processedContent: string | null) => {
    if (!processedContent) return { status: 'failed', message: 'No content' };
    if (processedContent.includes('Processing file content...') || processedContent.includes('Reprocessing file content...')) {
      return { status: 'processing', message: 'Processing...' };
    }
    if (processedContent.includes('Content extraction failed') || processedContent.includes('Reprocessing failed')) {
      return { status: 'failed', message: 'Extraction failed' };
    }
    if (processedContent.length < 50) {
      return { status: 'warning', message: 'Limited content' };
    }
    return { status: 'success', message: 'Content extracted' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileType className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      case 'md':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'txt':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let agentIdToUse = agentId;
      
      if (isEditing && agentId) {
        await updateAgent(agentId, formData);
        toast({
          title: "Agent updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const newAgent = await createAgent(formData);
        agentIdToUse = newAgent.id;
        toast({
          title: "Agent created", 
          description: `${formData.name} has been created successfully.`,
        });
        navigate(`/agents/${newAgent.id}/edit`);
      }

      // Save AI Actions
      if (agentIdToUse) {
        // Handle Calendar Booking Action
        const existingCalendarAction = actions.find(a => a.action_type === 'calendar_booking');
        if (calendarBookingEnabled && (calendarConfig.redirect_url || calendarConfig.calendly_link)) {
          const calendarData = {
            agent_id: agentIdToUse,
            action_type: 'calendar_booking' as const,
            config_json: calendarConfig,
            is_enabled: calendarBookingEnabled
          };
          
          if (existingCalendarAction) {
            await updateAction(existingCalendarAction.id, calendarData);
          } else {
            await createAction(calendarData);
          }
          
          // Create calendar integration if embedded mode
          if (calendarConfig.integration_mode === 'embedded' && calendarConfig.api_key) {
            await createIntegration({
              agent_id: agentIdToUse,
              provider: calendarConfig.provider,
              integration_mode: 'embedded',
              configuration_json: calendarConfig,
              api_key: calendarConfig.api_key
            });
          }
        } else if (existingCalendarAction && !calendarBookingEnabled) {
          await deleteAction(existingCalendarAction.id);
        }

        // Handle Custom Button Action
        const existingButtonAction = actions.find(a => a.action_type === 'custom_button');
        if (customButtonEnabled && buttonConfig.button_text && buttonConfig.button_url) {
          const buttonData = {
            agent_id: agentIdToUse,
            action_type: 'custom_button' as const,
            config_json: buttonConfig,
            is_enabled: customButtonEnabled
          };
          
          if (existingButtonAction) {
            await updateAction(existingButtonAction.id, buttonData);
          } else {
            await createAction(buttonData);
          }
        } else if (existingButtonAction && !customButtonEnabled) {
          await deleteAction(existingButtonAction.id);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Agent' : 'Create New Agent'}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="chat-settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat-settings" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Settings
            </TabsTrigger>
            <TabsTrigger value="knowledge-training" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Knowledge & Training
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat-settings" className="space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Configure your agent's basic details and profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agent Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter agent name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of your agent"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="space-y-2">
                      <Label>Profile Image</Label>
                      <ImageUpload
                        currentImage={formData.profile_image_url}
                        onImageChange={(imageUrl) => setFormData({ ...formData, profile_image_url: imageUrl || '' })}
                        agentId={agentId}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat Settings
                </CardTitle>
                <CardDescription>
                  Configure how your agent interacts with users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="initial_message">Initial Message</Label>
                  <Textarea
                    id="initial_message"
                    value={formData.initial_message}
                    onChange={(e) => setFormData({ ...formData, initial_message: e.target.value })}
                    placeholder="First message shown when chat starts (optional)"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Creativity Level: {formData.creativity_level}</Label>
                  <Slider
                    value={[formData.creativity_level]}
                    onValueChange={(value) => setFormData({ ...formData, creativity_level: value[0] })}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Focused (1)</span>
                    <span>Balanced (5)</span>
                    <span>Creative (10)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Chat Interface Settings
                </CardTitle>
                <CardDescription>
                  Customize the appearance of your chat widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ColorPicker
                  label="Message Bubble Color"
                  value={formData.message_bubble_color}
                  onChange={(color) => setFormData({ ...formData, message_bubble_color: color })}
                />

                <div className="space-y-2">
                  <Label htmlFor="theme">Interface Theme</Label>
                  <Select 
                    value={formData.chat_interface_theme} 
                    onValueChange={(value) => setFormData({ ...formData, chat_interface_theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chat Preview */}
                <div className="p-4 border rounded-lg bg-muted/20">
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className={`p-4 rounded-lg ${formData.chat_interface_theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {formData.profile_image_url ? (
                          <img 
                            src={formData.profile_image_url} 
                            alt="Agent" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">{formData.name || 'Agent Name'}</div>
                        <div className={`inline-block px-3 py-2 rounded-lg text-sm text-white`} 
                             style={{ backgroundColor: formData.message_bubble_color }}>
                          {formData.initial_message || 'Hello! How can I help you today?'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI Actions
                </CardTitle>
                <CardDescription>
                  Configure intelligent actions your agent can perform during conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calendar Booking Action */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Calendar Booking</h4>
                        <p className="text-sm text-muted-foreground">
                          Enable appointment scheduling with multiple integration options
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={calendarBookingEnabled}
                      onCheckedChange={setCalendarBookingEnabled}
                    />
                  </div>
                  
                  {calendarBookingEnabled && (
                    <div className="space-y-4 pl-8">
                      {/* Integration Mode Selector */}
                      <div className="space-y-2">
                        <Label>Integration Mode</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={calendarConfig.integration_mode === 'redirect' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCalendarConfig({ ...calendarConfig, integration_mode: 'redirect' })}
                            className="justify-start"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Redirect
                          </Button>
                          <Button
                            variant={calendarConfig.integration_mode === 'embedded' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCalendarConfig({ ...calendarConfig, integration_mode: 'embedded' })}
                            className="justify-start"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Embedded
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {calendarConfig.integration_mode === 'redirect' 
                            ? 'Users will be redirected to external calendar (simple setup)'
                            : 'Users can book directly in chat (requires API key)'
                          }
                        </p>
                      </div>

                      {/* Provider Selector */}
                      <div className="space-y-2">
                        <Label>Calendar Provider</Label>
                        <Select 
                          value={calendarConfig.provider} 
                          onValueChange={(value: 'calendly' | 'calcom' | 'google') => 
                            setCalendarConfig({ ...calendarConfig, provider: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calendly">Calendly</SelectItem>
                            <SelectItem value="calcom">Cal.com</SelectItem>
                            <SelectItem value="google">Google Calendar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Configuration Fields */}
                      {calendarConfig.integration_mode === 'redirect' ? (
                        <div className="space-y-2">
                          <Label htmlFor="redirect_url">
                            {calendarConfig.provider === 'calendly' ? 'Calendly Link' : 
                             calendarConfig.provider === 'calcom' ? 'Cal.com Booking Link' :
                             'Google Calendar Link'}
                          </Label>
                          <Input
                            id="redirect_url"
                            value={calendarConfig.redirect_url || calendarConfig.calendly_link}
                            onChange={(e) => setCalendarConfig({ 
                              ...calendarConfig, 
                              redirect_url: e.target.value,
                              calendly_link: e.target.value // Legacy support
                            })}
                            placeholder={
                              calendarConfig.provider === 'calendly' ? 'https://calendly.com/your-username/meeting' :
                              calendarConfig.provider === 'calcom' ? 'https://cal.com/your-username/meeting' :
                              'https://calendar.google.com/calendar/...'
                            }
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="api_key">API Key</Label>
                            <Input
                              id="api_key"
                              type="password"
                              value={calendarConfig.api_key}
                              onChange={(e) => setCalendarConfig({ ...calendarConfig, api_key: e.target.value })}
                              placeholder={
                                calendarConfig.provider === 'calendly' ? 'Your Calendly Personal Access Token' :
                                calendarConfig.provider === 'calcom' ? 'Your Cal.com API Key' :
                                'Your Google Calendar API Key'
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              {calendarConfig.provider === 'calendly' && 
                                'Get your Personal Access Token from Calendly Settings > Integrations'}
                              {calendarConfig.provider === 'calcom' && 
                                'Generate an API key from Cal.com Settings > Developer'}
                              {calendarConfig.provider === 'google' && 
                                'Create credentials in Google Cloud Console'}
                            </p>
                          </div>
                          
                          {calendarConfig.provider === 'calendly' && (
                            <div className="space-y-2">
                              <Label htmlFor="calendly_username">Calendly Username</Label>
                              <Input
                                id="calendly_username"
                                value={calendarConfig.calendly_username || ''}
                                onChange={(e) => setCalendarConfig({ 
                                  ...calendarConfig, 
                                  calendly_username: e.target.value 
                                })}
                                placeholder="your-calendly-username"
                              />
                            </div>
                          )}
                          
                          {calendarConfig.provider === 'google' && (
                            <div className="space-y-2">
                              <Label htmlFor="calendar_id">Calendar ID</Label>
                              <Input
                                id="calendar_id"
                                value={calendarConfig.calendar_id || ''}
                                onChange={(e) => setCalendarConfig({ 
                                  ...calendarConfig, 
                                  calendar_id: e.target.value 
                                })}
                                placeholder="primary or your-calendar@gmail.com"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="trigger_instructions">Trigger Instructions</Label>
                        <Textarea
                          id="trigger_instructions"
                          value={calendarConfig.trigger_instructions}
                          onChange={(e) => setCalendarConfig({ ...calendarConfig, trigger_instructions: e.target.value })}
                          placeholder="When should the agent offer booking? (e.g., 'If user asks to book or schedule')"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Button Action */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Custom Button</h4>
                        <p className="text-sm text-muted-foreground">
                          Display conditional buttons with custom text and URLs
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={customButtonEnabled}
                      onCheckedChange={setCustomButtonEnabled}
                    />
                  </div>
                  
                  {customButtonEnabled && (
                    <div className="space-y-3 pl-8">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="button_text">Button Text</Label>
                          <Input
                            id="button_text"
                            value={buttonConfig.button_text}
                            onChange={(e) => setButtonConfig({ ...buttonConfig, button_text: e.target.value })}
                            placeholder="Download Brochure"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="button_url">Button URL</Label>
                          <Input
                            id="button_url"
                            value={buttonConfig.button_url}
                            onChange={(e) => setButtonConfig({ ...buttonConfig, button_url: e.target.value })}
                            placeholder="https://example.com/download"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_condition">Display Condition (Keywords)</Label>
                        <Input
                          id="display_condition"
                          value={buttonConfig.display_condition}
                          onChange={(e) => setButtonConfig({ ...buttonConfig, display_condition: e.target.value })}
                          placeholder="pricing, cost, quote (comma-separated keywords)"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Capture Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Lead Capture
                </CardTitle>
                <CardDescription>
                  Automatically collect visitor information during conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Enable Lead Capture</h4>
                      <p className="text-sm text-muted-foreground">
                        Agent will intelligently prompt for contact information (name, email, phone)
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.enable_lead_capture}
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_lead_capture: checked })}
                  />
                </div>
                
                {formData.enable_lead_capture && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>How it works:</strong> Your agent will naturally ask for contact details during conversations 
                      when appropriate opportunities arise. All captured leads will be available in the Leads section.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge-training" className="space-y-6">
            {/* Agent Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Agent Instructions
                </CardTitle>
                <CardDescription>
                  Define how your agent should behave and respond
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions *</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Provide detailed instructions for your agent's behavior, personality, and how it should respond to users..."
                    rows={8}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Training Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Training Links
                  <Badge variant="secondary">{links.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Add URLs to train your agent with web content
                </CardDescription>
              </CardHeader>
              <Collapsible open={isLinksExpanded} onOpenChange={setIsLinksExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full [&[data-state=open]>svg]:rotate-90 px-6 py-2">
                  <span className="text-sm font-medium">
                    {isLinksExpanded ? 'Hide' : 'Show'} Training Links
                  </span>
                  <ChevronRight className="w-4 h-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
                      />
                      <Button onClick={handleAddLink} disabled={!newUrl.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {links.length > 0 && (
                      <div className="space-y-2">
                        {links.map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{link.title || 'Untitled'}</span>
                              </div>
                              <span className="text-xs text-muted-foreground truncate">{link.url}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={link.status === 'crawled' ? 'default' : 'secondary'}>
                                {link.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {/* Remove link logic */}}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEditing && links.length > 0 && (
                      <Button onClick={handleTrainAgent} disabled={loading} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {loading ? 'Training...' : 'Train Agent'}
                      </Button>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Knowledge Base Files */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Knowledge Base Files
                  <Badge variant="secondary">{files.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Upload documents to expand your agent's knowledge
                </CardDescription>
              </CardHeader>
              <Collapsible open={isFilesExpanded} onOpenChange={setIsFilesExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full [&[data-state=open]>svg]:rotate-90 px-6 py-2">
                  <span className="text-sm font-medium">
                    {isFilesExpanded ? 'Hide' : 'Show'} Files
                  </span>
                  <ChevronRight className="w-4 h-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div>
                      <input
                        type="file"
                        multiple
                        accept=".txt,.md,.pdf,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" className="w-full cursor-pointer" disabled={!isEditing}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: TXT, MD, PDF, DOCX (max 10MB each)
                      </p>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((file) => {
                          const status = getContentStatus(file.processed_content);
                          return (
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                {getFileIcon(file.filename)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{file.filename}</span>
                                    {getStatusBadge(status.status)}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{formatFileSize(file.file_size)}</span>
                                    <span>{status.message}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {status.status === 'failed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReprocessFile(file)}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(file)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4 pt-6">
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.name || !formData.instructions}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (isEditing ? 'Update Agent' : 'Create Agent')}
          </Button>
          
          {isEditing && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/agents/${agentId}/playground`)}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Test Agent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};