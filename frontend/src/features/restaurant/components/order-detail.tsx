'use client';

import { useEffect } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import LocalDate from '@/components/ui/local-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/sonner';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ordersDetailOptions, useOrdersUpdateStatusMutation, paymentsByOrderOptions, usePaymentsCreateMutation, useOrdersRemoveItemMutation, keys } from '@/features/restaurant/api/queries';
import { parseRole } from '@/features/restaurant/lib/auth-store';
import { formatCurrency } from '@/lib/format';
import { statusVariant, STATUS_FLOW } from '@/features/restaurant/lib/order-status';
import { getOrderHub, startOrderHub, OrderStatus } from '@/features/restaurant/lib/signalr-store';
import { useI18n } from '@/lib/i18n/context';

export function OrderDetail() {
  const params = useParams();
  const orderId = Number(params.id);
  const { data: order } = useSuspenseQuery(ordersDetailOptions(orderId));
  const { data: payments } = useSuspenseQuery(paymentsByOrderOptions(orderId));
  const qc = useQueryClient();
  const updateMutation = useOrdersUpdateStatusMutation();
  const payMutation = usePaymentsCreateMutation();
  const removeItemMutation = useOrdersRemoveItemMutation();
  const toast = useToast();
  const role = parseRole();
  const { t, locale } = useI18n();
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card'>('cash');

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
    <div className="space-y-6">
      <Link href={role ? '/orders' : '/menu'} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <Icons.chevronLeft className="w-4 h-4" /> {role ? t.nav.orders : t.nav.menu}
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold">{t.orders.orderNumber}{order.id}</h1>
                <Badge variant={statusVariant(order.status) ?? 'default'}>
                  {t.orders.status[order.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icons.table className="w-4 h-4" /> {t.orders.table} {order.tableNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Icons.clock className="w-4 h-4" /> <LocalDate value={order.createdAt} />
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t.orders.remaining}</div>
              <div className="text-2xl font-bold">{formatCurrency(remaining)}</div>
            </div>
          </div>

          {/* Progress steps */}
          <div className="mt-6 flex gap-0">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < statusIdx ? 'bg-primary text-primary-foreground' :
                    i === statusIdx ? 'bg-primary/20 text-primary ring-2 ring-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i < statusIdx ? <Icons.circleCheck className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 ${i <= statusIdx ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t.orders.status[s]}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-4 ${i < statusIdx ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {role === 'Kitchen' && (
          <>
            {order.status === 'pending' && (
              <Button size="sm" disabled={updateMutation.isPending} onClick={() => {
                updateMutation.mutate({ id: order.id, data: { status: 'preparing' } });
                toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.preparing}`);
              }}>
                <Icons.clock className="mr-1 w-4 h-4" /> {t.orders.startPreparing}
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button size="sm" disabled={updateMutation.isPending} onClick={() => {
                updateMutation.mutate({ id: order.id, data: { status: 'ready' } });
                toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.ready}`);
              }}>
                <Icons.circleCheck className="mr-1 w-4 h-4" /> {t.orders.markReady}
              </Button>
            )}
          </>
        )}
        {(role === 'Waiter' || role === 'Admin') && order.status === 'ready' && (
          <Button size="sm" variant="default" disabled={updateMutation.isPending} onClick={() => {
            updateMutation.mutate({ id: order.id, data: { status: 'served' } });
            toast.success(`${t.orders.orderNumber}${order.id} — ${t.orders.status.served}`);
          }}>
            <Icons.circleCheck className="mr-1 w-4 h-4" /> {t.orders.markServed}
          </Button>
        )}
        {(role === 'Waiter' || role === 'Admin') && order.status !== 'cancelled' && order.status !== 'served' && (
          <Button size="sm" variant="destructive" disabled={updateMutation.isPending} onClick={() => {
            updateMutation.mutate({ id: order.id, data: { status: 'cancelled' } });
            toast.error(`${t.orders.orderNumber}${order.id} — ${t.orders.status.cancelled}`);
          }}>
            <Icons.close className="mr-1 w-4 h-4" /> {t.orders.cancelOrder}
          </Button>
        )}
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.post className="w-5 h-5" /> {t.orders.items}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.orders.items}</TableHead>
                <TableHead className="w-24 text-center">{t.cart.qty}</TableHead>
                <TableHead className="w-28 text-right">{t.menu.price}</TableHead>
                <TableHead className="w-32 text-right">{t.cart.subtotal}</TableHead>
                {(role === 'Waiter' || role === 'Admin') && order.status !== 'served' && order.status !== 'cancelled' && (
                  <TableHead className="w-16" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {locale === 'ku' && item.menuItemNameKu ? item.menuItemNameKu : item.menuItemName}
                    {item.note && <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.price * item.quantity)}</TableCell>
                  {(role === 'Waiter' || role === 'Admin') && order.status !== 'served' && order.status !== 'cancelled' && (
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        disabled={removeItemMutation.isPending}
                        onClick={() => {
                          removeItemMutation.mutate(
                            { orderId: order.id, itemId: item.id },
                            {
                              onSuccess: () => toast.success(t.orders.itemRemoved),
                              onError: () => toast.error(t.orders.failedRemoveItem),
                            }
                          );
                        }}
                      >
                        <Icons.trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end p-4 bg-muted/50">
            <div className="text-lg font-semibold">{t.orders.total}: {formatCurrency(total)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.creditCard className="w-5 h-5" /> {t.orders.payment}
            <span className="text-sm font-normal text-muted-foreground">({formatCurrency(paidTotal)} / {formatCurrency(total)})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.orders.amount}</TableHead>
                  <TableHead>{t.orders.method}</TableHead>
                  <TableHead>{t.orders.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="capitalize">{p.method === 'cash' ? t.orders.cash : t.orders.card}</TableCell>
                    <TableCell className="text-muted-foreground"><LocalDate value={p.paidAt} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {remaining > 0.01 && order.status !== 'cancelled' && order.status !== 'served' && (
            <>
              <Separator />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!payAmount) return;
                  payMutation.mutate(
                    { orderId, data: { amount: parseFloat(payAmount), method: payMethod } },
                    {
                      onSuccess: () => { setPayAmount(''); toast.success(t.orders.paymentRecorded); },
                      onError: () => toast.error(t.orders.paymentFailed),
                    }
                  );
                }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
              >
                <div className="flex-1">
                  <label className="text-sm font-medium">{t.orders.amount}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    placeholder={`Max ${formatCurrency(remaining)}`}
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label className="text-sm font-medium">{t.orders.method}</label>
                  <Select value={payMethod} onValueChange={(v) => setPayMethod(v as 'cash' | 'card')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t.orders.cash}</SelectItem>
                      <SelectItem value="card">{t.orders.card}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={payMutation.isPending} className="w-full sm:w-auto">
                  {t.orders.addPayment}
                </Button>
              </form>
            </>
          )}

          {remaining <= 0.01 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icons.circleCheck className="w-4 h-4 text-green-600" /> {t.orders.fullyPaid}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
