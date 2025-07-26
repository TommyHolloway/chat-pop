import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface KnowledgeFile {
  id: string;
  agent_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  processed_content: string | null;
  created_at: string;
}

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAgents((data || []) as Agent[]);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: {
    name: string;
    description?: string;
    instructions: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          ...agentData,
          user_id: user.id,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateAgent = async (id: string, agentData: {
    name: string;
    description?: string;
    instructions: string;
    status?: 'active' | 'inactive' | 'draft';
  }) => {
    const { data, error } = await supabase
      .from('agents')
      .update(agentData)
      .eq('id', id)
      .eq('user_id', user?.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteAgent = async (id: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) throw error;
  };

  const getAgent = async (id: string) => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error) throw error;
    return data;
  };

  useEffect(() => {
    fetchAgents();
  }, [user]);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    refetchAgents: fetchAgents,
  };
};

export const useKnowledgeFiles = (agentId: string) => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFiles = async () => {
    if (!agentId) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, agentId: string) => {
    if (!user) throw new Error('User not authenticated');

    // Upload file to Supabase Storage
    const filePath = `${user.id}/${agentId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('agent-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Read file content for processing
    const text = await file.text();

    // Store file metadata in database
    const { data, error } = await supabase
      .from('knowledge_files')
      .insert([
        {
          agent_id: agentId,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          processed_content: text,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('agent-files')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('knowledge_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
  };

  useEffect(() => {
    if (agentId) {
      fetchFiles();
    }
  }, [agentId]);

  return {
    files,
    loading,
    uploadFile,
    deleteFile,
    refetchFiles: fetchFiles,
  };
};