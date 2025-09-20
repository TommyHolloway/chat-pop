import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AgentLink {
  id: string;
  agent_id: string;
  url: string;
  title?: string;
  content?: string;
  status: 'pending' | 'crawled' | 'failed';
  created_at: string;
  updated_at: string;
}

export const useAgentLinks = (agentId?: string) => {
  const [links, setLinks] = useState<AgentLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLinks = async () => {
    if (!agentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_links')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks((data || []) as AgentLink[]);
    } catch (error) {
      console.error('Error fetching agent links:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLink = async (url: string) => {
    if (!agentId) return false;

    try {
      const { data, error } = await supabase
        .from('agent_links')
        .insert({
          agent_id: agentId,
          url,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setLinks(prev => [data as AgentLink, ...prev]);
      
      // Start crawling the URL
      crawlLink(data.id, url);
      
      toast({
        title: "Success",
        description: "Link added and crawling started",
      });
      
      return true;
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: "Error",
        description: "Failed to add training link",
        variant: "destructive",
      });
      return false;
    }
  };

  const crawlLink = async (linkId: string, url: string) => {
    try {
      console.log('Starting crawl for:', { linkId, url });
      
      // Call edge function to crawl the URL
      const { data, error } = await supabase.functions.invoke('crawl-url', {
        body: { url, linkId }
      });

      console.log('Crawl response:', { data, error });

      // Check if there's a Supabase error
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Check if the crawl was successful based on the response
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Failed to crawl URL';
        console.error('Crawl failed:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Crawl successful, updating database:', { title: data.title, content: data.content });

      // Update the link with crawled content
      const { error: updateError } = await supabase
        .from('agent_links')
        .update({
          title: data.title || 'Untitled',
          content: data.content || '',
          status: 'crawled'
        })
        .eq('id', linkId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Website content crawled successfully",
      });

      // Refresh links
      fetchLinks();

    } catch (error) {
      console.error('Error crawling link:', error);
      
      // Update status to failed
      await supabase
        .from('agent_links')
        .update({ status: 'failed' })
        .eq('id', linkId);
        
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to crawl website",
        variant: "destructive",
      });
        
      fetchLinks();
    }
  };

  const retryCrawl = async (linkId: string, url: string) => {
    // Update status to pending before retry
    await supabase
      .from('agent_links')
      .update({ status: 'pending' })
      .eq('id', linkId);
    
    fetchLinks(); // Refresh to show pending status
    
    // Retry the crawl
    await crawlLink(linkId, url);
  };

  const removeLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('agent_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setLinks(prev => prev.filter(link => link.id !== linkId));
      
      toast({
        title: "Success",
        description: "Training link removed",
      });
    } catch (error) {
      console.error('Error removing link:', error);
      toast({
        title: "Error",
        description: "Failed to remove training link",
        variant: "destructive",
      });
    }
  };

  const trainAgent = async () => {
    if (!agentId) return false;

    try {
      setLoading(true);
      
      // Call edge function to retrain agent with all knowledge
      const { data, error } = await supabase.functions.invoke('train-agent', {
        body: { agentId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent training completed",
      });
      
      return true;
    } catch (error) {
      console.error('Error training agent:', error);
      toast({
        title: "Error",
        description: "Failed to train agent",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [agentId]);

  return {
    links,
    loading,
    addLink,
    removeLink,
    trainAgent,
    fetchLinks,
    retryCrawl
  };
};