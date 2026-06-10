import { describe, it, expect, beforeAll } from 'vitest';
import { getQueryClient } from './query-client';

describe('getQueryClient', () => {
  beforeAll(() => {
    // Ensure we're in a client-like environment for these tests
    // isServer from @tanstack/react-query checks typeof window === 'undefined'
  });

  it('returns a QueryClient instance', () => {
    const client = getQueryClient();
    expect(client).toBeDefined();
    expect(client.getQueryCache()).toBeDefined();
  });

  it('returns the same instance on subsequent calls', () => {
    const client1 = getQueryClient();
    const client2 = getQueryClient();
    expect(client1).toBe(client2);
  });

  it('has default staleTime of 60000ms', () => {
    const client = getQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(60000);
  });

  it('has dehydrate shouldDehydrateQuery function', () => {
    const client = getQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.dehydrate?.shouldDehydrateQuery).toBeDefined();
  });
});
