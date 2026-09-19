import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Navigation, Bus, User, MapPin, 
  Play, Square, CheckCircle, XCircle, Users,
  AlertTriangle
} from 'lucide-react';
import type { DriverTrip, GPSStatus, PassengerOccupancy, ConductorInfo } from '../types';

export default function CurrentTrip() {
  const [currentTrip, setCurrentTrip] = useState<DriverTrip | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>({
    connected: false,
    current_location: null,
    last_update: '',
    speed: 0
  });
  const [passengerOccupancy, setPassengerOccupancy] = useState<PassengerOccupancy>({
    current_count: 0,
    available_capacity: 31,
    occupancy_percentage: 0,
    ai_count: 0,
    qr_validations: 0
  });
  const [conductor, setConductor] = useState<ConductorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    gpsConnected: false,
    systemConnected: true
  });

  useEffect(() => {
    fetchCurrentTrip();
    
    const subscription = supabase
      .channel('driver-current-trip')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        void fetchCurrentTrip();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_locations' }, () => {
        void fetchGPSStatus();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passenger_counts' }, () => {
        void fetchPassengerOccupancy();
      })
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, []);

  const fetchCurrentTrip = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'driver@commutai.test')
        .single() as any);

      if (!staffData) return;

      const { data: tripData } = await (supabase
        .from('trips')
        .select(`
          *,
          buses (
            bus_number,
            plate_number,
            status,
            seat_capacity
          ),
          conductor:staff_users!trips_conductor_id_fkey (
            full_name,
            is_active
          )
        `)
        .eq('operator_id', staffData.id)
        .in('status', ['scheduled', 'ready', 'in_progress'])
        .order('scheduled_departure', { ascending: false })
        .limit(1)
        .single() as any);

      if (tripData) {
        setCurrentTrip(tripData);
        setConductor(tripData.conductor ? {
          name: tripData.conductor.full_name,
          status: tripData.conductor.is_active ? 'ON DUTY' : 'OFF DUTY',
          current_trip: tripData.id,
          shift_status: tripData.conductor.is_active ? 'ACTIVE' : 'INACTIVE'
        } : null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching current trip:', error);
      setLoading(false);
    }
  };

  const fetchGPSStatus = async () => {
    try {
      const { data: gpsData } = await (supabase
        .from('bus_locations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as any);

      setGpsStatus({
        connected: !!gpsData,
        current_location: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : null,
        last_update: gpsData?.updated_at || '',
        speed: gpsData?.speed || 0
      });
      setSystemStatus(prev => ({ ...prev, gpsConnected: !!gpsData }));
    } catch (error) {
      console.error('Error fetching GPS status:', error);
    }
  };

  const fetchPassengerOccupancy = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: passengerData } = await (supabase
        .from('passenger_counts')
        .select('count, ai_count')
        .gte('recorded_at', today)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single() as any);

      const { data: qrData } = await (supabase
        .from('boarded_passengers')
        .select('id')
        .gte('boarded_at', today) as any);

      const count = passengerData?.count || 0;
      setPassengerOccupancy({
        current_count: count,
        available_capacity: 31 - count,
        occupancy_percentage: Math.round((count / 31) * 100),
        ai_count: passengerData?.ai_count || 0,
        qr_validations: qrData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching passenger occupancy:', error);
    }
  };

  const startTrip = async () => {
    if (!currentTrip) return;

    try {
      // Get current GPS location
      const { data: gpsData } = await (supabase
        .from('bus_locations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as any);

      await (supabase
        .from('trips') as any)
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', currentTrip.id);

      // Log activity
      await (supabase
        .from('activity_logs') as any)
        .insert({
          user_id: currentTrip.operator_id,
          action: 'trip_started',
          trip_id: currentTrip.id,
          bus_id: currentTrip.bus_id,
          gps_location: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : null,
          created_at: new Date().toISOString()
        });

      setShowStartConfirm(false);
      await fetchCurrentTrip();
    } catch (error) {
      console.error('Error starting trip:', error);
      alert('Failed to start trip. Please try again.');
    }
  };

  const endTrip = async () => {
    if (!currentTrip) return;

    try {
      // Get current GPS location
      const { data: gpsData } = await (supabase
        .from('bus_locations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as any);

      await (supabase
        .from('trips') as any)
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentTrip.id);

      // Log activity
      await (supabase
        .from('activity_logs') as any)
        .insert({
          user_id: currentTrip.operator_id,
          action: 'trip_ended',
          trip_id: currentTrip.id,
          bus_id: currentTrip.bus_id,
          gps_location: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : null,
          created_at: new Date().toISOString()
        });

      setShowEndConfirm(false);
      await fetchCurrentTrip();
    } catch (error) {
      console.error('Error ending trip:', error);
      alert('Failed to end trip. Please try again.');
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'scheduled': return 'text-yellow-400';
      case 'ready': return 'text-orange-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-white">Loading trip information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Current Trip</h1>
        <p className="text-white/60">Manage your active trip</p>
      </div>

      {!currentTrip ? (
        <div className="glass-card p-8 text-center">
          <Bus className="text-white/40 mx-auto mb-4" size={48} />
          <p className="text-white/60">No active trip assigned</p>
          <p className="text-white/40 text-sm mt-2">Please contact dispatch for trip assignment</p>
        </div>
      ) : (
        <>
          {/* Trip Status Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${currentTrip.status === 'in_progress' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  <Navigation size={24} />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Trip Status</p>
                  <p className={`text-white font-bold text-lg capitalize ${getTripStatusColor(currentTrip.status)}`}>
                    {currentTrip.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Trip ID</p>
                <p className="text-white font-medium">{currentTrip.id.slice(0, 8)}...</p>
              </div>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Bus className="text-orange-400" size={20} />
                  <div>
                    <p className="text-white/60 text-sm">Bus</p>
                    <p className="text-white font-medium">{currentTrip.buses?.bus_number || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-orange-400" size={20} />
                  <div>
                    <p className="text-white/60 text-sm">Driver</p>
                    <p className="text-white font-medium">Assigned Driver</p>
                  </div>
                </div>
                {conductor && (
                  <div className="flex items-center gap-3">
                    <User className="text-orange-400" size={20} />
                    <div>
                      <p className="text-white/60 text-sm">Conductor</p>
                      <p className="text-white font-medium">{conductor.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="text-orange-400" size={20} />
                  <div>
                    <p className="text-white/60 text-sm">Route</p>
                    <p className="text-white font-medium">{currentTrip.route}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Navigation className="text-orange-400" size={20} />
                  <div>
                    <p className="text-white/60 text-sm">Origin → Destination</p>
                    <p className="text-white font-medium">{currentTrip.origin} → {currentTrip.destination}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Scheduled Departure</p>
                <p className="text-white font-medium">{formatTime(currentTrip.scheduled_departure)}</p>
                <p className="text-white/40 text-xs">{formatDate(currentTrip.scheduled_departure)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Start Time</p>
                <p className="text-white font-medium">{formatTime(currentTrip.started_at || '')}</p>
                <p className="text-white/40 text-xs">{formatDate(currentTrip.started_at || '')}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">End Time</p>
                <p className="text-white font-medium">{formatTime(currentTrip.ended_at || '')}</p>
                <p className="text-white/40 text-xs">{formatDate(currentTrip.ended_at || '')}</p>
              </div>
            </div>

            {/* GPS and Passenger Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className={gpsStatus.connected ? 'text-green-400' : 'text-red-400'} size={20} />
                  <p className="text-white/60 text-sm">GPS Status</p>
                </div>
                <p className={`font-medium ${gpsStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {gpsStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </p>
                {gpsStatus.connected && gpsStatus.current_location && (
                  <p className="text-white/40 text-xs mt-1">
                    {gpsStatus.current_location.lat.toFixed(4)}, {gpsStatus.current_location.lng.toFixed(4)}
                  </p>
                )}
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-orange-400" size={20} />
                  <p className="text-white/60 text-sm">Passengers</p>
                </div>
                <p className="text-white font-medium">
                  {passengerOccupancy.current_count} / 31
                </p>
                <p className="text-white/40 text-xs">
                  {passengerOccupancy.occupancy_percentage}% Occupied
                </p>
              </div>
            </div>

            {/* System Status Check */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                {systemStatus.gpsConnected ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-red-400" size={20} />
                )}
                <span className="text-white/60 text-sm">GPS Connection</span>
              </div>
              <div className="flex items-center gap-3">
                {systemStatus.systemConnected ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <XCircle className="text-red-400" size={20} />
                )}
                <span className="text-white/60 text-sm">System Connectivity</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {currentTrip.status === 'scheduled' || currentTrip.status === 'ready' ? (
                <button
                  onClick={() => setShowStartConfirm(true)}
                  disabled={!systemStatus.gpsConnected || !systemStatus.systemConnected}
                  className="flex-1 primary-btn primary-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={20} />
                  START TRIP
                </button>
              ) : currentTrip.status === 'in_progress' ? (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="flex-1 primary-btn primary-btn--secondary"
                >
                  <Square size={20} />
                  END TRIP
                </button>
              ) : (
                <div className="flex-1 text-center">
                  <p className="text-white/60">Trip {currentTrip.status.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Start Trip Confirmation Modal */}
          {showStartConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="glass-card p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-white mb-4">Start Trip</h2>
                <div className="space-y-3 mb-6">
                  <p className="text-white/60">{currentTrip.origin} → {currentTrip.destination}</p>
                  <p className="text-white/60">Bus: {currentTrip.buses?.bus_number || 'Not assigned'}</p>
                  {conductor && (
                    <p className="text-white/60">Conductor: {conductor.name}</p>
                  )}
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-white/60 text-sm">System Checks:</p>
                    <div className="flex items-center gap-2 mt-2">
                      {systemStatus.gpsConnected ? (
                        <CheckCircle className="text-green-400" size={16} />
                      ) : (
                        <XCircle className="text-red-400" size={16} />
                      )}
                      <span className="text-white/60 text-sm">GPS Connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {systemStatus.systemConnected ? (
                        <CheckCircle className="text-green-400" size={16} />
                      ) : (
                        <XCircle className="text-red-400" size={16} />
                      )}
                      <span className="text-white/60 text-sm">System Connected</span>
                    </div>
                  </div>
                </div>
                <p className="text-white mb-6">Are you ready to start this trip?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowStartConfirm(false)}
                    className="flex-1 primary-btn primary-btn--secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startTrip}
                    disabled={!systemStatus.gpsConnected || !systemStatus.systemConnected}
                    className="flex-1 primary-btn primary-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Trip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* End Trip Confirmation Modal */}
          {showEndConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="glass-card p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-orange-400" size={24} />
                  <h2 className="text-xl font-bold text-white">End Trip</h2>
                </div>
                <p className="text-white/60 mb-6">
                  You are about to complete the current trip. This will record the end time and 
                  notify the operator that the trip has ended.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 primary-btn primary-btn--secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={endTrip}
                    className="flex-1 primary-btn primary-btn--primary"
                  >
                    End Trip
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}