import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, ExternalLink, User, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { CalendarWidget } from '@/components/calendar/CalendarWidget';

interface ActionButtonsProps {
  actions: any[];
  agentId: string;
  conversationId: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  actions, 
  agentId, 
  conversationId 
}) => {
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCalendarIntegration, setSelectedCalendarIntegration] = useState<any>(null);
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLeadCapture = async () => {
    if (!leadData.name || !leadData.email) {
      toast({
        title: "Required fields",
        description: "Please fill in your name and email",
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
        description: data.message || "Thank you for your information!",
      });
      
      setLeadCaptureOpen(false);
      setLeadData({ name: '', email: '', phone: '' });
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
          if (action.type === 'calendar_booking') {
            // Check if it's embedded or redirect mode
            const config = action.data.config || action.data;
            const integrationMode = config.integration_mode || 'redirect';
            
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (integrationMode === 'embedded') {
                    setSelectedCalendarIntegration({
                      provider: config.provider || 'calendly',
                      integration_mode: 'embedded',
                      configuration_json: config
                    });
                    setCalendarOpen(true);
                  } else {
                    // Redirect mode - use external link
                    const link = config.redirect_url || config.calendly_link || action.data.link;
                    if (link) {
                      window.open(link, '_blank');
                    }
                  }
                }}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {action.data.text || 'Schedule Appointment'}
              </Button>
            );
          }

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
            return (
              <Button
                key={index}
                variant="default"
                size="sm"
                onClick={() => setLeadCaptureOpen(true)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Get in Touch
              </Button>
            );
          }

          return null;
        })}
      </div>

      {/* Calendar Widget Modal */}
      {selectedCalendarIntegration && (
        <CalendarWidget
          integration={selectedCalendarIntegration}
          agentId={agentId}
          conversationId={conversationId}
          open={calendarOpen}
          onClose={() => {
            setCalendarOpen(false);
            setSelectedCalendarIntegration(null);
          }}
        />
      )}

      {/* Lead Capture Dialog */}
      <Dialog open={leadCaptureOpen} onOpenChange={setLeadCaptureOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={leadData.name}
                onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={leadData.email}
                onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Your phone number"
                value={leadData.phone}
                onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
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