-- Add webhook_id column for idempotency
ALTER TABLE shopify_webhook_events 
ADD COLUMN IF NOT EXISTS webhook_id TEXT;

-- Create unique index for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_webhook_id_unique 
ON shopify_webhook_events(webhook_id) 
WHERE webhook_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id 
ON shopify_webhook_events(webhook_id);

COMMENT ON COLUMN shopify_webhook_events.webhook_id IS 'Shopify webhook ID from X-Shopify-Webhook-Id header for deduplication';