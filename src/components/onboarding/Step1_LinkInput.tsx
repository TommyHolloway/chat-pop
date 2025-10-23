import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, ShoppingBag, Bot, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Step1Props {
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  useCase: 'general' | 'customer_support' | 'sales';
  setUseCase: (useCase: 'general' | 'customer_support' | 'sales') => void;
  onNext: () => void;
}

const isValidUrl = (url: string) => {
  if (!url) return false;
  // Remove protocol if present
  const cleanUrl = url.replace(/^https?:\/\//, '');
  // Basic domain validation
  return /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}/.test(cleanUrl);
};

export const Step1_LinkInput = ({ websiteUrl, setWebsiteUrl, useCase, setUseCase, onNext }: Step1Props) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Let's start with a link</h1>
        <p className="text-muted-foreground text-lg">
          Share your website link, and we'll automatically build an AI shopping assistant trained on your content.
        </p>
      </div>
      
      <Card className="border-2">
        <CardContent className="pt-6 space-y-5">
          <div>
            <Label className="text-base">Your website URL</Label>
            <div className="flex gap-2 mt-2">
              <Select value="https://" disabled>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
              </Select>
              <Input
                placeholder="yourstore.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="text-lg"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-base">What's your main use case?</Label>
            <Select value={useCase} onValueChange={setUseCase}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_support">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Customer support (answer questions, provide help)
                  </div>
                </SelectItem>
                <SelectItem value="sales">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Sales & e-commerce (recommend products, recover carts)
                  </div>
                </SelectItem>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    General AI agent (flexible assistant)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={onNext}
            disabled={!isValidUrl(websiteUrl)}
            className="w-full"
            size="lg"
          >
            Set up using my URL
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => navigate('/agents/new')}
            className="w-full"
          >
            I'll set up manually instead
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
