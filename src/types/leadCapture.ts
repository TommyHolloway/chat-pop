export interface LeadCaptureField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  required: boolean;
  placeholder: string;
  options?: string[];
}

export interface LeadCaptureConfig {
  enabled: boolean;
  fields: LeadCaptureField[];
  success_message: string;
  button_text: string;
}