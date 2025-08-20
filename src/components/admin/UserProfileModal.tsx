import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  display_name: z.string().optional(),
  plan: z.enum(['free', 'hobby', 'standard']),
  role: z.enum(['user', 'admin']),
});

interface User {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  role: string;
}

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserProfileModal({ user, isOpen, onClose, onUpdate }: UserProfileModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: '',
      plan: 'free',
      role: 'user',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        display_name: user.display_name || '',
        plan: user.plan as 'free' | 'hobby' | 'standard',
        role: user.role as 'user' | 'admin',
      });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    console.log('Updating user profile:', {
      userId: user.id,
      currentValues: { plan: user.plan, role: user.role },
      newValues: values
    });

    setLoading(true);
    try {
      // Use atomic update function for transaction safety
      const { data: result, error } = await supabase
        .rpc('update_user_profile_atomic', {
          p_user_id: user.id,
          p_display_name: values.display_name || null,
          p_plan: values.plan,
          p_role: values.role
        });

      if (error) {
        console.error('Atomic update error:', error);
        throw new Error(error.message || 'Database update failed');
      }

      // Type guard and result validation
      const updateResult = result as { success: boolean; error?: string; user_id?: string };
      if (!updateResult || !updateResult.success) {
        console.error('Update failed:', updateResult);
        throw new Error(updateResult?.error || 'Update operation failed');
      }

      console.log('Profile updated successfully:', updateResult);

      // Verify the update was persisted by checking the database
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();

      if (verifyError || !verifyData || verifyData.plan !== values.plan) {
        console.error('Update verification failed:', { verifyError, verifyData, expectedPlan: values.plan });
        throw new Error('Update failed to persist - please try again');
      }

      // Log the action
      try {
        await supabase.functions.invoke('log-admin-action', {
          body: {
            action: 'user_profile_updated',
            details: {
              target_user_id: user.id,
              target_user_email: user.email,
              changes: values,
              previous_values: { plan: user.plan, role: user.role }
            },
          },
        });
      } catch (logError) {
        console.warn('Failed to log admin action:', logError);
        // Don't fail the whole operation if logging fails
      }

      toast({
        title: 'Success',
        description: 'User profile updated successfully',
      });

      // Only update UI after successful DB confirmation and verification
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update user information and permissions for {user?.email}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                   <SelectItem value="free">Free</SelectItem>
                   <SelectItem value="hobby">Hobby</SelectItem>
                   <SelectItem value="standard">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}