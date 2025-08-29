import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Play, 
  MessageSquare, 
  FileText, 
  Globe, 
  HelpCircle, 
  Calendar, 
  MousePointer, 
  Share, 
  Code, 
  Zap, 
  Eye, 
  ChevronDown, 
  Plus 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAgents } from "@/hooks/useAgents";

interface WorkspaceSidebarProps {
  selectedAgent?: any;
}

export function WorkspaceSidebar({ selectedAgent }: WorkspaceSidebarProps) {
  const location = useLocation();
  const params = useParams();
  const { workspaceId, id: agentId } = params;
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaces();
  const { agents } = useAgents();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const workspaceAgents = agents.filter(agent => agent.workspace_id === workspaceId);

  const isActive = (path: string) => location.pathname === path;
  const isInSection = (sectionPrefix: string) => location.pathname.startsWith(sectionPrefix);

  const workspaceBasePath = `/workspace/${workspaceId}`;
  const agentBasePath = agentId ? `/workspace/${workspaceId}/agents/${agentId}` : '';

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        {!collapsed && (
          <div className="space-y-2">
            {/* Workspace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2 py-1 h-auto">
                  <div className="text-left">
                    <div className="text-sm font-medium truncate">
                      {currentWorkspace?.name || 'Select Workspace'}
                    </div>
                    <div className="text-xs text-muted-foreground">Workspace</div>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => switchWorkspace(workspace)}
                    className={currentWorkspace?.id === workspace.id ? "bg-accent" : ""}
                  >
                    {workspace.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Agent Dropdown - Only show if agents exist */}
            {workspaceAgents.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-2 py-1 h-auto">
                    <div className="text-left">
                      <div className="text-sm font-medium truncate">
                        {selectedAgent?.name || 'All Agents'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedAgent ? 'Agent' : 'View All'}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={`${workspaceBasePath}/agents`}>All Agents</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {workspaceAgents.map((agent) => (
                    <DropdownMenuItem key={agent.id} asChild>
                      <Link to={`/workspace/${workspaceId}/agents/${agent.id}/playground`}>
                        {agent.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Agent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Workspace-level Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`${workspaceBasePath}`) || isActive(`${workspaceBasePath}/overview`)}>
                  <Link to={workspaceBasePath}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Overview</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`${workspaceBasePath}/agents`)}>
                  <Link to={`${workspaceBasePath}/agents`}>
                    <Users className="mr-2 h-4 w-4" />
                    {!collapsed && <span>All Agents</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`${workspaceBasePath}/analytics`)}>
                  <Link to={`${workspaceBasePath}/analytics`}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Analytics</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`${workspaceBasePath}/settings`)}>
                  <Link to={`${workspaceBasePath}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Agent-specific Navigation - Only show when an agent is selected */}
        {selectedAgent && agentId && !collapsed && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Agent: {selectedAgent.name}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive(`${agentBasePath}/playground`)}>
                      <Link to={`${agentBasePath}/playground`}>
                        <Play className="mr-2 h-4 w-4" />
                        <span>Playground</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Activity Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Activity
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/activity/conversations`)}>
                          <Link to={`${agentBasePath}/activity/conversations`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Conversations</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/activity/leads`)}>
                          <Link to={`${agentBasePath}/activity/leads`}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Leads</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Analytics Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Analytics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive(`${agentBasePath}/analytics`)}>
                      <Link to={`${agentBasePath}/analytics`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Performance</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive(`${agentBasePath}/visitor-analytics`)}>
                      <Link to={`${agentBasePath}/visitor-analytics`}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>Visitor Behavior</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Sources Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Sources
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/sources/files`)}>
                          <Link to={`${agentBasePath}/sources/files`}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Files</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/sources/text`)}>
                          <Link to={`${agentBasePath}/sources/text`}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Text</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/sources/website`)}>
                          <Link to={`${agentBasePath}/sources/website`}>
                            <Globe className="mr-2 h-4 w-4" />
                            <span>Website</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/sources/qa`)}>
                          <Link to={`${agentBasePath}/sources/qa`}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            <span>Q&A</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Actions Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Actions
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/actions/calendar`)}>
                          <Link to={`${agentBasePath}/actions/calendar`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Calendar Booking</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/actions/buttons`)}>
                          <Link to={`${agentBasePath}/actions/buttons`}>
                            <MousePointer className="mr-2 h-4 w-4" />
                            <span>Custom Buttons</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Deploy Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Deploy
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/deploy/embed`)}>
                          <Link to={`${agentBasePath}/deploy/embed`}>
                            <Code className="mr-2 h-4 w-4" />
                            <span>Embed</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/deploy/share`)}>
                          <Link to={`${agentBasePath}/deploy/share`}>
                            <Share className="mr-2 h-4 w-4" />
                            <span>Share</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/deploy/integrations`)}>
                          <Link to={`${agentBasePath}/deploy/integrations`}>
                            <Zap className="mr-2 h-4 w-4" />
                            <span>Integrations</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Settings Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    Settings
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/settings/general`)}>
                          <Link to={`${agentBasePath}/settings/general`}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>General</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/settings/ai`)}>
                          <Link to={`${agentBasePath}/settings/ai`}>
                            <Zap className="mr-2 h-4 w-4" />
                            <span>AI Configuration</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/settings/chat`)}>
                          <Link to={`${agentBasePath}/settings/chat`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Chat Interface</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`${agentBasePath}/settings/leads`)}>
                          <Link to={`${agentBasePath}/settings/leads`}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Lead Capture</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}