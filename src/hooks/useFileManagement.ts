import { useKnowledgeFiles } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';

export const useFileManagement = (agentId?: string) => {
  const { files, uploadFile, deleteFile, reprocessFile, refetchFiles } = useKnowledgeFiles(agentId || '');
  const { toast } = useToast();

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    files,
    handleFileUpload,
    removeFile,
    handleReprocessFile,
    getContentStatus,
    formatFileSize,
    refetchFiles
  };
};