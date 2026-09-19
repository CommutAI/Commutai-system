/**
 * Supabase Broadcast Example for Raspberry Pi
 * This script demonstrates how to broadcast GPS data via Supabase realtime as backup
 * 
 * This is the backup method when WebSocket connection fails
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-supabase-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to broadcast GPS data via Supabase
async function broadcastGPSData(gpsData) {
  try {
    const { data, error } = await supabase
      .channel('gps-broadcast-channel')
      .send({
        type: 'broadcast',
        event: 'gps_update',
        payload: { data: gpsData }
      });

    if (error) {
      console.error('Error broadcasting GPS data via Supabase:', error);
      return false;
    }

    console.log('GPS data broadcasted via Supabase:', gpsData);
    return true;
  } catch (error) {
    console.error('Error in Supabase broadcast:', error);
    return false;
  }
}

// Example: Simulated GPS data with dual broadcasting
function simulateGPSData() {
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
    bus_id: 'BUS-001',
    recorded_at: new Date().toISOString()
  };

  return simulatedGPSData;
}

// Start broadcasting GPS data
function startSupabaseBroadcasting() {
  console.log('Starting Supabase GPS broadcasting...');
  
  setInterval(() => {
    try {
      const gpsData = simulateGPSData();
      
      // Broadcast via Supabase
      broadcastGPSData(gpsData);
      
    } catch (error) {
      console.error('Error in GPS broadcasting loop:', error);
    }
  }, 2000); // 2 second interval
}

// Usage with your actual GPS data
// function broadcastActualGPSData(gpsData) {
//   broadcastGPSData(gpsData);
// }

// Start the broadcasting
startSupabaseBroadcasting();

console.log('Supabase broadcast example running. Press Ctrl+C to stop.');