import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CalendarIntegration {
  id: string;
  agent_id: string;
  provider: 'calendly' | 'calcom' | 'google';
  integration_mode: 'redirect' | 'embedded';
  configuration_json: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCalendarIntegrations = (agentId?: string) => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIntegrations = async (id?: string) => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('agent_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations((data || []) as CalendarIntegration[]);
    } catch (error) {
      console.error('Error fetching calendar integrations:', error);
      toast.error('Failed to load calendar integrations');
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (integrationData: {
    agent_id: string;
    provider: 'calendly' | 'calcom' | 'google';
    integration_mode: 'redirect' | 'embedded';
    configuration_json: any;
    api_key?: string;
  }) => {
    if (!user) return null;

    try {
      // If API key is provided, encrypt it server-side
      let insertData: any = { ...integrationData };
      delete insertData.api_key; // Remove from object before insert
      
      if (integrationData.api_key) {
        const { data: encryptedKey, error: encryptError } = await supabase.functions.invoke('encrypt-api-key', {
          body: { api_key: integrationData.api_key }
        });
        
        if (encryptError) throw encryptError;
        insertData.api_key_encrypted = encryptedKey.encrypted_key;
      }

      const { data, error } = await supabase
        .from('calendar_integrations')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      
      setIntegrations(prev => [data as CalendarIntegration, ...prev]);
      toast.success('Calendar integration created successfully');
      return data;
    } catch (error) {
      console.error('Error creating calendar integration:', error);
      toast.error('Failed to create calendar integration');
      return null;
    }
  };

  const updateIntegration = async (id: string, updates: Partial<CalendarIntegration>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === id ? { ...integration, ...data } as CalendarIntegration : integration
      ));
      toast.success('Calendar integration updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating calendar integration:', error);
      toast.error('Failed to update calendar integration');
      return null;
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
      toast.success('Calendar integration deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting calendar integration:', error);
      toast.error('Failed to delete calendar integration');
      return false;
    }
  };

  const testConnection = async (integrationData: {
    provider: 'calendly' | 'calcom' | 'google';
    api_key?: string;
    configuration_json: any;
  }) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('test-calendar-connection', {
        body: integrationData
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Connection test successful');
        return true;
      } else {
        toast.error(data.message || 'Connection test failed');
        return false;
      }
    } catch (error) {
      console.error('Error testing calendar connection:', error);
      toast.error('Failed to test connection');
      return false;
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchIntegrations(agentId);
    }
  }, [agentId, user]);

  return {
    integrations,
    loading,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection
  };
};