import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserPlan } from '@/hooks/useUserPlan';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bell, Shield, CreditCard } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { plan: currentPlan, isAdminOverride } = useUserPlan();

  const getInitials = (email: string) => {
    return email ? email.slice(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="flex-1 space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your profile information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt={user?.email || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(user?.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h3 className="font-medium">{user?.email}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {currentPlan === 'free' ? 'Free Plan' : 
                     currentPlan === 'hobby' ? 'Hobby Plan' : 
                     currentPlan === 'standard' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                  {isAdminOverride && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Admin Override
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" placeholder="Enter your display name" />
              </div>
            </div>
            
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about your agents via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Get weekly performance reports for your agents
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and tips
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the interface looks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark themes
                </p>
              </div>
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <div className="text-sm text-muted-foreground">
              Last signed in: Today at {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Billing Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing
            </CardTitle>
            <CardDescription>
              View your current plan and billing information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {currentPlan === 'free' ? 'Free Plan' : 
                   currentPlan === 'hobby' ? 'Hobby Plan' : 
                   currentPlan === 'standard' ? 'Pro Plan' : 'Free Plan'}
                  {isAdminOverride && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Admin Override
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPlan === 'free' ? '1 agent • 100 messages/month' :
                   currentPlan === 'hobby' ? '2 agents • 2,000 messages/month' :
                   currentPlan === 'standard' ? '5 agents • 12,000 messages/month' : '1 agent • 100 messages/month'}
                </div>
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};