# GPS WebSocket Setup Guide

Complete setup guide for implementing WebSocket GPS tracking with Supabase backup for CommutAI.

## Architecture Overview

```
Raspberry Pi (GPS Hardware)
    ↓
WebSocket Server (Primary) → Dashboard (WebSocket Client)
    ↓ (if fails)
Supabase Broadcast (Backup) → Dashboard (Supabase Client)
```

## Part 1: Raspberry Pi Setup

### 1. Install Dependencies

```bash
# Navigate to websocket-server package
cd packages/websocket-server

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Edit `.env`:
```env
PORT=8080
WS_PORT=8081
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
GPS_UPDATE_INTERVAL=2000
GPS_HARDWARE_TYPE=serial
```

### 3. Set Up GPS Hardware Integration

Choose one of the following approaches:

#### Option A: Serial Port GPS (Most Common)

Modify `gps-reader-example.js`:

```javascript
const SerialPort = require('serialport');
const { updateGPSData } = require('./gps-websocket-server');

const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });

port.on('data', (data) => {
  // Parse NMEA sentences
  const gpsData = parseNMEA(data.toString());
  updateGPSData(gpsData);
});

function parseNMEA(nmeaString) {
  // Implement NMEA parsing logic
  // Example: $GPGGA sentence parsing
  const parts = nmeaString.split(',');
  if (parts[0] === '$GPGGA') {
    return {
      latitude: parseLatitude(parts[2], parts[3]),
      longitude: parseLongitude(parts[4], parts[5]),
      altitude: parseFloat(parts[9]),
      satelliteCount: parseInt(parts[7]),
      source: 'serial-gps',
      trip_id: 'TRIP-001',
      bus_id: 'BUS-001',
      recorded_at: new Date().toISOString()
    };
  }
}
```

#### Option B: GPSD (GPS Daemon)

```javascript
const Gpsd = require('gpsd');
const { updateGPSData } = require('./gps-websocket-server');

const gpsd = new Gpsd();

gpsd.on('TPV', (data) => {
  const gpsData = {
    latitude: data.lat,
    longitude: data.lon,
    altitude: data.alt,
    speed: data.speed,
    heading: data.track,
    accuracy: data.epx,
    satelliteCount: data.sats,
    source: 'gpsd',
    trip_id: 'TRIP-001',
    bus_id: 'BUS-001',
    recorded_at: new Date().toISOString()
  };
  updateGPSData(gpsData);
});
```

#### Option C: Simulated (For Testing)

Use the provided `gps-reader-example.js` as-is for testing.

### 4. Start the WebSocket Server

```bash
# Start WebSocket server
node gps-websocket-server.js

# Or with GPS reader
node gps-reader-example.js
```

### 5. Set Up as System Service

Create `/etc/systemd/system/gps-websocket.service`:

```ini
[Unit]
Description=GPS WebSocket Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/commutai/packages/websocket-server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /home/pi/commutai/packages/websocket-server/gps-websocket-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable gps-websocket
sudo systemctl start gps-websocket
sudo systemctl status gps-websocket
```

## Part 2: Dashboard Setup

### 1. Install WebSocket Client Package

```bash
cd apps/public-dashboard
npm install
```

### 2. Configure WebSocket URL

Edit `apps/public-dashboard/src/App.tsx`:

```typescript
const client = new GPSWebSocketClient(
  'ws://YOUR_RASPBERRY_PI_IP:8080', // Change to your Raspberry Pi IP
  supabase,
  true
);
```

### 3. Enable Supabase Realtime

1. Go to your Supabase project dashboard
2. Navigate to Realtime → Settings
3. Enable Realtime for your project
4. Create a broadcast channel named `gps-broadcast-channel`

### 4. Test the Connection

```bash
# Start the dashboard
cd apps/public-dashboard
npm run dev
```

Check the browser console for connection status messages.

## Part 3: Raspberry Pi Backup Broadcasting

### 1. Install Supabase Dependencies

```bash
cd packages/websocket-server
npm install @supabase/supabase-js
```

### 2. Configure Supabase in .env

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
```

### 3. Test Supabase Broadcasting

```bash
node supabase-broadcast-example.js
```

### 4. Integrate with Main GPS Reader

Modify your GPS reader to broadcast to both WebSocket and Supabase:

```javascript
const { updateGPSData } = require('./gps-websocket-server');
const { broadcastGPSData } = require('./supabase-broadcast-example');

function handleNewGPSData(gpsData) {
  // Primary: WebSocket
  updateGPSData(gpsData);
  
  // Backup: Supabase
  broadcastGPSData(gpsData);
}
```

## Part 4: Testing & Troubleshooting

### Test WebSocket Connection

```bash
# Check if WebSocket server is running
curl http://localhost:8080/health

# Expected response:
# {"status":"healthy","timestamp":"...","connectedClients":0}
```

### Test with WebSocket Client

```javascript
// In browser console
const ws = new WebSocket('ws://YOUR_RASPBERRY_PI_IP:8080');
ws.onmessage = (event) => console.log('Received:', JSON.parse(event.data));
```

### Monitor Connection Status

The dashboard shows connection status in the "Arrival Board" section:
- **WebSocket (Live)**: Primary connection active
- **Supabase (Live)**: Backup connection active
- **Connecting**: Attempting to connect
- **Error**: Connection failed

### Common Issues

#### WebSocket Connection Fails
1. Check Raspberry Pi is accessible: `ping YOUR_RASPBERRY_PI_IP`
2. Check firewall: `sudo ufw allow 8080/tcp`
3. Verify WebSocket server is running: `sudo systemctl status gps-websocket`
4. Check browser console for specific errors

#### Supabase Connection Fails
1. Verify Supabase credentials in `.env`
2. Check Realtime is enabled in Supabase dashboard
3. Verify channel name matches: `gps-broadcast-channel`
4. Check network connectivity

#### No GPS Data Received
1. Check GPS hardware is connected
2. Verify GPS data format matches expected structure
3. Check WebSocket server logs
4. Test with simulated data first

## Part 5: Deployment

### Production Checklist

- [ ] Raspberry Pi has static IP address
- [ ] Firewall configured to allow WebSocket port
- [ ] WebSocket server running as system service
- [ ] GPS hardware properly connected and configured
- [ ] Supabase Realtime enabled
- [ ] Dashboard configured with correct WebSocket URL
- [ ] Backup broadcasting configured
- [ ] Monitoring and logging set up
- [ ] Error handling and recovery tested

### Security Considerations

1. **WebSocket Security**: Consider using WSS (WebSocket Secure) in production
2. **Authentication**: Add authentication to WebSocket connection if needed
3. **Rate Limiting**: Implement rate limiting on WebSocket server
4. **Data Validation**: Validate GPS data before broadcasting
5. **Firewall**: Restrict WebSocket access to trusted IPs

### Monitoring

Add monitoring to track:
- WebSocket connection uptime
- GPS data frequency
- Connection switch events
- Error rates
- System performance

## Part 6: Network Configuration

### Static IP for Raspberry Pi

Edit `/etc/dhcpcd.conf`:
```conf
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8
```

### Port Forwarding (if needed)

Forward port 8080 to your Raspberry Pi IP in your router settings.

## Part 7: Backup & Recovery

### Backup Configuration

```bash
# Backup WebSocket server configuration
tar -czf gps-websocket-backup.tar.gz packages/websocket-server/

# Backup systemd service
sudo cp /etc/systemd/system/gps-websocket.service ~/backup/
```

### Recovery Procedure

1. Restore configuration files
2. Restart system service: `sudo systemctl restart gps-websocket`
3. Verify connection: `curl http://localhost:8080/health`
4. Test dashboard connection

## Support

For issues or questions:
1. Check logs: `sudo journalctl -u gps-websocket -f`
2. Review browser console for client errors
3. Test with simulated data first
4. Verify network connectivity
5. Check hardware connections

## Next Steps

1. Deploy to Raspberry Pi
2. Test with actual GPS hardware
3. Monitor connection stability
4. Set up alerts for connection failures
5. Implement data logging for analytics
6. Add additional buses if needed