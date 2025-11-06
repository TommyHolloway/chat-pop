import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Loader2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CrawlActivity {
  id: string;
  url: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  duration?: number;
  timestamp: Date;
}

interface CrawlActivityFeedProps {
  linkId: string | null;
  isActive: boolean;
}

export const CrawlActivityFeed = ({ linkId, isActive }: CrawlActivityFeedProps) => {
  const [activities, setActivities] = useState<CrawlActivity[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!linkId || !isActive) return;

    // Fetch initial pages
    const fetchPages = async () => {
      try {
        // @ts-ignore - Supabase type inference issue with deeply nested queries
        const { data, error } = await supabase
          .from('agent_crawl_pages')
          .select('id, url, title, status, created_at')
          .eq('link_id', linkId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && Array.isArray(data)) {
          const newActivities: CrawlActivity[] = data.map((page: any) => ({
            id: String(page.id),
            url: String(page.url),
            title: String(page.title || 'Untitled Page'),
            status: (page.status || 'completed') as 'processing' | 'completed' | 'failed',
            timestamp: new Date(page.created_at)
          }));
          setActivities(newActivities);
        }
      } catch (err) {
        console.error('Error fetching crawl pages:', err);
      }
    };

    fetchPages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('crawl_pages_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_crawl_pages',
          filter: `link_id=eq.${linkId}`
        },
        (payload) => {
          const newPage = payload.new as any;
          const newActivity: CrawlActivity = {
            id: newPage.id,
            url: newPage.url,
            title: newPage.title || 'Untitled Page',
            status: newPage.status || 'completed',
            timestamp: new Date(newPage.created_at)
          };
          
          setActivities(prev => [newActivity, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [linkId, isActive]);

  // Auto-scroll to top when new activity added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities.length]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-3 w-3 text-green-600 flex-shrink-0" />;
      case 'processing':
        return <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20';
      case 'processing':
        return 'bg-primary/10 border-primary/20';
      case 'failed':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Waiting for crawl to start...
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] pr-4" ref={scrollRef}>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${getStatusColor(activity.status)}`}
          >
            {getStatusIcon(activity.status)}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-xs">
                {activity.title}
              </div>
              <div className="text-muted-foreground truncate text-[10px]">
                {activity.url}
              </div>
            </div>
            {activity.duration && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {activity.duration.toFixed(1)}s
              </span>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
