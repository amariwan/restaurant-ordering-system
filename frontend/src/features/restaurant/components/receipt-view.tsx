'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { formatCurrency } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import type { Receipt } from '@/features/restaurant/api/types';

interface ReceiptViewProps {
  receipt: Receipt;
  onClose?: () => void;
}

export function ReceiptView({ receipt, onClose }: ReceiptViewProps) {
  const { t, locale } = useI18n();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${t.receipt.title} ${receipt.receiptNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 24px; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 8px; text-align: left; border-bottom: 1px dashed #ccc; }
            th { font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mt-4 { margin-top: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .text-sm { font-size: 11px; }
            hr { border: none; border-top: 1px dashed #000; margin: 12px 0; }
            @media print {
              body { margin: 0; padding: 16px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="text-center mb-2">
            <h2 style="margin:0;font-size:16px;">${t.receipt.title}</h2>
            <div class="text-sm">${t.receipt.receiptNumber}: ${receipt.receiptNumber}</div>
            <div class="text-sm">${t.orders.table} ${receipt.tableNumber}</div>
            <div class="text-sm">${new Date(receipt.generatedAt).toLocaleString()}</div>
          </div>
          <hr/>
          <table>
            <thead>
              <tr>
                <th>${t.menu.name}</th>
                <th class="text-center">${t.cart.qty}</th>
                <th class="text-right">${t.menu.price}</th>
                <th class="text-right">${t.cart.subtotal}</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.items.map(item => `
                <tr>
                  <td>${locale === 'ku' && item.nameKu ? item.nameKu : item.name}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.price)}</td>
                  <td class="text-right">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <hr/>
          <div style="margin-top:8px;">
            <div style="display:flex;justify-content:space-between;">
              <span>${t.orders.total}:</span>
              <span class="font-bold">${formatCurrency(receipt.totalAmount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span>${t.receipt.paid}:</span>
              <span>${formatCurrency(receipt.paidAmount)}</span>
            </div>
            ${receipt.taxAmount > 0 ? `
            <div style="display:flex;justify-content:space-between;">
              <span>${t.receipt.tax}:</span>
              <span>${formatCurrency(receipt.taxAmount)}</span>
            </div>
            ` : ''}
            ${receipt.tipAmount > 0 ? `
            <div style="display:flex;justify-content:space-between;">
              <span>${t.receipt.tip}:</span>
              <span>${formatCurrency(receipt.tipAmount)}</span>
            </div>
            ` : ''}
          </div>
          <hr/>
          <div class="text-sm">
            <div>${t.receipt.paymentMethods}: ${receipt.paymentMethods}</div>
          </div>
          <div class="text-center text-sm mt-4">${t.receipt.thankYou}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='flex items-center gap-2'>
          <Icons.receipt className='w-5 h-5' />
          {t.receipt.title}
        </CardTitle>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={handlePrint}>
            <Icons.printer className='w-4 h-4 mr-1' />
            {t.receipt.print}
          </Button>
          {onClose && (
            <Button size='sm' variant='ghost' onClick={onClose}>
              <Icons.close className='w-4 h-4' />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Screen preview */}
        <div ref={printRef} className='font-mono text-sm space-y-2 max-w-sm mx-auto'>
          <div className='text-center'>
            <div className='text-lg font-bold'>{t.receipt.title}</div>
            <div className='text-muted-foreground'>{t.receipt.receiptNumber}: {receipt.receiptNumber}</div>
            <div className='text-muted-foreground'>{t.orders.table} {receipt.tableNumber}</div>
            <div className='text-muted-foreground'>{new Date(receipt.generatedAt).toLocaleString()}</div>
          </div>
          <Separator className='border-dashed' />
          <table className='w-full'>
            <thead>
              <tr className='text-muted-foreground text-xs'>
                <th className='text-left font-medium'>{t.menu.name}</th>
                <th className='text-center font-medium'>{t.cart.qty}</th>
                <th className='text-right font-medium'>{t.menu.price}</th>
                <th className='text-right font-medium'>{t.cart.subtotal}</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i}>
                  <td className='py-1'>
                    {locale === 'ku' && item.nameKu ? item.nameKu : item.name}
                  </td>
                  <td className='text-center py-1'>{item.quantity}</td>
                  <td className='text-right py-1'>{formatCurrency(item.price)}</td>
                  <td className='text-right py-1 font-medium'>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Separator className='border-dashed' />
          <div className='space-y-1'>
            <div className='flex justify-between'>
              <span>{t.orders.total}:</span>
              <span className='font-bold'>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            <div className='flex justify-between text-muted-foreground'>
              <span>{t.receipt.paid}:</span>
              <span>{formatCurrency(receipt.paidAmount)}</span>
            </div>
            {receipt.taxAmount > 0 && (
              <div className='flex justify-between text-muted-foreground'>
                <span>{t.receipt.tax}:</span>
                <span>{formatCurrency(receipt.taxAmount)}</span>
              </div>
            )}
            {receipt.tipAmount > 0 && (
              <div className='flex justify-between text-muted-foreground'>
                <span>{t.receipt.tip}:</span>
                <span>{formatCurrency(receipt.tipAmount)}</span>
              </div>
            )}
          </div>
          <Separator className='border-dashed' />
          <div className='text-xs text-muted-foreground'>
            {t.receipt.paymentMethods}: {receipt.paymentMethods}
          </div>
          <div className='text-center text-xs text-muted-foreground pt-2'>
            {t.receipt.thankYou}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
