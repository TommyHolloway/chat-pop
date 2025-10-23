-- Add Shopify configuration to agents table for product search
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS shopify_config JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_agents_shopify_config 
ON agents USING GIN (shopify_config);

-- Add comment for documentation
COMMENT ON COLUMN agents.shopify_config IS 'Stores Shopify credentials and configuration: store_domain, admin_api_token, storefront_access_token';