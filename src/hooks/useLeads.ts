import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  agent_id: string;
  conversation_id: string;
  lead_data_json: any;
  created_at: string;
  agent?: {
    name: string;
  };
}

export const useLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async (agentId?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          agent:agents(name)
        `)
        .order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (leadsToExport: Lead[]) => {
    if (!leadsToExport.length) {
      toast.error('No leads to export');
      return;
    }

    const headers = ['ID', 'Date', 'Agent Name', 'Name', 'Email', 'Phone', 'Company'];
    const csvContent = [
      headers.join(','),
      ...leadsToExport.map(lead => [
        lead.id,
        new Date(lead.created_at).toLocaleDateString(),
        lead.agent?.name || 'Unknown',
        lead.lead_data_json?.name || '',
        lead.lead_data_json?.email || '',
        lead.lead_data_json?.phone || '',
        lead.lead_data_json?.company || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Leads exported successfully');
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  return {
    leads,
    loading,
    fetchLeads,
    exportToCSV
  };
};