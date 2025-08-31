import { format } from 'date-fns';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/hooks/useUserManagement';

interface UserTableRowProps {
  user: User;
  onUserAction: (user: User, action: string) => void;
}

export function UserTableRow({ user, onUserAction }: UserTableRowProps) {
  const getStatusBadge = (user: User) => {
    if (!user.email_confirmed_at) {
      return <Badge variant="secondary">Unconfirmed</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium">{user.email}</TableCell>
      <TableCell>{user.display_name || '-'}</TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {user.plan === 'standard' ? 'Pro' : user.plan}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>{getStatusBadge(user)}</TableCell>
      <TableCell>
        {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : '-'}
      </TableCell>
      <TableCell>
        {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM dd, yyyy') : 'Never'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onUserAction(user, 'edit')}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}