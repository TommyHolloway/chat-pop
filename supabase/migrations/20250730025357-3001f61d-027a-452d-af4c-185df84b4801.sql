-- Create agent_knowledge_chunks table for intelligent chunking
CREATE TABLE public.agent_knowledge_chunks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('file', 'link')),
    source_id UUID NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    metadata_json JSONB DEFAULT '{}',
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view chunks for their agents" 
ON public.agent_knowledge_chunks 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM agents 
    WHERE agents.id = agent_knowledge_chunks.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can create chunks for their agents" 
ON public.agent_knowledge_chunks 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM agents 
    WHERE agents.id = agent_knowledge_chunks.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can update chunks for their agents" 
ON public.agent_knowledge_chunks 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM agents 
    WHERE agents.id = agent_knowledge_chunks.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can delete chunks for their agents" 
ON public.agent_knowledge_chunks 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM agents 
    WHERE agents.id = agent_knowledge_chunks.agent_id 
    AND agents.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_agent_knowledge_chunks_agent_id ON public.agent_knowledge_chunks(agent_id);
CREATE INDEX idx_agent_knowledge_chunks_source ON public.agent_knowledge_chunks(source_type, source_id);
CREATE INDEX idx_agent_knowledge_chunks_tokens ON public.agent_knowledge_chunks(token_count);

-- Add trigger for updated_at
CREATE TRIGGER update_agent_knowledge_chunks_updated_at
BEFORE UPDATE ON public.agent_knowledge_chunks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();