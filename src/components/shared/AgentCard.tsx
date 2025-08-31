import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Edit,
  Play,
  Trash2,
  ExternalLink,
  Settings,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AgentCardProps {
  agent: Agent;
  onDelete?: (agentId: string, agentName: string) => void;
  variant?: 'dashboard' | 'agents';
}

export function AgentCard({ agent, onDelete, variant = 'dashboard' }: AgentCardProps) {
  const { currentWorkspace } = useWorkspaces();
  const workspaceId = currentWorkspace?.id;
  
  const primaryAction = variant === 'dashboard' ? 'Edit' : 'Manage';
  const primaryLink = variant === 'dashboard' 
    ? `/workspace/${workspaceId}/agents/${agent.id}/settings/general` 
    : `/workspace/${workspaceId}/agents/${agent.id}`;
  const PrimaryIcon = variant === 'dashboard' ? Edit : Settings;
  const testLink = `/workspace/${workspaceId}/agents/${agent.id}/playground`;

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                {agent.status}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(agent.updated_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {variant === 'agents' && (
              <DropdownMenuItem asChild>
                <Link to={`/workspace/${workspaceId}/agents/${agent.id}`} className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to={`/workspace/${workspaceId}/agents/${agent.id}/settings/general`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Edit Agent
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={testLink} className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                Test Agent
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/workspace/${workspaceId}/agents/${agent.id}/deploy/embed`} className="flex items-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                Deploy
              </Link>
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(agent.id, agent.name)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agent
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          {agent.description || 'No description provided'}
        </CardDescription>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="font-semibold capitalize">{agent.status}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Created</span>
            <div className="font-semibold">{format(new Date(agent.created_at), 'MMM d')}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to={testLink} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Play className="mr-2 h-3 w-3" />
              Test
            </Button>
          </Link>
          <Link to={primaryLink} className="flex-1">
            <Button size="sm" className="w-full">
              <PrimaryIcon className="mr-2 h-3 w-3" />
              {primaryAction}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}