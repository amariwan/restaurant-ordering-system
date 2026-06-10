export type UserRole = 'Admin' | 'Waiter' | 'Kitchen';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type TableStatus = 'free' | 'occupied' | 'reserved';
export type PaymentMethod = 'cash' | 'card';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  status?: string;
}

export interface Category {
  id: number;
  nameEn: string;
  nameKu: string;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  categoryNameEn: string;
  categoryNameKu: string;
  nameEn: string;
  nameKu: string;
  price: number;
  available: boolean;
  descriptionEn?: string;
  descriptionKu?: string;
  imageUrl?: string;
}

export interface Table {
  id: number;
  number: number;
  status: TableStatus;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  menuItemNameKu: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: number;
  tableId: number;
  tableNumber: number;
  userId?: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface ApiError {
  status: number;
  message: string;
}

// --- Query filter types ---

export interface MenuFilters {
  categoryId?: number;
  available?: boolean;
}

export interface OrdersFilters {
  status?: OrderStatus;
  tableId?: number;
}

// --- Mutation payload types ---

export interface CreateCategoryPayload {
  nameEn: string;
  nameKu: string;
}

export interface UpdateCategoryPayload {
  nameEn: string;
  nameKu: string;
}

export interface CreateMenuItemPayload {
  categoryId: number;
  nameEn: string;
  nameKu: string;
  price: number;
  available: boolean;
  descriptionEn?: string;
  descriptionKu?: string;
  imageUrl?: string;
}

export interface UpdateMenuItemPayload {
  categoryId?: number;
  nameEn?: string;
  nameKu?: string;
  price?: number;
  available?: boolean;
  descriptionEn?: string;
  descriptionKu?: string;
  imageUrl?: string;
}

export interface CreateTablePayload {
  number: number;
  status?: TableStatus;
}

export interface UpdateTablePayload {
  number?: number;
  status?: TableStatus;
}

export interface CreateOrderPayload {
  tableId: number;
  items: Array<{ menuItemId: number; quantity: number; note?: string }>;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export interface AddOrderItemPayload {
  menuItemId: number;
  quantity: number;
  note?: string;
}

export interface CreatePaymentPayload {
  amount: number;
  method: PaymentMethod;
}

export interface UpdateUserPayload {
  role?: UserRole;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  status?: string;
}

// --- Reservations ---

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Reservation {
  id: number;
  tableId?: number;
  tableNumber: number;
  userId?: number;
  staffName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  guestCount: number;
  reservationTime: string;
  status: ReservationStatus;
  note?: string;
  createdAt: string;
}

export interface CreateReservationPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  guestCount?: number;
  reservationTime: string;
  note?: string;
}

export interface UpdateReservationPayload {
  tableId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  guestCount?: number;
  reservationTime?: string;
  note?: string;
}

export interface UpdateReservationStatusPayload {
  status: ReservationStatus;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  date?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// --- Paginated response ---

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
