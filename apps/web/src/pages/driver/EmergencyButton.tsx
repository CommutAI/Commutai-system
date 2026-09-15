import { useState, useEffect } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  AlertTriangle, MapPin, Send, X, CheckCircle,
  Heart, Car, Shield, Users, Activity
} from 'lucide-react';
import type { EmergencyAlert } from '../types';

const EMERGENCY_TYPES = [
  { 
    value: 'medical_emergency', 
    label: 'Medical Emergency', 
    icon: Heart, 
    description: 'Passenger or crew medical emergency requiring immediate attention',
    color: 'red'
  },
  { 
    value: 'accident', 
    label: 'Accident', 
    icon: Car, 
    description: 'Traffic accident involving the bus or other vehicles',
    color: 'red'
  },
  { 
    value: 'vehicle_problem', 
    label: 'Vehicle Problem', 
    icon: Activity, 
    description: 'Mechanical failure or serious vehicle malfunction',
    color: 'orange'
  },
  { 
    value: 'passenger_incident', 
    label: 'Passenger Incident', 
    icon: Users, 
    description: 'Disturbance, conflict, or safety issue involving passengers',
    color: 'orange'
  },
  { 
    value: 'security_safety', 
    label: 'Security/Safety Issue', 
    icon: Shield, 
    description: 'Security threat or safety concern requiring immediate response',
    color: 'red'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: AlertTriangle, 
    description: 'Any other emergency situation not covered above',
    color: 'yellow'
  }
] as const;

interface EmergencyButtonProps {
  standalone?: boolean;
}

export default function EmergencyButton({ standalone = false }: EmergencyButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentTrip, setCurrentTrip] = useState<{ id: string; bus_id: string } | null>(null);

  useEffect(() => {
    if (showModal) {
      void fetchCurrentData();
    }
  }, [showModal]);

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
        .eq('email', 'nekochii57@gmail.com') // Using actual driver email from database
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

  const handleEmergencyAlert = async () => {
    if (!selectedType) {
      alert('Please select an emergency type');
      return;
    }

    if (!currentTrip) {
      alert('No active trip found. Emergency alerts require an active trip.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'nekochii57@gmail.com') // Using actual driver email from database
        .single() as any);

      if (!staffData) {
        throw new Error('Driver not found');
      }

      const alertData: Partial<EmergencyAlert> = {
        driver_id: staffData.id,
        bus_id: currentTrip.bus_id,
        trip_id: currentTrip.id,
        emergency_type: selectedType as any,
        description: description.trim() || undefined,
        gps_location: gpsLocation || { lat: 0, lng: 0 },
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await (supabase
        .from('emergency_alerts') as any)
        .insert(alertData);

      if (insertError) throw insertError;

      // Log activity
      await (supabase
        .from('activity_logs') as any)
        .insert({
          user_id: staffData.id,
          action: 'emergency_alert_sent',
          trip_id: currentTrip.id,
          bus_id: currentTrip.bus_id,
          gps_location: gpsLocation,
          created_at: new Date().toISOString()
        });

      setSubmitted(true);
      setSelectedType('');
      setDescription('');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please try again or use alternative communication.');
    } finally {
      setSubmitting(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20';
      case 'orange':
        return 'border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20';
      case 'yellow':
        return 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20';
      default:
        return 'border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'text-red-400';
      case 'orange':
        return 'text-orange-400';
      case 'yellow':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatCoordinates = (location: { lat: number; lng: number } | null) => {
    if (!location) return 'Location not available';
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  // Standalone mode returns just the button
  if (standalone && !showModal && !submitted) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 text-xl"
      >
        <AlertTriangle size={32} className="animate-pulse" />
        🚨 EMERGENCY
      </button>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="glass-card p-8 text-center border border-green-500/30">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle size={48} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Emergency Alert Sent</h2>
        <p className="text-white/60 mb-6">
          Operator has been notified. Help is on the way.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setShowModal(false);
          }}
          className="primary-btn primary-btn--primary"
        >
          Close
        </button>
      </div>
    );
  }

  // Modal
  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-500/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Emergency Alert</h2>
                <p className="text-white/60 text-sm">Send emergency notification to operator</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="text-white" size={24} />
            </button>
          </div>

          {/* Current Location */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-red-400" size={20} />
              <p className="text-white/60 text-sm">Current GPS Location</p>
            </div>
            <p className="text-white font-medium">{formatCoordinates(gpsLocation)}</p>
            {!gpsLocation && (
              <p className="text-yellow-400 text-xs mt-1">GPS signal unavailable - using last known location</p>
            )}
          </div>

          {/* Current Trip Info */}
          {currentTrip ? (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
              <p className="text-white/60 text-sm mb-1">Active Trip</p>
              <p className="text-white font-medium">Trip ID: {currentTrip.id.slice(0, 8)}...</p>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ No active trip found. Emergency alerts require an active trip.
              </p>
            </div>
          )}

          {/* Emergency Type Selection */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">
              Emergency Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EMERGENCY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedType === type.value
                        ? getColorClasses(type.color)
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`flex-shrink-0 ${getIconColor(type.color)}`} size={24} />
                      <div>
                        <p className={`font-medium ${selectedType === type.value ? 'text-white' : 'text-white/80'}`}>
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
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional details about the emergency..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition-colors resize-none"
              rows={3}
              maxLength={300}
            />
            <p className="text-white/40 text-xs mt-1">
              {description.length} / 300 characters
            </p>
          </div>

          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-white font-medium mb-1">⚠️ Important</p>
                <p className="text-white/60 text-sm">
                  Emergency alerts are immediately sent to the operator and may trigger emergency response protocols.
                  Only use this feature for genuine emergencies requiring immediate assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 primary-btn primary-btn--secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleEmergencyAlert}
              disabled={!selectedType || !currentTrip || submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <Send size={20} />
                  SEND EMERGENCY ALERT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Integrated mode - returns trigger button
  return (
    <button
      onClick={() => setShowModal(true)}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-red-600/30 flex items-center justify-center gap-3"
    >
      <AlertTriangle size={24} className="animate-pulse" />
      🚨 EMERGENCY
    </button>
  );
}