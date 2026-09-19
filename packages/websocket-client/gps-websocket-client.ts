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

export class GPSWebSocketClient {
  private ws: WebSocket | null = null;
  private supabaseChannel: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private gpsUpdateCallback: ((data: GPSData) => void) | null = null;
  private connectionStatusCallback: ((status: ConnectionStatus) => void) | null = null;
  private currentConnection: 'websocket' | 'supabase' | 'none' = 'none';
  private lastGPSData: GPSData | null = null;

  constructor(
    private wsUrl: string = 'ws://localhost:8080',
    private supabaseClient: any,
    private useWebsocketPrimary: boolean = true
  ) {}

  /**
   * Start the GPS client with WebSocket as primary, Supabase as backup
   */
  async start(): Promise<void> {
    if (this.useWebsocketPrimary) {
      this.connectWebSocket();
    } else {
      this.connectSupabase();
    }
  }

  /**
   * Connect to WebSocket server (primary connection)
   */
  private connectWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.updateConnectionStatus({
      type: 'websocket',
      status: 'connecting'
    });

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.currentConnection = 'websocket';
        this.updateConnectionStatus({
          type: 'websocket',
          status: 'connected',
          lastUpdate: new Date().toISOString()
        });

        // Send heartbeat periodically
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'gps_update' && message.data) {
            this.handleGPSUpdate(message.data);
          } else if (message.type === 'connection_status') {
            console.log('Connection status:', message.status);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.handleConnectionError('websocket');
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.handleConnectionError('websocket');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.handleConnectionError('websocket');
    }
  }

  /**
   * Connect to Supabase realtime (backup connection)
   */
  private connectSupabase(): void {
    this.updateConnectionStatus({
      type: 'supabase',
      status: 'connecting'
    });

    try {
      this.supabaseChannel = this.supabaseClient
        .channel('gps-broadcast-channel')
        .on('broadcast', { event: 'gps_update' }, (payload: any) => {
          if (payload.data) {
            this.handleGPSUpdate(payload.data);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Supabase realtime connected successfully');
            this.currentConnection = 'supabase';
            this.updateConnectionStatus({
              type: 'supabase',
              status: 'connected',
              lastUpdate: new Date().toISOString()
            });
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Supabase channel error');
            this.handleConnectionError('supabase');
          }
        });
    } catch (error) {
      console.error('Error connecting to Supabase realtime:', error);
      this.handleConnectionError('supabase');
    }
  }

  /**
   * Handle connection errors and switch to backup
   */
  private handleConnectionError(connectionType: 'websocket' | 'supabase'): void {
    this.updateConnectionStatus({
      type: connectionType,
      status: 'disconnected'
    });

    // If WebSocket failed, try to reconnect first, then fallback to Supabase
    if (connectionType === 'websocket' && this.useWebsocketPrimary) {
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }
        
        this.reconnectTimer = setTimeout(() => {
          this.connectWebSocket();
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.log('Max WebSocket reconnection attempts reached, switching to Supabase');
        this.switchToSupabase();
      }
    } else if (connectionType === 'supabase') {
      // If Supabase fails, try to reconnect
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Attempting to reconnect Supabase (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }
        
        this.reconnectTimer = setTimeout(() => {
          this.connectSupabase();
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.log('All connection attempts failed');
        this.updateConnectionStatus({
          type: 'none',
          status: 'error'
        });
      }
    }
  }

  /**
   * Switch from WebSocket to Supabase connection
   */
  private switchToSupabase(): void {
    console.log('Switching to Supabase realtime connection');
    
    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear heartbeat
    this.stopHeartbeat();
    
    // Connect to Supabase
    this.connectSupabase();
  }

  /**
   * Switch from Supabase to WebSocket connection
   */
  private switchToWebSocket(): void {
    console.log('Switching to WebSocket connection');
    
    // Close Supabase connection
    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
      this.supabaseChannel = null;
    }
    
    // Reset reconnection attempts
    this.reconnectAttempts = 0;
    
    // Connect to WebSocket
    this.connectWebSocket();
  }

  /**
   * Handle incoming GPS data
   */
  private handleGPSUpdate(data: any): void {
    this.lastGPSData = data;
    
    if (this.gpsUpdateCallback) {
      this.gpsUpdateCallback(data);
    }
    
    this.updateConnectionStatus({
      type: this.currentConnection,
      status: 'connected',
      lastUpdate: new Date().toISOString()
    });
  }

  /**
   * Update connection status callback
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback(status);
    }
  }

  /**
   * Start heartbeat to keep WebSocket connection alive
   */
  private startHeartbeat(): void {
    const heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    // Heartbeat is cleared in the interval callback
  }

  /**
   * Set callback for GPS updates
   */
  onGPSUpdate(callback: (data: GPSData) => void): void {
    this.gpsUpdateCallback = callback;
    
    // Send last known GPS data if available
    if (this.lastGPSData) {
      callback(this.lastGPSData);
    }
  }

  /**
   * Set callback for connection status changes
   */
  onConnectionStatus(callback: (status: ConnectionStatus) => void): void {
    this.connectionStatusCallback = callback;
    
    // Send current status
    this.updateConnectionStatus({
      type: this.currentConnection,
      status: this.currentConnection === 'none' ? 'disconnected' : 'connected'
    });
  }

  /**
   * Get current connection type
   */
  getCurrentConnection(): 'websocket' | 'supabase' | 'none' {
    return this.currentConnection;
  }

  /**
   * Get last GPS data
   */
  getLastGPSData(): GPSData | null {
    return this.lastGPSData;
  }

  /**
   * Stop the client and cleanup connections
   */
  stop(): void {
    console.log('Stopping GPS WebSocket client');
    
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Close Supabase connection
    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
      this.supabaseChannel = null;
    }
    
    this.currentConnection = 'none';
    this.updateConnectionStatus({
      type: 'none',
      status: 'disconnected'
    });
  }

  /**
   * Manually request current GPS data
   */
  requestCurrentGPS(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'request_current_gps' }));
    }
  }
}