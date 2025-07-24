-- Create agent_links table for storing training URLs
CREATE TABLE public.agent_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agent_links ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_links
CREATE POLICY "Users can view links for their agents" 
ON public.agent_links 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = agent_links.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can create links for their agents" 
ON public.agent_links 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = agent_links.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can update links for their agents" 
ON public.agent_links 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = agent_links.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can delete links for their agents" 
ON public.agent_links 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = agent_links.agent_id 
  AND agents.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agent_links_updated_at
BEFORE UPDATE ON public.agent_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying
CREATE INDEX idx_agent_links_agent_id ON public.agent_links(agent_id);
CREATE INDEX idx_agent_links_status ON public.agent_links(status);