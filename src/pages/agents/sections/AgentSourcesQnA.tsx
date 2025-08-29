import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, MessageCircleQuestion, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAgentQnAKnowledge } from '@/hooks/useAgentQnAKnowledge';

interface QnAPair {
  id: string;
  question: string;
  answer: string;
}

export const AgentSourcesQnA = ({ agent }: { agent: any }) => {
  const { id } = useParams();
  const { qnaKnowledge, loading: dataLoading, createQnAKnowledge, deleteQnAKnowledge } = useAgentQnAKnowledge(id);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Please provide both question and answer");
      return;
    }

    setSaving(true);
    try {
      await createQnAKnowledge({
        agent_id: id!,
        question: question.trim(),
        answer: answer.trim(),
      });
      setQuestion('');
      setAnswer('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qnaId: string) => {
    await deleteQnAKnowledge(qnaId);
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
          <Button onClick={handleSave} disabled={saving || !question.trim() || !answer.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Add Q&A Pair'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Q&A Pairs</CardTitle>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : qnaKnowledge.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircleQuestion className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No Q&A pairs added yet</p>
              <p className="text-sm">Add your first question and answer to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qnaKnowledge.map((qna) => (
                <div key={qna.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-sm text-muted-foreground">QUESTION</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(qna.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mb-4">{qna.question}</p>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">ANSWER</h4>
                  <p className="text-sm">{qna.answer}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(qna.created_at).toLocaleDateString()}
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