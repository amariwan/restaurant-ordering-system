import { describe, it, expect } from 'vitest';
import {
  signInSchema,
  signUpSchema,
  menuItemSchema,
  categorySchema,
  tableSchema,
  paymentSchema,
  orderItemSchema,
  createOrderSchema,
} from './restaurant';

describe('signInSchema', () => {
  it('accepts valid sign-in data', () => {
    const result = signInSchema.safeParse({ email: 'test@example.com', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts valid sign-up data', () => {
    const result = signUpSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = signUpSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword');
    }
  });

  it('rejects short password', () => {
    const result = signUpSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = signUpSchema.safeParse({
      name: '',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('menuItemSchema', () => {
  it('accepts valid menu item', () => {
    const result = menuItemSchema.safeParse({ name: 'Pizza', price: '12.5', categoryId: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(12.5);
    }
  });

  it('rejects empty name', () => {
    const result = menuItemSchema.safeParse({ name: '', price: '10', categoryId: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive price', () => {
    const result = menuItemSchema.safeParse({ name: 'Pizza', price: '0', categoryId: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = menuItemSchema.safeParse({ name: 'Pizza', price: '-5', categoryId: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects empty category', () => {
    const result = menuItemSchema.safeParse({ name: 'Pizza', price: '10', categoryId: '' });
    expect(result.success).toBe(false);
  });
});

describe('categorySchema', () => {
  it('accepts valid category', () => {
    const result = categorySchema.safeParse({ name: 'Appetizers' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = categorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('tableSchema', () => {
  it('accepts valid table number', () => {
    const result = tableSchema.safeParse({ number: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.number).toBe(5);
    }
  });

  it('rejects non-positive number', () => {
    const result = tableSchema.safeParse({ number: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects NaN', () => {
    const result = tableSchema.safeParse({ number: 'abc' });
    expect(result.success).toBe(false);
  });
});

describe('paymentSchema', () => {
  it('accepts cash payment', () => {
    const result = paymentSchema.safeParse({ amount: '25', method: 'cash' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(25);
    }
  });

  it('accepts card payment', () => {
    const result = paymentSchema.safeParse({ amount: '50', method: 'card' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid method', () => {
    const result = paymentSchema.safeParse({ amount: '25', method: 'bitcoin' });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = paymentSchema.safeParse({ amount: '0', method: 'cash' });
    expect(result.success).toBe(false);
  });
});

describe('orderItemSchema', () => {
  it('accepts valid order item', () => {
    const result = orderItemSchema.safeParse({ menuItemId: 1, quantity: 2 });
    expect(result.success).toBe(true);
  });

  it('accepts item with optional note', () => {
    const result = orderItemSchema.safeParse({ menuItemId: 1, quantity: 2, note: 'no onions' });
    expect(result.success).toBe(true);
  });

  it('rejects quantity less than 1', () => {
    const result = orderItemSchema.safeParse({ menuItemId: 1, quantity: 0 });
    expect(result.success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  it('accepts valid order', () => {
    const result = createOrderSchema.safeParse({
      tableId: 1,
      items: [{ menuItemId: 1, quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects order with no items', () => {
    const result = createOrderSchema.safeParse({ tableId: 1, items: [] });
    expect(result.success).toBe(false);
  });
});
