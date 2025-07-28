import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FileText, 
  Link as LinkIcon, 
  Calendar,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  FileType,
  FileSpreadsheet,
  File,
  Globe,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface KnowledgeFile {
  id: string;
  filename: string;
  file_size: number;
  content_type: string;
  processed_content?: string;
  created_at: string;
}

interface AgentLink {
  id: string;
  url: string;
  title?: string;
  content?: string;
  status: 'pending' | 'crawled' | 'failed';
  created_at: string;
}

interface TrainingSummaryProps {
  files: KnowledgeFile[];
  links: AgentLink[];
  agentUpdatedAt?: string;
}

export const TrainingSummary = ({ files, links, agentUpdatedAt }: TrainingSummaryProps) => {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalFiles = files.length;
  const totalLinks = links.length;
  const successfulLinks = links.filter(link => link.status === 'crawled').length;
  const failedLinks = links.filter(link => link.status === 'failed').length;
  const pendingLinks = links.filter(link => link.status === 'pending').length;
  
  const linkSuccessRate = totalLinks > 0 ? (successfulLinks / totalLinks) * 100 : 0;
  const totalContentSize = files.reduce((acc, file) => acc + file.file_size, 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Training Summary
        </CardTitle>
        <CardDescription>
          Overview of your agent's knowledge base and training status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Training Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-blue-500" />
              Knowledge Files
            </div>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <div className="text-xs text-muted-foreground">
              {formatFileSize(totalContentSize)} total
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-green-500" />
              Web Sources
            </div>
            <div className="text-2xl font-bold">{totalLinks}</div>
            <div className="text-xs text-muted-foreground">
              {successfulLinks} crawled successfully
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-purple-500" />
              Success Rate
            </div>
            <div className="text-2xl font-bold">{linkSuccessRate.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">
              Link crawl success
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-orange-500" />
              Last Updated
            </div>
            <div className="text-xs font-medium">
              {agentUpdatedAt ? format(new Date(agentUpdatedAt), 'MMM d, yyyy') : 'Never'}
            </div>
            <div className="text-xs text-muted-foreground">
              Training status
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        {totalLinks > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Link Processing Status</span>
              <span className="text-muted-foreground">{successfulLinks}/{totalLinks} complete</span>
            </div>
            <Progress value={linkSuccessRate} className="h-2" />
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>{successfulLinks} successful</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>{pendingLinks} pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>{failedLinks} failed</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Knowledge Sources</h4>
          
          {/* Files Section */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Files ({files.length})
              </div>
              <div className="grid gap-2">
                {files.slice(0, 3).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.filename)}
                      <span className="text-sm font-medium truncate">{file.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.file_size)}
                      </Badge>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                ))}
                {files.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    +{files.length - 3} more files
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Links Section */}
          {links.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="h-4 w-4" />
                Web Sources ({links.length})
              </div>
              <div className="grid gap-2">
                {links.slice(0, 3).map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(link.status)}
                      <span className="text-sm font-medium truncate">
                        {link.title || new URL(link.url).hostname}
                      </span>
                    </div>
                    <Badge 
                      variant={link.status === 'crawled' ? 'default' : link.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {link.status}
                    </Badge>
                  </div>
                ))}
                {links.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    +{links.length - 3} more sources
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && links.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No training data yet</p>
              <p className="text-xs">Upload files or add links to start training your agent</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};