import { Link, useLocation, useParams } from 'react-router-dom';
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
  Loader2
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

interface AgentSidebarProps {
  agent: any;
  loading?: boolean;
}

export const AgentSidebar = ({ agent, loading }: AgentSidebarProps) => {
  const location = useLocation();
  const { id } = useParams();
  
  const isActive = (path: string) => location.pathname === path;
  const isInSection = (section: string) => location.pathname.includes(`/${section}`);

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
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {agent?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{agent?.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Active</Badge>
              <span className="text-xs text-muted-foreground">Agent</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Playground */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`/agents/${id}/playground`)}>
                  <Link to={`/agents/${id}/playground`}>
                    <Play className="h-4 w-4" />
                    <span>Playground</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Activity */}
              <Collapsible defaultOpen={isInSection('activity')}>
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/activity/conversations`)}>
                          <Link to={`/agents/${id}/activity/conversations`}>
                            <Bot className="h-4 w-4" />
                            <span>Conversations</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/activity/leads`)}>
                          <Link to={`/agents/${id}/activity/leads`}>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(`/agents/${id}/analytics`)}>
                  <Link to={`/agents/${id}/analytics`}>
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Sources */}
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/sources/files`)}>
                          <Link to={`/agents/${id}/sources/files`}>
                            <Files className="h-4 w-4" />
                            <span>Files</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/sources/text`)}>
                          <Link to={`/agents/${id}/sources/text`}>
                            <Type className="h-4 w-4" />
                            <span>Text</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/sources/website`)}>
                          <Link to={`/agents/${id}/sources/website`}>
                            <Globe2 className="h-4 w-4" />
                            <span>Website</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/sources/qa`)}>
                          <Link to={`/agents/${id}/sources/qa`}>
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/actions/calendar`)}>
                          <Link to={`/agents/${id}/actions/calendar`}>
                            <Calendar className="h-4 w-4" />
                            <span>Calendar Booking</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/actions/buttons`)}>
                          <Link to={`/agents/${id}/actions/buttons`}>
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
              <Collapsible defaultOpen={isInSection('deploy')}>
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/deploy/embed`)}>
                          <Link to={`/agents/${id}/deploy/embed`}>
                            <Code className="h-4 w-4" />
                            <span>Embed</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/deploy/share`)}>
                          <Link to={`/agents/${id}/deploy/share`}>
                            <Share className="h-4 w-4" />
                            <span>Share</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/deploy/integrations`)}>
                          <Link to={`/agents/${id}/deploy/integrations`}>
                            <Link2 className="h-4 w-4" />
                            <span>Integrations</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Settings */}
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
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/settings/general`)}>
                          <Link to={`/agents/${id}/settings/general`}>
                            <Bot className="h-4 w-4" />
                            <span>General</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/settings/ai`)}>
                          <Link to={`/agents/${id}/settings/ai`}>
                            <Settings className="h-4 w-4" />
                            <span>AI Configuration</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/settings/chat`)}>
                          <Link to={`/agents/${id}/settings/chat`}>
                            <Palette className="h-4 w-4" />
                            <span>Chat Interface</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive(`/agents/${id}/settings/leads`)}>
                          <Link to={`/agents/${id}/settings/leads`}>
                            <UserPlus className="h-4 w-4" />
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
      </SidebarContent>
    </Sidebar>
  );
};