import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Agent {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  instructions: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  initial_message?: string | null;
  creativity_level?: number | null;
  profile_image_url?: string | null;
  message_bubble_color?: string | null;
  chat_interface_theme?: string | null;
  enable_proactive_engagement?: boolean | null;
  proactive_config?: any | null;
  widget_page_restrictions?: string[] | null;
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
    workspace_id: string;
    initial_message?: string;
    creativity_level?: number;
    profile_image_url?: string;
    message_bubble_color?: string;
    chat_interface_theme?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    // Check if user can create more agents (enforcement will be checked in UI)
    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          ...agentData,
          user_id: user.id,
          status: 'active', // Default to active
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
    name?: string;
    description?: string;
    instructions?: string;
    status?: 'active' | 'inactive' | 'draft';
    initial_message?: string;
    creativity_level?: number;
    profile_image_url?: string;
    message_bubble_color?: string;
    chat_interface_theme?: string;
    enable_proactive_engagement?: boolean;
    proactive_config?: any;
    widget_page_restrictions?: string[];
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

    // Generate a unique file path using timestamp to avoid conflicts
    const timestamp = Date.now();
    const filePath = `${user.id}/${agentId}/${timestamp}-${file.name}`;
    
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('agent-files')
      .upload(filePath, file);

    if (uploadError) {
      // If file already exists, try with a different name
      if (uploadError.message?.includes('already exists')) {
        const randomSuffix = Math.random().toString(36).substring(7);
        const newFilePath = `${user.id}/${agentId}/${timestamp}-${randomSuffix}-${file.name}`;
        const { error: retryError } = await supabase.storage
          .from('agent-files')
          .upload(newFilePath, file);
        
        if (retryError) throw retryError;
        // Update filePath for database insert
        return await insertFileRecord(newFilePath, file, agentId);
      }
      throw uploadError;
    }

    return await insertFileRecord(filePath, file, agentId);
  };

  const insertFileRecord = async (filePath: string, file: File, agentId: string) => {
    // Store file metadata in database with initial processing status
    const { data, error } = await supabase
      .from('knowledge_files')
      .insert([
        {
          agent_id: agentId,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          processed_content: 'Processing file content...',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Extract content from the uploaded file
    try {
      let processedContent: string;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === '.txt' || fileExtension === '.md') {
        // Read text files directly
        processedContent = await file.text();
      } else {
        // Use the extraction service for other file types
        const extractResponse = await supabase.functions.invoke('extract-file-content', {
          body: {
            filePath: filePath,
            fileType: file.type
          }
        });

        if (extractResponse.data?.success && extractResponse.data?.content) {
          processedContent = extractResponse.data.content;
        } else if (extractResponse.data?.content) {
          // Even if extraction failed, use the fallback content
          processedContent = extractResponse.data.content;
        } else {
          processedContent = `File uploaded: ${file.name} (${fileExtension}). Content extraction failed.`;
        }
      }

      // Update the file record with extracted content
      console.log(`Attempting to update file ${data.id} with content length: ${processedContent.length}`);
      const { error: updateError } = await supabase
        .from('knowledge_files')
        .update({
          processed_content: processedContent
        })
        .eq('id', data.id);

      if (updateError) {
        console.error('Failed to update extracted content:', updateError);
        throw updateError; // Make sure the error propagates
      }

      console.log(`Successfully updated file ${data.id} with content length: ${processedContent.length}`);
      
      // Refresh the files list to show updated status
      await fetchFiles();

    } catch (extractError) {
      console.error('Content extraction failed:', extractError);
      
      // Update with fallback content
      await supabase
        .from('knowledge_files')
        .update({
          processed_content: `File uploaded: ${file.name}. Content extraction failed: ${extractError.message}`
        })
        .eq('id', data.id);
    }

    // Update storage usage tracking
    if (user) {
      await supabase.rpc('update_storage_usage', {
        p_user_id: user.id,
        p_size_change: file.size
      });
    }

    // Trigger automatic training after file upload
    try {
      console.log('Triggering agent training after file upload...');
      await supabase.functions.invoke('train-agent', {
        body: { agentId }
      });
      console.log('Agent training triggered successfully');
    } catch (trainError) {
      console.warn('Failed to trigger agent training:', trainError);
      // Don't throw here as the file upload was successful
    }

    return data;
  };

  const reprocessFile = async (fileId: string, filePath: string, filename: string, contentType: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update file status to processing
      await supabase
        .from('knowledge_files')
        .update({
          processed_content: 'Reprocessing file content...'
        })
        .eq('id', fileId);

      let processedContent: string;
      const fileExtension = '.' + filename.split('.').pop()?.toLowerCase();
      
      if (fileExtension === '.txt' || fileExtension === '.md') {
        // For text files, download and read directly
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('agent-files')
          .download(filePath);
        
        if (downloadError) throw downloadError;
        processedContent = await fileData.text();
      } else {
        // Use the extraction service for other file types
        console.log(`Calling extract-file-content for: ${filePath}`);
        const extractResponse = await supabase.functions.invoke('extract-file-content', {
          body: {
            filePath: filePath,
            fileType: contentType
          }
        });

        console.log('Extract response:', {
          error: extractResponse.error,
          success: extractResponse.data?.success,
          contentLength: extractResponse.data?.content?.length,
          dataKeys: Object.keys(extractResponse.data || {})
        });

        if (extractResponse.error) {
          throw new Error(`Edge function error: ${extractResponse.error.message}`);
        }

        if (extractResponse.data?.content) {
          processedContent = extractResponse.data.content;
          console.log(`Content extracted successfully. Length: ${processedContent.length} characters`);
        } else {
          throw new Error(extractResponse.data?.error || 'No content extracted from response');
        }
      }

      // Update the file record with extracted content
      const { error: updateError } = await supabase
        .from('knowledge_files')
        .update({
          processed_content: processedContent
        })
        .eq('id', fileId);

      if (updateError) throw updateError;

      // Trigger chunking for the agent after successful content extraction
      try {
        console.log('Triggering agent training after file processing...');
        await supabase.functions.invoke('train-agent', {
          body: { agentId }
        });
        console.log('Agent training triggered successfully');
      } catch (trainError) {
        console.warn('Failed to trigger agent training:', trainError);
        // Don't throw here as the file processing was successful
      }

      return processedContent;
    } catch (error) {
      console.error('Reprocessing failed:', error);
      
      // Update with error message
      await supabase
        .from('knowledge_files')
        .update({
          processed_content: `Reprocessing failed: ${error.message}`
        })
        .eq('id', fileId);
      
      throw error;
    }
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
    reprocessFile,
    refetchFiles: fetchFiles,
  };
};