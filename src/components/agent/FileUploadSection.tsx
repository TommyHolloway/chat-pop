import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Upload, 
  File, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  FileText,
  FileType,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface FileUploadSectionProps {
  files: any[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (file: { id: string; file_path: string; filename: string }) => void;
  onFileReprocess: (file: { id: string; file_path: string; filename: string; content_type: string }) => void;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
}

export const FileUploadSection = ({ 
  files, 
  onFileUpload, 
  onFileRemove, 
  onFileReprocess,
  isExpanded,
  onToggleExpanded 
}: FileUploadSectionProps) => {
  
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
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
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
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-0">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4" />
            <span>Files</span>
            <Badge variant="secondary">{files.length}</Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4">
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload files to train your agent
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            onChange={onFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supported: PDF, DOCX, TXT, MD
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Uploaded Files</h4>
            {files.map((file) => {
              const status = getContentStatus(file.processed_content);
              return (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2 flex-1">
                    {getFileIcon(file.filename)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size || 0)}</span>
                        <span>•</span>
                        <span>{status.message}</span>
                      </div>
                    </div>
                    {getStatusBadge(status.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFileReprocess(file)}
                      title="Reprocess file"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFileRemove(file)}
                      title="Remove file"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};