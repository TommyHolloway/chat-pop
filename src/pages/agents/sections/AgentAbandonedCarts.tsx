import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAbandonedCarts, AbandonedCart } from '@/hooks/useAbandonedCarts';
import { usePlanEnforcement } from '@/hooks/usePlanEnforcement';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, Send, Search, Package, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentAbandonedCartsProps {
  agent: any;
}

export const AgentAbandonedCarts = ({ agent }: AgentAbandonedCartsProps) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'recovery_sent' | 'recovered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [selectedCarts, setSelectedCarts] = useState<Set<string>>(new Set());

  const { carts, loading, sendRecoveryMessage } = useAbandonedCarts(agent.id, {
    status: statusFilter,
    searchQuery,
  });

  const { limits, usage, canUseCartRecovery } = usePlanEnforcement();

  const getStatusBadge = (cart: AbandonedCart) => {
    if (cart.recovered) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Recovered</Badge>;
    }
    if (cart.recovery_attempted) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Recovery Sent</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Abandoned Carts</h2>
        <p className="text-muted-foreground">Manage and recover abandoned shopping carts</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by session ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carts</SelectItem>
                <SelectItem value="pending">Pending Recovery</SelectItem>
                <SelectItem value="recovery_sent">Recovery Sent</SelectItem>
                <SelectItem value="recovered">Recovered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCarts.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedCarts.size} cart{selectedCarts.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCarts(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                disabled={!canUseCartRecovery}
                onClick={async () => {
                  for (const cartId of selectedCarts) {
                    const cart = carts.find(c => c.id === cartId);
                    if (cart) await sendRecoveryMessage(cart);
                  }
                  setSelectedCarts(new Set());
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Recovery to Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cart Overview</CardTitle>
          <CardDescription>
            {carts.length} abandoned cart{carts.length !== 1 ? 's' : ''} found • {usage.currentCartRecovery}/{limits.cartRecovery === -1 ? '∞' : limits.cartRecovery} recovery attempts used this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No abandoned carts</h3>
              <p className="text-muted-foreground text-sm">
                {statusFilter === 'all' 
                  ? "When customers abandon their carts, they'll appear here."
                  : "No carts match the selected filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={carts.length > 0 && selectedCarts.size === carts.filter(c => !c.recovered && !c.recovery_attempted).length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCarts(new Set(carts.filter(c => !c.recovered && !c.recovery_attempted).map(c => c.id)));
                          } else {
                            setSelectedCarts(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carts.map((cart) => (
                    <TableRow 
                      key={cart.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCart(cart)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {!cart.recovered && !cart.recovery_attempted && (
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={selectedCarts.has(cart.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedCarts);
                              if (e.target.checked) {
                                newSelected.add(cart.id);
                              } else {
                                newSelected.delete(cart.id);
                              }
                              setSelectedCarts(newSelected);
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {cart.session_id.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {cart.cart_items?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(cart.cart_total, cart.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(cart)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(cart.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!cart.recovered && !cart.recovery_attempted && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canUseCartRecovery}
                            onClick={(e) => {
                              e.stopPropagation();
                              sendRecoveryMessage(cart);
                            }}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send Recovery
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart Detail Dialog */}
      <Dialog open={!!selectedCart} onOpenChange={(open) => !open && setSelectedCart(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cart Details</DialogTitle>
            <DialogDescription>
              Session: {selectedCart?.session_id}
            </DialogDescription>
          </DialogHeader>

          {selectedCart && (
            <div className="space-y-6">
              {/* Status and Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getStatusBadge(selectedCart)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Cart Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedCart.cart_total, selectedCart.currency)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cart Items ({selectedCart.cart_items?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCart.cart_items && selectedCart.cart_items.length > 0 ? (
                      selectedCart.cart_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-start border-b pb-3 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{item.title || item.product_title || 'Unknown Product'}</p>
                            {item.variant_title && (
                              <p className="text-sm text-muted-foreground">{item.variant_title}</p>
                            )}
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency((item.price || 0) / 100, selectedCart.currency)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No item details available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recovery Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Cart Abandoned</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedCart.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {selectedCart.recovery_message_sent_at && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-muted p-2">
                          <Send className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Recovery Message Sent</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedCart.recovery_message_sent_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedCart.recovered_at && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-green-500 p-2">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Cart Recovered</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedCart.recovered_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {!selectedCart.recovered && !selectedCart.recovery_attempted && (
                <Button
                  className="w-full"
                  disabled={!canUseCartRecovery}
                  onClick={() => {
                    sendRecoveryMessage(selectedCart);
                    setSelectedCart(null);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Recovery Message
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
