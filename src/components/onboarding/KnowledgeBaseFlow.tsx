import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Globe, FileText, Brain, ArrowDown } from 'lucide-react';

interface KnowledgeBaseFlowProps {
  pagesFound: number;
  pagesProcessed: number;
  knowledgeChunks: number;
  status: 'discovering' | 'processing' | 'completed';
}

export const KnowledgeBaseFlow = ({ 
  pagesFound, 
  pagesProcessed, 
  knowledgeChunks,
  status 
}: KnowledgeBaseFlowProps) => {
  const discoveryProgress = pagesFound > 0 ? 100 : 0;
  const extractionProgress = pagesFound > 0 ? Math.round((pagesProcessed / pagesFound) * 100) : 0;
  
  // Calculate chunking progress: 0% if no chunks, 50% if pages processed but no chunks yet, then progressive
  const chunkingProgress = knowledgeChunks > 0
    ? Math.min(100, Math.round((knowledgeChunks / (pagesProcessed * 5)) * 100))
    : pagesProcessed === pagesFound && pagesProcessed > 0 ? 50 : 0;

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-6">
        {/* Stage 1: Discovering Pages */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
              discoveryProgress === 100 ? 'bg-green-500/20' : 'bg-primary/20'
            }`}>
              <Globe className={`h-5 w-5 ${
                discoveryProgress === 100 ? 'text-green-600' : 'text-primary'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Discovering Pages</span>
                <span className="text-sm text-muted-foreground">{pagesFound} found</span>
              </div>
              <Progress value={discoveryProgress} className="h-2" />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
        </div>

        {/* Stage 2: Extracting Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
              extractionProgress === 100 ? 'bg-green-500/20' : status === 'discovering' ? 'bg-muted' : 'bg-primary/20'
            }`}>
              <FileText className={`h-5 w-5 ${
                extractionProgress === 100 ? 'text-green-600' : status === 'discovering' ? 'text-muted-foreground' : 'text-primary'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Extracting Content</span>
                <span className="text-sm text-muted-foreground">
                  {pagesProcessed}/{pagesFound} pages
                </span>
              </div>
              <Progress value={extractionProgress} className="h-2" />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
        </div>

        {/* Stage 3: Building Knowledge Base */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
              chunkingProgress === 100 ? 'bg-green-500/20' : pagesProcessed === 0 ? 'bg-muted' : 'bg-primary/20'
            }`}>
              <Brain className={`h-5 w-5 ${
                chunkingProgress === 100 ? 'text-green-600' : pagesProcessed === 0 ? 'text-muted-foreground' : 'text-primary'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Building Knowledge Base</span>
                <span className="text-sm text-muted-foreground">{knowledgeChunks} chunks</span>
              </div>
              <Progress value={chunkingProgress} className="h-2" />
            </div>
          </div>
        </div>

        {/* Summary */}
        {status === 'completed' && (
          <div className="pt-4 border-t text-center">
            <p className="text-sm font-medium text-green-600">
              ✓ Knowledge base ready for AI training
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
