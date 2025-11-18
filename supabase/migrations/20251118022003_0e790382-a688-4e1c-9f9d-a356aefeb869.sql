-- GDPR Compliance Functions for Shopify App Store

-- Function 1: Export Customer Data (48-hour response requirement)
CREATE OR REPLACE FUNCTION public.export_customer_data(
  p_shop_domain text,
  p_customer_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agent_id uuid;
  v_customer_data jsonb;
BEGIN
  -- Get agent_id from shop connection
  SELECT agent_id INTO v_agent_id
  FROM shopify_connections
  WHERE LOWER(shop_domain) = LOWER(p_shop_domain)
    AND deleted_at IS NULL;
  
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Shop not found or connection deleted');
  END IF;
  
  -- Build comprehensive customer data export
  SELECT jsonb_build_object(
    'shop_domain', p_shop_domain,
    'customer_email', p_customer_email,
    'export_date', now(),
    'data', jsonb_build_object(
      'orders', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'order_id', order_id,
            'order_number', order_number,
            'total_price', total_price,
            'currency', currency,
            'order_created_at', order_created_at,
            'line_items', line_items,
            'note', note
          )
        ), '[]'::jsonb)
        FROM shopify_orders
        WHERE agent_id = v_agent_id
          AND LOWER(customer_email) = LOWER(p_customer_email)
      ),
      'leads', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'captured_at', created_at,
            'lead_data', lead_data_json
          )
        ), '[]'::jsonb)
        FROM leads
        WHERE agent_id = v_agent_id
          AND (lead_data_json->>'email')::text = LOWER(p_customer_email)
      ),
      'conversations', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'conversation_id', c.id,
            'created_at', c.created_at,
            'messages', (
              SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                  'role', m.role,
                  'content', m.content,
                  'timestamp', m.created_at
                )
                ORDER BY m.created_at
              ), '[]'::jsonb)
              FROM messages m
              WHERE m.conversation_id = c.id
                AND m.deleted_at IS NULL
            )
          )
        ), '[]'::jsonb)
        FROM conversations c
        JOIN leads l ON l.conversation_id = c.id
        WHERE c.agent_id = v_agent_id
          AND (l.lead_data_json->>'email')::text = LOWER(p_customer_email)
          AND c.deleted_at IS NULL
      ),
      'abandoned_carts', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'cart_id', id,
            'created_at', created_at,
            'cart_total', cart_total,
            'currency', currency,
            'cart_items', cart_items,
            'recovered', recovered,
            'shopify_checkout_url', shopify_checkout_url
          )
        ), '[]'::jsonb)
        FROM abandoned_carts ac
        WHERE ac.agent_id = v_agent_id
          AND EXISTS (
            SELECT 1 FROM leads l
            WHERE l.agent_id = v_agent_id
              AND (l.lead_data_json->>'email')::text = LOWER(p_customer_email)
              AND l.conversation_id = ac.conversation_id
          )
      )
    )
  ) INTO v_customer_data;
  
  RETURN v_customer_data;
END;
$$;

-- Function 2: Redact Customer Data (10-day processing window)
CREATE OR REPLACE FUNCTION public.redact_customer_data(
  p_shop_domain text,
  p_customer_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agent_id uuid;
  v_conversation_ids uuid[];
BEGIN
  -- Get agent_id from shop connection
  SELECT agent_id INTO v_agent_id
  FROM shopify_connections
  WHERE LOWER(shop_domain) = LOWER(p_shop_domain)
    AND deleted_at IS NULL;
  
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Shop not found: %', p_shop_domain;
  END IF;
  
  -- Get conversation IDs for this customer
  SELECT array_agg(l.conversation_id) INTO v_conversation_ids
  FROM leads l
  WHERE l.agent_id = v_agent_id
    AND (l.lead_data_json->>'email')::text = LOWER(p_customer_email);
  
  -- Anonymize orders (keep for analytics but remove PII)
  UPDATE shopify_orders
  SET 
    customer_email = 'redacted@privacy.local',
    customer_name = 'REDACTED',
    customer_shopify_id = NULL,
    note = NULL
  WHERE agent_id = v_agent_id
    AND LOWER(customer_email) = LOWER(p_customer_email);
  
  -- Delete leads (contains PII)
  DELETE FROM leads
  WHERE agent_id = v_agent_id
    AND (lead_data_json->>'email')::text = LOWER(p_customer_email);
  
  -- Soft delete conversations
  UPDATE conversations
  SET deleted_at = now()
  WHERE agent_id = v_agent_id
    AND id = ANY(v_conversation_ids)
    AND deleted_at IS NULL;
  
  -- Soft delete messages
  UPDATE messages
  SET deleted_at = now()
  WHERE conversation_id = ANY(v_conversation_ids)
    AND deleted_at IS NULL;
  
  -- Delete abandoned cart records
  DELETE FROM abandoned_carts
  WHERE agent_id = v_agent_id
    AND conversation_id = ANY(v_conversation_ids);
  
  -- Log redaction for audit
  PERFORM log_security_event(
    'gdpr_customer_data_redacted',
    NULL,
    jsonb_build_object(
      'shop_domain', p_shop_domain,
      'customer_email_hash', encode(digest(LOWER(p_customer_email), 'sha256'), 'hex'),
      'agent_id', v_agent_id,
      'redaction_date', now()
    )
  );
END;
$$;

-- Function 3: Redact Shop Data (10-day window after uninstall)
CREATE OR REPLACE FUNCTION public.redact_shop_data(
  p_shop_domain text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agent_id uuid;
BEGIN
  -- Get agent_id from shop connection
  SELECT agent_id INTO v_agent_id
  FROM shopify_connections
  WHERE LOWER(shop_domain) = LOWER(p_shop_domain);
  
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Shop not found: %', p_shop_domain;
  END IF;
  
  -- Delete Shopify connection
  DELETE FROM shopify_connections
  WHERE LOWER(shop_domain) = LOWER(p_shop_domain);
  
  -- Delete Shopify subscriptions
  DELETE FROM shopify_subscriptions
  WHERE LOWER(shop_domain) = LOWER(p_shop_domain);
  
  -- Delete product catalog
  DELETE FROM agent_product_catalog
  WHERE agent_id = v_agent_id;
  
  -- Delete inventory snapshots
  DELETE FROM inventory_snapshot
  WHERE agent_id = v_agent_id;
  
  -- Delete customer analytics
  DELETE FROM customer_analytics
  WHERE agent_id = v_agent_id;
  
  -- Delete orders
  DELETE FROM shopify_orders
  WHERE agent_id = v_agent_id;
  
  -- Delete abandoned carts
  DELETE FROM abandoned_carts
  WHERE agent_id = v_agent_id;
  
  -- Delete cart events
  DELETE FROM cart_events
  WHERE agent_id = v_agent_id;
  
  -- Delete ecommerce metrics
  DELETE FROM agent_ecommerce_metrics
  WHERE agent_id = v_agent_id;
  
  -- Delete product recommendations
  DELETE FROM product_recommendations
  WHERE agent_id = v_agent_id;
  
  -- Soft delete all conversations for this agent
  UPDATE conversations
  SET deleted_at = now()
  WHERE agent_id = v_agent_id
    AND deleted_at IS NULL;
  
  -- Soft delete all messages for this agent's conversations
  UPDATE messages
  SET deleted_at = now()
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE agent_id = v_agent_id
  )
  AND deleted_at IS NULL;
  
  -- Delete leads
  DELETE FROM leads
  WHERE agent_id = v_agent_id;
  
  -- Clear Shopify config from agent
  UPDATE agents
  SET shopify_config = '{}'::jsonb
  WHERE id = v_agent_id;
  
  -- Log shop data redaction for audit
  PERFORM log_security_event(
    'gdpr_shop_data_redacted',
    NULL,
    jsonb_build_object(
      'shop_domain', p_shop_domain,
      'agent_id', v_agent_id,
      'redaction_date', now()
    )
  );
END;
$$;

COMMENT ON FUNCTION public.export_customer_data IS 'GDPR: Export all customer data (customers/data_request webhook)';
COMMENT ON FUNCTION public.redact_customer_data IS 'GDPR: Redact customer PII (customers/redact webhook)';
COMMENT ON FUNCTION public.redact_shop_data IS 'GDPR: Delete all shop data after uninstall (shop/redact webhook)';