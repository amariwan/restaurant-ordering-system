'use client';

import { useEffect } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import LocalDate from '@/components/ui/local-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/sonner';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  ordersDetailOptions,
  useOrdersUpdateStatusMutation,
  paymentsByOrderOptions,
  usePaymentsCreateMutation,
  useOrdersRemoveItemMutation,
  useReceiptsGenerateMutation,
  keys
} from '@/features/restaurant/api/queries';
import { parseRole } from '@/features/restaurant/lib/auth-store';
import { formatCurrency } from '@/lib/format';
import { statusVariant, STATUS_FLOW } from '@/features/restaurant/lib/order-status';
import { getOrderHub, startOrderHub, OrderStatus } from '@/features/restaurant/lib/signalr-store';
import { useI18n } from '@/lib/i18n/context';
import { ReceiptView } from '@/features/restaurant/components/receipt-view';

export function OrderDetail() {
  const params = useParams();
  const orderId = Number(params.id);
  const { data: order } = useSuspenseQuery(ordersDetailOptions(orderId));
  const { data: payments } = useSuspenseQuery(paymentsByOrderOptions(orderId));
  const qc = useQueryClient();
  const updateMutation = useOrdersUpdateStatusMutation();
  const payMutation = usePaymentsCreateMutation();
  const removeItemMutation = useOrdersRemoveItemMutation();
  const generateReceiptMutation = useReceiptsGenerateMutation();
  const toast = useToast();
  const role = parseRole();
  const { t, locale } = useI18n();
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card'>('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    id: number;
    receiptNumber: string;
    orderId: number;
    tableNumber: number;
    totalAmount: number;
    paidAmount: number;
    taxAmount: number;
    tipAmount: number;
    paymentMethods: string;
    generatedAt: string;
    items: Array<{ name: string; nameKu: string; quantity: number; price: number; total: number }>;
  } | null>(null);

  useEffect(() => {
    if (!role) return;

    const hub = getOrderHub();

    const onStatus = (_payload: { orderId: number; status: OrderStatus }) => {
      qc.invalidateQueries({ queryKey: keys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: keys.orders.all });
    };

    hub.on('OrderStatusChanged', onStatus);
    Promise.resolve(startOrderHub()).catch(() => {});

    return () => {
      hub.off('OrderStatusChanged', onStatus);
    };
  }, [qc, orderId, role]);

  const statusIdx = STATUS_FLOW.indexOf(order.status);
  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - paidTotal;

  return (
    <div className='space-y-6'>
      <Link
        href={role ? '/orders' : '/menu'}
        className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
      >
        <Icons.chevronLeft className='w-4 h-4' /> {role ? t.nav.orders : t.nav.menu}
      </Link>

      {/* Header */}
      <Card className='border-0 ring-1 ring-border shadow-sm'>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {t.orders.orderNumber}{order.id}
                </h1>
                <Badge variant={statusVariant(order.status) ?? 'default'} className='capitalize shadow-xs'>
                  {t.orders.status[order.status]}
                </Badge>
              </div>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span className='inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md'>
                  <Icons.table className='w-3.5 h-3.5' /> {t.orders.table} {order.tableNumber}
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <Icons.clock className='w-3.5 h-3.5' /> <LocalDate value={order.createdAt} />
                </span>
              </div>
            </div>
            <div className='text-right bg-muted/30 rounded-xl px-5 py-3 ring-1 ring-border/50'>
              <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>{t.orders.remaining}</div>
              <div className='text-2xl font-bold tracking-tight tabular-nums'>{formatCurrency(remaining)}</div>
            </div>
          </div>

          {/* Progress steps */}
          <div className='mt-8 flex gap-0'>
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className='flex-1 flex items-center'>
                <div className='flex flex-col items-center'>
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      i < statusIdx
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : i === statusIdx
                          ? 'bg-primary/15 text-primary ring-2 ring-primary/40 shadow-xs'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < statusIdx ? <Icons.circleCheck className='w-4 h-4' /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-medium ${i <= statusIdx ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {t.orders.status[s]}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mt-4 mx-1 rounded-full ${i < statusIdx ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex flex-wrap gap-2'>
        {role === 'Kitchen' && (
          <>
            {order.status === 'pending' && (
              <Button
                size='sm'
                disabled={updateMutation.isPending}
                onClick={() => {
                  updateMutation.mutate({ id: order.id, data: { status: 'preparing' } });
                  toast.success(
                    `${t.orders.orderNumber}${order.id} — ${t.orders.status.preparing}`
                  );
                }}
              >
                <Icons.clock className='mr-1 w-4 h-4' /> {t.orders.startPreparing}
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button
                size='sm'
                disabled={updateMutation.isPending}
                onClick={() => {
                  updateMutation.mutate({ id: order.id, data: { status: 'ready' } });
                  toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.ready}`);
                }}
              >
                <Icons.circleCheck className='mr-1 w-4 h-4' /> {t.orders.markReady}
              </Button>
            )}
          </>
        )}
        {(role === 'Waiter' || role === 'Admin') && order.status === 'ready' && (
          <Button
            size='sm'
            variant='default'
            disabled={updateMutation.isPending}
            onClick={() => {
              updateMutation.mutate({ id: order.id, data: { status: 'served' } });
              toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.served}`);
            }}
          >
            <Icons.circleCheck className='mr-1 w-4 h-4' /> {t.orders.markServed}
          </Button>
        )}
        {(role === 'Waiter' || role === 'Admin') &&
          order.status !== 'cancelled' &&
          order.status !== 'served' && (
            <Button
              size='sm'
              variant='destructive'
              disabled={updateMutation.isPending}
              onClick={() => {
                updateMutation.mutate({ id: order.id, data: { status: 'cancelled' } });
                toast.error(`${t.orders.orderNumber}${order.id} — ${t.orders.status.cancelled}`);
              }}
            >
              <Icons.close className='mr-1 w-4 h-4' /> {t.orders.cancelOrder}
            </Button>
          )}
      </div>

      {/* Items */}
      <Card className='border-0 ring-1 ring-border shadow-sm overflow-hidden'>
        <CardHeader className='border-b border-border/50 bg-muted/20'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <div className='rounded-lg bg-primary/10 p-1.5'>
              <Icons.post className='w-4 h-4 text-primary' />
            </div>
            {t.orders.items}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/30'>
                <TableHead className='font-semibold text-foreground/70'>{t.orders.items}</TableHead>
                <TableHead className='w-24 text-center font-semibold text-foreground/70'>{t.cart.qty}</TableHead>
                <TableHead className='w-28 text-right font-semibold text-foreground/70'>{t.menu.price}</TableHead>
                <TableHead className='w-32 text-right font-semibold text-foreground/70'>{t.cart.subtotal}</TableHead>
                {(role === 'Waiter' || role === 'Admin') &&
                  order.status !== 'served' &&
                  order.status !== 'cancelled' && <TableHead className='w-16' />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id} className='border-b border-border/30'>
                  <TableCell className='font-medium'>
                    <div className='flex flex-col'>
                      <span>{locale === 'ku' && item.menuItemNameKu ? item.menuItemNameKu : item.menuItemName}</span>
                      {item.note && (
                        <span className='text-xs text-muted-foreground/70 italic mt-0.5'>{item.note}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='text-center tabular-nums'>{item.quantity}</TableCell>
                  <TableCell className='text-right tabular-nums'>{formatCurrency(item.price)}</TableCell>
                  <TableCell className='text-right font-semibold tabular-nums'>
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                  {(role === 'Waiter' || role === 'Admin') &&
                    order.status !== 'served' &&
                    order.status !== 'cancelled' && (
                      <TableCell>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10'
                          disabled={removeItemMutation.isPending}
                          onClick={() => {
                            removeItemMutation.mutate(
                              { orderId: order.id, itemId: item.id },
                              {
                                onSuccess: () => toast.success(t.orders.itemRemoved),
                                onError: () => toast.error(t.orders.failedRemoveItem)
                              }
                            );
                          }}
                        >
                          <Icons.trash className='w-3.5 h-3.5' />
                        </Button>
                      </TableCell>
                    )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className='flex justify-end px-6 py-4 bg-gradient-to-r from-transparent via-muted/30 to-muted/50'>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium text-muted-foreground'>{t.orders.total}:</span>
              <span className='text-xl font-bold tracking-tight tabular-nums'>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className='border-0 ring-1 ring-border shadow-sm'>
        <CardHeader className='border-b border-border/50 bg-muted/20'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <div className='rounded-lg bg-green-100 p-1.5'>
              <Icons.creditCard className='w-4 h-4 text-green-600' />
            </div>
            {t.orders.payment}
            <span className='text-sm font-normal text-muted-foreground/70 ml-1'>
              {formatCurrency(paidTotal)} / {formatCurrency(total)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 pt-5'>
          {payments.length > 0 && (
            <div className='rounded-lg border border-border/50 overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/20'>
                    <TableHead className='font-semibold text-foreground/70'>{t.orders.amount}</TableHead>
                    <TableHead className='font-semibold text-foreground/70'>{t.orders.method}</TableHead>
                    <TableHead className='font-semibold text-foreground/70'>{t.orders.date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className='font-medium tabular-nums'>{formatCurrency(p.amount)}</TableCell>
                      <TableCell className='capitalize'>
                        <span className='inline-flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md text-xs font-medium'>
                          {p.method === 'cash' ? t.orders.cash : t.orders.card}
                        </span>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        <LocalDate value={p.paidAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {remaining > 0.01 && order.status !== 'cancelled' && order.status !== 'served' && (
            <>
              <Separator />
              <div className='rounded-lg bg-muted/20 p-4 ring-1 ring-border/50'>
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-sm font-semibold'>{t.orders.addPayment}</span>
                  <span className='text-sm text-muted-foreground tabular-nums'>{t.orders.remaining}: {formatCurrency(remaining)}</span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!payAmount) return;
                    payMutation.mutate(
                      { orderId, data: { amount: parseFloat(payAmount), method: payMethod } },
                      {
                        onSuccess: () => {
                          setPayAmount('');
                          toast.success(t.orders.paymentRecorded);
                        },
                        onError: () => toast.error(t.orders.paymentFailed)
                      }
                    );
                  }}
                  className='flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3'
                >
                  <div className='flex-1'>
                    <Input
                      type='number'
                      step='0.01'
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                      placeholder={`Max ${formatCurrency(remaining)}`}
                    />
                  </div>
                  <div className='w-full sm:w-36'>
                    <Select
                      value={payMethod}
                      onValueChange={(v) => setPayMethod(v as 'cash' | 'card')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='cash'>{t.orders.cash}</SelectItem>
                        <SelectItem value='card'>{t.orders.card}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type='submit' disabled={payMutation.isPending} className='w-full sm:w-auto'>
                    {t.orders.addPayment}
                  </Button>
                </form>
              </div>
            </>
          )}

          {remaining <= 0.01 && (
            <div className='flex items-center gap-2 text-sm py-2'>
              <div className='rounded-full bg-green-100 p-1'>
                <Icons.circleCheck className='w-3.5 h-3.5 text-green-600' />
              </div>
              <span className='font-medium text-green-700'>{t.orders.fullyPaid}</span>
            </div>
          )}

          {(remaining <= 0.01 || payments.length > 0) && (
            <>
              <Separator />
              <Button
                size='sm'
                variant='outline'
                disabled={generateReceiptMutation.isPending}
                onClick={async () => {
                  try {
                    const receipt = await generateReceiptMutation.mutateAsync(orderId);
                    setReceiptData(receipt);
                    setShowReceipt(true);
                    toast.success(t.receipt.generated);
                  } catch {
                    toast.error(t.receipt.generateFailed);
                  }
                }}
                className='w-full'
              >
                <Icons.receipt className='w-4 h-4 mr-2' />
                {generateReceiptMutation.isPending ? t.common.loading : t.receipt.generateReceipt}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {showReceipt && receiptData && (
        <ReceiptView
          receipt={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
