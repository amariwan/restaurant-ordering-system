import * as signalR from '@microsoft/signalr';
import { getToken } from '@/features/restaurant/lib/auth-store';
import { SIGNALR_HUB_URL } from '@/features/restaurant/api/service';

export type { OrderStatus } from '@/features/restaurant/api/types';

let connection: signalR.HubConnection | null = null;

export function getOrderHub(): signalR.HubConnection {
  if (!connection) {
    const url = SIGNALR_HUB_URL ?? '/hubs/orders';
    connection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => getToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export async function startOrderHub(): Promise<void> {
  const hub = getOrderHub();
  if (hub.state === signalR.HubConnectionState.Disconnected) {
    await hub.start();
  }
}

export async function stopOrderHub(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
