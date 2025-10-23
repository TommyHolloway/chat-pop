export interface LeadCaptureField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required: boolean;
  placeholder: string;
  options?: string[];
}

// E-commerce specific preset fields
export const ECOMMERCE_LEAD_FIELDS: LeadCaptureField[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
  { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
  { key: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '+1 (555) 123-4567' },
  { key: 'budget_range', label: 'Budget Range', type: 'select', required: false, placeholder: 'Select budget', options: ['Under $50', '$50-$100', '$100-$250', '$250-$500', '$500+'] },
  { key: 'product_interest', label: 'What are you looking for?', type: 'textarea', required: false, placeholder: 'Tell us what products interest you...' },
  { key: 'purchase_timeline', label: 'When are you looking to buy?', type: 'select', required: false, placeholder: 'Select timeline', options: ['Today', 'This week', 'This month', 'Just browsing'] },
  { key: 'style_preferences', label: 'Style Preferences', type: 'text', required: false, placeholder: 'Describe your style or preferences' }
];

export interface LeadCaptureConfig {
  enabled: boolean;
  fields: LeadCaptureField[];
  success_message: string;
  button_text: string;
  trigger_type: 'immediate' | 'after_messages' | 'ai_detection';
  trigger_after_messages: number;
  prompt: string;
}