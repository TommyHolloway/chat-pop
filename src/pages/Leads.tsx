import React, { useState } from 'react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Eye, Calendar, User, Mail, Phone, Building } from 'lucide-react';
import { format } from 'date-fns';
import { useAgents } from '@/hooks/useAgents';

const Leads: React.FC = () => {
  const { leads, loading, fetchLeads, exportToCSV } = useLeads();
  const { agents } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(lead => {
    const matchesAgent = selectedAgent === 'all' || lead.agent_id === selectedAgent;
    const matchesSearch = !searchTerm || 
      lead.lead_data_json?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lead_data_json?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesAgent && matchesSearch;
  });

  const handleExportAll = () => {
    exportToCSV(filteredLeads);
  };

  const formatLeadData = (leadData: any) => {
    if (!leadData) return {};
    
    const formatted: { [key: string]: any } = {};
    Object.entries(leadData).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        formatted[key.charAt(0).toUpperCase() + key.slice(1)] = value;
      }
    });
    return formatted;
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground mt-2">
            View and export captured lead information from your agents
          </p>
        </div>
        <Button onClick={handleExportAll} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {lead.lead_data_json?.name || 'Anonymous Lead'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {lead.agent?.name || 'Unknown Agent'}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(lead.created_at), 'MMM dd')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.lead_data_json?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{lead.lead_data_json.email}</span>
                    </div>
                  )}
                  {lead.lead_data_json?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.lead_data_json.phone}</span>
                    </div>
                  )}
                  {lead.lead_data_json?.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{lead.lead_data_json.company}</span>
                    </div>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Lead Details
                        </DialogTitle>
                      </DialogHeader>
                      {selectedLead && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Basic Information</h4>
                            <div className="space-y-2">
                              <p><strong>ID:</strong> {selectedLead.id}</p>
                              <p><strong>Agent:</strong> {selectedLead.agent?.name}</p>
                              <p><strong>Date:</strong> {format(new Date(selectedLead.created_at), 'PPP')}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Captured Data</h4>
                            <div className="space-y-2">
                              {Object.entries(formatLeadData(selectedLead.lead_data_json)).map(([key, value]) => (
                                <p key={key}>
                                  <strong>{key}:</strong> {String(value)}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLeads.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedAgent !== 'all' 
                    ? "No leads match your current filters."
                    : "Your agents haven't captured any leads yet. Enable lead capture in your agent settings to start collecting visitor information."}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Leads;