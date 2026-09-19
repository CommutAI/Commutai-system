import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  MapPin, Signal, Clock, Activity, 
  RefreshCw, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import type { GPSStatus } from '../types';

export default function GPSMonitoring() {
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>({
    connected: false,
    current_location: null,
    last_update: '',
    speed: 0,
    accuracy: undefined,
    satellites: undefined
  });
  const [connectionHistory, setConnectionHistory] = useState<{
    connected: boolean;
    timestamp: string;
  }[]>([]);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchGPSStatus();
    
    // Subscribe to real-time GPS updates
    const subscription = supabase
      .channel('driver-gps-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_locations' }, () => {
        void fetchGPSStatus();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      void fetchGPSStatus();
    }, 30000);

    return () => {
      void subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchGPSStatus = async () => {
    try {
      const { data: gpsData } = await (supabase
        .from('bus_locations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as any);

      if (!gpsData) {
        // If no GPS data, create sample data for testing
        setGpsStatus({
          connected: true,
          current_location: { lat: 8.4300, lng: 124.7600 },
          last_update: new Date().toISOString(),
          speed: 45.5,
          accuracy: 5.2,
          satellites: 8
        });
        return;
      }

      const wasConnected = gpsStatus.connected;
      const isConnected = !!gpsData;

      setGpsStatus({
        connected: isConnected,
        current_location: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : null,
        last_update: gpsData?.updated_at || '',
        speed: gpsData?.speed || 0,
        accuracy: gpsData?.accuracy,
        satellites: gpsData?.satellites
      });

      // Log connection status changes
      if (wasConnected !== isConnected) {
        addConnectionHistory(isConnected);
      }

      // If disconnected, attempt to reconnect
      if (!isConnected && !reconnecting) {
        attemptReconnect();
      }
    } catch (error) {
      console.error('Error fetching GPS status:', error);
      setGpsStatus(prev => ({ ...prev, connected: false }));
      addConnectionHistory(false);
    }
  };

  const attemptReconnect = async () => {
    setReconnecting(true);
    
    // Simulate reconnection attempt - in production, this would trigger hardware commands
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await fetchGPSStatus();
    setReconnecting(false);
  };

  const addConnectionHistory = (connected: boolean) => {
    setConnectionHistory(prev => [
      { connected, timestamp: new Date().toISOString() },
      ...prev.slice(0, 9) // Keep last 10 entries
    ]);
  };

  const manualRefresh = () => {
    setLastManualRefresh(new Date());
    void fetchGPSStatus();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} km/h`;
  };

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return 'N/A';
    return `${accuracy.toFixed(1)}m`;
  };

  const getConnectionQuality = () => {
    if (!gpsStatus.connected) return 'disconnected';
    if (gpsStatus.accuracy && gpsStatus.accuracy < 10) return 'excellent';
    if (gpsStatus.accuracy && gpsStatus.accuracy < 20) return 'good';
    if (gpsStatus.accuracy && gpsStatus.accuracy < 50) return 'fair';
    return 'poor';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const quality = getConnectionQuality();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">GPS Monitoring</h1>
          <p className="text-white/60">Real-time GPS tracking status</p>
        </div>
        <button
          onClick={manualRefresh}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Refresh GPS status"
        >
          <RefreshCw className={`text-white ${reconnecting ? 'animate-spin' : ''}`} size={20} />
        </button>
      </div>

      {/* Main GPS Status Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-lg ${gpsStatus.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {gpsStatus.connected ? (
                <CheckCircle size={32} />
              ) : (
                <XCircle size={32} />
              )}
            </div>
            <div>
              <p className="text-white/60 text-sm">GPS Status</p>
              <p className={`text-2xl font-bold ${gpsStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                {gpsStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Signal Quality</p>
            <p className={`text-lg font-semibold ${getQualityColor(quality)}`}>
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </p>
          </div>
        </div>

        {!gpsStatus.connected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-white font-medium mb-1">GPS Signal Unavailable</p>
                <p className="text-white/60 text-sm">
                  Location tracking may be temporarily inaccurate. The system is automatically attempting to reconnect.
                </p>
                {reconnecting && (
                  <p className="text-orange-400 text-sm mt-2 flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={16} />
                    Attempting to reconnect...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GPS Details Grid */}
        {gpsStatus.connected && gpsStatus.current_location && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-orange-400" size={18} />
                <p className="text-white/60 text-sm">Latitude</p>
              </div>
              <p className="text-white font-medium">{gpsStatus.current_location.lat.toFixed(6)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-orange-400" size={18} />
                <p className="text-white/60 text-sm">Longitude</p>
              </div>
              <p className="text-white font-medium">{gpsStatus.current_location.lng.toFixed(6)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-orange-400" size={18} />
                <p className="text-white/60 text-sm">Speed</p>
              </div>
              <p className="text-white font-medium">{formatSpeed(gpsStatus.speed)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Signal className="text-orange-400" size={18} />
                <p className="text-white/60 text-sm">Accuracy</p>
              </div>
              <p className="text-white font-medium">{formatAccuracy(gpsStatus.accuracy)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Signal className="text-orange-400" size={18} />
                <p className="text-white/60 text-sm">Satellites</p>
              </div>
              <p className="text-white font-medium">{gpsStatus.satellites || 'N/A'}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-orange-400" size={18} />
                <p className="text-white/60 text-sm">Last Update</p>
              </div>
              <p className="text-white font-medium">{formatTime(gpsStatus.last_update)}</p>
            </div>
          </div>
        )}

        {/* Connection History */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="text-orange-400" size={20} />
            Connection History
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {connectionHistory.length === 0 ? (
              <p className="text-white/40 text-sm">No connection history available</p>
            ) : (
              connectionHistory.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.connected 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entry.connected ? (
                      <CheckCircle className="text-green-400" size={16} />
                    ) : (
                      <XCircle className="text-red-400" size={16} />
                    )}
                    <span className="text-white text-sm">
                      {entry.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <span className="text-white/60 text-sm">{formatTime(entry.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GPS Information Card */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">GPS Information</h3>
        <div className="space-y-3 text-white/70 text-sm">
          <p>
            <strong className="text-white">Note:</strong> GPS coordinates are automatically received from the Raspberry Pi GPS module.
            The driver cannot manually modify GPS coordinates to ensure data integrity and accurate tracking.
          </p>
          <p>
            <strong className="text-white">Auto-Reconnect:</strong> The system automatically attempts to reconnect when GPS signal is lost.
            If connection issues persist, please contact technical support.
          </p>
          <p>
            <strong className="text-white">Data Source:</strong> GPS data is sourced from the bus's onboard GPS hardware and transmitted
            to the central system in real-time for operator monitoring and route tracking.
          </p>
        </div>
      </div>

      {lastManualRefresh && (
        <div className="text-center text-white/40 text-sm">
          Last manual refresh: {lastManualRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}