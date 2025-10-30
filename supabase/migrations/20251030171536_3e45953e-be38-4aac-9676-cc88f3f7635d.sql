-- Add widget_excluded_pages column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS widget_excluded_pages text[] DEFAULT '{}';

COMMENT ON COLUMN agents.widget_excluded_pages IS 'Pages where the chat widget should NOT appear (exclusion patterns)';