import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockBuild = vi.fn();

vi.mock('@microsoft/signalr', () => {
  class MockHubConnectionBuilder {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    build() {
      return mockBuild();
    }
  }
  return {
    HubConnectionBuilder: MockHubConnectionBuilder,
    HubConnectionState: { Disconnected: 0, Connected: 1, Reconnecting: 2 }
  };
});

vi.mock('@/features/restaurant/lib/auth-store', () => ({
  getToken: vi.fn(() => 'mock-token')
}));

vi.mock('@/features/restaurant/api/service', () => ({
  SIGNALR_HUB_URL: 'http://127.0.0.1:5000/hubs/orders'
}));

import { getOrderHub, startOrderHub, stopOrderHub } from './signalr-store';

function makeMockHub(state = 0) {
  return {
    on: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    state
  };
}

describe('signalr-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await stopOrderHub();
    vi.restoreAllMocks();
  });

  describe('getOrderHub', () => {
    it('creates a new connection when none exists', () => {
      mockBuild.mockReturnValue(makeMockHub());

      const hub = getOrderHub();

      expect(hub).toBeDefined();
      expect(mockBuild).toHaveBeenCalled();
    });

    it('returns same connection on subsequent calls', () => {
      mockBuild.mockReturnValue(makeMockHub());

      const hub1 = getOrderHub();
      const hub2 = getOrderHub();

      expect(hub1).toBe(hub2);
      expect(mockBuild).toHaveBeenCalledTimes(1);
    });
  });

  describe('startOrderHub', () => {
    it('starts connection when disconnected', async () => {
      mockBuild.mockReturnValue(makeMockHub(0));
      getOrderHub();

      await startOrderHub();

      const hub = getOrderHub();
      expect(hub.start).toHaveBeenCalled();
    });

    it('does not start connection if already connected', async () => {
      mockBuild.mockReturnValue(makeMockHub(1));
      getOrderHub();

      await startOrderHub();

      const hub = getOrderHub();
      expect(hub.start).not.toHaveBeenCalled();
    });
  });

  describe('stopOrderHub', () => {
    it('stops and rebuilds on next get', async () => {
      mockBuild.mockReturnValue(makeMockHub(0));
      getOrderHub();

      await stopOrderHub();
      mockBuild.mockReturnValue(makeMockHub(0));
      const newHub = getOrderHub();

      expect(newHub.start).toBeDefined();
      expect(mockBuild).toHaveBeenCalledTimes(2);
    });
  });
});
