import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Users, TrendingUp, AlertTriangle, Activity,
  RefreshCw, Clock, CheckCircle
} from 'lucide-react';
import type { PassengerOccupancy } from '../types';

export default function PassengerOccupancy() {
  const [occupancy, setOccupancy] = useState<PassengerOccupancy>({
    current_count: 0,
    available_capacity: 31,
    occupancy_percentage: 0,
    ai_count: 0,
    qr_validations: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [occupancyHistory, setOccupancyHistory] = useState<{
    count: number;
    percentage: number;
    timestamp: string;
  }[]>([]);

  const MAX_CAPACITY = 31; // 25 seats + 6 standing

  useEffect(() => {
    fetchOccupancyData();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('driver-occupancy')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passenger_counts' }, () => {
        void fetchOccupancyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boarded_passengers' }, () => {
        void fetchOccupancyData();
      })
      .subscribe();

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      void fetchOccupancyData();
    }, 60000);

    return () => {
      void subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchOccupancyData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch AI passenger counts
      const { data: passengerData } = await (supabase
        .from('passenger_counts')
        .select('count, ai_count, recorded_at')
        .gte('recorded_at', today)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single() as any);

      // Fetch QR validations count
      const { data: qrData } = await (supabase
        .from('boarded_passengers')
        .select('id, boarded_at')
        .gte('boarded_at', today) as any);

      const count = passengerData?.count || 0;
      const newOccupancy = {
        current_count: count,
        available_capacity: MAX_CAPACITY - count,
        occupancy_percentage: Math.round((count / MAX_CAPACITY) * 100),
        ai_count: passengerData?.ai_count || 0,
        qr_validations: qrData?.length || 0
      };

      setOccupancy(newOccupancy);
      setLastUpdate(new Date());

      // Add to history if count changed
      if (occupancyHistory.length === 0 || occupancyHistory[0].count !== count) {
        setOccupancyHistory(prev => [
          { 
            count, 
            percentage: newOccupancy.occupancy_percentage, 
            timestamp: new Date().toISOString() 
          },
          ...prev.slice(0, 9) // Keep last 10 entries
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      setLoading(false);
    }
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-400';
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-yellow-400';
    if (percentage >= 50) return 'text-orange-400';
    return 'text-green-400';
  };

  const getOccupancyBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getOccupancyWarning = (percentage: number) => {
    if (percentage >= 100) return { show: true, message: '⚠ BUS AT CAPACITY', type: 'danger' as const };
    if (percentage >= 90) return { show: true, message: '⚠ Near Capacity', type: 'warning' as const };
    if (percentage >= 75) return { show: true, message: '⚠ High Occupancy', type: 'warning' as const };
    return { show: false, message: '', type: 'info' as const };
  };

  const getOccupancyStatus = (percentage: number) => {
    if (percentage >= 100) return 'Full';
    if (percentage >= 90) return 'Near Full';
    if (percentage >= 75) return 'High';
    if (percentage >= 50) return 'Moderate';
    if (percentage >= 25) return 'Low';
    return 'Very Low';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const warning = getOccupancyWarning(occupancy.occupancy_percentage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Passenger Occupancy</h1>
          <p className="text-white/60">Real-time passenger count and capacity monitoring</p>
        </div>
        <button
          onClick={() => void fetchOccupancyData()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Refresh occupancy data"
        >
          <RefreshCw className="text-white" size={20} />
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center">
          <div className="text-white">Loading occupancy data...</div>
        </div>
      ) : (
        <>
          {/* Main Occupancy Display */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-lg bg-purple-500/20 text-purple-400">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-white/60 text-sm">PASSENGER OCCUPANCY</p>
                  <p className="text-3xl font-bold text-white">
                    {occupancy.current_count} / {MAX_CAPACITY}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getOccupancyColor(occupancy.occupancy_percentage)}`}>
                  {occupancy.occupancy_percentage}% Occupied
                </p>
                <p className="text-white/60 text-sm">{getOccupancyStatus(occupancy.occupancy_percentage)}</p>
              </div>
            </div>

            {/* Occupancy Bar */}
            <div className="mb-6">
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getOccupancyBarColor(occupancy.occupancy_percentage)} transition-all duration-500`}
                  style={{ width: `${Math.min(occupancy.occupancy_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Warning Banner */}
            {warning.show && (
              <div className={`mb-6 p-4 rounded-lg border ${
                warning.type === 'danger' 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={warning.type === 'danger' ? 'text-red-400' : 'text-yellow-400'} size={24} />
                  <p className={`font-bold ${warning.type === 'danger' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {warning.message}
                  </p>
                </div>
                <p className="text-white/60 text-sm mt-2">
                  {warning.type === 'danger' 
                    ? 'Bus has reached maximum capacity. No additional passengers can board.'
                    : 'Bus is approaching maximum capacity. Monitor boarding closely.'}
                </p>
              </div>
            )}

            {/* Capacity Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-purple-400" size={18} />
                  <p className="text-white/60 text-sm">AI Passenger Count</p>
                </div>
                <p className="text-white font-bold text-2xl">{occupancy.ai_count}</p>
                <p className="text-white/40 text-xs">AI-monitored</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-purple-400" size={18} />
                  <p className="text-white/60 text-sm">QR Validations</p>
                </div>
                <p className="text-white font-bold text-2xl">{occupancy.qr_validations}</p>
                <p className="text-white/40 text-xs">Fare transactions</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-purple-400" size={18} />
                  <p className="text-white/60 text-sm">Available Capacity</p>
                </div>
                <p className="text-white font-bold text-2xl">{occupancy.available_capacity}</p>
                <p className="text-white/40 text-xs">Remaining spots</p>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-orange-400" size={20} />
              Capacity Breakdown
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div>
                    <p className="text-white font-medium">Seated Passengers</p>
                    <p className="text-white/60 text-sm">25 seats available</p>
                  </div>
                </div>
                <p className="text-white font-bold text-xl">
                  {Math.min(occupancy.current_count, 25)} / 25
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <div>
                    <p className="text-white font-medium">Standing Passengers</p>
                    <p className="text-white/60 text-sm">6 standing positions</p>
                  </div>
                </div>
                <p className="text-white font-bold text-xl">
                  {Math.max(0, occupancy.current_count - 25)} / 6
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <div>
                    <p className="text-white font-medium">Total Capacity</p>
                    <p className="text-white/60 text-sm">Seated + Standing</p>
                  </div>
                </div>
                <p className="text-white font-bold text-xl">
                  {occupancy.current_count} / {MAX_CAPACITY}
                </p>
              </div>
            </div>
          </div>

          {/* Occupancy History */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="text-orange-400" size={20} />
              Recent Occupancy Changes
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {occupancyHistory.length === 0 ? (
                <p className="text-white/40 text-sm">No occupancy history available</p>
              ) : (
                occupancyHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="text-purple-400" size={16} />
                      <div>
                        <p className="text-white font-medium">{entry.count} passengers</p>
                        <p className={`text-sm ${getOccupancyColor(entry.percentage)}`}>
                          {entry.percentage}% occupied
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-sm">{formatTime(entry.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Information Note */}
          <div className="glass-card p-4 border border-orange-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-orange-400 size={20} flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Driver Notice</p>
                <p className="text-white/60 text-sm">
                  Passenger counts are automatically monitored by the AI system and recorded through conductor QR transactions.
                  This information is for operational awareness only. The driver cannot modify passenger counts or transaction records.
                </p>
              </div>
            </div>
          </div>

          {lastUpdate && (
            <div className="text-center text-white/40 text-sm">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
}