-- Enable real-time for agent_crawl_pages table
ALTER TABLE agent_crawl_pages REPLICA IDENTITY FULL;

-- Add the table to the realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_crawl_pages;