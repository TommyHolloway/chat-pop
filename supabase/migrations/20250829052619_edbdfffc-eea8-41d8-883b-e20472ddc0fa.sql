-- Create table for agent text knowledge
CREATE TABLE IF NOT EXISTS public.agent_text_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_text_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for agent text knowledge
CREATE POLICY "Users can view text knowledge for their agents" 
ON public.agent_text_knowledge 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_text_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

CREATE POLICY "Users can create text knowledge for their agents" 
ON public.agent_text_knowledge 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_text_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

CREATE POLICY "Users can update text knowledge for their agents" 
ON public.agent_text_knowledge 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_text_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

CREATE POLICY "Users can delete text knowledge for their agents" 
ON public.agent_text_knowledge 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_text_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

-- Create table for agent Q&A knowledge  
CREATE TABLE IF NOT EXISTS public.agent_qna_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_qna_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for agent Q&A knowledge
CREATE POLICY "Users can view qna knowledge for their agents" 
ON public.agent_qna_knowledge 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_qna_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

CREATE POLICY "Users can create qna knowledge for their agents" 
ON public.agent_qna_knowledge 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_qna_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

CREATE POLICY "Users can update qna knowledge for their agents" 
ON public.agent_qna_knowledge 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_qna_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

CREATE POLICY "Users can delete qna knowledge for their agents" 
ON public.agent_qna_knowledge 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_qna_knowledge.agent_id) AND (agents.user_id = auth.uid()))));

-- Add triggers for updated_at
CREATE TRIGGER update_agent_text_knowledge_updated_at
BEFORE UPDATE ON public.agent_text_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_qna_knowledge_updated_at
BEFORE UPDATE ON public.agent_qna_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();