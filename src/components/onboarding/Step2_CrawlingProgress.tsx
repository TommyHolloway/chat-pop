import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image, Palette, Globe, Sparkles, Check, Loader2, Database, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Step2Props {
  websiteUrl: string;
  agentId?: string | null;
  progressState: {
    logo: 'pending' | 'processing' | 'completed';
    brandColor: 'pending' | 'processing' | 'completed';
    links: 'pending' | 'processing' | 'completed';
    prompt: 'pending' | 'processing' | 'completed';
    knowledgeBase: 'pending' | 'processing' | 'completed';
  };
  crawlProgress?: { pagesProcessed: number; pagesFound: number };
}

interface PageInfo {
  url: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
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

export const Step2_CrawlingProgress = ({ websiteUrl, agentId, progressState, crawlProgress }: Step2Props) => {
  const [discoveredPages, setDiscoveredPages] = useState<PageInfo[]>([]);

  // Fetch discovered pages in real-time
  useEffect(() => {
    if (!agentId || progressState.knowledgeBase !== 'processing') return;

    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('agent_text_knowledge')
        .select('id, content')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        // Group by unique content titles to avoid showing chunks as separate pages
        const uniquePages = new Map<string, PageInfo>();
        
        data.forEach((item, index) => {
          // Extract title from content (first line)
          const contentLines = item.content?.split('\n').filter(line => line.trim()) || [];
          const title = contentLines[0]?.replace(/^#+\s*/, '').substring(0, 60) || `Page ${index + 1}`;
          
          // Use a hash of the title as a unique key to avoid duplicates
          const key = title.toLowerCase();
          if (!uniquePages.has(key)) {
            uniquePages.set(key, {
              url: `Content section ${uniquePages.size + 1}`,
              title: title,
              status: 'completed' as const
            });
          }
        });
        
        setDiscoveredPages(Array.from(uniquePages.values()).slice(0, 15));
      }
    };

    // Initial fetch
    fetchPages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('knowledge_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_text_knowledge',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, progressState.knowledgeBase]);

  // Calculate progress text for knowledge base
  const knowledgeBaseProgressText = crawlProgress && crawlProgress.pagesFound > 0
    ? `${crawlProgress.pagesProcessed}/${crawlProgress.pagesFound} pages`
    : undefined;

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
    {/* Left: Progress Indicators */}
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Analyzing your site</h2>
        <p className="text-muted-foreground text-lg mt-2">
          We're automatically extracting your brand details to personalize your AI assistant.
        </p>
      </div>
      
      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <ProgressItem
            icon={<Image className="h-5 w-5" />}
            label="Fetching logo"
            status={progressState.logo}
          />
          <Separator />
          <ProgressItem
            icon={<Palette className="h-5 w-5" />}
            label="Extracting brand color"
            status={progressState.brandColor}
          />
          <Separator />
          <ProgressItem
            icon={<Globe className="h-5 w-5" />}
            label="Crawling site links"
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
            label="Building knowledge base"
            status={progressState.knowledgeBase}
            progressText={knowledgeBaseProgressText}
          />
        </CardContent>
      </Card>
    </div>
    
    {/* Right: Live Website Card with Page List */}
    <div className="flex flex-col gap-4">
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
      
      {/* Discovered Pages List */}
      {progressState.knowledgeBase === 'processing' && discoveredPages.length > 0 && (
        <Card className="w-full border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Discovered Pages</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {discoveredPages.length} pages
              </span>
            </div>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {discoveredPages.map((page, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs"
                  >
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{page.title}</div>
                      <div className="text-muted-foreground truncate text-[10px]">
                        {page.url}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
  );
};
