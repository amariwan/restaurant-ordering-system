import type { OrderStatus } from '@/features/restaurant/api/types';

export type { OrderStatus };

export const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

export const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  preparing: { label: 'Preparing', variant: 'outline' },
  ready: { label: 'Ready', variant: 'secondary' },
  served: { label: 'Served', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}

export function statusVariant(status: OrderStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  return STATUS_CONFIG[status]?.variant ?? 'default';
}

export function nextStatuses(current: OrderStatus): OrderStatus[] {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1) return [];
  return current === 'cancelled' ? [] : [STATUS_FLOW[idx + 1]];
}

export function prevStatuses(current: OrderStatus): OrderStatus[] {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx <= 0) return [];
  return [STATUS_FLOW[idx - 1]];
}

// Status-specific next-step label for display in action buttons
export function nextStatusLabel(current: OrderStatus): string | null {
  const flow = nextStatuses(current);
  if (flow.length === 0) return null;
  return `Mark as ${STATUS_CONFIG[flow[0]].label}`;
}
