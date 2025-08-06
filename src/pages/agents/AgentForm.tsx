import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  X, 
  Save,
  Bot,
  FileText,
  Loader2,
  Link as LinkIcon,
  Plus,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  FileType,
  Image,
  FileSpreadsheet,
  Globe,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAgents, useKnowledgeFiles } from '@/hooks/useAgents';
import { useAgentLinks } from '@/hooks/useAgentLinks';
import { TrainingSummary } from '@/components/agent/TrainingSummary';
import { Switch } from '@/components/ui/switch';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
}

export const AgentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { toast } = useToast();
  const { createAgent, updateAgent, getAgent } = useAgents();
  const { files, uploadFile, deleteFile, reprocessFile, refetchFiles } = useKnowledgeFiles(id || '');
  const { links, addLink, removeLink, trainAgent, loading: linksLoading } = useAgentLinks(id);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    status: 'draft' as 'active' | 'inactive' | 'draft',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [newUrl, setNewUrl] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [reprocessingFiles, setReprocessingFiles] = useState<string[]>([]);
  const [viewingContent, setViewingContent] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadAgent();
    }
  }, [isEditing, id]);

  const loadAgent = async () => {
    try {
      const agent = await getAgent(id!);
      setFormData({
        name: agent.name,
        description: agent.description || '',
        instructions: agent.instructions,
        status: (agent.status as 'active' | 'inactive' | 'draft') || 'draft',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load agent data.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Please save the agent first before uploading files.",
        variant: "destructive",
      });
      return;
    }

    const uploadedFiles = Array.from(event.target.files || []);
    
    try {
      setIsLoading(true);
      setUploadingFiles(uploadedFiles.map(f => f.name));
      
      for (const file of uploadedFiles) {
        await uploadFile(file, id);
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
      setIsLoading(false);
      setUploadingFiles([]);
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
      setReprocessingFiles(prev => [...prev, file.id]);
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
    } finally {
      setReprocessingFiles(prev => prev.filter(id => id !== file.id));
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

  const handleAddLink = async () => {
    if (!newUrl.trim() || !id) return;
    
    // Basic URL validation
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

    const success = await addLink(newUrl);
    if (success) {
      setNewUrl('');
    }
  };

  const handleTrainAgent = async () => {
    if (!id) return;
    
    const success = await trainAgent();
    if (success) {
      toast({
        title: "Training Complete",
        description: "Your agent has been updated with the latest knowledge.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'crawled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && id) {
        await updateAgent(id, formData);
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
      setIsLoading(false);
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
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Edit Agent' : 'Create New Agent'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Update your AI agent configuration' : 'Build a new AI agent for your business'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Set up the basic details for your AI agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Customer Support Bot"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Choose a descriptive name for your agent
                  </p>
                </div>

                 <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Textarea
                     id="description"
                     placeholder="Briefly describe what this agent does..."
                     value={formData.description}
                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     rows={3}
                   />
                   <p className="text-sm text-muted-foreground">
                     A short description of your agent's purpose
                   </p>
                 </div>

                 {/* Agent Status */}
                 {isEditing && (
                   <div className="space-y-2">
                     <Label>Agent Status</Label>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="flex items-center gap-3">
                         {formData.status === 'active' ? (
                           <Globe className="h-5 w-5 text-green-500" />
                         ) : (
                           <Lock className="h-5 w-5 text-muted-foreground" />
                         )}
                         <div>
                           <p className="font-medium">
                             {formData.status === 'active' ? 'Public & Active' : 'Private'}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {formData.status === 'active' 
                               ? 'Your agent is live and accessible via public chat URLs'
                               : 'Your agent is private and not accessible publicly'
                             }
                           </p>
                         </div>
                       </div>
                       <Switch
                         checked={formData.status === 'active'}
                         onCheckedChange={(checked) => 
                           setFormData(prev => ({ 
                             ...prev, 
                             status: checked ? 'active' : 'inactive' 
                           }))
                         }
                       />
                     </div>
                     <p className="text-sm text-muted-foreground">
                       Toggle to control whether your agent is publicly accessible
                     </p>
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Agent Instructions
                </CardTitle>
                <CardDescription>
                  Define how your agent should behave and respond
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="instructions">System Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="You are a helpful assistant that..."
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide clear instructions on how the agent should behave, respond to users, and handle different scenarios.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Training Summary - Only show if editing and has training data */}
            {isEditing && (files.length > 0 || links.length > 0) && (
              <TrainingSummary 
                files={files} 
                links={links} 
                agentUpdatedAt={undefined} // Will get this from agent data if needed
                agentId={id!}
                onTrainingComplete={() => {
                  refetchFiles();
                }}
              />
            )}

            {/* Training Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Training Links
                </CardTitle>
                <CardDescription>
                  Add website URLs to train your agent on web content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    disabled={!id}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddLink} 
                    disabled={!id || !newUrl.trim() || linksLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
                
                {!id && (
                  <p className="text-sm text-muted-foreground">
                    Save the agent first to add training links
                  </p>
                )}

                {links.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Training Links ({links.length})</h4>
                      <div className="space-y-2">
                        {links.map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(link.status)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{link.title || link.url}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {link.url}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Status: {link.status}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLink(link.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Knowledge Base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Knowledge Base Files
                </CardTitle>
                <CardDescription>
                  Upload files to train your agent with specific knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <div className="text-center space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-semibold">Upload knowledge files</h3>
                      <p className="text-sm text-muted-foreground">
                        Support for .txt, .md, .pdf, and .docx files
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        multiple
                        accept=".txt,.md,.pdf,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={!id}
                      />
                      <Label htmlFor="file-upload">
                        <Button variant="outline" asChild disabled={!id}>
                          <span>{!id ? 'Save agent first' : 'Choose Files'}</span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>

                {(files.length > 0 || uploadingFiles.length > 0) && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">
                        {uploadingFiles.length > 0 ? 'Uploading Files...' : `Uploaded Files (${files.length})`}
                      </h4>
                      <div className="space-y-2">
                        {/* Show uploading files */}
                        {uploadingFiles.map((fileName) => (
                          <div key={fileName} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              {getFileIcon(fileName)}
                              <div>
                                <p className="font-medium">{fileName}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Uploading...
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Show uploaded files */}
                        {files.map((file) => {
                          const contentStatus = getContentStatus(file.processed_content);
                          const isReprocessing = reprocessingFiles.includes(file.id);
                          
                          return (
                            <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getFileIcon(file.filename)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{file.filename}</p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{formatFileSize(file.file_size)}</span>
                                    <span className="flex items-center gap-1">
                                      {isReprocessing ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Reprocessing...
                                        </>
                                      ) : (
                                        <>
                                          {getStatusBadge(contentStatus.status)}
                                          {contentStatus.message}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  
                                  {/* Content preview for successful extractions */}
                                  {contentStatus.status === 'success' && file.processed_content && (
                                    <div className="mt-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                        onClick={() => setViewingContent(viewingContent === file.id ? null : file.id)}
                                      >
                                        {viewingContent === file.id ? 'Hide Content' : 'View Content Preview'}
                                      </Button>
                                      {viewingContent === file.id && (
                                         <div className="mt-2 p-3 bg-muted/50 rounded text-xs max-h-40 overflow-y-auto">
                                           <div className="mb-2 text-xs text-muted-foreground border-b pb-1">
                                             Content Preview ({file.processed_content.length.toLocaleString()} characters, {file.processed_content.split(' ').length.toLocaleString()} words)
                                           </div>
                                           <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                             {file.processed_content.slice(0, 500).replace(/\s+/g, ' ').trim()}
                                             {file.processed_content.length > 500 && '...'}
                                           </p>
                                         </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-4">
                                {/* Reprocess button for failed or limited content */}
                                {(contentStatus.status === 'failed' || contentStatus.status === 'warning') && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReprocessFile(file)}
                                    disabled={isReprocessing}
                                    className="text-xs"
                                  >
                                    {isReprocessing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reprocess'}
                                  </Button>
                                )}
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(file)}
                                  disabled={isLoading || isReprocessing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Link to="/dashboard">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : (isEditing ? 'Update Agent' : 'Create Agent')}
                </Button>
                {isEditing && (
                  <Link to={`/agents/${id}/playground`}>
                    <Button variant="outline">
                      Test Agent
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};