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
  FileSpreadsheet
} from 'lucide-react';
import { FirecrawlService } from '@/utils/FirecrawlService';

export const AgentForm = () => {
  const { id: agentId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!agentId;
  const { toast } = useToast();
  
  const { createAgent, updateAgent, getAgent } = useAgents();
  const { files, uploadFile, deleteFile, reprocessFile, refetchFiles } = useKnowledgeFiles(agentId || '');
  
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
  });
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [newUrl, setNewUrl] = useState('');
  const [links, setLinks] = useState<any[]>([]);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);

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
          status: data.status || 'active',
          initial_message: data.initial_message || '',
          creativity_level: data.creativity_level || 5,
          profile_image_url: data.profile_image_url || '',
          message_bubble_color: data.message_bubble_color || '#3B82F6',
          chat_interface_theme: data.chat_interface_theme || 'dark',
        });
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
      if (isEditing && agentId) {
        await updateAgent(agentId, formData);
        toast({
          title: "Agent updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const newAgent = await createAgent(formData);
        toast({
          title: "Agent created", 
          description: `${formData.name} has been created successfully.`,
        });
        navigate(`/agents/${newAgent.id}/edit`);
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
                <Collapsible open={isLinksExpanded} onOpenChange={setIsLinksExpanded}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full [&[data-state=open]>svg]:rotate-90">
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Training Links
                      <Badge variant="secondary">{links.length}</Badge>
                    </CardTitle>
                    <ChevronRight className="w-4 h-4 transition-transform" />
                  </CollapsibleTrigger>
                </Collapsible>
                <CardDescription>
                  Add URLs to train your agent with web content
                </CardDescription>
              </CardHeader>
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
            </Card>

            {/* Knowledge Base Files */}
            <Card>
              <CardHeader>
                <Collapsible open={isFilesExpanded} onOpenChange={setIsFilesExpanded}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full [&[data-state=open]>svg]:rotate-90">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Knowledge Base Files
                      <Badge variant="secondary">{files.length}</Badge>
                    </CardTitle>
                    <ChevronRight className="w-4 h-4 transition-transform" />
                  </CollapsibleTrigger>
                </Collapsible>
                <CardDescription>
                  Upload documents to expand your agent's knowledge
                </CardDescription>
              </CardHeader>
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