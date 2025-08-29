-- Create visitor behavior tracking tables

-- Table to track visitor sessions (anonymous)
CREATE TABLE public.visitor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  country_code TEXT,
  first_page_url TEXT,
  current_page_url TEXT,
  total_page_views INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track individual behavior events
CREATE TABLE public.visitor_behavior_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'click', 'scroll', 'time_spent'
  page_url TEXT NOT NULL,
  element_selector TEXT, -- for click events
  scroll_depth INTEGER, -- percentage for scroll events
  time_on_page INTEGER, -- seconds spent on page
  event_data JSONB DEFAULT '{}', -- additional event metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track proactive suggestions and their effectiveness
CREATE TABLE public.proactive_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'pricing_concern', 'feature_exploration', etc.
  suggestion_message TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  was_shown BOOLEAN DEFAULT false,
  was_clicked BOOLEAN DEFAULT false,
  conversation_started BOOLEAN DEFAULT false,
  behavioral_triggers JSONB DEFAULT '{}', -- what triggered this suggestion
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add visitor_session_id to conversations table to link behavior context
ALTER TABLE public.conversations 
ADD COLUMN visitor_session_id TEXT REFERENCES public.visitor_sessions(session_id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_visitor_sessions_agent_id ON public.visitor_sessions(agent_id);
CREATE INDEX idx_visitor_sessions_session_id ON public.visitor_sessions(session_id);
CREATE INDEX idx_visitor_behavior_events_session_id ON public.visitor_behavior_events(session_id);
CREATE INDEX idx_visitor_behavior_events_event_type ON public.visitor_behavior_events(event_type);
CREATE INDEX idx_proactive_suggestions_session_id ON public.proactive_suggestions(session_id);
CREATE INDEX idx_conversations_visitor_session_id ON public.conversations(visitor_session_id);

-- Enable RLS on new tables
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visitor_sessions
CREATE POLICY "Users can view sessions for their agents" 
ON public.visitor_sessions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = visitor_sessions.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Anyone can create visitor sessions" 
ON public.visitor_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update visitor sessions" 
ON public.visitor_sessions FOR UPDATE 
USING (true);

-- RLS Policies for visitor_behavior_events
CREATE POLICY "Users can view events for their agent sessions" 
ON public.visitor_behavior_events FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.visitor_sessions vs
  JOIN public.agents a ON a.id = vs.agent_id
  WHERE vs.session_id = visitor_behavior_events.session_id 
  AND a.user_id = auth.uid()
));

CREATE POLICY "Anyone can create behavior events" 
ON public.visitor_behavior_events FOR INSERT 
WITH CHECK (true);

-- RLS Policies for proactive_suggestions
CREATE POLICY "Users can view suggestions for their agents" 
ON public.proactive_suggestions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.agents 
  WHERE agents.id = proactive_suggestions.agent_id 
  AND agents.user_id = auth.uid()
));

CREATE POLICY "Anyone can create suggestions" 
ON public.proactive_suggestions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update suggestions" 
ON public.proactive_suggestions FOR UPDATE 
USING (true);

-- Create trigger for updating visitor_sessions.updated_at
CREATE TRIGGER update_visitor_sessions_updated_at
  BEFORE UPDATE ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();