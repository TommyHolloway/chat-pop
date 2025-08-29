import { Link, useLocation, useParams } from 'react-router-dom';
import { useState } from 'react';
import { 
  Home, 
  Bot, 
  Plus, 
  CreditCard, 
  Settings, 
  User,
  ChevronRight,
  Shield,
  Users,
  Building2,
  ChevronDown,
  UserPlus,
  BarChart3,
  ArrowLeft,
  Play,
  MessageSquare,
  FileText,
  Globe,
  HelpCircle,
  Calendar,
  Share2,
  Code,
  Zap,
  Palette,
  Target
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/hooks/useAgents';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { PlanUpgradeDialog } from '@/components/PlanUpgradeDialog';

export const WorkspaceSidebar = () => {
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { state } = useSidebar();
  const { isAdmin } = useUserRole();
  const { agents } = useAgents();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaces();
  const { canViewVisitorAnalytics } = usePlanEnforcement();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  const isCollapsed = state === 'collapsed';
  
  const getInitials = (email: string) => {
    return email ? email.slice(0, 2).toUpperCase() : 'U';
  };

  const isActive = (path: string) => location.pathname === path;
  const isAgentRoute = location.pathname.includes('/agents');
  const currentAgentId = params.id;
  const currentAgent = agents.find(a => a.id === currentAgentId);

  // Filter agents for current workspace
  const workspaceAgents = agents.filter(a => a.workspace_id === currentWorkspace?.id);

  // Check if we're in an agent's detailed view
  const isInAgentDetail = isAgentRoute && currentAgentId;

  const isInSection = (section: string) => {
    return location.pathname.includes(`/agents/${currentAgentId}/${section}`);
  };

  const handleProactiveEngagementClick = (e: React.MouseEvent) => {
    if (!canViewVisitorAnalytics) {
      e.preventDefault();
      setShowUpgradeDialog(true);
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        {/* Workspace Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </span>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  switchWorkspace(workspace);
                  // Navigate to dashboard if switching workspaces
                  if (workspace.id !== currentWorkspace?.id) {
                    window.location.href = '/dashboard';
                  }
                }}
                className={workspace.id === currentWorkspace?.id ? 'bg-muted' : ''}
              >
                <Building2 className="mr-2 h-4 w-4" />
                {workspace.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {isInAgentDetail ? (
          // Agent-specific navigation
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{currentAgent?.name}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isInSection('playground')}>
                      <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/playground`}>
                        <Play className="h-4 w-4" />
                        <span>Playground</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild={canViewVisitorAnalytics}
                      isActive={isInSection('settings/proactive')}
                      onClick={handleProactiveEngagementClick}
                    >
                      {canViewVisitorAnalytics ? (
                        <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/proactive`}>
                          <Target className="h-4 w-4" />
                          <span>Proactive Engagement</span>
                          <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
                        </Link>
                      ) : (
                        <button className="w-full">
                          <Target className="h-4 w-4" />
                          <span>Proactive Engagement</span>
                          <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
                        </button>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <Collapsible defaultOpen={isInSection('activity')}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <MessageSquare className="h-4 w-4" />
                          <span>Activity</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/activity/conversations`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/activity/conversations`}>
                                <span>Conversations</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/activity/leads`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/activity/leads`}>
                                <span>Leads</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isInSection('analytics')}>
                      <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/analytics`}>
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <Collapsible defaultOpen={isInSection('sources')}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <FileText className="h-4 w-4" />
                          <span>Sources</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/files`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/files`}>
                                <span>Files</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/text`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/text`}>
                                <span>Text</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/website`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/website`}>
                                <span>Website</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/qa`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/sources/qa`}>
                                <span>Q&A</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <Collapsible defaultOpen={isInSection('actions')}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Zap className="h-4 w-4" />
                          <span>Actions</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/actions/calendar`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/actions/calendar`}>
                                <span>Calendar Booking</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/actions/buttons`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/actions/buttons`}>
                                <span>Custom Buttons</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <Collapsible defaultOpen={isInSection('deploy')}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Share2 className="h-4 w-4" />
                          <span>Deploy</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/deploy/embed`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/deploy/embed`}>
                                <span>Embed</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/deploy/share`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/deploy/share`}>
                                <span>Share</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/deploy/integrations`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/deploy/integrations`}>
                                <span>Integrations</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  <Collapsible defaultOpen={isInSection('settings')}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/general`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/general`}>
                                <span>General</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/ai`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/ai`}>
                                <span>AI Configuration</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/chat`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/chat`}>
                                <span>Chat Interface</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/leads`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${currentAgentId}/settings/leads`}>
                                <span>Lead Capture</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          // Regular workspace navigation
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/dashboard')}>
                    <Link to="/dashboard">
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <Collapsible defaultOpen={isAgentRoute}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Bot className="h-4 w-4" />
                        <span>Agents</span>
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {workspaceAgents.slice(0, 5).map((agent) => (
                          <SidebarMenuSubItem key={agent.id}>
                            <SidebarMenuSubButton asChild isActive={location.pathname.includes(`/agents/${agent.id}`)}>
                              <Link to={`/workspace/${currentWorkspace?.id}/agents/${agent.id}/playground`}>
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {agent.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{agent.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/dashboard">
                              <Bot className="h-4 w-4" />
                              <span>View All</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link to="/dashboard">
                              <Plus className="h-4 w-4" />
                              <span>Create New</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/leads')}>
                    <Link to="/leads">
                      <UserPlus className="h-4 w-4" />
                      <span>Leads</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/analytics')}>
                    <Link to="/analytics">
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/billing')}>
                    <Link to="/billing">
                      <CreditCard className="h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/admin')}>
                      <Link to="/admin">
                        <Shield className="h-4 w-4" />
                        <span>Admin Portal</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/settings')}>
              <Link to="/settings" className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" alt={user?.email || 'User'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {user?.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Settings
                    </span>
                  </div>
                )}
                <Settings className="h-4 w-4 flex-shrink-0" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Plan Upgrade Dialog */}
      <PlanUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature="Proactive Engagement"
        currentLimit="Feature requires Pro plan"
        recommendedPlan="standard"
      />
    </Sidebar>
  );
};