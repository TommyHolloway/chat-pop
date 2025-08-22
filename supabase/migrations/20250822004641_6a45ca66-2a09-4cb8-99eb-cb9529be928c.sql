-- Update agent_actions table to support enhanced calendar booking configurations
-- No schema changes needed - config_json column already exists and can store the new structure

-- Add calendar integrations table for API key storage
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'calendly', 'calcom', 'google'
  integration_mode TEXT NOT NULL DEFAULT 'redirect', -- 'redirect' or 'embedded'
  api_key_encrypted TEXT, -- Encrypted API key for embedded mode
  configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Provider-specific config
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar integrations
CREATE POLICY "Users can create integrations for their agents" 
ON public.calendar_integrations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = calendar_integrations.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can view integrations for their agents" 
ON public.calendar_integrations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = calendar_integrations.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can update integrations for their agents" 
ON public.calendar_integrations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = calendar_integrations.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Users can delete integrations for their agents" 
ON public.calendar_integrations 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM agents 
  WHERE agents.id = calendar_integrations.agent_id 
  AND agents.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_calendar_integrations_updated_at
BEFORE UPDATE ON public.calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();