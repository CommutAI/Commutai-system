/**
 * GPS WebSocket Server for Raspberry Pi
 * Runs on the Raspberry Pi to broadcast GPS data to connected dashboard clients
 * 
 * Usage: node gps-websocket-server.js [port]
 * Default port: 8080
 */

const WebSocket = require('ws');
const http = require('http');

// Configuration
const PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

// Create HTTP server for health checks
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      connectedClients: wss.clients.size 
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server: httpServer });

// Store connected clients and their last heartbeat
const clients = new Map();

// GPS data buffer (store last known GPS data)
let lastGPSData = null;

// Helper function to broadcast GPS data to all connected clients
function broadcastGPSData(gpsData) {
  const message = JSON.stringify({
    type: 'gps_update',
    data: gpsData,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending to client:', error);
        clients.delete(client);
      }
    }
  });
}

// Helper function to send connection status to a specific client
function sendConnectionStatus(client, status) {
  const message = JSON.stringify({
    type: 'connection_status',
    status: status,
    timestamp: new Date().toISOString()
  });

  if (client.readyState === WebSocket.OPEN) {
    try {
      client.send(message);
    } catch (error) {
      console.error('Error sending status to client:', error);
    }
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`New client connected from ${clientIP}`);
  
  // Store client with heartbeat timestamp
  clients.set(ws, {
    connectedAt: new Date(),
    lastHeartbeat: new Date()
  });

  // Send current connection status
  sendConnectionStatus(ws, 'connected');

  // Send last known GPS data if available
  if (lastGPSData) {
    ws.send(JSON.stringify({
      type: 'gps_update',
      data: lastGPSData,
      timestamp: new Date().toISOString()
    }));
  }

  // Handle incoming messages (could be used for commands from dashboard)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message from client:', data);

      // Handle different message types
      switch (data.type) {
        case 'heartbeat':
          clients.get(ws).lastHeartbeat = new Date();
          break;
        case 'request_current_gps':
          if (lastGPSData) {
            broadcastGPSData(lastGPSData);
          }
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client disconnected from ${clientIP}`);
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Public API to update GPS data (can be called from your GPS reading script)
function updateGPSData(gpsData) {
  lastGPSData = gpsData;
  broadcastGPSData(gpsData);
  console.log('GPS data updated and broadcasted:', gpsData);
}

// Make the update function available globally (for external scripts)
global.updateGPSData = updateGPSData;

// Start the server
httpServer.listen(PORT, () => {
  console.log(`GPS WebSocket Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Cleanup disconnected clients periodically
setInterval(() => {
  const now = new Date();
  const timeout = 30000; // 30 seconds timeout

  wss.clients.forEach((client) => {
    const clientData = clients.get(client);
    if (clientData && (now - clientData.lastHeartbeat) > timeout) {
      console.log('Client timeout, disconnecting...');
      client.terminate();
      clients.delete(client);
    }
  });
}, 10000); // Check every 10 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  wss.clients.forEach((client) => {
    client.close();
  });
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  wss.clients.forEach((client) => {
    client.close();
  });
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { updateGPSData };