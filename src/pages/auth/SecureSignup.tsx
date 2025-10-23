import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Bot, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupFormData } from '@/lib/validation';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage, FormLabel, Form } from '@/components/ui/form';
import { EmailVerificationDialog } from '@/components/EmailVerificationDialog';

export const SecureSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (user) {
        // Check if user has any agents
        const { data: agents } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (!agents || agents.length === 0) {
          // First-time user - redirect to onboarding
          navigate('/agents/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    };
    
    checkFirstTimeUser();
  }, [user, navigate]);

  const handleSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up existing state
      const cleanupAuthState = () => {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      };

      cleanupAuthState();

      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) throw error;

      if (authData.user) {
        toast({
          title: "Welcome to ChatPop!",
          description: "Your account has been created successfully.",
        });
        
        // If user is immediately confirmed, check for selected plan
        if (authData.session) {
          const selectedPlan = localStorage.getItem('selectedPlan');
          if (selectedPlan && selectedPlan !== 'Free') {
            // User signed up for a paid plan, redirect to checkout
            localStorage.removeItem('selectedPlan');
            try {
              const planKey = selectedPlan === "Hobby" ? "hobby" : "standard";
              await createCheckout(planKey);
              toast({
                title: "Redirecting to checkout",
                description: "Complete your subscription to get started.",
              });
            } catch (error) {
              // If checkout fails, still redirect to dashboard
              window.location.href = '/dashboard';
            }
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          // If email confirmation is required, show email verification dialog
          setSignupEmail(data.email);
          setShowEmailDialog(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-large">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Back to Home</span>
            </Link>
            <div></div>
          </div>
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Start building intelligent chatbots for your business today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide password
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show password
                  </>
                )}
              </Button>

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label className="text-sm">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      <EmailVerificationDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        email={signupEmail}
      />
    </div>
  );
};