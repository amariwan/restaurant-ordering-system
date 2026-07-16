'use client';

import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/sonner';
import { Icons } from '@/components/icons';
import {
  tablesAllOptions,
  useTablesUpdateMutation,
  useTablesDeleteMutation,
  useTablesCreateMutation,
  useTablesUploadImageMutation,
  useTablesBulkDeleteMutation,
  useTablesBulkMoveMutation,
  mapBackgroundOptions,
  useUploadMapBackgroundMutation,
  useDeleteMapBackgroundMutation,
  wallsOptions,
  useWallsCreateMutation,
  useWallsDeleteMutation,
} from '@/features/restaurant/api/queries';
import { TableScene } from '@/features/restaurant/components/table-scene';
import { useI18n } from '@/lib/i18n/context';
import type { Table, TableShape, TableTypeOption, Wall } from '@/features/restaurant/api/types';

const TABLE_STATUSES = ['free', 'occupied', 'reserved'] as const;
const TABLE_SHAPES: TableShape[] = ['Circle', 'Rectangle', 'Square', 'Oval'];
const TABLE_TYPES = ['Regular', 'VIP', 'Private', 'Bar', 'Outdoor'] as const;
const COLOR_PRESETS = [
  { label: 'Default', value: '' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Rose', value: '#f43f5e' },
];

const STATUS_CONFIG: Record<
  string,
  { variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ComponentType<{ className?: string }>; color: string; mapBg: string; mapBorder: string; pulse: string; dotColor: string }
> = {
  free: {
    variant: 'default', icon: Icons.circleCheck,
    color: 'from-emerald-500/20 to-emerald-500/5 ring-emerald-500/20',
    mapBg: 'bg-emerald-500',
    mapBorder: 'ring-emerald-400/70',
    pulse: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
    dotColor: 'bg-emerald-400',
  },
  occupied: {
    variant: 'destructive', icon: Icons.circleX,
    color: 'from-red-500/20 to-red-500/5 ring-red-500/20',
    mapBg: 'bg-red-500',
    mapBorder: 'ring-red-400/70',
    pulse: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    dotColor: 'bg-red-400',
  },
  reserved: {
    variant: 'secondary', icon: Icons.clock,
    color: 'from-amber-500/20 to-amber-500/5 ring-amber-500/20',
    mapBg: 'bg-amber-500',
    mapBorder: 'ring-amber-400/70',
    pulse: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    dotColor: 'bg-amber-400',
  },
};

const TYPE_BADGES: Record<string, { label: string; class: string }> = {
  VIP: { label: 'VIP', class: 'bg-purple-500 text-white' },
  Private: { label: 'Private', class: 'bg-pink-500 text-white' },
  Bar: { label: 'Bar', class: 'bg-blue-500 text-white' },
  Outdoor: { label: 'Outdoor', class: 'bg-amber-500 text-white' },
  Regular: { label: '', class: '' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statusLabel(t: any, status: string): string {
  switch (status) {
    case 'free': return t.tables?.status?.free ?? 'Free';
    case 'occupied': return t.tables?.status?.occupied ?? 'Occupied';
    case 'reserved': return t.tables?.status?.reserved ?? 'Reserved';
    default: return status;
  }
}

function shapeLabel(t: { tables?: { shapes?: Record<string, string> } }, shape: string): string {
  const key = shape.toLowerCase();
  return t?.tables?.shapes?.[key as keyof typeof t.tables.shapes] ?? shape;
}

function typeLabel(t: { tables?: { type?: Record<string, string> } }, type: string): string {
  const key = type.toLowerCase();
  return t?.tables?.type?.[key as keyof typeof t.tables.type] ?? type;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tl(t: any, key: string, fallback: string): string {
  const keys = key.split('.');
  let val: any = t;
  for (const k of keys) {
    if (val == null) return fallback;
    val = val[k];
  }
  return (val as string) ?? fallback;
}

export function TablesPage() {
  const { t } = useI18n();
  const [floor, setFloor] = useState(1);
  const { data: tables } = useSuspenseQuery(tablesAllOptions(floor));
  const { data: background } = useQuery(mapBackgroundOptions(floor));
  const { data: walls } = useQuery(wallsOptions(floor));
  const updateMutation = useTablesUpdateMutation();
  const deleteMutation = useTablesDeleteMutation();
  const createMutation = useTablesCreateMutation();
  const bulkDeleteMutation = useTablesBulkDeleteMutation();
  const bulkMoveMutation = useTablesBulkMoveMutation();
  const wallCreateMutation = useWallsCreateMutation();
  const wallDeleteMutation = useWallsDeleteMutation();
  const toast = useToast();

  const [view, setView] = useState<'map' | 'list'>('map');
  const [editing, setEditing] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);
  const [createPos, setCreatePos] = useState<{ x: number; y: number } | null>(null);

  // Floor plan editor states
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [drawWallMode, setDrawWallMode] = useState(false);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallMousePos, setWallMousePos] = useState<{ x: number; y: number } | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [undoStack, setUndoStack] = useState<Table[][]>([]);
  const [redoStack, setRedoStack] = useState<Table[][]>([]);

  // Edit form state
  const [editNumber, setEditNumber] = useState('');
  const [editCapacity, setEditCapacity] = useState(4);
  const [editArea, setEditArea] = useState('');
  const [editStatus, setEditStatus] = useState<string>('free');
  const [editShape, setEditShape] = useState<TableShape>('Circle');
  const [editWidth, setEditWidth] = useState(72);
  const [editHeight, setEditHeight] = useState(72);
  const [editRotation, setEditRotation] = useState(0);
  const [editColorHex, setEditColorHex] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTableType, setEditTableType] = useState<TableTypeOption>('Regular');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageUrlInput, setEditImageUrlInput] = useState('');

  // Create form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [newArea, setNewArea] = useState('');
  const [newShape, setNewShape] = useState<TableShape>('Circle');
  const [newTableType, setNewTableType] = useState<TableTypeOption>('Regular');

  const uploadImageMutation = useTablesUploadImageMutation();
  const uploadBgMutation = useUploadMapBackgroundMutation(floor);
  const deleteBgMutation = useDeleteMapBackgroundMutation(floor);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        if (e.shiftKey) {
          // Redo
          setRedoStack((rs) => {
            if (rs.length === 0) return rs;
            const prev = rs[rs.length - 1];
            setUndoStack((us) => [...us, tables]);
            setRedoStack((r) => r.slice(0, -1));
            // Optimistic: invalidating query will refetch
            return rs;
          });
        } else {
          // Undo
          setUndoStack((us) => {
            if (us.length === 0) return us;
            const prev = us[us.length - 1];
            setRedoStack((rs) => [...rs, tables]);
            setUndoStack((u) => u.slice(0, -1));
            return us;
          });
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setDrawWallMode(false);
        setWallStart(null);
        setWallMousePos(null);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0 && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          bulkDeleteMutation.mutate(Array.from(selectedIds));
          setSelectedIds(new Set());
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tables, selectedIds, bulkDeleteMutation]);

  // Push snapshot to undo before mutations
  function pushUndo() {
    setUndoStack((us) => [...us.slice(-50), tables]);
    setRedoStack([]);
  }

  const statusCounts = {
    free: tables.filter((t) => t.status === 'free').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  };

  const areas = useMemo(() => {
    if (tables.length === 0) return [];
    const groups: Record<string, { tables: Table[] }> = {};
    for (const table of tables) {
      const a = table.area || 'Main';
      if (!groups[a]) groups[a] = { tables: [] };
      groups[a].tables.push(table);
    }
    return Object.entries(groups).map(([name, g]) => ({
      name,
      nx: g.tables.reduce((s, table) => s + table.posX, 0) / g.tables.length,
      ny: g.tables.reduce((s, table) => s + table.posY, 0) / g.tables.length,
    }));
  }, [tables]);

  const currentEditTable = useMemo(
    () => (editing ? tables.find((table) => table.id === editing) : null),
    [editing, tables]
  );

  function openEdit(table: Table) {
    setEditing(table.id);
    setEditNumber(String(table.number));
    setEditCapacity(table.capacity);
    setEditArea(table.area ?? '');
    setEditStatus(table.status);
    setEditShape(table.shape);
    setEditWidth(table.width);
    setEditHeight(table.height);
    setEditRotation(table.rotation);
    setEditColorHex(table.colorHex ?? '');
    setEditDescription(table.description ?? '');
    setEditTableType(table.type);
    setEditImageUrl(table.imageUrl ?? '');
    setEditImageUrlInput(table.imageUrl ?? '');
  }

  async function handleDuplicate() {
    if (!currentEditTable) return;
    try {
      const newNum = Math.max(...tables.map((table) => table.number)) + 1;
      await createMutation.mutateAsync({
        number: newNum,
        capacity: currentEditTable.capacity,
        area: currentEditTable.area ?? undefined,
        shape: currentEditTable.shape,
        width: currentEditTable.width,
        height: currentEditTable.height,
        rotation: currentEditTable.rotation,
        colorHex: currentEditTable.colorHex ?? undefined,
        description: currentEditTable.description ?? undefined,
        type: currentEditTable.type,
        status: currentEditTable.status,
        imageUrl: currentEditTable.imageUrl ?? undefined,
        posX: currentEditTable.posX + 40,
        posY: currentEditTable.posY + 40,
      });
      toast.success(`Table ${newNum} created (copy of ${currentEditTable.number})`);
      setEditing(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const handleTableDragEnd = useCallback(async (id: number, nx: number, ny: number) => {
    const table = tables.find((table) => table.id === id);
    if (!table) return;
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          number: table.number,
          capacity: table.capacity,
          area: table.area ?? undefined,
          imageUrl: table.imageUrl ?? undefined,
          status: table.status,
          shape: table.shape,
          width: table.width,
          height: table.height,
          rotation: table.rotation,
          colorHex: table.colorHex ?? undefined,
          description: table.description ?? undefined,
          type: table.type,
          posX: Math.min(1, Math.max(0, nx)),
          posY: Math.min(1, Math.max(0, ny)),
        },
      });
    } catch {
      toast.error('Failed to move table');
    }
  }, [tables, updateMutation, toast]);

  const handleTableDragEndMulti = useCallback((positions: { id: number; posX: number; posY: number }[]) => {
    pushUndo();
    bulkMoveMutation.mutate(positions);
  }, [bulkMoveMutation]);

  const handleWallDrawStart = useCallback((nx: number, ny: number) => {
    setWallStart({ x: nx, y: ny });
  }, []);

  const handleWallDrawEnd = useCallback((nx: number, ny: number) => {
    if (!wallStart) return;
    wallCreateMutation.mutate({
      floor,
      startX: wallStart.x,
      startY: wallStart.y,
      endX: Math.min(1, Math.max(0, nx)),
      endY: Math.min(1, Math.max(0, ny)),
      colorHex: '#ffffff',
      thickness: 3,
    });
    setWallStart(null);
    setWallMousePos(null);
  }, [wallStart, floor, wallCreateMutation]);

  const handleWallDrawMove = useCallback((nx: number, ny: number) => {
    setWallMousePos({ x: nx, y: ny });
  }, []);

  const handleDeleteWall = useCallback(async (wallId: number) => {
    if (window.confirm('Delete this wall?')) {
      await wallDeleteMutation.mutateAsync(wallId);
    }
  }, [wallDeleteMutation]);

  async function handleCreate() {
    const num = parseInt(newTableNumber, 10);
    if (isNaN(num) || num < 1) {
      toast.error(tl(t, 'tables.invalidNumber', 'Please enter a valid table number'));
      return;
    }
    try {
      await createMutation.mutateAsync({
        number: num,
        capacity: newCapacity,
        area: newArea || undefined,
        shape: newShape,
        type: newTableType,
        posX: createPos?.x ?? 0,
        posY: createPos?.y ?? 0,
      });
      toast.success(tl(t, 'tables.createSuccess', 'Table created'));
      setShowCreate(false);
      setNewTableNumber('');
      setNewCapacity(4);
      setNewArea('');
      setNewShape('Circle');
      setNewTableType('Regular');
      setCreatePos(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleEditSave() {
    if (!editing) return;
    const num = parseInt(editNumber, 10);
    if (isNaN(num) || num < 1) {
      toast.error(tl(t, 'tables.invalidNumber', 'Invalid table number'));
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editing,
        data: {
          number: num,
          capacity: editCapacity,
          area: editArea || undefined,
          status: editStatus as Table['status'],
          shape: editShape,
          width: editWidth,
          height: editHeight,
          rotation: editRotation,
          colorHex: editColorHex || undefined,
          description: editDescription || undefined,
          type: editTableType,
          imageUrl: editImageUrl || undefined,
        },
      });
      toast.success('Table updated');
      setEditing(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete() {
    if (deleteConfirm === null) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm);
      toast.success(tl(t, 'tables.deleteSuccess', 'Table deleted'));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleQuickStatusCycle(table: Table) {
    const next = { free: 'occupied', occupied: 'reserved', reserved: 'free' } as const;
    const newStatus = next[table.status];
    try {
      await updateMutation.mutateAsync({ id: table.id, data: { status: newStatus } });
    } catch {
      toast.error('Failed to update status');
    }
  }

  const areaOptions = useMemo(
    () => [...new Set(tables.map((table) => table.area).filter(Boolean))] as string[],
    [tables]
  );

  function handleCanvasClick(nx: number, ny: number) {
    if (drawWallMode || selectedIds.size > 0) return;
    setCreatePos({ x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) });
    setNewTableNumber('');
    setShowCreate(true);
  }

  const filteredTables = useMemo(() => {
    if (view !== 'list') return tables;
    let result = tables;
    if (filterStatus) result = result.filter((table) => table.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (table) =>
          String(table.number).includes(q) ||
          table.area?.toLowerCase().includes(q) ||
          table.description?.toLowerCase().includes(q) ||
          table.type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tables, filterStatus, searchQuery, view]);

  function handleShapeChange(shape: TableShape, isEdit: boolean) {
    const setShape = isEdit ? setEditShape : setNewShape;
    const setW = isEdit ? setEditWidth : (w: number) => {};
    const setH = isEdit ? setEditHeight : (h: number) => {};
    setShape(shape);
    if (isEdit) {
      switch (shape) {
        case 'Circle':
        case 'Square':
          setEditHeight(editWidth);
          break;
        case 'Rectangle':
          if (editWidth === editHeight) setEditHeight(Math.round(editWidth * 0.7));
          break;
        case 'Oval':
          if (editWidth === editHeight) setEditHeight(Math.round(editWidth * 0.6));
          break;
      }
    }
  }

  return (
    <div className='space-y-6'>
      {/* Stats overview */}
      <div className='grid grid-cols-3 gap-3'>
        {(['free', 'occupied', 'reserved'] as const).map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <Card key={status} className='border-0 ring-1 ring-border shadow-sm overflow-hidden'>
              <CardContent className='flex items-center gap-3 p-4'>
                <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${config.color} ring-1 shadow-sm`}>
                  <Icon className='size-5' />
                </div>
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    {statusLabel(t, status)}
                  </p>
                  <p className='text-2xl font-bold tabular-nums tracking-tight'>
                    {statusCounts[status]}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Floor tabs */}
      <div className='flex items-center gap-2'>
        {[1, 2, 3].map((f) => (
          <Button
            key={f}
            variant={floor === f ? 'default' : 'outline'}
            size='sm'
            className='h-8 gap-1.5 px-3 text-xs'
            onClick={() => { setFloor(f); setSelectedIds(new Set()); }}
          >
            <Icons.dashboard className='size-3.5' />
            Floor {f}
          </Button>
        ))}
      </div>

      {/* View toggle + toolbars */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='inline-flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5'>
            <Button
              variant={view === 'map' ? 'default' : 'ghost'}
              size='sm'
              className='gap-1.5 px-3'
              onClick={() => setView('map')}
            >
              <Icons.dashboard className='size-4' />
              Map
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size='sm'
              className='gap-1.5 px-3'
              onClick={() => setView('list')}
            >
              <Icons.table className='size-4' />
              List
            </Button>
          </div>
          {view === 'map' && (
            <div className='inline-flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5'>
              <Button
                variant={gridVisible ? 'default' : 'ghost'}
                size='sm'
                className='size-7 p-0'
                title='Toggle Grid'
                onClick={() => setGridVisible((g) => !g)}
              >
                <Icons.gripVertical className='size-3.5' />
              </Button>
              <Button
                variant={drawWallMode ? 'default' : 'ghost'}
                size='sm'
                className='size-7 p-0'
                title='Draw Walls'
                onClick={() => { setDrawWallMode((d) => !d); setWallStart(null); }}
              >
                <Icons.slash className='size-3.5' />
              </Button>
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {view === 'map' && (
            <>
              <Button
                variant={background?.url ? 'secondary' : 'outline'}
                size='sm'
                className='gap-1.5'
                onClick={() => setShowBackgroundDialog(true)}
              >
                <Icons.media className='size-4' />
                Background
              </Button>
            </>
          )}
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5'
            onClick={() => { pushUndo(); setCreatePos(null); setNewTableNumber(''); setShowCreate(true); }}
          >
            <Icons.add className='size-4' />
            {tl(t, 'tables.addTable', 'Add Table')}
          </Button>
        </div>
      </div>

      {/* Multi-select bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className='flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-2.5 text-sm'>
          <span className='font-medium'>{selectedIds.size} selected</span>
          <span className='h-4 w-px bg-border' />
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 text-xs'
            onClick={() => {
              pushUndo();
              bulkDeleteMutation.mutate(Array.from(selectedIds));
              setSelectedIds(new Set());
            }}
          >
            <Icons.trash className='size-3.5' />
            Delete
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='h-8 gap-1.5 text-xs'
            onClick={() => { setSelectedIds(new Set()); }}
          >
            <Icons.circleX className='size-3.5' />
            Clear
          </Button>
        </div>
      )}

      {/* Map view */}
      {view === 'map' && (
        <TableScene
          tables={tables}
          walls={walls ?? []}
          background={background?.url}
          gridVisible={gridVisible}
          drawWallMode={drawWallMode}
          wallStart={wallStart}
          wallMousePos={wallMousePos}
          selectedIds={selectedIds}
          hoveredTable={hoveredTable}
          onCanvasClick={handleCanvasClick}
          onTableClick={(id, shiftKey) => {
            if (shiftKey) {
              const next = new Set(selectedIds);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedIds(next);
            } else if (selectedIds.size > 0) {
              setSelectedIds(new Set());
            }
          }}
          onTableDoubleClick={(id) => {
            const table = tables.find((t) => t.id === id);
            if (table) openEdit(table);
          }}
          onTableDragEnd={handleTableDragEnd}
          onTableDragEndMulti={handleTableDragEndMulti}
          onHoverTable={setHoveredTable}
          onWallDrawStart={handleWallDrawStart}
          onWallDrawEnd={handleWallDrawEnd}
          onWallDrawMove={handleWallDrawMove}
          onDeleteWall={handleDeleteWall}
          areas={areas}
        />
      )}

      {/* List view */}
      {view === 'list' && (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1 max-w-xs'>
              <Icons.search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder={tl(t, 'common.search', 'Search...')}
                className='h-9 pl-8 text-sm'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='flex gap-1'>
              {([null, 'free', 'occupied', 'reserved'] as const).map((s) => {
                const cfg = s ? STATUS_CONFIG[s] : null;
                const Icon = cfg?.icon;
                return (
                  <Button
                    key={s ?? 'all'}
                    variant={filterStatus === s ? 'default' : 'outline'}
                    size='sm'
                    className={`h-9 gap-1.5 text-xs ${s === null ? 'px-3' : 'px-2.5'}`}
                    onClick={() => setFilterStatus(s)}
                  >
                    {Icon && <Icon className='size-3.5' />}
                    {s ? statusLabel(t, s) : 'All'}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            <AnimatePresence>
              {filteredTables.map((table, i) => {
                const config = STATUS_CONFIG[table.status];
                const Icon = config.icon;
                const typeBadge = TYPE_BADGES[table.type];
                return (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    layout
                    className='group relative overflow-hidden rounded-xl border bg-card p-4 text-center transition-all duration-200 hover:shadow-md'
                  >
                    <span className={`absolute inset-x-0 top-0 h-1 ${config.mapBg}`} />

                    <div className='absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-7'
                        onClick={() => openEdit(table)}
                      >
                        <Icons.edit className='size-3.5' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-7 text-muted-foreground hover:text-destructive'
                        onClick={() => setDeleteConfirm(table.id)}
                      >
                        <Icons.trash className='size-3.5 text-destructive' />
                      </Button>
                    </div>

                    {/* Shape icon */}
                    <div className='mb-3 mt-3'>
                      <div className='mx-auto flex size-14 items-center justify-center overflow-hidden rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/20 shadow-sm'>
                        {table.imageUrl ? (
                          <img src={table.imageUrl} alt='' className='size-full object-cover' />
                        ) : (
                          <Icons.table className='size-6 text-foreground/70' />
                        )}
                      </div>
                    </div>
                    <p className='text-sm font-semibold'>{tl(t, 'orders.table', 'Table')} {table.number}</p>
                    <div className='mt-0.5 flex items-center justify-center gap-1.5'>
                      {table.area && (
                        <span className='text-[10px] text-muted-foreground'>{table.area}</span>
                      )}
                      <span className='text-[10px] text-muted-foreground'>·</span>
                      <span className='text-[10px] text-muted-foreground'>{shapeLabel({ tables: t?.tables }, table.shape)}</span>
                      {typeBadge.label && (
                        <>
                          <span className='text-[10px] text-muted-foreground'>·</span>
                          <span className={`text-[10px] font-medium ${typeBadge.class.split(' ')[0] || 'text-muted-foreground'}`}>
                            {typeBadge.label}
                          </span>
                        </>
                      )}
                    </div>
                    <div className='mt-2 flex items-center justify-center gap-2'>
                      <Badge
                        variant={config.variant}
                        className='gap-1 px-2.5 py-0.5 text-[11px] font-normal'
                      >
                        <Icon className='size-3' />
                        {statusLabel(t, table.status)}
                      </Badge>
                      <span className='text-[11px] text-muted-foreground'>{table.capacity}p</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: tables.length * 0.03 }}
              onClick={() => { setCreatePos(null); setNewTableNumber(''); setShowCreate(true); }}
              className='flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card/50 p-4 text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground group'
            >
              <div className='flex size-12 items-center justify-center rounded-full border-2 border-dashed transition-colors group-hover:border-primary/50'>
                <Icons.add className='size-5 transition-transform group-hover:scale-110' />
              </div>
              <span className='text-sm font-medium'>{tl(t, 'tables.addTable', 'Add Table')}</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className='w-[480px] sm:max-w-lg overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>
              {tl(t, 'tables.editTable', 'Edit Table')} {currentEditTable?.number}
            </SheetTitle>
            <SheetDescription>
              Update table properties, shape, position, and appearance on the map.
            </SheetDescription>
          </SheetHeader>

          {currentEditTable && (
            <div className='grid gap-5 py-6'>
              {/* Number + Capacity */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-number'>{tl(t, 'tables.tableNumber', 'Table Number')}</Label>
                  <Input
                    id='edit-number'
                    type='number'
                    min={1}
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-capacity'>{tl(t, 'tables.capacity', 'Capacity')}</Label>
                  <Input
                    id='edit-capacity'
                    type='number'
                    min={1}
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              {/* Table Type */}
              <div className='space-y-2'>
                <Label>{tl(t, 'tables.tableType', 'Table Type')}</Label>
                <div className='flex flex-wrap gap-1.5'>
                  {TABLE_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant={editTableType === type ? 'default' : 'outline'}
                      size='sm'
                      className='gap-1.5'
                      onClick={() => setEditTableType(type)}
                    >
                      {typeLabel({ tables: t?.tables }, type)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Area */}
              <div className='space-y-2'>
                <Label htmlFor='edit-area'>{tl(t, 'tables.area', 'Area')}</Label>
                <Input
                  id='edit-area'
                  placeholder='e.g. Main Hall, Terrace'
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                />
                {areaOptions.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {areaOptions.map((a) => (
                      <button
                        key={a}
                        type='button'
                        onClick={() => setEditArea(a)}
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                          editArea === a
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-muted/50 text-muted-foreground border-border hover:border-foreground/30'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Shape */}
              <div className='space-y-2'>
                <Label>{tl(t, 'tables.shape', 'Shape')}</Label>
                <div className='flex gap-1.5'>
                  {TABLE_SHAPES.map((shape) => (
                    <Button
                      key={shape}
                      variant={editShape === shape ? 'default' : 'outline'}
                      size='sm'
                      className='gap-1.5 flex-1'
                      onClick={() => handleShapeChange(shape, true)}
                    >
                      {shape === 'Circle' && <Icons.circle className='size-3.5' />}
                      {shape === 'Square' && <Icons.square className='size-3.5' />}
                      {shape === 'Rectangle' && <Icons.rectangle className='size-3.5' />}
                      {shape === 'Oval' && <Icons.rectangleVertical className='size-3.5' />}
                      {shapeLabel({ tables: t?.tables }, shape)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Width + Height + Rotation */}
              {(editShape === 'Rectangle' || editShape === 'Oval') ? (
                <div className='grid grid-cols-3 gap-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-width'>{tl(t, 'tables.width', 'Width')}</Label>
                    <Input
                      id='edit-width'
                      type='number'
                      min={40}
                      max={200}
                      value={editWidth}
                      onChange={(e) => setEditWidth(parseInt(e.target.value, 10) || 72)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-height'>{tl(t, 'tables.height', 'Height')}</Label>
                    <Input
                      id='edit-height'
                      type='number'
                      min={40}
                      max={200}
                      value={editHeight}
                      onChange={(e) => setEditHeight(parseInt(e.target.value, 10) || 72)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-rotation'>
                      {tl(t, 'tables.rotation', 'Rotation')}°
                    </Label>
                    <Input
                      id='edit-rotation'
                      type='number'
                      min={0}
                      max={360}
                      value={editRotation}
                      onChange={(e) => setEditRotation(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-size'>{tl(t, 'tables.width', 'Size')}</Label>
                    <Input
                      id='edit-size'
                      type='number'
                      min={40}
                      max={200}
                      value={editWidth}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 72;
                        setEditWidth(v);
                        if (editShape === 'Circle' || editShape === 'Square') setEditHeight(v);
                      }}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='edit-rotation2'>
                      {tl(t, 'tables.rotation', 'Rotation')}°
                    </Label>
                    <Input
                      id='edit-rotation2'
                      type='number'
                      min={0}
                      max={360}
                      value={editRotation}
                      onChange={(e) => setEditRotation(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
              )}

              {/* Status */}
              <div className='space-y-2'>
                <Label>{tl(t, 'common.status', 'Status')}</Label>
                <div className='flex gap-2'>
                  {TABLE_STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const Icon = cfg.icon;
                    return (
                      <Button
                        key={s}
                        variant={editStatus === s ? 'default' : 'outline'}
                        size='sm'
                        className='gap-1.5 flex-1'
                        onClick={() => setEditStatus(s)}
                      >
                        <Icon className='size-3.5' />
                        {statusLabel(t, s)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div className='space-y-2'>
                <Label>{tl(t, 'tables.color', 'Color')}</Label>
                <div className='flex flex-wrap gap-1.5'>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type='button'
                      onClick={() => setEditColorHex(preset.value)}
                      className={`size-7 rounded-full ring-1 ring-inset ring-border transition-all hover:scale-110 ${
                        editColorHex === preset.value
                          ? 'ring-2 ring-foreground scale-110'
                          : ''
                      }`}
                      style={{
                        backgroundColor: preset.value || 'var(--muted)',
                        backgroundImage: preset.value
                          ? 'none'
                          : 'linear-gradient(45deg, var(--muted) 25%, var(--muted-foreground) 25%, var(--muted-foreground) 50%, var(--muted) 50%)',
                      }}
                      title={preset.label}
                    />
                  ))}
                  {editColorHex && !COLOR_PRESETS.some((p) => p.value === editColorHex) && (
                    <div className='flex items-center gap-1.5'>
                      <input
                        type='color'
                        value={editColorHex}
                        onChange={(e) => setEditColorHex(e.target.value)}
                        className='size-7 cursor-pointer rounded-full border-0'
                      />
                      <span className='text-[10px] text-muted-foreground font-mono'>{editColorHex}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className='space-y-2'>
                <Label htmlFor='edit-description'>{tl(t, 'tables.description', 'Description')}</Label>
                <Textarea
                  id='edit-description'
                  placeholder={tl(t, 'tables.descriptionPlaceholder', 'Notes about this table...')}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className='resize-none'
                />
              </div>

              {/* Image */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label>Image</Label>
                  {editImageUrl && (
                    <span className='text-[11px] text-muted-foreground'>Has image</span>
                  )}
                </div>

                {editImageUrl && (
                  <div className='relative overflow-hidden rounded-xl border bg-muted/30 group/image'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editImageUrl}
                      alt='Table'
                      className='h-32 w-full object-cover'
                    />
                    <div className='absolute inset-0 bg-black/0 transition-colors group-hover/image:bg-black/20' />
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute top-1.5 right-1.5 size-7 bg-background/60 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background/80 group-hover/image:opacity-100'
                      onClick={() => { setEditImageUrl(''); setEditImageUrlInput(''); }}
                    >
                      <Icons.close className='size-3.5' />
                    </Button>
                  </div>
                )}

                <div className='space-y-1.5'>
                  <Label className='text-xs text-muted-foreground'>Upload file</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      type='file'
                      accept='image/*'
                      disabled={uploadImageMutation.isPending}
                      className='text-xs'
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const { url } = await uploadImageMutation.mutateAsync(file);
                          setEditImageUrl(url);
                          setEditImageUrlInput(url);
                        } catch {
                          toast.error('Failed to upload image');
                        }
                      }}
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs text-muted-foreground'>Or paste image URL</Label>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='https://example.com/image.jpg'
                      className='text-xs flex-1'
                      value={editImageUrlInput}
                      onChange={(e) => setEditImageUrlInput(e.target.value)}
                      onBlur={() => {
                        if (editImageUrlInput && editImageUrlInput !== editImageUrl) {
                          setEditImageUrl(editImageUrlInput);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editImageUrlInput && editImageUrlInput !== editImageUrl) {
                          setEditImageUrl(editImageUrlInput);
                        }
                      }}
                    />
                    <Button
                      variant='secondary'
                      size='sm'
                      className='shrink-0'
                      disabled={!editImageUrlInput || editImageUrlInput === editImageUrl}
                      onClick={() => setEditImageUrl(editImageUrlInput)}
                    >
                      <Icons.check className='size-3.5' />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Position info */}
              <div className='rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 p-3 ring-1 ring-border/50'>
                <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1'>
                  <Icons.dashboard className='size-3' />
                  Position
                </div>
                <p className='text-sm tabular-nums text-foreground/70'>
                  X: {currentEditTable.posX} · Y: {currentEditTable.posY} · {shapeLabel({ tables: t?.tables }, currentEditTable.shape)} · {currentEditTable.width}×{currentEditTable.height} · {currentEditTable.rotation}°
                </p>
              </div>

              <SheetFooter className='flex-row gap-2 pt-2 border-t'>
                <Button
                  variant='destructive'
                  size='sm'
                  className='gap-1.5'
                  onClick={() => { setEditing(null); setDeleteConfirm(currentEditTable.id); }}
                >
                  <Icons.trash className='size-3.5' />
                  {tl(t, 'common.delete', 'Delete')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-1.5'
                  onClick={handleDuplicate}
                >
                  <Icons.copy className='size-3.5' />
                  Duplicate
                </Button>
                <Button
                  size='sm'
                  className='gap-1.5 ml-auto'
                  isLoading={updateMutation.isPending}
                  onClick={handleEditSave}
                >
                  <Icons.check className='size-3.5' />
                  {tl(t, 'common.save', 'Save')}
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create table dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) setCreatePos(null); setShowCreate(open); }}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{tl(t, 'tables.addTable', 'Add Table')}</DialogTitle>
            <DialogDescription>
              {createPos
                ? `Place table at position X: ${createPos.x}, Y: ${createPos.y}`
                : 'Enter table details to create a new table.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label htmlFor='new-number'>{tl(t, 'tables.tableNumber', 'Table Number')}</Label>
                <Input
                  id='new-number'
                  type='number'
                  min={1}
                  placeholder='e.g. 11'
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-capacity'>{tl(t, 'tables.capacity', 'Capacity')}</Label>
                <Input
                  id='new-capacity'
                  type='number'
                  min={1}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || 4)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='new-area'>{tl(t, 'tables.area', 'Area')}</Label>
              <Input
                id='new-area'
                placeholder='e.g. Main Hall, Terrace'
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label>{tl(t, 'tables.shape', 'Shape')}</Label>
                <Select value={newShape} onValueChange={(v) => setNewShape(v as TableShape)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_SHAPES.map((shape) => (
                      <SelectItem key={shape} value={shape}>
                        {shapeLabel({ tables: t?.tables }, shape)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>{tl(t, 'tables.tableType', 'Table Type')}</Label>
                <Select value={newTableType} onValueChange={(v) => setNewTableType(v as TableTypeOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeLabel({ tables: t?.tables }, type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {createPos && (
              <div className='rounded-lg bg-muted/50 p-2.5 text-center text-sm text-muted-foreground'>
                Position: {Math.round(createPos.x * 100)}% / {Math.round(createPos.y * 100)}%
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => { setShowCreate(false); setCreatePos(null); }}>
              {tl(t, 'common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreate} isLoading={createMutation.isPending}>
              {tl(t, 'common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Background image dialog */}
      <Dialog open={showBackgroundDialog} onOpenChange={setShowBackgroundDialog}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Map Background — Floor {floor}</DialogTitle>
            <DialogDescription>
              Upload a floor plan image to use as reference behind your tables.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {background?.url && (
              <div className='overflow-hidden rounded-lg border bg-muted/30 relative'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={background.url}
                  alt='Current background'
                  loading='lazy'
                  decoding='async'
                  className='h-40 w-full object-cover'
                />
                <div className='absolute inset-0 rounded-lg ring-1 ring-inset ring-border/50 pointer-events-none' />
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='bg-upload' className='flex items-center gap-1.5'>
                <Icons.media className='size-3.5' />
                Upload image
              </Label>
              <Input
                id='bg-upload'
                type='file'
                accept='image/*'
                disabled={uploadBgMutation.isPending}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await uploadBgMutation.mutateAsync(file);
                    toast.success('Background updated');
                  } catch {
                    toast.error('Failed to upload background');
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className='flex-row justify-between'>
            {background?.url && (
              <Button
                variant='destructive'
                size='sm'
                className='gap-1.5'
                isLoading={deleteBgMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteBgMutation.mutateAsync();
                    toast.success('Background removed');
                  } catch {
                    toast.error('Failed to remove background');
                  }
                }}
              >
                <Icons.trash className='size-3.5' />
                Remove
              </Button>
            )}
            <Button variant='outline' size='sm' onClick={() => setShowBackgroundDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <Icons.warning className='size-5' />
              {tl(t, 'tables.confirmDelete', 'Delete table?')}
            </DialogTitle>
            <DialogDescription>
              {tl(t, 'tables.deleteWarning', 'This action cannot be undone. The table will be permanently removed.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteConfirm(null)}>
              {tl(t, 'common.cancel', 'Cancel')}
            </Button>
            <Button
              variant='destructive'
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {tl(t, 'common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
