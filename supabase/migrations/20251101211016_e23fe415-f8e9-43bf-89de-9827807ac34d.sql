-- Enable realtime for agent_links table
ALTER TABLE public.agent_links REPLICA IDENTITY FULL;

-- Add agent_links to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_links;