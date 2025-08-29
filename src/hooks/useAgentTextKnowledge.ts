import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AgentTextKnowledge {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useAgentTextKnowledge = (agentId?: string) => {
  const { user } = useAuth();
  const [textKnowledge, setTextKnowledge] = useState<AgentTextKnowledge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTextKnowledge = async (id?: string) => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_text_knowledge')
        .select('*')
        .eq('agent_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTextKnowledge((data || []) as AgentTextKnowledge[]);
    } catch (error) {
      console.error('Error fetching text knowledge:', error);
      toast.error('Failed to load text knowledge');
    } finally {
      setLoading(false);
    }
  };

  const createTextKnowledge = async (data: {
    agent_id: string;
    title: string;
    content: string;
  }) => {
    if (!user) return null;

    try {
      const { data: result, error } = await supabase
        .from('agent_text_knowledge')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      setTextKnowledge(prev => [result as AgentTextKnowledge, ...prev]);
      toast.success('Text knowledge added successfully');
      return result;
    } catch (error) {
      console.error('Error creating text knowledge:', error);
      toast.error('Failed to add text knowledge');
      return null;
    }
  };

  const updateTextKnowledge = async (id: string, updates: Partial<AgentTextKnowledge>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agent_text_knowledge')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTextKnowledge(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } as AgentTextKnowledge : item
      ));
      toast.success('Text knowledge updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating text knowledge:', error);
      toast.error('Failed to update text knowledge');
      return null;
    }
  };

  const deleteTextKnowledge = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agent_text_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTextKnowledge(prev => prev.filter(item => item.id !== id));
      toast.success('Text knowledge deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting text knowledge:', error);
      toast.error('Failed to delete text knowledge');
      return false;
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchTextKnowledge(agentId);
    }
  }, [agentId, user]);

  return {
    textKnowledge,
    loading,
    fetchTextKnowledge,
    createTextKnowledge,
    updateTextKnowledge,
    deleteTextKnowledge
  };
};