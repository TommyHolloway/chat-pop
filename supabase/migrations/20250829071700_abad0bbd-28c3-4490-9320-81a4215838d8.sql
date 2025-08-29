-- Add proactive engagement configuration to agents table
ALTER TABLE public.agents 
ADD COLUMN enable_proactive_engagement boolean DEFAULT false,
ADD COLUMN proactive_config jsonb DEFAULT '{
  "enabled": false,
  "confidence_threshold": 0.7,
  "timing_delay": 5000,
  "frequency_limit": 3,
  "triggers": {
    "pricing_concern": {
      "enabled": true,
      "time_threshold": 30,
      "message": "Hi! I noticed you''re looking at our pricing. I''d be happy to help you find the perfect plan for your needs!"
    },
    "high_engagement": {
      "enabled": true, 
      "time_threshold": 120,
      "page_views_threshold": 5,
      "message": "You seem really interested in what we offer! Would you like to chat about how we can help you?"
    },
    "feature_exploration": {
      "enabled": true,
      "page_threshold": 3,
      "message": "I see you''re exploring our features. Want to learn more about how they can benefit you?"
    }
  }
}'::jsonb;