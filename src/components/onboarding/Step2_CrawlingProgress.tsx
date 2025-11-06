import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Sparkles, Check, Loader2, Database, ExternalLink, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeBaseFlow } from './KnowledgeBaseFlow';

interface Step2Props {
  websiteUrl: string;
  agentId?: string | null;
  linkId?: string | null;
  progressState: {
    links: 'pending' | 'processing' | 'completed';
    prompt: 'pending' | 'processing' | 'completed';
    knowledgeBase: 'pending' | 'processing' | 'completed';
  };
  crawlProgress?: { pagesProcessed: number; pagesFound: number };
  isChunking: boolean;
  chunkingComplete: boolean;
  finalChunkCount?: number;
  onContinue: () => void;
}

interface CrawledPage {
  id: string;
  url: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
}

const ProgressItem = ({ icon, label, status, progressText }: {
  icon: React.ReactNode;
  label: string;
  status: 'pending' | 'processing' | 'completed';
  progressText?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <span className="font-medium">{label}</span>
      {progressText && (
        <span className="text-sm text-muted-foreground ml-2">
          {progressText}
        </span>
      )}
    </div>
    {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
    {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
    {status === 'completed' && <Check className="h-4 w-4 text-green-600" />}
  </div>
);

export const Step2_CrawlingProgress = ({ 
  websiteUrl, 
  agentId, 
  linkId, 
  progressState, 
  crawlProgress,
  isChunking,
  chunkingComplete,
  finalChunkCount,
  onContinue
}: Step2Props) => {
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState(0);

  // Override with parent's authoritative count when chunking is complete
  useEffect(() => {
    if (chunkingComplete && finalChunkCount !== undefined && finalChunkCount > 0) {
      console.log('Updating UI with final chunk count from parent:', finalChunkCount);
      setKnowledgeChunks(finalChunkCount);
    }
  }, [chunkingComplete, finalChunkCount]);

  // Fetch crawled pages from agent_crawl_pages in real-time
  useEffect(() => {
    if (!linkId || progressState.knowledgeBase !== 'processing') return;

    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('agent_crawl_pages')
        .select('id, url, title, status, created_at')
        .eq('agent_link_id', linkId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCrawledPages(data as CrawledPage[]);
      }
    };

    // Initial fetch
    fetchPages();

    // Subscribe to real-time updates for crawled pages
    const pagesChannel = supabase
      .channel('crawl_pages_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_crawl_pages',
          filter: `agent_link_id=eq.${linkId}`
        },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pagesChannel);
    };
  }, [linkId, progressState.knowledgeBase]);

  // Track knowledge base chunks being created - initial fetch on mount
  useEffect(() => {
    if (!agentId) return;

    const fetchChunks = async () => {
      const { count, error } = await supabase
        .from('agent_knowledge_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      if (!error && count !== null) {
        setKnowledgeChunks(count);
      }
    };

    // Initial fetch
    fetchChunks();

    // Subscribe to real-time updates for knowledge chunks
    const chunksChannel = supabase
      .channel('kb_chunks_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_knowledge_chunks',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchChunks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chunksChannel);
    };
  }, [agentId]);

  const flowStatus = progressState.knowledgeBase === 'completed' 
    ? 'completed' 
    : crawlProgress && crawlProgress.pagesProcessed > 0 
      ? 'processing' 
      : 'discovering';

  // Calculate estimated time remaining
  const estimatedTimeRemaining = crawlProgress && crawlProgress.pagesFound > 0 && crawlProgress.pagesProcessed > 0
    ? Math.ceil(((crawlProgress.pagesFound - crawlProgress.pagesProcessed) * 2)) // ~2 seconds per page
    : null;

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
      {/* Left: Progress Flow & Basic Steps */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Analyzing your site</h2>
          <p className="text-muted-foreground text-lg mt-2">
            We're crawling your website and building an AI knowledge base.
          </p>
        </div>
        
        {/* Basic Progress Steps */}
        <Card className="border-2">
          <CardContent className="pt-6 space-y-4">
            <ProgressItem
              icon={<Globe className="h-5 w-5" />}
              label="Analyzing website structure"
              status={progressState.links}
            />
            <Separator />
            <ProgressItem
              icon={<Sparkles className="h-5 w-5" />}
              label="Generating AI instructions"
              status={progressState.prompt}
            />
            <Separator />
            <ProgressItem
              icon={<Database className="h-5 w-5" />}
              label="Crawling website pages"
              status={progressState.knowledgeBase}
              progressText={crawlProgress ? `${crawlProgress.pagesProcessed}/${crawlProgress.pagesFound} pages` : undefined}
            />
          </CardContent>
        </Card>

        {/* Knowledge Base Flow Visualization - Always show when processing or chunking */}
        {(progressState.knowledgeBase === 'processing' || isChunking || chunkingComplete) && crawlProgress && (
          <KnowledgeBaseFlow
            pagesFound={crawlProgress.pagesFound}
            pagesProcessed={crawlProgress.pagesProcessed}
            knowledgeChunks={knowledgeChunks}
            status={chunkingComplete ? 'completed' : flowStatus}
          />
        )}

        {/* Continue Button - Show when chunking is complete */}
        {chunkingComplete && (
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={onContinue}
              className="min-w-[200px]"
            >
              Looks Good, Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Processing Status - Show while chunking */}
        {isChunking && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing knowledge base...</span>
          </div>
        )}

        {/* Statistics Card */}
        {progressState.knowledgeBase === 'processing' && crawlProgress && crawlProgress.pagesFound > 0 && (
          <Card className="border-2 bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Crawl Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pages Found</p>
                  <p className="text-2xl font-bold">{crawlProgress.pagesFound}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pages Processed</p>
                  <p className="text-2xl font-bold">{crawlProgress.pagesProcessed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Knowledge Chunks</p>
                  <p className="text-2xl font-bold">{knowledgeChunks}</p>
                </div>
                {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                  <div>
                    <p className="text-muted-foreground">Est. Remaining</p>
                    <p className="text-2xl font-bold">~{estimatedTimeRemaining}s</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Right: Live Crawled Pages Feed */}
      <div className="flex flex-col gap-4">
        <Card className="w-full border-2 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Globe className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{websiteUrl}</span>
              {progressState.links === "completed" && (
                <Check className="h-4 w-4 text-green-600 ml-auto flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Live Crawled Pages Feed */}
        {progressState.knowledgeBase === 'processing' && crawledPages.length > 0 && (
          <Card className="w-full border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Discovered Pages</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {crawledPages.length} pages
                </span>
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {crawledPages.map((page) => {
                    const statusIcon = page.status === 'completed' 
                      ? <Check className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                      : page.status === 'processing'
                      ? <Loader2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5 animate-spin" />
                      : <div className="h-3 w-3 rounded-full border-2 border-muted flex-shrink-0 mt-0.5" />;

                    return (
                      <div 
                        key={page.id}
                        className={`flex items-start gap-2 p-2 rounded-lg text-xs transition-all ${
                          page.status === 'completed' 
                            ? 'bg-green-500/10' 
                            : page.status === 'processing'
                            ? 'bg-primary/10'
                            : 'bg-muted/50'
                        }`}
                      >
                        {statusIcon}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {page.title || 'Untitled Page'}
                          </div>
                          <div className="text-muted-foreground truncate text-[10px]">
                            {page.url}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
