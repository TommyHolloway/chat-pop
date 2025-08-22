-- Add lead capture configuration to agents table
ALTER TABLE public.agents 
ADD COLUMN lead_capture_config JSONB DEFAULT '{
  "enabled": false,
  "fields": [
    {
      "key": "name", 
      "label": "Full Name", 
      "type": "text", 
      "required": true, 
      "placeholder": "Enter your name"
    },
    {
      "key": "email", 
      "label": "Email Address", 
      "type": "email", 
      "required": true, 
      "placeholder": "your@email.com"
    },
    {
      "key": "phone", 
      "label": "Phone Number", 
      "type": "tel", 
      "required": false, 
      "placeholder": "+1 (555) 123-4567"
    }
  ],
  "success_message": "Thank you! We'\''ll be in touch soon.",
  "button_text": "Get in Touch"
}'::JSONB;

-- Update existing agents to migrate from enable_lead_capture to lead_capture_config
UPDATE public.agents 
SET lead_capture_config = jsonb_set(
  lead_capture_config, 
  '{enabled}', 
  to_jsonb(COALESCE(enable_lead_capture, false))
)
WHERE enable_lead_capture IS NOT NULL;