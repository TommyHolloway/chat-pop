import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Calendar,
  MoreHorizontal,
  Edit,
  Play,
  Trash2,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Dashboard = () => {
  const [agents] = useState(mockAgents);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your AI agents.
              </p>
            </div>
            <Link to="/agents/new">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create New Agent
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,284</div>
              <p className="text-xs text-muted-foreground">+180 from yesterday</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.2%</div>
              <p className="text-xs text-muted-foreground">+2.1% from last week</p>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">573</div>
              <p className="text-xs text-muted-foreground">+25 this hour</p>
            </CardContent>
          </Card>
        </div>

        {/* Agents Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Your AI Agents</h2>
              <p className="text-muted-foreground">
                Manage and monitor your deployed chatbots
              </p>
            </div>
          </div>

          {agents.length === 0 ? (
            <Card className="p-12 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI agent to get started with automated customer support.
              </p>
              <Link to="/agents/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Agent
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover-lift">
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
                          <Badge variant={agent.status === 'live' ? 'default' : 'secondary'}>
                            {agent.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {agent.lastUpdated}
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
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/edit`} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Agent
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/playground`} className="flex items-center">
                            <Play className="mr-2 h-4 w-4" />
                            Test Agent
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/agents/${agent.id}/deploy`} className="flex items-center">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Deploy
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {agent.description}
                    </CardDescription>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Conversations</span>
                        <div className="font-semibold">{agent.conversations}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accuracy</span>
                        <div className="font-semibold">{agent.accuracy}%</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link to={`/agents/${agent.id}/playground`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Play className="mr-2 h-3 w-3" />
                          Test
                        </Button>
                      </Link>
                      <Link to={`/agents/${agent.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const mockAgents = [
  {
    id: '1',
    name: 'Customer Support Bot',
    description: 'Handles general customer inquiries and support tickets for our main product.',
    status: 'live' as const,
    lastUpdated: '2 hours ago',
    conversations: 234,
    accuracy: 94
  },
  {
    id: '2', 
    name: 'Sales Assistant',
    description: 'Qualifies leads and provides product information to potential customers.',
    status: 'draft' as const,
    lastUpdated: '1 day ago',
    conversations: 0,
    accuracy: 0
  },
  {
    id: '3',
    name: 'FAQ Helper',
    description: 'Answers frequently asked questions about pricing, features, and policies.',
    status: 'live' as const,
    lastUpdated: '3 days ago',
    conversations: 456,
    accuracy: 97
  },
  {
    id: '4',
    name: 'Technical Support',
    description: 'Provides technical assistance and troubleshooting for advanced users.',
    status: 'live' as const,
    lastUpdated: '1 week ago',
    conversations: 89,
    accuracy: 91
  }
];