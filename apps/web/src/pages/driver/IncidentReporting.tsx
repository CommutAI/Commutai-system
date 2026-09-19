import { useState, useEffect } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  AlertTriangle, MapPin, Send, CheckCircle,
  Bus, Wrench, Car, User, Navigation, Settings
} from 'lucide-react';
import type { IncidentReport } from '../types';

const INCIDENT_TYPES = [
  { value: 'vehicle_problem', label: 'Vehicle Problem', icon: Wrench, description: 'Mechanical issues, breakdowns, or malfunctions' },
  { value: 'road_obstruction', label: 'Road Obstruction', icon: Car, description: 'Blocked roads, construction, accidents ahead' },
  { value: 'accident', label: 'Accident', icon: AlertTriangle, description: 'Traffic accident involving the bus' },
  { value: 'passenger_issue', label: 'Passenger Issue', icon: User, description: 'Medical emergency, disturbance, or conflict' },
  { value: 'gps_problem', label: 'GPS Problem', icon: Navigation, description: 'GPS tracking issues or signal loss' },
  { value: 'system_problem', label: 'System Problem', icon: Settings, description: 'Technical issues with onboard systems' },
  { value: 'other', label: 'Other', icon: AlertTriangle, description: 'Any other type of incident' }
] as const;

export default function IncidentReporting() {
  const [incidentType, setIncidentType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTrip, setCurrentTrip] = useState<{ id: string; bus_id: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchCurrentData();
  }, []);

  const fetchCurrentData = async () => {
    try {
      // Get current GPS location
      const { data: gpsData } = await (supabase
        .from('bus_locations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single() as any);

      if (gpsData) {
        setGpsLocation({ lat: gpsData.lat, lng: gpsData.lng });
      }

      // Get current trip
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'driver@commutai.test') // Using actual driver email from database
        .single() as any);

      if (staffData) {
        const { data: tripData } = await (supabase
          .from('trips')
          .select('id, bus_id')
          .eq('operator_id', staffData.id)
          .eq('status', 'in_progress')
          .single() as any);

        if (tripData) {
          setCurrentTrip(tripData);
        }
      }
    } catch (error) {
      console.error('Error fetching current data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!incidentType || !description.trim()) {
      setError('Please select an incident type and provide a description');
      return;
    }

    if (!currentTrip) {
      setError('No active trip found. Please start a trip before reporting an incident.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'driver@commutai.test') // Using actual driver email from database
        .single() as any);

      if (!staffData) {
        throw new Error('Driver not found');
      }

      const incidentData: Partial<IncidentReport> = {
        driver_id: staffData.id,
        bus_id: currentTrip.bus_id,
        trip_id: currentTrip.id,
        incident_type: incidentType as any,
        description: description.trim(),
        gps_location: gpsLocation || { lat: 0, lng: 0 },
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await (supabase
        .from('incident_reports') as any)
        .insert(incidentData);

      if (insertError) throw insertError;

      // Log activity
      await (supabase
        .from('activity_logs') as any)
        .insert({
          user_id: staffData.id,
          action: 'incident_reported',
          trip_id: currentTrip.id,
          bus_id: currentTrip.bus_id,
          gps_location: gpsLocation,
          created_at: new Date().toISOString()
        });

      setSubmitted(true);
      setIncidentType('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting incident report:', error);
      setError('Failed to submit incident report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCoordinates = (location: { lat: number; lng: number } | null) => {
    if (!location) return 'Location not available';
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-500/20 text-green-400">
              <CheckCircle size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Incident Reported</h2>
          <p className="text-white/60 mb-6">
            Your incident report has been submitted successfully. The operator has been notified.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="primary-btn primary-btn--primary"
          >
            Report Another Incident
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Report Incident</h1>
        <p className="text-white/60">Report issues or incidents during your trip</p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Location Display */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-orange-400" size={20} />
              <p className="text-white/60 text-sm">Current GPS Location</p>
            </div>
            <p className="text-white font-medium">{formatCoordinates(gpsLocation)}</p>
            {!gpsLocation && (
              <p className="text-yellow-400 text-xs mt-1">GPS signal unavailable - using last known location</p>
            )}
          </div>

          {/* Current Trip Info */}
          {currentTrip ? (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Bus className="text-orange-400" size={20} />
                <p className="text-white/60 text-sm">Current Trip</p>
              </div>
              <p className="text-white font-medium">Trip ID: {currentTrip.id.slice(0, 8)}...</p>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                No active trip in progress. Please start a trip before reporting an incident.
              </p>
            </div>
          )}

          {/* Incident Type Selection */}
          <div>
            <label className="block text-white font-medium mb-3">
              Incident Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setIncidentType(type.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      incidentType === type.value
                        ? 'bg-orange-500/20 border-orange-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`flex-shrink-0 ${incidentType === type.value ? 'text-orange-400' : 'text-white/60'}`} size={20} />
                      <div>
                        <p className={`font-medium ${incidentType === type.value ? 'text-white' : 'text-white/80'}`}>
                          {type.label}
                        </p>
                        <p className="text-white/40 text-xs mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-3">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the incident..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-white/40 text-xs mt-1">
              {description.length} / 500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !currentTrip}
            className="w-full primary-btn primary-btn--primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit Incident Report
              </>
            )}
          </button>
        </form>
      </div>

      {/* Information Card */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-400" size={20} />
          Incident Reporting Guidelines
        </h3>
        <div className="space-y-3 text-white/70 text-sm">
          <p>
            <strong className="text-white">When to report:</strong> Report any incidents that affect passenger safety,
            vehicle operation, or service quality.
          </p>
          <p>
            <strong className="text-white">Be specific:</strong> Include relevant details such as time, location,
            and any actions taken.
          </p>
          <p>
            <strong className="text-white">Safety first:</strong> Only complete this form when the bus is safely stopped.
            Do not report incidents while driving.
          </p>
          <p>
            <strong className="text-white">Emergency situations:</strong> For immediate emergencies, use the Emergency
            button instead of this form.
          </p>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Incident Reports</h3>
        <div className="text-white/40 text-sm">
          <p>Recent incident reports will appear here</p>
        </div>
      </div>
    </div>
  );
}