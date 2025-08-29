import { Link, useLocation } from 'react-router-dom';
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
  BarChart3
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
import { useAgents } from '@/hooks/useAgents';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export const WorkspaceSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();
  const { isAdmin } = useUserRole();
  const { agents } = useAgents();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaces();
  
  const isCollapsed = state === 'collapsed';
  
  const getInitials = (email: string) => {
    return email ? email.slice(0, 2).toUpperCase() : 'U';
  };

  const isActive = (path: string) => location.pathname === path;
  const isAgentRoute = location.pathname.includes('/agents');

  // Filter agents for current workspace
  const workspaceAgents = agents.filter(a => a.workspace_id === currentWorkspace?.id);

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
    </Sidebar>
  );
};