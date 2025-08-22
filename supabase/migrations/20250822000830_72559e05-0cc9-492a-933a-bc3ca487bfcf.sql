-- Add lead capture toggle to agents table
ALTER TABLE public.agents 
ADD COLUMN enable_lead_capture BOOLEAN DEFAULT false;

-- Create agent_actions table for AI action configurations
CREATE TABLE public.agent_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('calendar_booking', 'custom_button')),
    config_json JSONB NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_agent_actions_agent_id FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE
);

-- Create leads table for captured lead information
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    lead_data_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_leads_agent_id FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
    CONSTRAINT fk_leads_conversation_id FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_actions
CREATE POLICY "Users can create actions for their agents" 
ON public.agent_actions 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = agent_actions.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can view actions for their agents" 
ON public.agent_actions 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = agent_actions.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can update actions for their agents" 
ON public.agent_actions 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = agent_actions.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can delete actions for their agents" 
ON public.agent_actions 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = agent_actions.agent_id 
    AND agents.user_id = auth.uid()
));

-- Create RLS policies for leads
CREATE POLICY "Users can view leads for their agents" 
ON public.leads 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = leads.agent_id 
    AND agents.user_id = auth.uid()
));

CREATE POLICY "System can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_agent_actions_agent_id ON public.agent_actions(agent_id);
CREATE INDEX idx_agent_actions_type ON public.agent_actions(action_type);
CREATE INDEX idx_leads_agent_id ON public.leads(agent_id);
CREATE INDEX idx_leads_conversation_id ON public.leads(conversation_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Create trigger for updating updated_at on agent_actions
CREATE TRIGGER update_agent_actions_updated_at
    BEFORE UPDATE ON public.agent_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();