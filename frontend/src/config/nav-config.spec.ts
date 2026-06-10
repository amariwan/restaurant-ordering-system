import { describe, it, expect } from 'vitest';
import { navGroups } from './nav-config';

describe('nav-config', () => {
  it('exports an array with restaurant group', () => {
    expect(navGroups).toHaveLength(1);
    expect(navGroups[0].label).toBe('Restaurant');
  });

  it('has all expected nav items', () => {
    const items = navGroups[0].items;
    const titles = items.map((i) => i.title);
    expect(titles).toContain('Dashboard');
    expect(titles).toContain('Orders');
    expect(titles).toContain('Menu');
    expect(titles).toContain('Manage Menu');
    expect(titles).toContain('Kitchen');
    expect(titles).toContain('Cart');
    expect(titles).toContain('Users');
    expect(titles).toContain('Tables');
  });

  it('each item has url, icon, and shortcut', () => {
    for (const item of navGroups[0].items) {
      expect(item.url).toBeDefined();
      expect(item.icon).toBeDefined();
      expect(item.shortcut).toBeDefined();
      expect(item.shortcut).toHaveLength(2);
    }
  });

  it('has correct URLs', () => {
    const items = navGroups[0].items;
    expect(items.find((i) => i.title === 'Dashboard')!.url).toBe('/admin');
    expect(items.find((i) => i.title === 'Orders')!.url).toBe('/orders');
    expect(items.find((i) => i.title === 'Tables')!.url).toBe('/admin/tables');
  });
});
