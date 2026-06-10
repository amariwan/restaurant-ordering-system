import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency } from './format';

describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    expect(result).toBe('June 15, 2024');
  });

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(42.5)).toBe('$42.50');
  });

  it('handles string input', () => {
    expect(formatCurrency('19.99')).toBe('$19.99');
  });

  it('returns $0.00 for NaN', () => {
    expect(formatCurrency(NaN)).toBe('$0.00');
  });

  it('accepts custom symbol', () => {
    expect(formatCurrency(42.5, '€')).toBe('€42.50');
  });
});
