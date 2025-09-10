import { Playground } from '../Playground';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const AgentPlayground = ({ agent }: { agent: any }) => {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Floating sidebar trigger */}
      <div className="fixed top-4 left-4 z-60">
        <SidebarTrigger asChild>
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm border shadow-lg">
            <Menu className="h-4 w-4" />
          </Button>
        </SidebarTrigger>
      </div>
      <Playground />
    </div>
  );
};