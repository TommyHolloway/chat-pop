import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Image, Palette, Globe, Sparkles, Check, Loader2, Database } from 'lucide-react';

interface Step2Props {
  websiteUrl: string;
  progressState: {
    logo: 'pending' | 'processing' | 'completed';
    brandColor: 'pending' | 'processing' | 'completed';
    links: 'pending' | 'processing' | 'completed';
    prompt: 'pending' | 'processing' | 'completed';
    knowledgeBase: 'pending' | 'processing' | 'completed';
  };
  crawlProgress?: { pagesProcessed: number; pagesFound: number };
}

const ProgressItem = ({ icon, label, status, progressText }: {
  icon: React.ReactNode;
  label: string;
  status: 'pending' | 'processing' | 'completed';
  progressText?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <span className="font-medium">{label}</span>
      {progressText && (
        <span className="text-sm text-muted-foreground ml-2">
          {progressText}
        </span>
      )}
    </div>
    {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
    {status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
    {status === 'completed' && <Check className="h-4 w-4 text-green-600" />}
  </div>
);

export const Step2_CrawlingProgress = ({ websiteUrl, progressState, crawlProgress }: Step2Props) => {
  // Calculate progress text for knowledge base
  const knowledgeBaseProgressText = crawlProgress && crawlProgress.pagesFound > 0
    ? `${crawlProgress.pagesProcessed}/${crawlProgress.pagesFound} pages`
    : undefined;

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
    {/* Left: Progress Indicators */}
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Analyzing your site</h2>
        <p className="text-muted-foreground text-lg mt-2">
          We're automatically extracting your brand details to personalize your AI assistant.
        </p>
      </div>
      
      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <ProgressItem
            icon={<Image className="h-5 w-5" />}
            label="Fetching logo"
            status={progressState.logo}
          />
          <Separator />
          <ProgressItem
            icon={<Palette className="h-5 w-5" />}
            label="Extracting brand color"
            status={progressState.brandColor}
          />
          <Separator />
          <ProgressItem
            icon={<Globe className="h-5 w-5" />}
            label="Crawling site links"
            status={progressState.links}
          />
          <Separator />
          <ProgressItem
            icon={<Sparkles className="h-5 w-5" />}
            label="Generating AI instructions"
            status={progressState.prompt}
          />
          <Separator />
          <ProgressItem
            icon={<Database className="h-5 w-5" />}
            label="Building knowledge base"
            status={progressState.knowledgeBase}
            progressText={knowledgeBaseProgressText}
          />
        </CardContent>
      </Card>
    </div>
    
    {/* Right: Live Website Card */}
    <div className="flex items-center justify-center">
      <Card className="w-full border-2 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Globe className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{websiteUrl}</span>
            {progressState.links === "completed" && (
              <Check className="h-4 w-4 text-green-600 ml-auto" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  );
};
