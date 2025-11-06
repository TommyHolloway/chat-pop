import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Globe, Sparkles, Check, Loader2, Database, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrawlActivityFeed } from './CrawlActivityFeed';
import { CrawlStatistics } from './CrawlStatistics';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Step2Props {
  websiteUrl: string;
  agentId?: string | null;
  progressState: {
    links: 'pending' | 'processing' | 'completed';
    prompt: 'pending' | 'processing' | 'completed';
    knowledgeBase: 'pending' | 'processing' | 'completed';
  };
  crawlProgress?: { pagesProcessed: number; pagesFound: number };
  linkId?: string | null;
  crawlError?: string | null;
}

const ProgressItem = ({ 
  icon, 
  label, 
  status, 
  progress 
}: {
  icon: React.ReactNode;
  label: string;
  status: 'pending' | 'processing' | 'completed';
  progress?: number;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <span className="font-medium">{label}</span>
        {progress !== undefined && status === 'processing' && (
          <span className="text-sm text-muted-foreground ml-2">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
      {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      {status === 'completed' && <Check className="h-4 w-4 text-green-600" />}
    </div>
    {status === 'processing' && progress !== undefined && (
      <Progress value={progress} className="h-2" />
    )}
  </div>
);

export const Step2_CrawlingProgress = ({ 
  websiteUrl, 
  agentId, 
  progressState, 
  crawlProgress,
  linkId,
  crawlError 
}: Step2Props) => {
  const [startTime] = useState(Date.now());
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);

  // Track the link ID from agent_links
  useEffect(() => {
    if (!agentId || !linkId) return;
    setCurrentLinkId(linkId);
  }, [agentId, linkId]);

  // Calculate progress percentages
  const linksProgress = progressState.links === 'completed' ? 100 : 
                        progressState.links === 'processing' ? 50 : 0;
  const promptProgress = progressState.prompt === 'completed' ? 100 : 
                         progressState.prompt === 'processing' ? 50 : 0;
  
  const knowledgeBaseProgress = crawlProgress && crawlProgress.pagesFound > 0
    ? (crawlProgress.pagesProcessed / crawlProgress.pagesFound) * 100
    : progressState.knowledgeBase === 'processing' ? 10 : 0;

  // Calculate statistics
  const successRate = crawlProgress && crawlProgress.pagesProcessed > 0
    ? Math.round((crawlProgress.pagesProcessed / crawlProgress.pagesProcessed) * 100)
    : 100;

  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const avgTimePerPage = crawlProgress && crawlProgress.pagesProcessed > 0
    ? elapsedSeconds / crawlProgress.pagesProcessed
    : undefined;

  const pagesRemaining = crawlProgress 
    ? Math.max(0, crawlProgress.pagesFound - crawlProgress.pagesProcessed)
    : 0;
  const estimatedTimeRemaining = avgTimePerPage && pagesRemaining > 0
    ? avgTimePerPage * pagesRemaining
    : undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Analyzing your site</h2>
        <p className="text-muted-foreground text-lg mt-2">
          We're crawling your website to create a personalized AI assistant.
        </p>
      </div>

      {/* Error Alert */}
      {crawlError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">Crawling Error</div>
            <div className="text-sm">{crawlError}</div>
            <div className="text-xs mt-2">
              The crawl will continue with available pages. You can add more content manually later.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Cards */}
      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <ProgressItem
            icon={<Globe className="h-5 w-5" />}
            label="Analyzing website structure"
            status={progressState.links}
            progress={linksProgress}
          />
          <Separator />
          <ProgressItem
            icon={<Sparkles className="h-5 w-5" />}
            label="Generating AI instructions"
            status={progressState.prompt}
            progress={promptProgress}
          />
          <Separator />
          <ProgressItem
            icon={<Database className="h-5 w-5" />}
            label="Building knowledge base"
            status={progressState.knowledgeBase}
            progress={knowledgeBaseProgress}
          />
          {progressState.knowledgeBase === 'processing' && crawlProgress && (
            <div className="text-xs text-muted-foreground pl-8">
              {crawlProgress.pagesProcessed} of {crawlProgress.pagesFound} pages processed
              {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                <span className="ml-2">
                  • ~{Math.round(estimatedTimeRemaining)}s remaining
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Activity and Statistics */}
      {progressState.knowledgeBase === 'processing' && crawlProgress && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Statistics */}
          <CrawlStatistics
            pagesProcessed={crawlProgress.pagesProcessed}
            pagesFound={crawlProgress.pagesFound}
            successRate={successRate}
            avgTimePerPage={avgTimePerPage}
            estimatedTimeRemaining={estimatedTimeRemaining}
          />

          {/* Activity Feed */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm font-semibold">Live Activity</span>
              </div>
              <CrawlActivityFeed 
                linkId={currentLinkId} 
                isActive={progressState.knowledgeBase === 'processing'}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Website Preview */}
      <Card className="w-full border-2 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Globe className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{websiteUrl}</span>
            {progressState.links === "completed" && (
              <Check className="h-4 w-4 text-green-600 ml-auto" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
