# GPS WebSocket Server

WebSocket server for broadcasting GPS data from Raspberry Pi to dashboard clients.

## Installation

```bash
cd packages/websocket-server
npm install
```

## Usage

### Basic Usage

```bash
npm start
```

This will start the WebSocket server on port 8080 by default.

### Custom Port

```bash
PORT=3000 npm start
```

### With GPS Reader

```bash
node gps-reader-example.js
```

## Integration with Raspberry Pi

1. **Install dependencies on Raspberry Pi:**
   ```bash
   npm install ws
   ```

2. **Run the server:**
   ```bash
   node gps-websocket-server.js
   ```

3. **Integrate with your GPS hardware:**
   - Modify `gps-reader-example.js` to read from your actual GPS hardware
   - Call `updateGPSData(gpsData)` whenever new GPS data is available

## API

### Server Endpoints

- **WebSocket:** `ws://localhost:8080` (or your configured port)
- **Health Check:** `http://localhost:8080/health`

### GPS Data Format

```javascript
{
  latitude: 8.428123,
  longitude: 124.761456,
  altitude: 150.5,
  speed: 45.2,
  heading: 180.5,
  accuracy: 5.2,
  satelliteCount: 12,
  source: 'raspberry-pi-gps',
  trip_id: 'TRIP-001',
  bus_id: 'BUS-001'
}
```

### Client Messages

The server accepts the following messages from clients:

- **Heartbeat:** `{ type: 'heartbeat' }`
- **Request Current GPS:** `{ type: 'request_current_gps' }`

### Server Messages

The server sends the following messages to clients:

- **GPS Update:** `{ type: 'gps_update', data: {...}, timestamp: '...' }`
- **Connection Status:** `{ type: 'connection_status', status: 'connected', timestamp: '...' }`

## Features

- Real-time GPS data broadcasting
- Automatic client connection management
- Health check endpoint
- Client heartbeat monitoring
- Graceful shutdown
- Automatic reconnection handling
- Last known GPS data storage

## Hardware Integration Examples

### Serial Port GPS

```javascript
const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });

port.on('data', (data) => {
  const gpsData = parseNMEA(data.toString());
  updateGPSData(gpsData);
});
```

### GPSD (GPS Daemon)

```javascript
const Gpsd = require('gpsd');
const gpsd = new Gpsd();

gpsd.on('TPV', (data) => {
  const gpsData = {
    latitude: data.lat,
    longitude: data.lon,
    altitude: data.alt,
    speed: data.speed,
    heading: data.track,
    accuracy: data.epx,
    source: 'gpsd'
  };
  updateGPSData(gpsData);
});
```

## Deployment

### Systemd Service

Create `/etc/systemd/system/gps-websocket.service`:

```ini
[Unit]
Description=GPS WebSocket Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/gps-websocket-server
ExecStart=/usr/bin/node /home/pi/gps-websocket-server/gps-websocket-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable gps-websocket
sudo systemctl start gps-websocket
```

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :8080
sudo kill -9 <PID>
```

### Firewall Issues
```bash
sudo ufw allow 8080/tcp
```

### Connection Issues
- Check firewall settings
- Verify Raspberry Pi IP address
- Check network connectivity
- Review server logs

## Monitoring

Check server status:
```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-15T10:30:00.000Z",
  "connectedClients": 3
}
```