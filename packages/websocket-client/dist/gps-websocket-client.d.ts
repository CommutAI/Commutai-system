/**
 * GPS WebSocket Client for Dashboard
 * Connects to WebSocket server as primary, with Supabase realtime as backup
 */
export interface GPSData {
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
export interface ConnectionStatus {
    type: 'websocket' | 'supabase' | 'none';
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
    lastUpdate?: string;
}
export declare class GPSWebSocketClient {
    private wsUrl;
    private supabaseClient;
    private useWebsocketPrimary;
    private ws;
    private supabaseChannel;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private reconnectTimer;
    private gpsUpdateCallback;
    private connectionStatusCallback;
    private currentConnection;
    private lastGPSData;
    constructor(wsUrl: string | undefined, supabaseClient: any, useWebsocketPrimary?: boolean);
    /**
     * Start the GPS client with WebSocket as primary, Supabase as backup
     */
    start(): Promise<void>;
    /**
     * Connect to WebSocket server (primary connection)
     */
    private connectWebSocket;
    /**
     * Connect to Supabase realtime (backup connection)
     */
    private connectSupabase;
    /**
     * Handle connection errors and switch to backup
     */
    private handleConnectionError;
    /**
     * Switch from WebSocket to Supabase connection
     */
    private switchToSupabase;
    /**
     * Switch from Supabase to WebSocket connection
     */
    private switchToWebSocket;
    /**
     * Handle incoming GPS data
     */
    private handleGPSUpdate;
    /**
     * Update connection status callback
     */
    private updateConnectionStatus;
    /**
     * Start heartbeat to keep WebSocket connection alive
     */
    private startHeartbeat;
    /**
     * Stop heartbeat
     */
    private stopHeartbeat;
    /**
     * Set callback for GPS updates
     */
    onGPSUpdate(callback: (data: GPSData) => void): void;
    /**
     * Set callback for connection status changes
     */
    onConnectionStatus(callback: (status: ConnectionStatus) => void): void;
    /**
     * Get current connection type
     */
    getCurrentConnection(): 'websocket' | 'supabase' | 'none';
    /**
     * Get last GPS data
     */
    getLastGPSData(): GPSData | null;
    /**
     * Stop the client and cleanup connections
     */
    stop(): void;
    /**
     * Manually request current GPS data
     */
    requestCurrentGPS(): void;
}
//# sourceMappingURL=gps-websocket-client.d.ts.map