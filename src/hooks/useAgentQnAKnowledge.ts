import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AgentQnAKnowledge {
  id: string;
  agent_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export const useAgentQnAKnowledge = (agentId?: string) => {
  const { user } = useAuth();
  const [qnaKnowledge, setQnaKnowledge] = useState<AgentQnAKnowledge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQnAKnowledge = async (id?: string) => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_qna_knowledge')
        .select('*')
        .eq('agent_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQnaKnowledge((data || []) as AgentQnAKnowledge[]);
    } catch (error) {
      console.error('Error fetching Q&A knowledge:', error);
      toast.error('Failed to load Q&A knowledge');
    } finally {
      setLoading(false);
    }
  };

  const createQnAKnowledge = async (data: {
    agent_id: string;
    question: string;
    answer: string;
  }) => {
    if (!user) return null;

    try {
      const { data: result, error } = await supabase
        .from('agent_qna_knowledge')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      setQnaKnowledge(prev => [result as AgentQnAKnowledge, ...prev]);
      toast.success('Q&A pair added successfully');
      return result;
    } catch (error) {
      console.error('Error creating Q&A knowledge:', error);
      toast.error('Failed to add Q&A pair');
      return null;
    }
  };

  const updateQnAKnowledge = async (id: string, updates: Partial<AgentQnAKnowledge>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agent_qna_knowledge')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setQnaKnowledge(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } as AgentQnAKnowledge : item
      ));
      toast.success('Q&A pair updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating Q&A knowledge:', error);
      toast.error('Failed to update Q&A pair');
      return null;
    }
  };

  const deleteQnAKnowledge = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agent_qna_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setQnaKnowledge(prev => prev.filter(item => item.id !== id));
      toast.success('Q&A pair deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting Q&A knowledge:', error);
      toast.error('Failed to delete Q&A pair');
      return false;
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchQnAKnowledge(agentId);
    }
  }, [agentId, user]);

  return {
    qnaKnowledge,
    loading,
    fetchQnAKnowledge,
    createQnAKnowledge,
    updateQnAKnowledge,
    deleteQnAKnowledge
  };
};