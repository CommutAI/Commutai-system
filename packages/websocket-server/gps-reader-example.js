/**
 * Example GPS Reader Script for Raspberry Pi
 * This script demonstrates how to read GPS data and send it to the WebSocket server
 * 
 * Replace the GPS reading logic with your actual GPS hardware integration
 */

const { updateGPSData } = require('./gps-websocket-server');

// Simulated GPS data - replace with actual GPS reading
function readGPSData() {
  // In a real implementation, you would read from your GPS hardware
  // Example: serial port, GPS daemon, or GPS library
  
  // Simulated data for demonstration
  const simulatedGPSData = {
    latitude: (8.4 + Math.random() * 0.1).toFixed(6),
    longitude: (124.7 + Math.random() * 0.1).toFixed(6),
    altitude: (100 + Math.random() * 50).toFixed(1),
    speed: (30 + Math.random() * 20).toFixed(1),
    heading: (Math.random() * 360).toFixed(1),
    accuracy: (5 + Math.random() * 10).toFixed(1),
    satelliteCount: Math.floor(8 + Math.random() * 5),
    source: 'raspberry-pi-gps',
    trip_id: 'TRIP-001',
    bus_id: 'BUS-001'
  };

  return simulatedGPSData;
}

// Example: Read GPS data every 2 seconds
function startGPSReading() {
  console.log('Starting GPS reading...');
  
  setInterval(() => {
    try {
      const gpsData = readGPSData();
      
      // Update the WebSocket server with new GPS data
      updateGPSData(gpsData);
      
      console.log('GPS data sent:', gpsData);
    } catch (error) {
      console.error('Error reading GPS data:', error);
    }
  }, 2000); // 2 second interval
}

// Alternative: Event-based GPS reading (if your GPS hardware provides events)
// function setupGPSHardware() {
//   // Example with serial port GPS
//   const SerialPort = require('serialport');
//   const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });
//   
//   port.on('data', (data) => {
//     // Parse NMEA sentences or other GPS format
//     const gpsData = parseNMEA(data.toString());
//     updateGPSData(gpsData);
//   });
// }

// Start the GPS reading
startGPSReading();

console.log('GPS reader example running. Press Ctrl+C to stop.');