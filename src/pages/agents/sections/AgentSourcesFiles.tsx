import { useParams } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useKnowledgeFiles } from '@/hooks/useAgents';
import { PlanEnforcementWrapper } from '@/components/PlanEnforcementWrapper';
import {
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  RefreshCw,
  Plus,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const AgentSourcesFiles = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const {
    files,
    loading,
    uploadFile,
    deleteFile,
    reprocessFile
  } = useKnowledgeFiles(id!);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of Array.from(selectedFiles)) {
        await uploadFile(file, id!);
      }
      toast({
        title: "Files uploaded successfully",
        description: "Your knowledge base has been updated.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      await deleteFile(fileId, filePath);
      toast({
        title: "File deleted",
        description: "File has been removed from knowledge base.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReprocessFile = async (fileId: string, filePath: string, filename: string) => {
    try {
      await reprocessFile(fileId, filePath, filename, 'application/pdf');
      toast({
        title: "File reprocessed",
        description: "File content has been updated.",
      });
    } catch (error) {
      toast({
        title: "Reprocess failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <Image className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base Files</h2>
          <p className="text-muted-foreground">Upload documents and files for your agent to learn from</p>
        </div>
        
        <PlanEnforcementWrapper 
          feature="storage" 
          fallbackContent={
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          }
        >
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Files
          </Button>
        </PlanEnforcementWrapper>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files uploaded</h3>
            <p className="text-muted-foreground mb-4">
              Upload documents, PDFs, or images to expand your agent's knowledge base.
            </p>
            <PlanEnforcementWrapper 
              feature="storage"
              fallbackContent={<Button disabled>Upload Your First File</Button>}
            >
              <Button onClick={() => fileInputRef.current?.click()}>
                Upload Your First File
              </Button>
            </PlanEnforcementWrapper>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.filename)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">
                        {file.filename}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {file.processed_content ? 'Processed' : 'Processing...'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReprocessFile(file.id, file.file_path, file.filename)}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{file.filename}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteFile(file.id, file.file_path)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};