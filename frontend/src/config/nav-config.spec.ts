import { describe, it, expect } from 'vitest';
import { navGroups } from './nav-config';

describe('nav-config', () => {
  it('exports three groups: Operations, Kitchen, Administration', () => {
    expect(navGroups).toHaveLength(3);
    expect(navGroups[0].label).toBe('Operations');
    expect(navGroups[1].label).toBe('Kitchen');
    expect(navGroups[2].label).toBe('Administration');
  });

  it('has all expected nav items across groups', () => {
    const allItems = navGroups.flatMap((g) => g.items);
    const titles = allItems.map((i) => i.title);
    expect(titles).toContain('Dashboard');
    expect(titles).toContain('Orders');
    expect(titles).toContain('Menu');
    expect(titles).toContain('Manage Menu');
    expect(titles).toContain('Kitchen View');
    expect(titles).toContain('Cart');
    expect(titles).toContain('Users');
    expect(titles).toContain('Tables');
    expect(titles).toContain('Reservations');
  });

  it('each item has url and icon', () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        expect(item.url).toBeDefined();
        expect(item.icon).toBeDefined();
      }
    }
  });

  it('has correct URLs', () => {
    const allItems = navGroups.flatMap((g) => g.items);
    expect(allItems.find((i) => i.title === 'Dashboard')!.url).toBe('/admin');
    expect(allItems.find((i) => i.title === 'Orders')!.url).toBe('/orders');
    expect(allItems.find((i) => i.title === 'Tables')!.url).toBe('/admin/tables');
  });
});
