import { useState, useEffect, RefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Users, DollarSign, Bus, AlertTriangle, Map as MapIcon, CheckCircle, Clock, Search, Video, Camera, Activity, Brain, RefreshCw, LucideIcon } from 'lucide-react';
import { supabase } from '@commutai/supabase';
import AuditService from '../../services/auditService';
import { getPiVideoFeedUrl } from '../../services/raspberryPiApi';
import { useRaspberryPi } from '../../hooks/useRaspberryPi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Hide Leaflet attribution and logo (only once)
if (!document.getElementById('leaflet-style-override')) {
  const style = document.createElement('style');
  style.id = 'leaflet-style-override';
  style.textContent = `
    .leaflet-control-attribution {
      display: none !important;
    }
    .leaflet-bottom {
      display: none !important;
    }
    .pulse-dot {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color: string;
}

interface MapRecenterProps {
  center: [number, number];
  zoom: number;
}

interface CompactVideoFeedProps {
  online: boolean;
  connectionStatus: string;
  passengerCount: number;
  isStreaming: boolean;
  videoRef: RefObject<HTMLImageElement | null>;
  refresh: () => void;
}

interface BusMarkerProps {
  bus: {
    id: string;
    plate: string;
    route: string;
    lat: number;
    lng: number;
    passengers: number;
    status: string;
    locationSource: string;
    locationUpdatedAt: string | null;
  };
}

interface PassengerCount {
  count: number;
  trip_id: string;
}

interface Transaction {
  amount: string;
  type: string;
}

interface StaffUser {
  role: string;
}

interface Irregularity {
  type: string;
  trip_id?: string;
  description: string;
  detected_at: string;
}

interface EmergencyAlert {
  id: string;
  status: 'active' | 'acknowledged' | 'resolved';
  notes?: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  bus_id?: string;
  conductor_id?: string;
  lat?: number;
  lng?: number;
  buses?: {
    plate_number?: string;
  };
}

interface Alert {
  type: string;
  message: string;
  time: string;
  severity: string;
}

interface BusData {
  id: string;
  plate_number: string;
  route: string;
  status: string;
}

interface TripData {
  id: string;
  bus_id: string;
  current_lat?: number;
  current_lng?: number;
  gps_updated_at?: string;
}

interface GpsLocation {
  trip_id?: string;
  latitude: string;
  longitude: string;
  source?: string;
  recorded_at: string;
}

interface BusMarker {
  id: string;
  plate: string;
  route: string;
  lat: number;
  lng: number;
  passengers: number;
  status: string;
  locationSource: string;
  locationUpdatedAt: string | null;
  busId: string;
  tripId: string | null;
}

const KPICard = ({ title, value, change, icon: Icon, color }: KPICardProps) => (
  <div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {change >= 0 ? '+' : ''}{change}%
      </span>
    </div>
    <h3 className="text-white/60 text-sm mb-1">{title}</h3>
    <p className="text-white text-3xl font-bold">{value}</p>
  </div>
);

const MapRecenter = ({ center, zoom }: MapRecenterProps) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

const MapRouteFitter = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
};

const fetchRouteCoordinates = async (startCoords: [number, number], endCoords: [number, number]): Promise<[number, number][]> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] // Convert [lng, lat] to [lat, lng]
      );
    }
  } catch (error) {
    console.error('Error fetching route:', error);
  }
  
  // Fallback to straight line
  return [startCoords, endCoords];
};

// Compact video widget for the dashboard — receives Pi state from parent to avoid duplicate WebSocket connections
const CompactVideoFeed = ({ online, connectionStatus, passengerCount, isStreaming, videoRef, refresh }: CompactVideoFeedProps) => {
  const [useMjpeg, setUseMjpeg] = useState(false);
  // Stream is started automatically by the hook on connect — no effect needed here

  const statusColor = isStreaming || useMjpeg ? 'text-green-400' : online ? 'text-yellow-400' : 'text-red-400';
  const statusLabel = isStreaming || useMjpeg ? 'Live' : online ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting…' : 'Offline';

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-orange-400" />
          <h2 className="text-white font-semibold text-sm">Bus Video Monitoring</h2>
          <span className={`text-xs ${statusColor}`}>· {statusLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setUseMjpeg(v => !v)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${useMjpeg ? 'bg-orange-500/30 text-orange-300' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
          >
            {useMjpeg ? 'MJPEG' : 'WS'}
          </button>
          <button onClick={refresh} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Video — fixed height for compact size */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ height: '500px' }}>
        <img ref={videoRef} alt="Live feed" className={`w-full h-full object-contain ${isStreaming && !useMjpeg ? 'block' : 'hidden'}`} />
        {useMjpeg && <img src={getPiVideoFeedUrl('default')} alt="MJPEG feed" className="w-full h-full object-contain" />}

        {!isStreaming && !useMjpeg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Video className="w-10 h-10 text-white/20" />
            {online ? (
              <p className="text-white/40 text-xs">Starting stream…</p>
            ) : (
              <>
                <p className="text-white/40 text-xs">Connecting to Raspberry Pi…</p>
                <p className="text-white/20 text-xs">Auto-reconnecting</p>
              </>
            )}
          </div>
        )}

        {/* LIVE badge */}
        {(isStreaming || useMjpeg) && (
          <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-0.5 flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>
        )}

        {/* Passenger count badge */}
        {(isStreaming || useMjpeg) && (
          <div className="absolute top-2 right-2 bg-black/70 rounded px-2 py-0.5 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-orange-400" />
            <span className="text-white text-xs font-bold">{passengerCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [kpis, setKpis] = useState([
    { title: "Today's Passengers", value: '0', change: 0, icon: Users, color: 'bg-blue-500' },
    { title: 'Total Revenue', value: '$0', change: 0, icon: DollarSign, color: 'bg-green-500' },
    { title: 'Bus Fare Revenue', value: '$0', change: 0, icon: Bus, color: 'bg-purple-500' },
    { title: 'Baggage Fee Revenue', value: '$0', change: 0, icon: DollarSign, color: 'bg-orange-500' },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const setStats = useState({
    totalRoutes: 0,
    activeDrivers: 0,
    activeConductors: 0,
    avgTripDuration: '0 min',
    seatUtilization: '0%',
    totalBusFare: 0,
    totalBaggageFees: 0
  })[1];
  const [loading, setLoading] = useState(true);
  const [buses, setBuses] = useState<BusMarker[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<Record<string, [number, number][]>>({});
  const [mapStats, setMapStats] = useState({
    totalPassengers: 0,
    activeBuses: 0,
    totalRoutes: 0,
    maintenanceBuses: 0
  });
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [alertFilterStatus, setAlertFilterStatus] = useState('all');
  const [alertSearchTerm, setAlertSearchTerm] = useState('');

  // Single Raspberry Pi connection — shared between status indicators and the video widget
  const {
    online: piOnline,
    connectionStatus: piConnectionStatus,
    cameraActive: piCameraActive,
    passengerCount: piPassengerCount,
    currentTripId: piCurrentTripId,
    emergencyStatus: piEmergencyStatus,
    isStreaming: piIsStreaming,
    videoRef: piVideoRef,
    refresh: piRefresh,
    assignedBus: piAssignedBus,
  } = useRaspberryPi({ autoConnect: true, enableHealthCheck: true });

  useEffect(() => {
    fetchDashboardData();
    fetchLiveMapData();
    fetchEmergencyAlerts();
    
    // Log page view to audit logs
    AuditService.logPageView('Dashboard');
    
    // Set up real-time subscription for trips
    const tripsSubscription = supabase
      .channel('trips-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchLiveMapData();
      })
      .subscribe();

    const gpsSubscription = supabase
      .channel('dashboard-gps-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gps_locations' }, () => {
        fetchLiveMapData();
      })
      .subscribe();

    // Set up real-time subscription for emergency alerts
    const alertsSubscription = supabase
      .channel('emergency-alerts-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, () => {
        fetchEmergencyAlerts();
      })
      .subscribe();

    return () => {
      tripsSubscription.unsubscribe();
      gpsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];

      // Parallelize all independent queries for significant performance improvement
      const [
        { data: buses },
        { data: _trips },
        { data: passengerCounts },
        { data: irregularities },
        { data: emergencyAlertsData },
        { data: staffUsers },
        { data: transactions }
      ] = await Promise.all([
        // Fetch active buses - only bus 001 for Raspberry Pi
        supabase.from('buses').select('*').eq('status', 'active').eq('bus_number', 1),
        
        // Fetch today's trips
        supabase.from('trips').select('*, buses(*)').gte('started_at', today),
        
        // Fetch passenger counts for today
        supabase.from('passenger_counts').select('count').gte('recorded_at', today),
        
        // Fetch fare irregularities for today
        supabase.from('fare_irregularities')
          .select('*, trips(*, buses(*))')
          .gte('detected_at', today)
          .order('detected_at', { ascending: false })
          .limit(10),
        
        // Fetch emergency alerts - simplified query to avoid 400 error
        supabase.from('emergency_alerts')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Fetch staff users
        supabase.from('staff_users').select('*').eq('is_active', true),
        
        // Calculate revenue (from transactions)
        supabase.from('transactions').select('amount, type').gte('created_at', today)
      ]);

      // Calculate KPIs
      const totalPassengers = (passengerCounts as PassengerCount[])?.reduce((sum, pc) => sum + (pc.count || 0), 0) || 0;
      const activeConductorsCount = (staffUsers as StaffUser[])?.filter(u => u.role === 'conductor').length || 0;
      const activeDriversCount = (staffUsers as StaffUser[])?.filter(u => u.role === 'driver').length || 0;

      const totalRevenue = (transactions as Transaction[])?.reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0) || 0;
      
      // Calculate bus fare revenue (fare_validation transactions)
      const busFareRevenue = (transactions as Transaction[])
        ?.filter(t => t.type === 'fare_validation')
        .reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0) || 0;
      
      // Calculate baggage fee revenue (assuming a separate transaction type or calculation)
      // For now, we'll estimate it as a portion of total revenue since specific baggage transactions aren't defined
      const baggageFeeRevenue = (transactions as Transaction[])
        ?.filter(t => t.type === 'balance_topup' || t.type === 'card_issuance')
        .reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0) || 0;

      setKpis([
        { title: "Today's Passengers", value: totalPassengers.toLocaleString(), change: 8.5, icon: Users, color: 'bg-blue-500' },
        { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: 12.3, icon: DollarSign, color: 'bg-green-500' },
        { title: 'Bus Fare Revenue', value: `$${busFareRevenue.toLocaleString()}`, change: 10.1, icon: Bus, color: 'bg-purple-500' },
        { title: 'Baggage Fee Revenue', value: `$${baggageFeeRevenue.toLocaleString()}`, change: 15.2, icon: DollarSign, color: 'bg-orange-500' },
      ]);

      // Transform irregularities to alerts
      const irregularityAlerts = (irregularities as Irregularity[] || []).map(irr => ({
        type: `${irr.type.replace('_', ' ').toUpperCase()}`,
        message: `Trip #${irr.trip_id?.slice(0, 8)} - ${irr.description}`,
        time: new Date(irr.detected_at).toLocaleString(),
        severity: irr.type === 'fare_evasion' ? 'high' : 'medium'
      }));

      // Transform emergency alerts
      const emergencyAlertList = (emergencyAlertsData || []).map((alert: EmergencyAlert) => ({
        type: 'EMERGENCY ALERT',
        message: alert.notes || 'Emergency reported',
        time: new Date(alert.created_at).toLocaleString(),
        severity: 'high'
      }));

      setAlerts([...emergencyAlertList, ...irregularityAlerts].slice(0, 10));

      setStats({
        totalRoutes: buses?.length || 0,
        activeDrivers: activeDriversCount,
        activeConductors: activeConductorsCount,
        avgTripDuration: '32 min',
        seatUtilization: '78%',
        totalBusFare: busFareRevenue,
        totalBaggageFees: baggageFeeRevenue || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error to prevent UI crashes
      setKpis([
        { title: "Today's Passengers", value: '0', change: 0, icon: Users, color: 'bg-blue-500' },
        { title: 'Total Revenue', value: '$0', change: 0, icon: DollarSign, color: 'bg-green-500' },
        { title: 'Bus Fare Revenue', value: '$0', change: 0, icon: Bus, color: 'bg-purple-500' },
        { title: 'Baggage Fee Revenue', value: '$0', change: 0, icon: DollarSign, color: 'bg-orange-500' },
      ]);
      setAlerts([]);
      setStats({
        totalRoutes: 0,
        activeDrivers: 0,
        activeConductors: 0,
        avgTripDuration: '0 min',
        seatUtilization: '0%',
        totalBusFare: 0,
        totalBaggageFees: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMapData = async () => {
    try {
      // Fetch all buses on the route regardless of status — show on map with their current state
      const [
        { data: allBuses },
        { data: activeTrips },
        { data: gpsRows }
      ] = await Promise.all([
        supabase.from('buses').select('*').order('bus_number', { ascending: true }),
        supabase.from('trips')
          .select('*, buses(*)')
          .eq('status', 'in_progress')
          .order('started_at', { ascending: false }),
        supabase.from('gps_locations')
          .select('trip_id, latitude, longitude, source, recorded_at')
          .order('recorded_at', { ascending: false })
          .limit(100)
      ]);

      // Map active trip IDs to their trip data for quick lookup
      const tripByBusId: Record<string, TripData> = {};
      (activeTrips as TripData[] || []).forEach(trip => {
        tripByBusId[trip.bus_id] = trip;
      });

      const latestGpsByTripId: Record<string, any> = {};
      let latestGpsAny: any = null;
      (gpsRows as GpsLocation[] || []).forEach(row => {
        const gps = {
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude),
          source: row.source || 'gps',
          recordedAt: row.recorded_at,
          tripId: row.trip_id || null
        };

        if (!Number.isFinite(gps.lat) || !Number.isFinite(gps.lng)) return;
        if (!latestGpsAny) latestGpsAny = gps;
        if (row.trip_id && !latestGpsByTripId[row.trip_id]) {
          latestGpsByTripId[row.trip_id] = gps;
        }
      });

      const activeTripBusIds = new Set((activeTrips as TripData[] || []).map(trip => trip.bus_id));
      const fallbackGpsBusId =
        (activeTrips as TripData[] || [])[0]?.bus_id ||
        (allBuses as BusData[] || []).find(bus => bus.status === 'active')?.id ||
        (allBuses as BusData[] || [])[0]?.id;

      // Build a marker for every bus — active trip buses use GPS coords
      const busMarkers = (allBuses as BusData[] || []).map(bus => {
        const trip = tripByBusId[bus.id];
        const gps = trip
          ? latestGpsByTripId[trip.id] || latestGpsAny
          : (!activeTripBusIds.size && bus.id === fallbackGpsBusId ? latestGpsAny : null);
        return {
          id: bus.id,
          plate: bus.plate_number,
          route: bus.route,
          lat: gps?.lat ?? trip?.current_lat ?? 8.43,
          lng: gps?.lng ?? trip?.current_lng ?? 124.76,
          passengers: 0,
          status: trip ? 'active' : bus.status,
          locationSource: gps ? (gps.tripId ? gps.source : `${gps.source} (latest GPS)`) : 'fallback',
          locationUpdatedAt: gps?.recordedAt || trip?.gps_updated_at || null,
          busId: bus.id,
          tripId: trip?.id || null
        };
      });

      // Fetch latest passenger count for each active trip
      const tripIds = (activeTrips as TripData[] || []).map(t => t.id);
      let totalPassengers = 0;

      if (tripIds.length > 0) {
        const { data: passengerCounts } = await supabase
          .from('passenger_counts')
          .select('trip_id, count')
          .in('trip_id', tripIds)
          .order('recorded_at', { ascending: false });

        const latestCounts: Record<string, number> = {};
        (passengerCounts as PassengerCount[] || []).forEach(pc => {
          if (!latestCounts[pc.trip_id]) latestCounts[pc.trip_id] = pc.count;
        });

        busMarkers.forEach(bus => {
          if (bus.tripId && latestCounts[bus.tripId]) {
            bus.passengers = latestCounts[bus.tripId];
            totalPassengers += latestCounts[bus.tripId];
          }
        });
      }

      setBuses(busMarkers);
      
      // Generate route coordinates for main route
      const routeCoordsMap: Record<string, [number, number][]> = {};
      const predefinedRoutes: Record<string, { start: [number, number]; end: [number, number] }> = {
        'Manolo Fortich - Agora': {
          start: [8.36636242362125, 124.86511043016075],
          end: [8.49044367255386, 124.657778371929]
        },
        'Manolo Fortich - Cagayan de Oro': {
          start: [8.36636242362125, 124.86511043016075],
          end: [8.49044367255386, 124.657778371929]
        }
      };
      
      for (const route of ['Manolo Fortich - Agora', 'Manolo Fortich - Cagayan de Oro']) {
        const predefined = predefinedRoutes[route];
        if (predefined) {
          const coords = await fetchRouteCoordinates(predefined.start, predefined.end);
          routeCoordsMap[route] = coords;
        }
      }
      
      setRouteCoordinates(routeCoordsMap);
      
      setMapStats({
        totalPassengers,
        activeBuses: (activeTrips || []).length,
        totalRoutes: 1,
        maintenanceBuses: (allBuses || []).filter((b: any) => b.status === 'maintenance').length
      });
    } catch (error) {
      console.error('Error fetching live map data:', error);
    }
  };

  const fetchEmergencyAlerts = async () => {
    try {
      // Select only columns that are guaranteed to exist in the base table.
      // Avoid joining buses() here to prevent 400 errors if the FK relationship
      // isn't recognised by PostgREST (e.g. migration not yet applied).
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('id, status, notes, created_at, acknowledged_at, resolved_at, bus_id, conductor_id, lat, lng')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmergencyAlerts(data || []);
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      setEmergencyAlerts([]);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await (supabase
        .from('emergency_alerts') as any)
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      // Log alert acknowledgment to audit logs
      await AuditService.logAuditEvent({
        action: 'UPDATE',
        module: 'Emergency Alerts',
        details: `Acknowledged emergency alert ${alertId}`,
      });

      fetchEmergencyAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      alert('Error acknowledging alert: ' + (error as Error).message);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const alert = emergencyAlerts.find(a => a.id === alertId);
      const notes = alert?.notes || 'No notes provided';

      const { error } = await (supabase
        .from('emergency_alerts') as any)
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      // Log alert resolution to audit logs
      await AuditService.logEmergencyAlertResolved(alertId, notes);

      fetchEmergencyAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Error resolving alert: ' + (error as Error).message);
    }
  };

  const filteredAlerts = emergencyAlerts.filter((alert: EmergencyAlert) => {
    const matchesSearch = !alertSearchTerm ||
      alert.notes?.toLowerCase().includes(alertSearchTerm.toLowerCase()) ||
      alert.bus_id?.toLowerCase().includes(alertSearchTerm.toLowerCase());
    const matchesStatus = alertFilterStatus === 'all' || alert.status === alertFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const alertStatusColors = {
    active: 'bg-red-500/20 text-red-400 border-red-500/50',
    acknowledged: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/50',
  };

  const alertStatusIcons = {
    active: AlertTriangle,
    acknowledged: Clock,
    resolved: CheckCircle,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-white/60">Loading data...</p>
        </div>
      </div>
    );
  }

  const BusMarker = ({ bus }: BusMarkerProps) => (
    <Marker position={[bus.lat, bus.lng]}>
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-gray-800">{bus.plate}</h3>
          <p className="text-sm text-gray-600">{bus.route}</p>
          <p className="text-xs text-gray-700 mt-2">
            {Number(bus.lat).toFixed(6)}, {Number(bus.lng).toFixed(6)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Source: {bus.locationSource || 'fallback'}
          </p>
          {bus.locationUpdatedAt && (
            <p className="text-xs text-gray-500">
              Updated: {new Date(bus.locationUpdatedAt).toLocaleString()}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Users size={16} className="text-orange-500" />
            <span className="text-sm">{bus.passengers} passengers</span>
          </div>
          <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${bus.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {bus.status}
          </span>
        </div>
      </Popup>
    </Marker>
  );

  // Route: Manolo Fortich Terminal ↔ Agora Terminal, Cagayan de Oro
  // Midpoint of the route is roughly 8.43°N, 124.76°E — zoom 11 shows the full route
  const ROUTE_CENTER: [number, number] = [8.43, 124.76];
  const ROUTE_ZOOM = 11;
  const liveBus = buses.find(bus => bus.locationSource && bus.locationSource !== 'fallback');
  const mapCenter: [number, number] = liveBus ? [liveBus.lat, liveBus.lng] : ROUTE_CENTER;
  const mapZoom = liveBus ? 15 : ROUTE_ZOOM;



  // VideoMonitoring handles its own connection — no inline video code needed here

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-white/60">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Live Video Monitoring and Raspberry Pi Status — Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Video Monitoring — compact widget */}
        <div className="glass-card p-4 rounded-xl lg:col-span-2">
          <CompactVideoFeed
            online={piOnline}
            connectionStatus={piConnectionStatus}
            passengerCount={piPassengerCount}
            isStreaming={piIsStreaming}
            videoRef={piVideoRef}
            refresh={piRefresh}
          />
        </div>

        {/* Raspberry Pi Status Indicators */}
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
            <Camera className="text-orange-400" size={20} />
            Raspberry Pi Status
            {piAssignedBus?.busPlate && (
              <span className="ml-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
                Bus {piAssignedBus.busNumber}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-indigo-400" />
                <p className="text-white/60 text-xs">Server</p>
              </div>
              <p className={`text-lg font-bold ${piOnline ? 'text-green-400' : 'text-red-400'}`}>
                {piOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-white/40 text-xs mt-1">{piConnectionStatus}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <p className="text-white/60 text-xs">Camera</p>
              </div>
              <p className={`text-lg font-bold ${piCameraActive ? 'text-green-400' : 'text-red-400'}`}>
                {piCameraActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <p className="text-white/60 text-xs">Passengers</p>
              </div>
              <p className="text-lg font-bold text-white">{piPassengerCount}</p>
              <p className="text-white/40 text-xs mt-1">Current count</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <p className="text-white/60 text-xs">Trip ID</p>
              </div>
              <p className="text-lg font-bold text-white">
                {piCurrentTripId ? `#${piCurrentTripId.slice(0, 8)}` : 'None'}
              </p>
              <p className="text-white/40 text-xs mt-1">Active trip</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <p className="text-white/60 text-xs">Detection</p>
              </div>
              <p className="text-lg font-bold text-white">YOLO</p>
              <p className="text-white/40 text-xs mt-1">AI Model</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-4 h-4 ${piEmergencyStatus.emergency_active ? 'text-red-400' : 'text-green-400'}`} />
                <p className="text-white/60 text-xs">Emergency</p>
              </div>
              <p className={`text-lg font-bold ${piEmergencyStatus.emergency_active ? 'text-red-400' : 'text-green-400'}`}>
                {piEmergencyStatus.emergency_active ? 'Active' : 'Clear'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Map Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <MapIcon className="text-orange-400" />
            Live Bus Tracking
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="h-[400px] rounded-xl overflow-hidden">
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                style={{ height: '100%', width: '100%' }}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
              >
                <MapRecenter center={mapCenter} zoom={mapZoom} />
                {Object.values(routeCoordinates).flat().length > 0 && (
                  <MapRouteFitter coordinates={Object.values(routeCoordinates).flat()} />
                )}
                <TileLayer
                  attribution=""
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {Object.entries(routeCoordinates).map(([routeName, coords], index) => (
                  coords.length > 0 && (
                    <Polyline
                      key={routeName}
                      positions={coords}
                      color={['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444'][index % 5]}
                      weight={4}
                      opacity={0.7}
                    />
                  )
                ))}
                {buses.map((bus) => (
                  <BusMarker key={bus.id} bus={bus} />
                ))}
              </MapContainer>
            </div>
            <div className="bg-white/5 p-4 rounded-xl mt-4">
              <h3 className="text-white text-sm font-bold mb-3">Map Legend</h3>
              <div className="flex gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-white/70">On Active Trip</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-white/70">Inactive / Idle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-white/70">Maintenance</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-white/60 text-xs">Active Buses</p>
                <p className="text-white text-2xl font-bold">{mapStats.activeBuses}</p>
                <p className="text-white/40 text-xs mt-1">on trip now</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-white/60 text-xs">Fleet</p>
                <p className="text-white text-2xl font-bold">{buses.length}</p>
                <p className="text-white/40 text-xs mt-1">total buses</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-white/60 text-xs">Passengers</p>
                <p className="text-white text-2xl font-bold">{mapStats.totalPassengers}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-white/60 text-xs">Route</p>
                <p className="text-white text-sm font-bold">Manolo Fortich ↔ Agora</p>
              </div>
            </div>

            {/* All Buses List */}
            <div className="bg-white/5 p-4 rounded-xl">
              <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                <Bus className="text-orange-400" size={16} />
                Fleet
              </h3>
              <div className="space-y-3">
                {buses.length > 0 ? (
                  <select
                    value={selectedBus || ''}
                    onChange={(e) => setSelectedBus(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select a bus…</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plate} — {bus.status === 'active' ? '🟢 on trip' : bus.status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white/40 text-sm text-center py-2">No buses found</p>
                )}
                {selectedBus && (() => {
                  const bus = buses.find(b => b.id === selectedBus);
                  if (!bus) return null;
                  return (
                    <div className="p-3 bg-black/30 rounded-lg border border-white/10">
                      <p className="text-white/80 text-sm mb-2">{bus.route}</p>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Users size={14} />
                        <span>{bus.passengers} passengers</span>
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          bus.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          bus.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-white/10 text-white/50'
                        }`}>
                          {bus.status === 'active' ? 'On Trip' : bus.status}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts and Recent Activity — Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Alerts */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="text-orange-400" />
              Emergency Alerts
            </h2>
          </div>
          
          {/* Alert Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Active</p>
                  <p className="text-white text-lg font-bold">{emergencyAlerts.filter((a: EmergencyAlert) => a.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Acknowledged</p>
                  <p className="text-white text-lg font-bold">{emergencyAlerts.filter((a: EmergencyAlert) => a.status === 'acknowledged').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Resolved</p>
                  <p className="text-white text-lg font-bold">{emergencyAlerts.filter((a: EmergencyAlert) => a.status === 'resolved').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Filters */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={alertSearchTerm}
                onChange={(e) => setAlertSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
            <select
              value={alertFilterStatus}
              onChange={(e) => setAlertFilterStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-orange-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Alerts List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.slice(0, 5).map((alert: EmergencyAlert) => {
                const StatusIcon = alertStatusIcons[alert.status as keyof typeof alertStatusIcons];
                return (
                  <div key={alert.id} className={`p-3 rounded-lg border ${alertStatusColors[alert.status as keyof typeof alertStatusColors]}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10">
                          <StatusIcon size={12} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium text-xs">Emergency Alert</h3>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs border ${alertStatusColors[alert.status as keyof typeof alertStatusColors]}`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-white/70 text-xs mb-1">{alert.notes || 'No description provided'}</p>
                          <div className="flex items-center gap-3 text-white/60 text-xs">
                            {alert.buses?.plate_number && (
                              <span className="flex items-center gap-1">
                                <Bus size={10} />
                                {alert.buses.plate_number}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors text-xs"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-xs"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/60 text-xs">No emergency alerts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-4">
          <h2 className="text-white text-lg font-bold mb-3">Recent Activity</h2>
          {alerts.length > 0 ? (
            <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
              {alerts.slice(0, 10).map((alert, index) => (
                <div key={index} className="flex items-center gap-3 py-2.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-400' :
                    alert.severity === 'medium' ? 'bg-orange-400' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-white/80 text-sm font-medium">{alert.type}</span>
                    <span className="text-white/50 text-xs ml-2 truncate">{alert.message}</span>
                  </div>
                  <span className="text-white/30 text-xs flex-shrink-0">{alert.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm py-2">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
