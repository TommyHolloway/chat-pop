import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ConversationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filter: 'all' | 'active' | 'resolved' | 'needs_attention';
  onFilterChange: (filter: 'all' | 'active' | 'resolved' | 'needs_attention') => void;
}

export function ConversationFilters({ 
  searchTerm, 
  onSearchChange, 
  filter, 
  onFilterChange 
}: ConversationFiltersProps) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('resolved')}
        >
          Resolved
        </Button>
        <Button
          variant={filter === 'needs_attention' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('needs_attention')}
        >
          Needs Attention
        </Button>
      </div>
    </div>
  );
}