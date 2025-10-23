import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ActionButtonsProps {
  actions: any[];
  agentId: string;
  conversationId: string;
  leadCaptureConfig?: {
    enabled: boolean;
    fields: Array<{
      key: string;
      label: string;
      type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
      required: boolean;
      placeholder: string;
      options?: string[];
    }>;
    success_message: string;
    button_text: string;
  };
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  actions, 
  agentId, 
  conversationId,
  leadCaptureConfig
}) => {
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [leadData, setLeadData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLeadCapture = async () => {
    if (!leadCaptureConfig?.enabled) return;
    
    // Validate required fields based on configuration
    const requiredFields = leadCaptureConfig.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !leadData[field.key]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Required fields missing",
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-lead', {
        body: {
          agentId,
          conversationId,
          leadData
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message || leadCaptureConfig.success_message,
      });
      
      setLeadCaptureOpen(false);
      // Reset form data
      const resetData: Record<string, string> = {};
      leadCaptureConfig.fields.forEach(field => {
        resetData[field.key] = '';
      });
      setLeadData(resetData);
    } catch (error) {
      console.error('Error capturing lead:', error);
      toast({
        title: "Error",
        description: "Failed to submit your information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!actions || actions.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {actions.map((action, index) => {
          if (action.type === 'custom_button') {
            return (
              <Button
                key={index}
                variant={action.data.style === 'secondary' ? 'secondary' : 'default'}
                size="sm"
                onClick={() => window.open(action.data.url, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {action.data.text}
              </Button>
            );
          }

          if (action.type === 'lead_capture') {
            const config = leadCaptureConfig || {
              enabled: true,
              fields: [
                { key: 'name', label: 'Full Name', type: 'text' as const, required: true, placeholder: 'Enter your name' },
                { key: 'email', label: 'Email Address', type: 'email' as const, required: true, placeholder: 'your@email.com' },
                { key: 'phone', label: 'Phone Number', type: 'tel' as const, required: false, placeholder: '+1 (555) 123-4567' }
              ],
              success_message: 'Thank you! We will be in touch soon.',
              button_text: 'Get in Touch'
            };
            
            return (
              <Button
                key={index}
                variant="default"
                size="sm"
                onClick={() => setLeadCaptureOpen(true)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {config.button_text}
              </Button>
            );
          }

          return null;
        })}
      </div>

      {/* Lead Capture Dialog */}
      <Dialog open={leadCaptureOpen} onOpenChange={setLeadCaptureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {leadCaptureConfig?.fields?.[0]?.label ? 'Contact Information' : 'Contact Information'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {leadCaptureConfig?.fields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required ? '*' : ''}
                </Label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.key}
                    className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={field.placeholder}
                    value={leadData[field.key] || ''}
                    onChange={(e) => setLeadData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    id={field.key}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    value={leadData[field.key] || ''}
                    onChange={(e) => setLeadData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={leadData[field.key] || ''}
                    onChange={(e) => setLeadData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            )) || (
              // Fallback to default fields
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={leadData.name || ''}
                    onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={leadData.email || ''}
                    onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={leadData.phone || ''}
                    onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setLeadCaptureOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLeadCapture}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};