/**
 * GPS WebSocket Client for Dashboard
 * Connects to WebSocket server as primary, with Supabase realtime as backup
 */
export class GPSWebSocketClient {
    constructor(wsUrl = 'ws://localhost:8080', supabaseClient, useWebsocketPrimary = true) {
        this.wsUrl = wsUrl;
        this.supabaseClient = supabaseClient;
        this.useWebsocketPrimary = useWebsocketPrimary;
        this.ws = null;
        this.supabaseChannel = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.reconnectTimer = null;
        this.gpsUpdateCallback = null;
        this.connectionStatusCallback = null;
        this.currentConnection = 'none';
        this.lastGPSData = null;
    }
    /**
     * Start the GPS client with WebSocket as primary, Supabase as backup
     */
    async start() {
        if (this.useWebsocketPrimary) {
            this.connectWebSocket();
        }
        else {
            this.connectSupabase();
        }
    }
    /**
     * Connect to WebSocket server (primary connection)
     */
    connectWebSocket() {
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
                    }
                    else if (message.type === 'connection_status') {
                        console.log('Connection status:', message.status);
                    }
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.handleConnectionError('websocket');
        }
    }
    /**
     * Connect to Supabase realtime (backup connection)
     */
    connectSupabase() {
        this.updateConnectionStatus({
            type: 'supabase',
            status: 'connecting'
        });
        try {
            this.supabaseChannel = this.supabaseClient
                .channel('gps-broadcast-channel')
                .on('broadcast', { event: 'gps_update' }, (payload) => {
                if (payload.data) {
                    this.handleGPSUpdate(payload.data);
                }
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Supabase realtime connected successfully');
                    this.currentConnection = 'supabase';
                    this.updateConnectionStatus({
                        type: 'supabase',
                        status: 'connected',
                        lastUpdate: new Date().toISOString()
                    });
                }
                else if (status === 'CHANNEL_ERROR') {
                    console.error('Supabase channel error');
                    this.handleConnectionError('supabase');
                }
            });
        }
        catch (error) {
            console.error('Error connecting to Supabase realtime:', error);
            this.handleConnectionError('supabase');
        }
    }
    /**
     * Handle connection errors and switch to backup
     */
    handleConnectionError(connectionType) {
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
            }
            else {
                console.log('Max WebSocket reconnection attempts reached, switching to Supabase');
                this.switchToSupabase();
            }
        }
        else if (connectionType === 'supabase') {
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
            }
            else {
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
    switchToSupabase() {
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
    switchToWebSocket() {
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
    handleGPSUpdate(data) {
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
    updateConnectionStatus(status) {
        if (this.connectionStatusCallback) {
            this.connectionStatusCallback(status);
        }
    }
    /**
     * Start heartbeat to keep WebSocket connection alive
     */
    startHeartbeat() {
        const heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
            else {
                clearInterval(heartbeatInterval);
            }
        }, 30000); // Send heartbeat every 30 seconds
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        // Heartbeat is cleared in the interval callback
    }
    /**
     * Set callback for GPS updates
     */
    onGPSUpdate(callback) {
        this.gpsUpdateCallback = callback;
        // Send last known GPS data if available
        if (this.lastGPSData) {
            callback(this.lastGPSData);
        }
    }
    /**
     * Set callback for connection status changes
     */
    onConnectionStatus(callback) {
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
    getCurrentConnection() {
        return this.currentConnection;
    }
    /**
     * Get last GPS data
     */
    getLastGPSData() {
        return this.lastGPSData;
    }
    /**
     * Stop the client and cleanup connections
     */
    stop() {
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
    requestCurrentGPS() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'request_current_gps' }));
        }
    }
}
//# sourceMappingURL=gps-websocket-client.js.map