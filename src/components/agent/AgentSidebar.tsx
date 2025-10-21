import { Link, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Bot,
  Play,
  Activity,
  BarChart3,
  FileText,
  Zap,
  Globe,
  Settings,
  ChevronRight,
  Files,
  Type,
  Globe2,
  HelpCircle,
  Calendar,
  MousePointer,
  Code,
  Share,
  Link2,
  Palette,
  UserPlus,
  Loader2,
  Building2,
  ChevronDown,
  Plus,
  Eye,
  Target
} from 'lucide-react';
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
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useAgents } from '@/hooks/useAgents';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { PlanUpgradeDialog } from '@/components/PlanUpgradeDialog';

interface AgentSidebarProps {
  agent: any;
  loading?: boolean;
}

export const AgentSidebar = ({ agent, loading }: AgentSidebarProps) => {
  const location = useLocation();
  const { id, workspaceId } = useParams();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaces();
  const { agents } = useAgents();
  const { canViewVisitorAnalytics } = usePlanEnforcement();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  // State for controlling which sections are open
  const [openSections, setOpenSections] = useState({
    activity: false,
    analytics: false,
    sources: false,
    actions: false,
    deploy: false,
    settings: false,
  });
  
  // Filter agents for current workspace
  const workspaceAgents = agents.filter(a => a.workspace_id === workspaceId);
  
  const isActive = (path: string) => location.pathname === path;
  const isInSection = (section: string) => location.pathname.includes(`/${section}`);

  // Effect to update open sections based on current route
  useEffect(() => {
    setOpenSections({
      activity: isInSection('activity'),
      analytics: isInSection('analytics'),
      sources: isInSection('sources'),
      actions: isInSection('actions'),
      deploy: isInSection('deploy'),
      settings: isInSection('settings'),
    });
  }, [location.pathname]);

  const handleProactiveEngagementClick = (e: React.MouseEvent) => {
    if (!canViewVisitorAnalytics) {
      e.preventDefault();
      setShowUpgradeDialog(true);
    }
  };

  if (loading) {
    return (
      <div className="w-80 border-r flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Sidebar className="w-80 border-r">
      <SidebarHeader className="p-6 border-b">
        {/* Workspace Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between mb-3 h-auto p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  switchWorkspace(workspace);
                  // Navigate to workspace overview if switching workspaces
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

        {/* Agent Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {agent?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium text-sm truncate">{agent?.name}</div>
                  <div className="text-xs text-muted-foreground">Agent</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            {workspaceAgents.map((workspaceAgent) => (
              <DropdownMenuItem
                key={workspaceAgent.id}
                onClick={() => window.location.href = `/workspace/${workspaceId}/agents/${workspaceAgent.id}/playground`}
                className={workspaceAgent.id === agent?.id ? 'bg-muted' : ''}
              >
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {workspaceAgent.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{workspaceAgent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {workspaceAgent.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Playground */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/playground`)}>
                  <Link to={`/workspace/${workspaceId}/agents/${id}/playground`}>
                    <Play className="h-4 w-4" />
                    <span>Playground</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Proactive Engagement */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild={canViewVisitorAnalytics} 
                  isActive={isActive(`/workspace/${workspaceId}/agents/${id}/settings/proactive`)}
                  onClick={handleProactiveEngagementClick}
                >
                  {canViewVisitorAnalytics ? (
                    <Link to={`/workspace/${workspaceId}/agents/${id}/settings/proactive`}>
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

              {/* Activity */}
              <Collapsible 
                open={openSections.activity}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, activity: open }))}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Activity className="h-4 w-4" />
                      <span>Activity</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/activity/conversations`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/activity/conversations`}>
                            <Bot className="h-4 w-4" />
                            <span>Conversations</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/activity/leads`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/activity/leads`}>
                            <UserPlus className="h-4 w-4" />
                            <span>Leads</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Analytics */}
              <Collapsible 
                open={openSections.analytics}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, analytics: open }))}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/analytics`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/analytics`}>
                            <BarChart3 className="h-4 w-4" />
                            <span>Performance</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/analytics/visitor`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/analytics/visitor`}>
                            <Eye className="h-4 w-4" />
                            <span>Visitor Intelligence</span>
                            <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Sources */}
              <Collapsible 
                open={openSections.sources}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, sources: open }))}
              >
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/sources/files`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/sources/files`}>
                            <Files className="h-4 w-4" />
                            <span>Files</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/sources/text`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/sources/text`}>
                            <Type className="h-4 w-4" />
                            <span>Text</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/sources/website`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/sources/website`}>
                            <Globe2 className="h-4 w-4" />
                            <span>Website</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/sources/qa`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/sources/qa`}>
                            <HelpCircle className="h-4 w-4" />
                            <span>Q&A</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Actions */}
              <Collapsible 
                open={openSections.actions}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, actions: open }))}
              >
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/actions/calendar`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/actions/calendar`}>
                            <Calendar className="h-4 w-4" />
                            <span>Calendar Booking</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/actions/buttons`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/actions/buttons`}>
                            <MousePointer className="h-4 w-4" />
                            <span>Custom Buttons</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Deploy */}
              <Collapsible 
                open={openSections.deploy}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, deploy: open }))}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Globe className="h-4 w-4" />
                      <span>Deploy</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/deploy/embed`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/deploy/embed`}>
                            <Code className="h-4 w-4" />
                            <span>Embed</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/deploy/share`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/deploy/share`}>
                            <Share className="h-4 w-4" />
                            <span>Share</span>
                            <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Settings */}
              <Collapsible 
                open={openSections.settings}
                onOpenChange={(open) => setOpenSections(prev => ({ ...prev, settings: open }))}
              >
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/settings/general`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/settings/general`}>
                            <Bot className="h-4 w-4" />
                            <span>General</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/settings/chat`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/settings/chat`}>
                            <Palette className="h-4 w-4" />
                            <span>Chat Interface</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/settings/leads`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/settings/leads`}>
                            <UserPlus className="h-4 w-4" />
                            <span>Lead Capture</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/workspace/${workspaceId}/agents/${id}/settings/integrations`)}>
                          <Link to={`/workspace/${workspaceId}/agents/${id}/settings/integrations`}>
                            <Link2 className="h-4 w-4" />
                            <span>Integrations</span>
                            <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
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
      </SidebarContent>

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