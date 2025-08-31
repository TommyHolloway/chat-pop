import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export const EmailVerificationDialog = ({ open, onOpenChange, email }: EmailVerificationDialogProps) => {
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResendEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "We've sent another verification email to your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    onOpenChange(false);
    navigate('/auth/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl">Check Your Email</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              We've sent a verification email to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Please click the verification link in your email to activate your account.
              If you don't see it, check your spam or junk folder.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Account created successfully</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col space-y-2">
          <Button onClick={handleGoToLogin} className="w-full">
            Go to Sign In
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend Verification Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};