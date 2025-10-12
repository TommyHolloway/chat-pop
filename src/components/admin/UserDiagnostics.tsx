import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserDiagnostics() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc('sync_auth_users_to_profiles');
      
      if (error) throw error;
      
      setDiagnostics(data);
      toast({
        title: "Sync Complete",
        description: `Synced ${data[0]?.synced_count || 0} orphaned users`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync users. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          User Database Diagnostics
        </CardTitle>
        <CardDescription>
          Check for and fix orphaned auth users without profiles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Auth Users to Profiles'}
        </Button>
        
        {diagnostics && diagnostics[0] && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold">
                Synced {diagnostics[0].synced_count} user(s)
              </span>
            </div>
            {diagnostics[0].orphaned_users && diagnostics[0].orphaned_users.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Orphaned users found:</p>
                <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(diagnostics[0].orphaned_users, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
