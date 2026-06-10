import { describe, it, expect } from 'vitest';
import { ROLE_OPTIONS } from './options';

describe('ROLE_OPTIONS', () => {
  it('has 3 role options', () => {
    expect(ROLE_OPTIONS).toHaveLength(3);
  });

  it('contains Admin option', () => {
    expect(ROLE_OPTIONS).toContainEqual({ value: 'Admin', label: 'Admin' });
  });

  it('contains Waiter option', () => {
    expect(ROLE_OPTIONS).toContainEqual({ value: 'Waiter', label: 'Waiter' });
  });

  it('contains Kitchen option', () => {
    expect(ROLE_OPTIONS).toContainEqual({ value: 'Kitchen', label: 'Kitchen' });
  });

  it('each option has value matching label', () => {
    for (const opt of ROLE_OPTIONS) {
      expect(opt.value).toBe(opt.label);
    }
  });
});
