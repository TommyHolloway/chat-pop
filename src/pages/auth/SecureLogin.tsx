import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SecureForm } from '@/components/security/SecureForm';
import { SecureInput } from '@/components/security/SecureInput';
import { loginSchema, type LoginFormData } from '@/lib/validation';

export const SecureLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (data: LoginFormData) => {
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

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      if (authData.user) {
        toast({
          title: "Success!",
          description: "You have been logged in successfully.",
        });
        // Force page reload for clean state
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
      throw error; // Re-throw to let SecureForm handle it
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
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your ChatPop account to continue building amazing chatbots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SecureForm
            schema={loginSchema}
            onSubmit={handleSubmit}
            className="space-y-4"
            rateLimitKey="login"
            maxRequests={5}
            windowMs={300000} // 5 minutes
          >
            <SecureInput
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
            />
            
            <div className="space-y-2">
              <SecureInput
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between">
              <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </SecureForm>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up for free
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};