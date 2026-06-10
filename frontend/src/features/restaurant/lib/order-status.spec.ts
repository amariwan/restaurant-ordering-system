import { describe, it, expect } from 'vitest';
import type { OrderStatus } from '@/features/restaurant/api/types';
import {
  statusLabel,
  statusVariant,
  nextStatuses,
  prevStatuses,
  nextStatusLabel
} from './order-status';

describe('order-status', () => {
  describe('statusLabel', () => {
    it('returns correct labels for each status', () => {
      expect(statusLabel('pending')).toBe('Pending');
      expect(statusLabel('preparing')).toBe('Preparing');
      expect(statusLabel('ready')).toBe('Ready');
      expect(statusLabel('served')).toBe('Served');
      expect(statusLabel('cancelled')).toBe('Cancelled');
    });

    it('returns status for unknown status', () => {
      expect(statusLabel('unknown' as OrderStatus)).toBe('unknown');
    });
  });

  describe('statusVariant', () => {
    it('returns correct variants', () => {
      expect(statusVariant('pending')).toBe('secondary');
      expect(statusVariant('preparing')).toBe('outline');
      expect(statusVariant('ready')).toBe('secondary');
      expect(statusVariant('served')).toBe('default');
      expect(statusVariant('cancelled')).toBe('destructive');
    });

    it('returns default for unknown status', () => {
      expect(statusVariant('unknown' as OrderStatus)).toBe('default');
    });
  });

  describe('nextStatuses', () => {
    it('returns [preparing] for pending', () => {
      expect(nextStatuses('pending')).toEqual(['preparing']);
    });

    it('returns [] for cancelled', () => {
      expect(nextStatuses('cancelled')).toEqual([]);
    });

    it('returns [] for served (last in flow before cancelled)', () => {
      expect(nextStatuses('served')).toEqual(['cancelled']);
    });

    it('returns [ready] for preparing', () => {
      expect(nextStatuses('preparing')).toEqual(['ready']);
    });
  });

  describe('prevStatuses', () => {
    it('returns [pending] for preparing', () => {
      expect(prevStatuses('preparing')).toEqual(['pending']);
    });

    it('returns [] for pending', () => {
      expect(prevStatuses('pending')).toEqual([]);
    });

    it('returns [ready] for served', () => {
      expect(prevStatuses('served')).toEqual(['ready']);
    });
  });

  describe('nextStatusLabel', () => {
    it('returns "Mark as Preparing" for pending', () => {
      expect(nextStatusLabel('pending')).toBe('Mark as Preparing');
    });

    it('returns null for cancelled', () => {
      expect(nextStatusLabel('cancelled')).toBeNull();
    });
  });
});
