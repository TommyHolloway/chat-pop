import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Save, FileText, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentTextKnowledge } from '@/hooks/useAgentTextKnowledge';

export const AgentSourcesText = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { textKnowledge, loading: dataLoading, createTextKnowledge, deleteTextKnowledge } = useAgentTextKnowledge(id);
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!textContent.trim() || !title.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setSaving(true);
    try {
      await createTextKnowledge({
        agent_id: id!,
        title: title.trim(),
        content: textContent.trim(),
      });
      setTextContent('');
      setTitle('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (textId: string) => {
    await deleteTextKnowledge(textId);
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
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Company Policies, Product Information"
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
          <Button onClick={handleSave} disabled={saving || !textContent.trim() || !title.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Text Content'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Text Knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : textKnowledge.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No text content added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {textKnowledge.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{item.title}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};