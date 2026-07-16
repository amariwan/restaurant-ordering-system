'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
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
      <Card className='border-0 ring-1 ring-border shadow-sm'>
        <CardContent className='flex flex-col items-center py-16 text-center'>
          <div className='rounded-full bg-muted p-4 mb-4'>
            <IconShoppingCart className='w-10 h-10 text-muted-foreground/40' />
          </div>
          <p className='text-muted-foreground font-medium mb-6'>{t.cart.empty}</p>
          <Button asChild>
            <Link href='/menu'>{t.cart.addItems}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const grandTotal = total();

  return (
    <div className='space-y-5'>
      <Card className='border-0 ring-1 ring-border shadow-sm overflow-hidden'>
        <div className='rounded-t-lg bg-gradient-to-r from-primary/5 to-transparent px-6 py-3 border-b border-border/50'>
          <h3 className='text-sm font-semibold text-foreground/70 uppercase tracking-wide'>
            {t.orders.items} · {items.length}
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/20'>
              <TableHead className='font-semibold text-foreground/70'>{t.orders.items}</TableHead>
              <TableHead className='w-36 text-center font-semibold text-foreground/70'>Qty</TableHead>
              <TableHead className='w-28 text-right font-semibold text-foreground/70'>{t.menu.price}</TableHead>
              <TableHead className='w-32 text-right font-semibold text-foreground/70'>Subtotal</TableHead>
              <TableHead className='w-16' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.menuItemId} className='border-b border-border/30'>
                <TableCell className='font-medium'>
                  <div className='flex flex-col gap-1'>
                    <span>{locale === 'ku' ? item.menuItemNameKu : item.menuItemName}</span>
                    <Input
                      className='h-7 w-full text-xs bg-muted/30 border-0 ring-1 ring-border/50'
                      placeholder='Add note...'
                      value={item.note ?? ''}
                      onChange={(e) =>
                        useCartStore.getState().updateNote(item.menuItemId, e.target.value)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex items-center justify-center gap-1.5'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8 rounded-lg'
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                    >
                      <IconMinus className='w-3 h-3' />
                    </Button>
                    <span className='w-8 text-center font-semibold tabular-nums'>{item.quantity}</span>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8 rounded-lg'
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                    >
                      <IconPlus className='w-3 h-3' />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className='text-right tabular-nums'>{formatCurrency(item.price)}</TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>
                  {formatCurrency(item.price * item.quantity)}
                </TableCell>
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10'
                    onClick={() => removeItem(item.menuItemId)}
                  >
                    <IconTrash className='w-3.5 h-3.5' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className='border-0 ring-1 ring-border shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>{t.orders.title}</CardTitle>
          <CardDescription>{t.cart.selectTable}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg bg-muted/30 ring-1 ring-border/50 p-4'>
            <label className='text-sm font-medium text-foreground/70 block mb-1.5'>{t.orders.table}</label>
            <Input
              type='number'
              min={1}
              placeholder='e.g. 5'
              value={tableId ?? ''}
              onChange={(e) => setTableId(e.target.value ? Number(e.target.value) : null)}
              className='bg-background'
            />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/50'>
          <div className='flex items-baseline gap-2'>
            <span className='text-base font-medium text-muted-foreground'>{t.cart.total}:</span>
            <span className='text-2xl font-bold tracking-tight tabular-nums text-primary'>{formatCurrency(grandTotal)}</span>
          </div>
          <Button
            size='lg'
            disabled={!tableId}
            isLoading={mutation.isPending}
            className='min-w-40 shadow-sm'
            onClick={() => {
              if (!tableId) {
                toast.error(t.cart.noTableSelected);
                return;
              }
              const cart = useCartStore.getState();
              mutation.mutate(
                {
                  tableId: Number(tableId),
                  items: cart.items.map((i) => ({
                    menuItemId: i.menuItemId,
                    quantity: i.quantity,
                    note: i.note ?? ''
                  }))
                },
                {
                  onSuccess: (order) => {
                    clear();
                    toast.success(t.cart.orderCreated);
                    router.push(`/orders/${order.id}`);
                  },
                  onError: () => toast.error(t.common.failed)
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
