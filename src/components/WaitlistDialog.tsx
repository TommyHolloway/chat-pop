import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail } from '@/utils/validation';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function WaitlistDialog({ open, onOpenChange, source = 'unknown' }: WaitlistDialogProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [optInForTexts, setOptInForTexts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('waitlist-signup', {
        body: {
          email,
          phone: `+1${cleanedPhone}`,
          opt_in_for_texts: optInForTexts,
          source,
        },
      });

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('already')) {
          toast.error('This email is already on our waitlist!');
        } else if (error.message.includes('rate limit')) {
          toast.error('Too many signups. Please try again later.');
        } else {
          toast.error('Failed to join waitlist. Please try again.');
        }
        return;
      }

      setIsSuccess(true);
      toast.success('Successfully joined the waitlist!');
    } catch (error) {
      console.error('Waitlist signup error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail('');
      setPhone('');
      setOptInForTexts(false);
      setIsSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>Join the Waitlist</DialogTitle>
              <DialogDescription>
                Be among the first to experience ChatPop and get exclusive early access benefits.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  disabled={isLoading}
                  maxLength={14}
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="opt-in"
                  checked={optInForTexts}
                  onCheckedChange={(checked) => setOptInForTexts(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="opt-in"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Text me when ChatPop launches (optional)
                </label>
              </div>

              <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-sm">Waitlist Member Exclusive:</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get done-for-you embedding install of your agent onto your website! We'll handle the technical setup for you.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Waitlist'
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl">🎉 You're on the waitlist!</DialogTitle>
              <DialogDescription className="text-base">
                Waitlist members get done-for-you embedding install of their agent onto their website!
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              We'll be in touch soon with your early access details.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
