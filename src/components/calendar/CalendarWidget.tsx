import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarWidgetProps {
  integration: {
    provider: 'calendly' | 'calcom' | 'google';
    integration_mode: 'redirect' | 'embedded';
    configuration_json: any;
  };
  agentId: string;
  conversationId: string;
  onClose: () => void;
  open: boolean;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  integration,
  agentId,
  conversationId,
  onClose,
  open
}) => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<'loading' | 'selecting' | 'booking' | 'success'>('loading');
  const { toast } = useToast();

  React.useEffect(() => {
    if (open && integration.integration_mode === 'embedded') {
      loadAvailableSlots();
    }
  }, [open, integration]);

  const loadAvailableSlots = async () => {
    if (integration.integration_mode === 'redirect') return;
    
    setLoading(true);
    setBookingStep('loading');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-calendar-availability', {
        body: {
          agentId,
          provider: integration.provider,
          configuration: integration.configuration_json
        }
      });

      if (error) throw error;
      
      setAvailableSlots(data.slots || []);
      setBookingStep('selecting');
    } catch (error) {
      console.error('Error loading calendar slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive"
      });
      setBookingStep('selecting');
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (slot: any) => {
    setBookingStep('booking');
    setSelectedSlot(slot);
    
    try {
      const { data, error } = await supabase.functions.invoke('book-calendar-appointment', {
        body: {
          agentId,
          conversationId,
          provider: integration.provider,
          configuration: integration.configuration_json,
          slot: slot
        }
      });

      if (error) throw error;
      
      toast({
        title: "Appointment Booked!",
        description: `Your appointment has been scheduled for ${slot.time}`,
      });
      
      setBookingStep('success');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
      setBookingStep('selecting');
    }
  };

  const handleRedirect = () => {
    const redirectUrl = integration.configuration_json.redirect_url || integration.configuration_json.calendly_link;
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Appointment
          </DialogTitle>
        </DialogHeader>
        
        {integration.integration_mode === 'redirect' ? (
          <div className="py-6 text-center space-y-4">
            <p>Click below to open the booking calendar in a new window.</p>
            <Button onClick={handleRedirect} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Calendar
            </Button>
          </div>
        ) : (
          <div className="py-4">
            {bookingStep === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading available time slots...</p>
              </div>
            )}

            {bookingStep === 'selecting' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select an available time slot:
                </p>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p>No available slots found.</p>
                    <Button 
                      variant="outline" 
                      onClick={handleRedirect}
                      className="mt-4"
                    >
                      Try External Calendar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => bookAppointment(slot)}
                        className="w-full justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {slot.date} at {slot.time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {bookingStep === 'booking' && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Booking your appointment...</p>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Appointment Booked!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll receive a confirmation email shortly.
                  </p>
                </div>
                <Button onClick={onClose}>Close</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};