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

interface PlanLimitResponse {
  can_perform: boolean;
  current_usage: number;
  limit: number;
  plan: string;
  new_total_size?: number;
}

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgents = async () => {
    if (!user) return;

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

    // Check if user can create more agents (enforcement will be checked in UI)
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
    
    // Refresh agents list after creation
    await fetchAgents();
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

    // Validate file type
    const allowedTypes = ['.txt', '.md', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type ${fileExtension} is not supported. Please upload .txt, .md, .pdf, or .docx files.`);
    }

    // Check storage limits before uploading
    const { data: limitCheck } = await supabase.rpc('check_user_plan_limits', {
      p_user_id: user.id,
      p_feature_type: 'storage',
      p_file_size: file.size
    });

    const limitResponse = limitCheck as unknown as PlanLimitResponse;
    if (limitResponse && !limitResponse.can_perform) {
      throw new Error(`Storage limit exceeded. Current: ${(limitResponse.current_usage / (1024 * 1024 * 1024)).toFixed(1)}GB, Limit: ${(limitResponse.limit / (1024 * 1024 * 1024)).toFixed(1)}GB`);
    }

    // Upload file to Supabase Storage
    const filePath = `${user.id}/${agentId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('agent-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Process file content based on type
    let processedContent = null;
    
    if (fileExtension === '.txt' || fileExtension === '.md') {
      // Read text files directly
      processedContent = await file.text();
    } else {
      // For PDF and DOCX files, store metadata only for now
      // Content will be processed server-side later
      processedContent = `File uploaded: ${file.name} (${fileExtension})`;
    }

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
          processed_content: processedContent,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update storage usage tracking
    await supabase.rpc('update_storage_usage', {
      p_user_id: user.id,
      p_size_change: file.size
    });

    return data;
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    if (!user) throw new Error('User not authenticated');

    // Get file size before deletion for storage tracking
    const { data: fileData } = await supabase
      .from('knowledge_files')
      .select('file_size')
      .eq('id', fileId)
      .single();

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

    // Update storage usage tracking (subtract file size)
    if (fileData) {
      await supabase.rpc('update_storage_usage', {
        p_user_id: user.id,
        p_size_change: -fileData.file_size
      });
    }
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