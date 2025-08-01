import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useStreamingChat } from '@/hooks/useStreamingChat';
import { Loader2, TestTube2, MessageSquare, Database, Zap } from 'lucide-react';

interface AgentTestSuiteProps {
  agentId: string;
  agentName: string;
}

export const AgentTestSuite: React.FC<AgentTestSuiteProps> = ({ 
  agentId, 
  agentName 
}) => {
  const [testQuery, setTestQuery] = useState('');
  const [cacheStats, setCacheStats] = useState<{ hits: number; total: number } | null>(null);
  const [knowledgeStats, setKnowledgeStats] = useState<{ chunks: number; files: number } | null>(null);
  const [isTestingCache, setIsTestingCache] = useState(false);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  
  const { toast } = useToast();
  const { messages, isLoading, sendMessage, initializeChat } = useStreamingChat(agentId);

  const fetchKnowledgeStats = async () => {
    setIsFetchingStats(true);
    try {
      const { data: chunks } = await supabase
        .from('agent_knowledge_chunks')
        .select('id')
        .eq('agent_id', agentId);

      const { data: files } = await supabase
        .from('knowledge_files')
        .select('id')
        .eq('agent_id', agentId);

      setKnowledgeStats({
        chunks: chunks?.length || 0,
        files: files?.length || 0
      });
    } catch (error) {
      console.error('Error fetching knowledge stats:', error);
    } finally {
      setIsFetchingStats(false);
    }
  };

  const testCaching = async () => {
    if (!testQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test query first",
        variant: "destructive"
      });
      return;
    }

    setIsTestingCache(true);
    try {
      // First request (should not be cached)
      const start1 = Date.now();
      await sendMessage(testQuery, false); // Disable streaming for cache test
      const time1 = Date.now() - start1;

      // Wait a moment, then make the same request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const start2 = Date.now();
      await sendMessage(testQuery, false);
      const time2 = Date.now() - start2;

      const isCacheHit = time2 < time1 * 0.5; // If second request is significantly faster
      
      setCacheStats({
        hits: isCacheHit ? 1 : 0,
        total: 2
      });

      toast({
        title: "Cache Test Complete",
        description: `First request: ${time1}ms, Second request: ${time2}ms ${isCacheHit ? '(Cache Hit!)' : '(No cache)'}`,
      });

    } catch (error) {
      console.error('Cache test failed:', error);
      toast({
        title: "Cache Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingCache(false);
    }
  };

  const startChatTest = async () => {
    await initializeChat();
    toast({
      title: "Chat Initialized",
      description: "You can now test streaming responses",
    });
  };

  React.useEffect(() => {
    fetchKnowledgeStats();
  }, [agentId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Agent Test Suite - {agentName}
          </CardTitle>
          <CardDescription>
            Test and verify all agent enhancements are working correctly
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Knowledge Base Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Knowledge Base Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {isFetchingStats ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : knowledgeStats?.chunks || 0}
              </div>
              <div className="text-sm text-muted-foreground">Knowledge Chunks</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {isFetchingStats ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : knowledgeStats?.files || 0}
              </div>
              <div className="text-sm text-muted-foreground">Source Files</div>
            </div>
          </div>
          <Button onClick={fetchKnowledgeStats} variant="outline" className="w-full">
            Refresh Stats
          </Button>
        </CardContent>
      </Card>


      {/* Cache Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cache Performance Test
          </CardTitle>
          <CardDescription>
            Test the caching system with duplicate queries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter a test query to check caching performance..."
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            rows={3}
          />
          {cacheStats && (
            <div className="flex gap-2">
              <Badge variant="outline">
                Cache Hits: {cacheStats.hits}/{cacheStats.total}
              </Badge>
              <Badge variant={cacheStats.hits > 0 ? "default" : "destructive"}>
                {cacheStats.hits > 0 ? "Cache Working!" : "No Cache"}
              </Badge>
            </div>
          )}
          <Button 
            onClick={testCaching}
            disabled={isTestingCache || !testQuery.trim()}
            className="w-full"
          >
            {isTestingCache ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Cache Performance
          </Button>
        </CardContent>
      </Card>

      {/* Streaming Chat Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Streaming Chat Test
          </CardTitle>
          <CardDescription>
            Test real-time streaming responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <Button onClick={startChatTest} className="w-full">
              Initialize Streaming Chat
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2 p-4 border rounded">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs p-2 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      {message.isStreaming && (
                        <div className="text-xs opacity-70 mt-1">Streaming...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message to test streaming..."
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading && testQuery.trim()) {
                      sendMessage(testQuery);
                      setTestQuery('');
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    if (testQuery.trim()) {
                      sendMessage(testQuery);
                      setTestQuery('');
                    }
                  }}
                  disabled={isLoading || !testQuery.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};