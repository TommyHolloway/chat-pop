-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_top_revenue_conversations(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER);

-- Create function to get top revenue conversations
CREATE OR REPLACE FUNCTION get_top_revenue_conversations(
  p_agent_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  conversation_id UUID,
  session_id TEXT,
  order_count BIGINT,
  total_revenue NUMERIC,
  avg_confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.attributed_conversation_id as conversation_id,
    c.session_id,
    COUNT(so.id)::BIGINT as order_count,
    SUM(so.total_price) as total_revenue,
    AVG(so.attribution_confidence) as avg_confidence
  FROM shopify_orders so
  INNER JOIN conversations c ON c.id = so.attributed_conversation_id
  WHERE 
    so.agent_id = p_agent_id
    AND so.attributed_conversation_id IS NOT NULL
    AND so.order_created_at BETWEEN p_start_date AND p_end_date
  GROUP BY so.attributed_conversation_id, c.session_id
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;