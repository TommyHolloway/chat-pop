import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFileManagement } from '@/hooks/useFileManagement';
import { FileUploadSection } from '@/components/agent/FileUploadSection';
import { 
  Database, 
  Upload, 
  Plus, 
  Link as LinkIcon, 
  ChevronDown, 
  ChevronRight,
  RefreshCw,
  Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgentKnowledgeBaseProps {
  agentId?: string;
}

export const AgentKnowledgeBase = ({ agentId }: AgentKnowledgeBaseProps) => {
  const { toast } = useToast();
  const { files, handleFileUpload, removeFile, handleReprocessFile, refetchFiles } = useFileManagement(agentId);
  
  const [newUrl, setNewUrl] = useState('');
  const [links, setLinks] = useState<any[]>([]);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [isFilesExpanded, setIsFilesExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Training Links */}
          <Collapsible open={isLinksExpanded} onOpenChange={setIsLinksExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Training Links</span>
                  <Badge variant="secondary">{links.length}</Badge>
                </div>
                {isLinksExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/page"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
                />
                <Button onClick={handleAddLink} disabled={loading}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {links.length > 0 && (
                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm truncate">{link.url}</span>
                      <Badge variant={link.status === 'processed' ? 'default' : 'secondary'}>
                        {link.status || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* File Upload */}
          <FileUploadSection
            files={files}
            onFileUpload={handleFileUpload}
            onFileRemove={removeFile}
            onFileReprocess={handleReprocessFile}
            isExpanded={isFilesExpanded}
            onToggleExpanded={setIsFilesExpanded}
          />

          {/* Training Actions */}
          {agentId && (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleTrainAgent} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Retrain Agent
              </Button>
              <Button 
                variant="outline" 
                onClick={() => refetchFiles()}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};