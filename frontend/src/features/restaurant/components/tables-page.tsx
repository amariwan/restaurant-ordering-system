'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/sonner';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { tablesAllOptions, useTablesUpdateMutation, useTablesDeleteMutation, useTablesCreateMutation } from '@/features/restaurant/api/queries';
import { useI18n } from '@/lib/i18n/context';

const TABLE_STATUSES = ['free', 'occupied', 'reserved'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  free: 'default',
  occupied: 'destructive',
  reserved: 'secondary',
};

export function TablesPage() {
  const { t } = useI18n();
  const { data: tables } = useSuspenseQuery(tablesAllOptions);
  const [editing, setEditing] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const updateMutation = useTablesUpdateMutation();
  const deleteMutation = useTablesDeleteMutation();
  const createMutation = useTablesCreateMutation();
  const toast = useToast();

  async function handleCreate() {
    const num = parseInt(newTableNumber, 10);
    if (isNaN(num) || num < 1) {
      toast.error(t.tables.invalidNumber || 'Please enter a valid table number');
      return;
    }
    try {
      await createMutation.mutateAsync({ number: num });
      toast.success(t.tables.createSuccess || 'Table created');
      setShowCreate(false);
      setNewTableNumber('');
    } catch (err: any) {
      toast.error(err?.message ?? t.common.failed);
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case 'free': return t.tables.status.free;
      case 'occupied': return t.tables.status.occupied;
      case 'reserved': return t.tables.status.reserved;
      default: return status;
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between p-4 pb-0">
        <CardTitle>{t.tables.title}</CardTitle>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <IconPlus className="w-4 h-4 mr-1" />
          {t.tables.addTable}
        </Button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 px-4 pt-4">
          <input
            type="number"
            min="1"
            placeholder={t.tables.tableNumber}
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            className="w-40 rounded-md border border-input px-3 py-2 bg-transparent text-sm"
          />
          <Button size="sm" onClick={handleCreate} isLoading={createMutation.isPending}>
            {t.common.create}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setShowCreate(false); setNewTableNumber(''); }}>
            {t.common.cancel}
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.tables.tableNumber}</TableHead>
            <TableHead>{t.common.status}</TableHead>
            <TableHead className="w-24">{t.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.map((table) => (
            <TableRow key={table.id}>
              <TableCell className="font-medium">{t.orders.table} {table.number}</TableCell>
              <TableCell>
                {editing === table.id ? (
                  <select
                    value={table.status}
                    onChange={(e) => {
                      updateMutation.mutate({ id: table.id, data: { status: e.target.value as typeof TABLE_STATUSES[number] } });
                      setEditing(null);
                      toast.success(t.tables.statusUpdated || 'Table status updated');
                    }}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                  >
                    {TABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                ) : (
                  <Badge variant={STATUS_VARIANT[table.status] ?? 'default'}>
                    {statusLabel(table.status)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(editing === table.id ? null : table.id)}>
                    <IconPencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(t.tables.confirmDelete)) {
                        deleteMutation.mutate(table.id);
                        toast.success(t.tables.deleteSuccess || 'Table deleted');
                      }
                    }}
                  >
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {tables.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">{t.tables.noTables}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
