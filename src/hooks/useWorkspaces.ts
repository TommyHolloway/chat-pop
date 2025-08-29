import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const { user } = useAuth();

  const fetchWorkspaces = async () => {
    console.log('fetchWorkspaces called, user =', user);
    if (!user) {
      console.log('No user, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setWorkspaces(data || []);
      
      // Set current workspace from localStorage or first workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      if (savedWorkspaceId && data?.find(w => w.id === savedWorkspaceId)) {
        setCurrentWorkspace(data.find(w => w.id === savedWorkspaceId) || null);
      } else if (data && data.length > 0) {
        setCurrentWorkspace(data[0]);
        localStorage.setItem('currentWorkspaceId', data[0].id);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workspaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (workspaceData: { name: string; description?: string }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{
          user_id: user.id,
          ...workspaceData
        }])
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(prev => [...prev, data]);
      setCurrentWorkspace(data);
      localStorage.setItem('currentWorkspaceId', data.id);
      
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(prev => prev.map(w => w.id === id ? data : w));
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(data);
      }

      toast({
        title: "Success",
        description: "Workspace updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkspaces(prev => prev.filter(w => w.id !== id));
      
      // If deleted workspace was current, switch to first available
      if (currentWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id);
        if (remaining.length > 0) {
          setCurrentWorkspace(remaining[0]);
          localStorage.setItem('currentWorkspaceId', remaining[0].id);
        } else {
          setCurrentWorkspace(null);
          localStorage.removeItem('currentWorkspaceId');
        }
      }

      toast({
        title: "Success",
        description: "Workspace deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: "Error",
        description: "Failed to delete workspace",
        variant: "destructive",
      });
    }
  };

  const switchWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspaceId', workspace.id);
  };

  useEffect(() => {
    console.log('useWorkspaces useEffect, user =', user);
    if (user) {
      fetchWorkspaces();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    workspaces,
    loading,
    currentWorkspace,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    switchWorkspace
  };
};