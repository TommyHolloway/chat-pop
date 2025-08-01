-- Create query cache table for basic caching
CREATE TABLE public.query_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  response_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for cache access
CREATE POLICY "Users can access cache for their agents" 
ON public.query_cache 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = query_cache.agent_id 
  AND agents.user_id = auth.uid()
));

-- Create index for performance
CREATE INDEX idx_query_cache_agent_hash ON public.query_cache(agent_id, query_hash);
CREATE INDEX idx_query_cache_expires ON public.query_cache(expires_at);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.query_cache 
  WHERE expires_at < now();
END;
$$;