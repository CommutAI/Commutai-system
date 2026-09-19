import { useEffect, useState } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Clock, Navigation, Bus, CheckCircle, XCircle, 
  Calendar, Filter, RefreshCw, Users
} from 'lucide-react';
import type { DriverTripHistory } from '../types';

export default function TripHistory() {
  const [tripHistory, setTripHistory] = useState<DriverTripHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    fetchTripHistory();
  }, [filter, dateRange]);

  const fetchTripHistory = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'nekochii57@gmail.com') // Using actual driver email from database
        .single() as any);

      if (!staffData) return;

      let query = (supabase
        .from('trips') as any)
        .select(`
          id,
          route,
          buses (
            bus_number
          ),
          started_at,
          ended_at,
          status
        `)
        .eq('operator_id', staffData.id)
        .order('started_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply date filter
      const now = new Date();
      if (dateRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte('started_at', today.toISOString());
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('started_at', weekAgo.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('started_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedData = (data || []).map((trip: any) => ({
        id: trip.id,
        route: trip.route,
        bus_number: trip.buses?.bus_number || 'Unknown',
        start_time: trip.started_at,
        end_time: trip.ended_at,
        status: trip.status,
        passenger_count: 0 // Will be fetched separately
      }));

      setTripHistory(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trip history:', error);
      // Generate sample data for demo
      generateSampleHistory();
      setLoading(false);
    }
  };

  const generateSampleHistory = () => {
    const sampleHistory: DriverTripHistory[] = [
      {
        id: '1',
        route: 'Manolo Fortich → Cagayan de Oro',
        bus_number: 'OMANFORTSCO-001',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() - 1800000).toISOString(),
        status: 'completed',
        passenger_count: 24
      },
      {
        id: '2',
        route: 'Cagayan de Oro → Manolo Fortich',
        bus_number: 'OMANFORTSCO-001',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() - 72000000).toISOString(),
        status: 'completed',
        passenger_count: 28
      },
      {
        id: '3',
        route: 'Manolo Fortich → Cagayan de Oro',
        bus_number: 'OMANFORTSCO-001',
        start_time: new Date(Date.now() - 172800000).toISOString(),
        end_time: new Date(Date.now() - 158400000).toISOString(),
        status: 'completed',
        passenger_count: 19
      },
      {
        id: '4',
        route: 'Cagayan de Oro → Manolo Fortich',
        bus_number: 'OMANFORTSCO-001',
        start_time: new Date(Date.now() - 259200000).toISOString(),
        end_time: undefined,
        status: 'cancelled',
        passenger_count: 0
      },
      {
        id: '5',
        route: 'Manolo Fortich → Cagayan de Oro',
        bus_number: 'OMANFORTSCO-001',
        start_time: new Date(Date.now() - 345600000).toISOString(),
        end_time: new Date(Date.now() - 331200000).toISOString(),
        status: 'completed',
        passenger_count: 31
      }
    ];

    setTripHistory(sampleHistory);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'cancelled':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const calculateDuration = (startTime: string, endTime: string | null) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredHistory = tripHistory.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  const completedCount = tripHistory.filter(t => t.status === 'completed').length;
  const cancelledCount = tripHistory.filter(t => t.status === 'cancelled').length;
  const totalPassengers = tripHistory.reduce((sum, t) => sum + (t.passenger_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trip History</h1>
          <p className="text-white/60">View your completed and past trips</p>
        </div>
        <button
          onClick={() => void fetchTripHistory()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Refresh history"
        >
          <RefreshCw className="text-white" size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Completed Trips</p>
              <p className="text-white font-bold text-xl">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Cancelled Trips</p>
              <p className="text-white font-bold text-xl">{cancelledCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Passengers</p>
              <p className="text-white font-bold text-xl">{totalPassengers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-white/60" size={20} />
            <span className="text-white/60 text-sm">Status:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'all' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'completed' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'cancelled' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-white/60" size={20} />
            <span className="text-white/60 text-sm">Date:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  dateRange === 'today' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  dateRange === 'week' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  dateRange === 'month' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  dateRange === 'all' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip History List */}
      {loading ? (
        <div className="glass-card p-8 text-center">
          <div className="text-white">Loading trip history...</div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Clock className="text-white/40 mx-auto mb-4" size={48} />
          <p className="text-white/60">No trip history found</p>
          <p className="text-white/40 text-sm mt-2">
            Complete trips to see them appear here
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60 font-medium">Date</th>
                  <th className="text-left p-4 text-white/60 font-medium">Route</th>
                  <th className="text-left p-4 text-white/60 font-medium">Bus</th>
                  <th className="text-left p-4 text-white/60 font-medium">Start Time</th>
                  <th className="text-left p-4 text-white/60 font-medium">End Time</th>
                  <th className="text-left p-4 text-white/60 font-medium">Duration</th>
                  <th className="text-left p-4 text-white/60 font-medium">Passengers</th>
                  <th className="text-left p-4 text-white/60 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((trip) => (
                  <tr key={trip.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-white/60" size={16} />
                        <span className="text-white">{formatDate(trip.start_time)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Navigation className="text-orange-400" size={16} />
                        <span className="text-white">{trip.route}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Bus className="text-white/60" size={16} />
                        <span className="text-white">{trip.bus_number}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="text-white/60" size={16} />
                        <span className="text-white">{formatTime(trip.start_time)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="text-white/60" size={16} />
                        <span className="text-white">{formatTime(trip.end_time || '')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{calculateDuration(trip.start_time, trip.end_time || null)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="text-white/60" size={16} />
                        <span className="text-white">{trip.passenger_count || 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(trip.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(trip.status)}
                          <span className="capitalize">{trip.status.replace('_', ' ')}</span>
                        </div>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="glass-card p-4 border border-orange-500/30">
        <div className="flex items-start gap-3">
          <Clock className="text-orange-400 size={20} flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">Trip History</p>
            <p className="text-white/60 text-sm">
              This page displays your completed trips, cancelled trips, and passenger counts. 
              Historical records are maintained for operational tracking and cannot be modified by drivers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}