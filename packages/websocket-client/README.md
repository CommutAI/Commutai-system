# GPS WebSocket Client

WebSocket client for receiving GPS data with automatic fallback to Supabase realtime.

## Features

- **Primary Connection:** WebSocket for low-latency real-time GPS data
- **Backup Connection:** Supabase realtime for reliability
- **Automatic Failover:** Switches to backup if primary connection fails
- **Reconnection Logic:** Automatic reconnection with exponential backoff
- **Connection Status:** Real-time connection status monitoring
- **Type Safety:** Full TypeScript support

## Installation

```bash
cd packages/websocket-client
npm install
```

## Usage

### Basic Usage

```typescript
import { GPSWebSocketClient } from '@commutai/websocket-client';
import { supabase } from '@commutai/supabase';

const gpsClient = new GPSWebSocketClient(
  'ws://localhost:8080',  // WebSocket URL
  supabase,                // Supabase client
  true                     // Use WebSocket as primary
);

// Start the client
gpsClient.start();

// Handle GPS updates
gpsClient.onGPSUpdate((data) => {
  console.log('GPS Update:', data);
  // Update your UI with new GPS data
});

// Monitor connection status
gpsClient.onConnectionStatus((status) => {
  console.log('Connection Status:', status);
  // Update UI to show connection status
});

// Stop the client when done
gpsClient.stop();
```

### Integration with React

```typescript
import { useEffect, useState } from 'react';
import { GPSWebSocketClient, GPSData, ConnectionStatus } from '@commutai/websocket-client';
import { supabase } from '@commutai/supabase';

function GPSComponent() {
  const [gpsData, setGPSData] = useState<GPSData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    const gpsClient = new GPSWebSocketClient(
      'ws://localhost:8080',
      supabase,
      true
    );

    gpsClient.start();

    gpsClient.onGPSUpdate((data) => {
      setGPSData(data);
    });

    gpsClient.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    return () => {
      gpsClient.stop();
    };
  }, []);

  return (
    <div>
      <div>Connection: {connectionStatus?.type} ({connectionStatus?.status})</div>
      {gpsData && (
        <div>
          <div>Latitude: {gpsData.latitude}</div>
          <div>Longitude: {gpsData.longitude}</div>
        </div>
      )}
    </div>
  );
}
```

## API

### Constructor

```typescript
new GPSWebSocketClient(
  wsUrl: string = 'ws://localhost:8080',
  supabaseClient: any,
  useWebsocketPrimary: boolean = true
)
```

- `wsUrl`: WebSocket server URL
- `supabaseClient`: Supabase client instance
- `useWebsocketPrimary`: Whether to use WebSocket as primary connection

### Methods

#### `start(): Promise<void>`
Start the GPS client with automatic connection management.

#### `stop(): void`
Stop the client and cleanup all connections.

#### `onGPSUpdate(callback: (data: GPSData) => void): void`
Set callback for GPS updates. Will immediately call with last known data if available.

#### `onConnectionStatus(callback: (status: ConnectionStatus) => void): void`
Set callback for connection status changes.

#### `getCurrentConnection(): 'websocket' | 'supabase' | 'none'`
Get the current active connection type.

#### `getLastGPSData(): GPSData | null`
Get the last received GPS data.

#### `requestCurrentGPS(): void`
Manually request current GPS data from the server.

## Types

### GPSData

```typescript
interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  satelliteCount?: number;
  source: string;
  trip_id?: string;
  bus_id?: string;
  recorded_at?: string;
}
```

### ConnectionStatus

```typescript
interface ConnectionStatus {
  type: 'websocket' | 'supabase' | 'none';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastUpdate?: string;
}
```

## Connection Flow

1. **Initial Connection:** Attempts WebSocket connection first
2. **Primary Failure:** If WebSocket fails, attempts reconnection (up to 5 times)
3. **Fallback:** After max reconnection attempts, switches to Supabase
4. **Backup Recovery:** If WebSocket becomes available again, can switch back
5. **Status Updates:** Provides real-time connection status updates

## Configuration

### Reconnection Settings

The client uses exponential backoff for reconnection:

- **Max Attempts:** 5
- **Initial Delay:** 1 second
- **Backoff Multiplier:** Each attempt doubles the delay

You can modify these in the source code if needed.

### WebSocket URL

Default: `ws://localhost:8080`

For production, use your actual WebSocket server URL:
```typescript
const gpsClient = new GPSWebSocketClient(
  'ws://your-raspberry-pi-ip:8080',
  supabase,
  true
);
```

## Error Handling

The client automatically handles:
- Connection failures
- Network interruptions
- Server unavailability
- Message parsing errors

All errors are logged to console and trigger appropriate reconnection logic.

## Supabase Setup

For the backup connection to work, you need to set up Supabase realtime:

1. Enable Realtime in your Supabase project
2. Create a broadcast channel called `gps-broadcast-channel`
3. Ensure your Supabase client has proper permissions

```typescript
// Raspberry Pi side (using Supabase client to broadcast)
await supabase.channel('gps-broadcast-channel')
  .send({
    type: 'broadcast',
    event: 'gps_update',
    payload: { data: gpsData }
  });
```

## Testing

### Mock WebSocket Server

For testing without a real WebSocket server, you can use a mock:

```typescript
const mockWs = {
  onopen: () => {},
  onmessage: () => {},
  onerror: () => {},
  onclose: () => {},
  send: () => {},
  close: () => {}
};
```

### Test GPS Data

```typescript
const testGPSData = {
  latitude: 8.428123,
  longitude: 124.761456,
  source: 'test',
  trip_id: 'TEST-001'
};
```

## Performance Considerations

- **WebSocket:** Sub-second latency, ideal for real-time tracking
- **Supabase:** 1-2 second latency, good for backup
- **Network:** Both connections require stable internet
- **Bandwidth:** Minimal - GPS data is small (< 1KB per update)

## Troubleshooting

### WebSocket Connection Fails

1. Check WebSocket server is running
2. Verify URL and port
3. Check firewall settings
4. Ensure network connectivity

### Supabase Connection Fails

1. Verify Supabase credentials
2. Check Realtime is enabled
3. Ensure channel name matches
4. Check network connectivity

### No GPS Data Received

1. Check connection status
2. Verify GPS data source is sending data
3. Check browser console for errors
4. Test with manual `requestCurrentGPS()` call

## License

MIT