import { describe, it, expect } from 'vitest';
import { cn, formatBytes } from './utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    const showHidden = false;
    expect(cn('base', showHidden && 'hidden', 'visible')).toBe('base visible');
  });
});

describe('formatBytes', () => {
  it('returns correct human-readable size', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('with accurate size type uses KiB/MiB', () => {
    expect(formatBytes(1024, { sizeType: 'accurate' })).toBe('1 KiB');
    expect(formatBytes(1048576, { sizeType: 'accurate' })).toBe('1 MiB');
  });

  it('handles 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Byte');
  });
});
