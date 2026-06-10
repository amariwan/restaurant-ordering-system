import { z } from 'zod';

// --- Auth ---

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const signUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

// --- Menu ---

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  price: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'Price must be a positive number'),
  categoryId: z
    .union([z.number(), z.literal('')])
    .refine((val) => typeof val === 'number', 'Category is required')
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required')
});

// --- Table ---

export const tableSchema = z.object({
  number: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Table number must be a positive number')
});

// --- Payment ---

export const paymentSchema = z.object({
  amount: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount must be a positive number'),
  method: z.enum(['cash', 'card'])
});

// --- Order ---

export const orderItemSchema = z.object({
  menuItemId: z.number(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  note: z.string().optional()
});

export const createOrderSchema = z.object({
  tableId: z.number(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required')
});
