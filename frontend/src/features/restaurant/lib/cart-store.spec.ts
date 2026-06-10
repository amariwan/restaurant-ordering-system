import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cart-store';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('addItem adds new item', () => {
    const item = { menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 };
    useCartStore.getState().addItem(item);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].menuItemId).toBe(1);
    expect(items[0].menuItemName).toBe('Pizza');
    expect(items[0].price).toBe(10);
    expect(items[0].quantity).toBe(1);
  });

  it('addItem increments quantity for existing item', () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 });
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('addItem with custom quantity', () => {
    useCartStore.getState().addItem({
      menuItemId: 1,
      menuItemName: 'Pizza',
      menuItemNameKu: 'پیتزا',
      price: 10,
      quantity: 3
    });

    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('removeItem removes item', () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 });
    useCartStore
      .getState()
      .addItem({ menuItemId: 2, menuItemName: 'Pasta', menuItemNameKu: 'پاستا', price: 8 });

    useCartStore.getState().removeItem(1);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].menuItemId).toBe(2);
  });

  it('updateQuantity increments', () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 });
    useCartStore.getState().updateQuantity(1, 2);

    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('updateQuantity decrements but min 1', () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 });
    useCartStore.getState().updateQuantity(1, -5);

    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('clear removes all items', () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10 });
    useCartStore
      .getState()
      .addItem({ menuItemId: 2, menuItemName: 'Pasta', menuItemNameKu: 'پاستا', price: 8 });

    useCartStore.getState().clear();

    expect(useCartStore.getState().items).toEqual([]);
  });

  it('total calculates sum', () => {
    useCartStore.getState().addItem({
      menuItemId: 1,
      menuItemName: 'Pizza',
      menuItemNameKu: 'پیتزا',
      price: 10,
      quantity: 2
    });
    useCartStore
      .getState()
      .addItem({ menuItemId: 2, menuItemName: 'Pasta', menuItemNameKu: 'پاستا', price: 8 });

    expect(useCartStore.getState().total()).toBe(28);
  });

  it('itemCount returns total quantity', () => {
    useCartStore.getState().addItem({
      menuItemId: 1,
      menuItemName: 'Pizza',
      menuItemNameKu: 'پیتزا',
      price: 10,
      quantity: 2
    });
    useCartStore
      .getState()
      .addItem({ menuItemId: 2, menuItemName: 'Pasta', menuItemNameKu: 'پاستا', price: 8 });

    expect(useCartStore.getState().itemCount()).toBe(3);
  });

  it('price is stored as number', () => {
    useCartStore
      .getState()
      .addItem({ menuItemId: 1, menuItemName: 'Pizza', menuItemNameKu: 'پیتزا', price: 10.5 });

    const price = useCartStore.getState().items[0].price;
    expect(price).toBeTypeOf('number');
    expect(price).toBe(10.5);
  });
});
