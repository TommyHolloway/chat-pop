import { Playground } from '../Playground';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export const AgentPlayground = ({ agent }: { agent: any }) => {
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Floating menu button for sidebar access */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 shadow-lg"
      >
        <Menu className="h-4 w-4" />
      </Button>
      
      <Playground />
    </div>
  );
};