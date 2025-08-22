import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AgentAction {
  id: string;
  agent_id: string;
  action_type: 'calendar_booking' | 'custom_button';
  config_json: any;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useAgentActions = (agentId?: string) => {
  const { user } = useAuth();
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActions = async (id?: string) => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_actions')
        .select('*')
        .eq('agent_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActions((data || []) as AgentAction[]);
    } catch (error) {
      console.error('Error fetching agent actions:', error);
      toast.error('Failed to load agent actions');
    } finally {
      setLoading(false);
    }
  };

  const createAction = async (actionData: {
    agent_id: string;
    action_type: 'calendar_booking' | 'custom_button';
    config_json: any;
    is_enabled: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agent_actions')
        .insert([actionData])
        .select()
        .single();

      if (error) throw error;
      
      setActions(prev => [data as AgentAction, ...prev]);
      toast.success('AI Action created successfully');
      return data;
    } catch (error) {
      console.error('Error creating agent action:', error);
      toast.error('Failed to create AI Action');
      return null;
    }
  };

  const updateAction = async (id: string, updates: Partial<AgentAction>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agent_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setActions(prev => prev.map(action => 
        action.id === id ? { ...action, ...data } as AgentAction : action
      ));
      toast.success('AI Action updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating agent action:', error);
      toast.error('Failed to update AI Action');
      return null;
    }
  };

  const deleteAction = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agent_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setActions(prev => prev.filter(action => action.id !== id));
      toast.success('AI Action deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting agent action:', error);
      toast.error('Failed to delete AI Action');
      return false;
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchActions(agentId);
    }
  }, [agentId, user]);

  return {
    actions,
    loading,
    fetchActions,
    createAction,
    updateAction,
    deleteAction
  };
};