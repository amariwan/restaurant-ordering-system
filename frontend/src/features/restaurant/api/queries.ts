import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateTablePayload,
  UpdateTablePayload,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  AddOrderItemPayload,
  CreatePaymentPayload,
  UpdateUserPayload,
  OrdersFilters,
  CreateReservationPayload,
  UpdateReservationPayload,
  UpdateReservationStatusPayload,
  ReservationFilters,
  ReorderItemRequest,
  CreateWallPayload,
  TablePositionUpdate,
} from './types';
import * as service from './service';

// --- Query Keys ---

const ROOT_KEY = ['restaurant'] as const;

export const keys = {
  all: ROOT_KEY,
  menu: {
    all: [...ROOT_KEY, 'menu'] as const,
    categories: [...ROOT_KEY, 'menu', 'categories'] as const,
    items: [...ROOT_KEY, 'menu', 'items'] as const
  },
  tables: {
    all: [...ROOT_KEY, 'tables'] as const,
    byId: (id: number) => [...ROOT_KEY, 'tables', id] as const,
    byFloor: (floor: number) => [...ROOT_KEY, 'tables', 'floor', floor] as const,
  },
  orders: {
    all: [...ROOT_KEY, 'orders'] as const,
    list: (filters?: OrdersFilters) => [...ROOT_KEY, 'orders', 'list', filters] as const,
    detail: (id: number) => [...ROOT_KEY, 'orders', 'detail', id] as const
  },
  payments: {
    all: [...ROOT_KEY, 'payments'] as const,
    byOrder: (orderId: number) => [...ROOT_KEY, 'payments', orderId] as const
  },
  receipts: {
    all: [...ROOT_KEY, 'receipts'] as const,
    byId: (id: number) => [...ROOT_KEY, 'receipts', id] as const,
    byOrder: (orderId: number) => [...ROOT_KEY, 'receipts', 'by-order', orderId] as const
  },
  users: {
    all: [...ROOT_KEY, 'users'] as const
  },
  reservations: {
    all: [...ROOT_KEY, 'reservations'] as const,
    list: (filters?: ReservationFilters) => [...ROOT_KEY, 'reservations', 'list', filters] as const,
    detail: (id: number) => [...ROOT_KEY, 'reservations', 'detail', id] as const
  },
  settings: {
    all: [...ROOT_KEY, 'settings'] as const,
    mapBackground: [...ROOT_KEY, 'settings', 'mapBackground'] as const,
    mapBackgroundByFloor: (floor: number) => [...ROOT_KEY, 'settings', 'mapBackground', floor] as const,
  },
  walls: {
    all: [...ROOT_KEY, 'walls'] as const,
    byFloor: (floor: number) => [...ROOT_KEY, 'walls', floor] as const,
  }
} as const;

// --- Query Options ---

export const menuCategoriesOptions = queryOptions({
  queryKey: keys.menu.categories,
  queryFn: service.menuGetCategories
});

export const menuItemsOptions = (filters?: { categoryId?: number; available?: boolean }) =>
  queryOptions({
    queryKey: [...keys.menu.items, filters],
    queryFn: () => service.menuGetItems(filters)
  });

export const tablesAllOptions = (floor?: number) => queryOptions({
  queryKey: floor ? keys.tables.byFloor(floor) : keys.tables.all,
  queryFn: () => service.tablesGetAll(floor),
});

export const ordersAllOptions = (filters?: OrdersFilters) =>
  queryOptions({
    queryKey: keys.orders.list(filters),
    queryFn: () => service.ordersGetAll(filters)
  });

export const ordersDetailOptions = (orderId: number) =>
  queryOptions({
    queryKey: keys.orders.detail(orderId),
    queryFn: () => service.ordersGetById(orderId)
  });

export const paymentsByOrderOptions = (orderId: number) =>
  queryOptions({
    queryKey: keys.payments.byOrder(orderId),
    queryFn: () => service.paymentsGetByOrder(orderId)
  });

export const receiptByOrderOptions = (orderId: number) =>
  queryOptions({
    queryKey: keys.receipts.byOrder(orderId),
    queryFn: () => service.receiptsGetByOrder(orderId)
  });

export const usersAllOptions = queryOptions({
  queryKey: keys.users.all,
  queryFn: () => service.usersGetAll()
});

// --- Reservations ---

export const reservationsAllOptions = (filters?: ReservationFilters) =>
  queryOptions({
    queryKey: keys.reservations.list(filters),
    queryFn: () => service.reservationsGetAll(filters)
  });

export const reservationDetailOptions = (id: number) =>
  queryOptions({
    queryKey: keys.reservations.detail(id),
    queryFn: () => service.reservationsGetById(id)
  });

export function useReservationsCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservationPayload) => service.reservationsCreate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.reservations.all })
  });
}

export function useReservationsUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReservationPayload }) =>
      service.reservationsUpdate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.reservations.all })
  });
}

export function useReservationsUpdateStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReservationStatusPayload }) =>
      service.reservationsUpdateStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.reservations.all })
  });
}

export function useReservationsDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.reservationsDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.reservations.all })
  });
}

// --- Settings ---

export const mapBackgroundOptions = (floor = 1) => queryOptions({
  queryKey: keys.settings.mapBackgroundByFloor(floor),
  queryFn: () => service.getMapBackground(floor),
  staleTime: Infinity,
  retry: false,
});

export const wallsOptions = (floor: number) => queryOptions({
  queryKey: keys.walls.byFloor(floor),
  queryFn: () => service.wallsGetByFloor(floor),
  staleTime: 30000,
});

export function useUploadMapBackgroundMutation(floor = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => service.uploadMapBackground(file, floor),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings.mapBackgroundByFloor(floor) })
  });
}

export function useDeleteMapBackgroundMutation(floor = 1) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => service.deleteMapBackground(floor),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings.mapBackgroundByFloor(floor) })
  });
}

// --- Mutations ---

export function useMenuCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => service.menuCreateCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.menu.categories })
  });
}

export function useMenuUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryPayload }) =>
      service.menuUpdateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.menu.categories })
  });
}

export function useMenuDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.menuDeleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.menu.categories });
      qc.invalidateQueries({ queryKey: keys.menu.items });
    }
  });
}

export function useMenuCreateItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuItemPayload) => service.menuCreateItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.menu.items });
    }
  });
}

export function useMenuUpdateItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMenuItemPayload }) =>
      service.menuUpdateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.menu.items })
  });
}

export function useMenuDeleteItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.menuDeleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.menu.items })
  });
}

export function useMenuReorderCategoriesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderItemRequest[]) => service.menuReorderCategories(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.menu.categories })
  });
}

export function useMenuReorderItemsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderItemRequest[]) => service.menuReorderItems(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.menu.items })
  });
}

export function useTablesCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTablePayload) => service.tablesCreate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables.all })
  });
}

export function useTablesUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTablePayload }) =>
      service.tablesUpdate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables.all })
  });
}

export function useTablesUploadImageMutation() {
  return useMutation({
    mutationFn: (file: File) => service.tablesUploadImage(file),
  });
}

export function useTablesDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.tablesDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables.all })
  });
}

export function useTablesBulkDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => service.tablesBulkDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables.all })
  });
}

export function useTablesBulkUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: UpdateTablePayload }) =>
      service.tablesBulkUpdate(ids, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables.all })
  });
}

export function useTablesBulkMoveMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (positions: TablePositionUpdate[]) =>
      service.tablesBulkMove(positions),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables.all })
  });
}

// --- Wall Mutations ---

export function useWallsCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWallPayload) => service.wallsCreate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.walls.all })
  });
}

export function useWallsUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateWallPayload }) =>
      service.wallsUpdate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.walls.all })
  });
}

export function useWallsDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.wallsDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.walls.all })
  });
}

export function useWallsBulkDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => service.wallsBulkDelete(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.walls.all })
  });
}

export function useOrdersUpdateStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusPayload }) =>
      service.ordersUpdateStatus(id, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: keys.orders.detail(id) }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.orders.all });
      qc.invalidateQueries({ queryKey: keys.tables.all });
    }
  });
}

export function useOrdersCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderPayload) => service.ordersCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.orders.all });
      qc.invalidateQueries({ queryKey: keys.tables.all });
    }
  });
}

export function useOrdersRemoveItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: number; itemId: number }) =>
      service.ordersRemoveItem(orderId, itemId),
    onSettled: (_, __, { orderId }) => {
      qc.invalidateQueries({ queryKey: keys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: keys.orders.all });
    }
  });
}

export function useOrdersAddItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: AddOrderItemPayload }) =>
      service.ordersAddItem(orderId, data),
    onSettled: (_, __, { orderId }) => {
      qc.invalidateQueries({ queryKey: keys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: keys.orders.all });
    }
  });
}

export function usePaymentsCreateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: CreatePaymentPayload }) =>
      service.paymentsCreate(orderId, data),
    onSettled: (_, __, { orderId }) => {
      qc.invalidateQueries({ queryKey: keys.payments.byOrder(orderId) });
      qc.invalidateQueries({ queryKey: keys.orders.detail(orderId) });
      qc.invalidateQueries({ queryKey: keys.orders.all });
    }
  });
}

export function useReceiptsGenerateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => service.receiptsGenerate(orderId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.receipts.byOrder(data.orderId) });
      qc.setQueryData(keys.receipts.byId(data.id), data);
    }
  });
}

export function useUsersUpdateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserPayload }) =>
      service.usersUpdate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.users.all })
  });
}

export function useUsersDeleteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => service.usersDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.users.all })
  });
}
