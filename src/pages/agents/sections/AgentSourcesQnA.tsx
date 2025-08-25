import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, MessageCircleQuestion, Trash2, Edit2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QnAPair {
  id: string;
  question: string;
  answer: string;
}

export const AgentSourcesQnA = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [qnaPairs, setQnaPairs] = useState<QnAPair[]>([]); // TODO: Fetch from backend
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Error",
        description: "Please provide both question and answer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement Q&A saving
      const newQnA: QnAPair = {
        id: Date.now().toString(),
        question: question.trim(),
        answer: answer.trim(),
      };
      
      setQnaPairs(prev => [...prev, newQnA]);
      setQuestion('');
      setAnswer('');
      
      toast({
        title: "Success",
        description: "Q&A pair saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Q&A pair",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (qnaId: string) => {
    setQnaPairs(prev => prev.filter(qna => qna.id !== qnaId));
    toast({
      title: "Success",
      description: "Q&A pair deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Q&A Knowledge</h2>
        <p className="text-muted-foreground">Add specific question and answer pairs to train your agent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5" />
            Add Q&A Pair
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What question might users ask?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="How should your agent respond to this question?"
              rows={6}
            />
          </div>
          <Button onClick={handleSave} disabled={loading || !question.trim() || !answer.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Add Q&A Pair'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Q&A Pairs</CardTitle>
        </CardHeader>
        <CardContent>
          {qnaPairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircleQuestion className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No Q&A pairs added yet</p>
              <p className="text-sm">Add your first question and answer to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qnaPairs.map((qna) => (
                <div key={qna.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-sm text-muted-foreground">QUESTION</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(qna.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(qna.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mb-4">{qna.question}</p>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ANSWER</h4>
                  <p className="text-sm">{qna.answer}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};