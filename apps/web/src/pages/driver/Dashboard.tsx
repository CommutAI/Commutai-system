import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Bus, MapPin, Navigation, Users, Wifi, 
  Bell, CheckCircle, XCircle,
  Activity, TrendingUp
} from 'lucide-react';
import EmergencyButton from './EmergencyButton';

interface DashboardStats {
  assignedBus: {
    bus_number: string;
    plate_number: string;
    status: string;
    driver_name: string;
  } | null;
  currentTrip: {
    route: string;
    trip_id: string;
    status: string;
    departure_time: string;
    estimated_arrival: string;
  } | null;
  gpsStatus: {
    connected: boolean;
    current_location: { lat: number; lng: number } | null;
    last_update: string;
    speed: number;
  };
  passengerStatus: {
    current_count: number;
    available_capacity: number;
    occupancy_percentage: number;
    ai_count: number;
    qr_validations: number;
  };
  conductor: {
    name: string;
    status: string;
    current_trip: string;
    shift_status: string;
  } | null;
  busStatus: {
    bus_number: string;
    plate_number: string;
    status: string;
    gps_status: string;
    raspberry_pi_status: string;
    camera_status: string;
    internet_status: string;
  };
}

export default function DriverDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    assignedBus: null,
    currentTrip: null,
    gpsStatus: {
      connected: false,
      current_location: null,
      last_update: '',
      speed: 0
    },
    passengerStatus: {
      current_count: 0,
      available_capacity: 31,
      occupancy_percentage: 0,
      ai_count: 0,
      qr_validations: 0
    },
    conductor: null,
    busStatus: {
      bus_number: '',
      plate_number: '',
      status: '',
      gps_status: '',
      raspberry_pi_status: '',
      camera_status: '',
      internet_status: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('driver-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        void fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_locations' }, () => {
        void fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passenger_counts' }, () => {
        void fetchDashboardData();
      })
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch driver's assigned bus and current trip
      const { data: driverData } = await (supabase
        .from('staff_users')
        .select('id, full_name')
        .eq('email', 'driver@commutai.test') // Using actual driver email from database
        .single() as any);

      if (!driverData) return;

      // Fetch current active trip
      const { data: tripData } = await (supabase
        .from('trips')
        .select(`
          *,
          buses (
            bus_number,
            plate_number,
            status,
            seat_capacity
          )
        `)
        .eq('operator_id', driverData.id)
        .in('status', ['in_progress', 'scheduled'])
        .order('scheduled_departure', { ascending: false })
        .limit(1)
        .single() as any);

      // Fetch latest GPS location
      const { data: gpsData } = await (supabase
        .from('bus_locations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as any);

      // Fetch passenger counts
      const today = new Date().toISOString().split('T')[0];
      const { data: passengerData } = await (supabase
        .from('passenger_counts')
        .select('count, ai_count')
        .gte('recorded_at', today)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single() as any);

      // Fetch QR validations count
      const { data: qrData } = await (supabase
        .from('boarded_passengers')
        .select('id')
        .gte('boarded_at', today) as any);

      setStats({
        assignedBus: tripData?.buses ? {
          bus_number: tripData.buses.bus_number,
          plate_number: tripData.buses.plate_number,
          status: tripData.buses.status,
          driver_name: driverData.full_name
        } : null,
        currentTrip: tripData ? {
          route: tripData.buses?.route || 'Unknown',
          trip_id: tripData.id,
          status: tripData.status,
          departure_time: tripData.started_at,
          estimated_arrival: tripData.estimated_arrival || 'Calculating...'
        } : null,
        gpsStatus: {
          connected: !!gpsData,
          current_location: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : null,
          last_update: gpsData?.updated_at || '',
          speed: gpsData?.speed || 0
        },
        passengerStatus: {
          current_count: passengerData?.count || 0,
          available_capacity: 31 - (passengerData?.count || 0),
          occupancy_percentage: Math.round(((passengerData?.count || 0) / 31) * 100),
          ai_count: passengerData?.ai_count || 0,
          qr_validations: qrData?.length || 0
        },
        conductor: null,
        busStatus: {
          bus_number: tripData?.buses?.bus_number || '',
          plate_number: tripData?.buses?.plate_number || '',
          status: tripData?.buses?.status || 'Unknown',
          gps_status: gpsData ? 'ONLINE' : 'OFFLINE',
          raspberry_pi_status: 'ONLINE', // Would come from actual hardware monitoring
          camera_status: 'ONLINE', // Would come from actual hardware monitoring
          internet_status: 'ONLINE' // Would come from actual connectivity check
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getOccupancyWarning = (percentage: number) => {
    if (percentage >= 100) return '⚠ BUS AT CAPACITY';
    if (percentage >= 90) return '⚠ Near Capacity';
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Driver Dashboard</h1>
          <p className="text-white/60">
            Driver: {stats.assignedBus?.driver_name || 'Loading...'} | Bus: {stats.assignedBus?.bus_number || 'Loading...'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white font-medium">{currentTime.toLocaleTimeString()}</p>
          <p className="text-white/60 text-sm">{currentTime.toLocaleDateString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <div className="text-white">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Main Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Assigned Bus */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                  <Bus size={20} />
                </div>
                <h3 className="text-white/60 text-sm font-medium">ASSIGNED BUS</h3>
              </div>
              {stats.assignedBus ? (
                <div className="space-y-2">
                  <p className="text-white font-bold text-lg">{stats.assignedBus.bus_number}</p>
                  <p className="text-white/60 text-sm">{stats.assignedBus.plate_number}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stats.assignedBus.status === 'active' ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <span className="text-white/60 text-sm capitalize">{stats.assignedBus.status}</span>
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-sm">No bus assigned</p>
              )}
            </div>

            {/* Current Trip */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Navigation size={20} />
                </div>
                <h3 className="text-white/60 text-sm font-medium">CURRENT TRIP</h3>
              </div>
              {stats.currentTrip ? (
                <div className="space-y-2">
                  <p className="text-white font-bold text-lg">{stats.currentTrip.route}</p>
                  <p className="text-white/60 text-sm">ID: {stats.currentTrip.trip_id.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stats.currentTrip.status === 'in_progress' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-white/60 text-sm capitalize">{stats.currentTrip.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-sm">No active trip</p>
              )}
            </div>

            {/* GPS Status */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stats.gpsStatus.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <MapPin size={20} />
                </div>
                <h3 className="text-white/60 text-sm font-medium">GPS STATUS</h3>
              </div>
              <div className="space-y-2">
                <p className={`font-bold text-lg ${stats.gpsStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.gpsStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </p>
                {stats.gpsStatus.connected ? (
                  <>
                    <p className="text-white/60 text-sm">
                      {stats.gpsStatus.current_location?.lat.toFixed(4)}, {stats.gpsStatus.current_location?.lng.toFixed(4)}
                    </p>
                    <p className="text-white/60 text-sm">{stats.gpsStatus.speed} km/h</p>
                  </>
                ) : (
                  <p className="text-white/40 text-sm">Signal unavailable</p>
                )}
              </div>
            </div>

            {/* Passenger Status */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Users size={20} />
                </div>
                <h3 className="text-white/60 text-sm font-medium">PASSENGERS</h3>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold text-lg">
                  {stats.passengerStatus.current_count} / 31
                </p>
                <p className={`text-sm font-medium ${getOccupancyColor(stats.passengerStatus.occupancy_percentage)}`}>
                  {stats.passengerStatus.occupancy_percentage}% Occupied
                </p>
                {getOccupancyWarning(stats.passengerStatus.occupancy_percentage) && (
                  <p className="text-yellow-400 text-xs font-bold">
                    {getOccupancyWarning(stats.passengerStatus.occupancy_percentage)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bus Status */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="text-orange-400" size={20} />
                Bus Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Bus Number</span>
                  <span className="text-white font-medium">{stats.busStatus.bus_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Plate Number</span>
                  <span className="text-white/60 text-sm">{stats.busStatus.plate_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">GPS</span>
                  <span className={`flex items-center gap-1 text-sm ${stats.busStatus.gps_status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.busStatus.gps_status === 'ONLINE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {stats.busStatus.gps_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Raspberry Pi</span>
                  <span className={`flex items-center gap-1 text-sm ${stats.busStatus.raspberry_pi_status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.busStatus.raspberry_pi_status === 'ONLINE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {stats.busStatus.raspberry_pi_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Camera</span>
                  <span className={`flex items-center gap-1 text-sm ${stats.busStatus.camera_status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.busStatus.camera_status === 'ONLINE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {stats.busStatus.camera_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Internet</span>
                  <span className={`flex items-center gap-1 text-sm ${stats.busStatus.internet_status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.busStatus.internet_status === 'ONLINE' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {stats.busStatus.internet_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Occupancy Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-orange-400" size={20} />
              Passenger Occupancy Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">AI Passenger Count</p>
                <p className="text-white font-bold text-2xl">{stats.passengerStatus.ai_count}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">QR Validations</p>
                <p className="text-white font-bold text-2xl">{stats.passengerStatus.qr_validations}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Available Capacity</p>
                <p className="text-white font-bold text-2xl">{stats.passengerStatus.available_capacity}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="glass-card p-4 hover:bg-white/10 transition-colors text-left">
              <Navigation className="text-orange-400 mb-2" size={24} />
              <p className="text-white font-medium">Current Trip</p>
              <p className="text-white/60 text-sm">Manage trip</p>
            </button>
            <button className="glass-card p-4 hover:bg-white/10 transition-colors text-left">
              <MapPin className="text-orange-400 mb-2" size={24} />
              <p className="text-white font-medium">Route</p>
              <p className="text-white/60 text-sm">View route</p>
            </button>
            <button className="glass-card p-4 hover:bg-white/10 transition-colors text-left">
              <Users className="text-orange-400 mb-2" size={24} />
              <p className="text-white font-medium">Occupancy</p>
              <p className="text-white/60 text-sm">View details</p>
            </button>
            <button className="glass-card p-4 hover:bg-white/10 transition-colors text-left">
              <Bell className="text-orange-400 mb-2" size={24} />
              <p className="text-white font-medium">Notifications</p>
              <p className="text-white/60 text-sm">View alerts</p>
            </button>
          </div>

          {/* Emergency Button */}
          <EmergencyButton />

          {/* Bottom Information Bar */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin size={16} />
                  <span>GPS: {stats.gpsStatus.last_update ? new Date(stats.gpsStatus.last_update).toLocaleTimeString() : 'Never'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Wifi size={16} />
                  <span>System: Connected</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/60">
                {stats.currentTrip && (
                  <span>Trip: {stats.currentTrip.trip_id.slice(0, 8)}...</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}