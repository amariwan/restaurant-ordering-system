'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';
import { IconMinus, IconPlus, IconTrash, IconShoppingCart } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/features/restaurant/lib/cart-store';
import Link from 'next/link';
import { useOrdersCreateMutation } from '@/features/restaurant/api/queries';
import { useI18n } from '@/lib/i18n/context';

export function CartPage() {
  const { items, tableId, removeItem, updateQuantity, clear, total, setTableId } = useCartStore();
  const router = useRouter();
  const toast = useToast();
  const mutation = useOrdersCreateMutation();
  const { t, locale } = useI18n();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <IconShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <div className="text-muted-foreground mb-4">{t.cart.empty}</div>
          <Button>
            <Link href="/menu">{t.cart.addItems}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const grandTotal = total();

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.orders.items}</TableHead>
              <TableHead className="w-32 text-center">Qty</TableHead>
              <TableHead className="w-28 text-right">{t.menu.price}</TableHead>
              <TableHead className="w-32 text-right">Subtotal</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.menuItemId}>
                <TableCell className="font-medium">
                  <div>{locale === 'ku' ? item.menuItemNameKu : item.menuItemName}</div>
                  <Input
                    className="mt-1 h-7 w-full text-xs"
                    placeholder="Add note..."
                    value={item.note ?? ''}
                    onChange={(e) => useCartStore.getState().updateNote(item.menuItemId, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.menuItemId, -1)}>
                      <IconMinus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.menuItemId, 1)}>
                      <IconPlus className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency((item.price * item.quantity))}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.menuItemId)}>
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.orders.title}</CardTitle>
          <CardDescription>{t.cart.selectTable}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t.orders.table}</label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 5"
              value={tableId ?? ''}
              onChange={(e) => setTableId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
          <div className="text-lg font-semibold">{t.cart.total}: {formatCurrency(grandTotal)}</div>
          <Button
            size="lg"
            disabled={!tableId}
            isLoading={mutation.isPending}
            onClick={() => {
              if (!tableId) {
                toast.error(t.cart.noTableSelected);
                return;
              }
              const cart = useCartStore.getState();
              mutation.mutate(
                {
                  tableId: Number(tableId),
                  items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity, note: i.note ?? '' })),
                },
                {
                  onSuccess: (order) => {
                    clear();
                    toast.success(t.cart.orderCreated);
                    router.push(`/orders/${order.id}`);
                  },
                  onError: () => toast.error(t.common.failed),
                }
              );
            }}
          >
            {t.cart.placeOrder}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
