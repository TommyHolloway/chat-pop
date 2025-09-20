-- Add crawling support to agent_links table
ALTER TABLE public.agent_links 
ADD COLUMN crawl_mode TEXT NOT NULL DEFAULT 'scrape' CHECK (crawl_mode IN ('scrape', 'crawl')),
ADD COLUMN crawl_limit INTEGER DEFAULT 10 CHECK (crawl_limit > 0 AND crawl_limit <= 100),
ADD COLUMN pages_found INTEGER DEFAULT 0,
ADD COLUMN pages_processed INTEGER DEFAULT 0,
ADD COLUMN crawl_job_id TEXT;

-- Create table for individual crawled pages
CREATE TABLE public.agent_crawl_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_link_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  markdown TEXT,
  metadata_json JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.agent_crawl_pages 
ADD CONSTRAINT agent_crawl_pages_agent_link_id_fkey 
FOREIGN KEY (agent_link_id) REFERENCES public.agent_links(id) ON DELETE CASCADE;

-- Enable RLS on agent_crawl_pages
ALTER TABLE public.agent_crawl_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_crawl_pages
CREATE POLICY "Users can view crawl pages for their agents" 
ON public.agent_crawl_pages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM agent_links al
  JOIN agents a ON a.id = al.agent_id
  WHERE al.id = agent_crawl_pages.agent_link_id 
  AND a.user_id = auth.uid()
));

CREATE POLICY "Users can create crawl pages for their agents" 
ON public.agent_crawl_pages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM agent_links al
  JOIN agents a ON a.id = al.agent_id
  WHERE al.id = agent_crawl_pages.agent_link_id 
  AND a.user_id = auth.uid()
));

CREATE POLICY "Users can update crawl pages for their agents" 
ON public.agent_crawl_pages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM agent_links al
  JOIN agents a ON a.id = al.agent_id
  WHERE al.id = agent_crawl_pages.agent_link_id 
  AND a.user_id = auth.uid()
));

CREATE POLICY "Users can delete crawl pages for their agents" 
ON public.agent_crawl_pages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM agent_links al
  JOIN agents a ON a.id = al.agent_id  
  WHERE al.id = agent_crawl_pages.agent_link_id 
  AND a.user_id = auth.uid()
));

-- Create index for performance
CREATE INDEX idx_agent_crawl_pages_agent_link_id ON public.agent_crawl_pages(agent_link_id);
CREATE INDEX idx_agent_crawl_pages_status ON public.agent_crawl_pages(status);

-- Update existing agent_links to have default crawl_mode
UPDATE public.agent_links SET crawl_mode = 'scrape' WHERE crawl_mode IS NULL;