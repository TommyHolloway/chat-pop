import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Save, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const AgentSourcesText = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!textContent.trim() || !title.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement text knowledge saving
      toast({
        title: "Success",
        description: "Text content saved successfully",
      });
      setTextContent('');
      setTitle('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save text content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Text Knowledge</h2>
        <p className="text-muted-foreground">Add custom text content to your agent's knowledge base</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Text Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Company Policies, Product Information"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter the text content that your agent should know about..."
              rows={12}
            />
          </div>
          <Button onClick={handleSave} disabled={loading || !textContent.trim() || !title.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Text Content'}
          </Button>
        </CardContent>
      </Card>

      {/* TODO: Add list of existing text knowledge items */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Text Knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No text content added yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};