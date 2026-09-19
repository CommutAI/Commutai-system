import { useState, useEffect } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Navigation, MapPin, Play, ExternalLink, 
  Smartphone, Download, CheckCircle
} from 'lucide-react';

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff' | 'waypoint';
  order: number;
  completed: boolean;
  eta?: string;
  distance?: number;
}

export default function OrganicMapsIntegration() {
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<{ id: string; buses?: { bus_number?: number; route?: string } } | null>(null);
  const [isOrganicMapsInstalled, setIsOrganicMapsInstalled] = useState(false);

  useEffect(() => {
    void fetchActiveTrip();
    checkOrganicMapsInstallation();
  }, []);

  const checkOrganicMapsInstallation = () => {
    // Check if Organic Maps is installed (basic detection)
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
    
    if (isMobile) {
      // On mobile, we can try to detect if the app is installed
      // This is a basic check - actual detection requires more complex logic
      setIsOrganicMapsInstalled(true); // Assume available for demo
    }
  };

  const fetchActiveTrip = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'nekochii57@gmail.com') // Using actual driver email from database
        .single() as any);

      if (!staffData) return;

      const { data: tripData } = await (supabase
        .from('trips')
        .select(`
          *,
          buses (
            bus_number,
            route,
            seat_capacity
          )
        `)
        .eq('operator_id', staffData.id)
        .eq('status', 'in_progress')
        .single() as any);

      if (tripData) {
        setSelectedTrip(tripData);
        generateRouteStops(tripData.buses?.route || 'Manolo Fortich - Agora');
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    }
  };

  const generateRouteStops = (_routeName: string) => {
    // Sample route stops for Manolo Fortich - Agora route
    const stops: RouteStop[] = [
      {
        id: '1',
        name: 'Manolo Fortich Terminal',
        lat: 8.4300,
        lng: 124.7600,
        type: 'pickup',
        order: 1,
        completed: true,
        eta: '0 min',
        distance: 0
      },
      {
        id: '2',
        name: 'Poblacion Market',
        lat: 8.4350,
        lng: 124.7650,
        type: 'waypoint',
        order: 2,
        completed: false,
        eta: '5 min',
        distance: 1.2
      },
      {
        id: '3',
        name: 'San Isidro Crossing',
        lat: 8.4400,
        lng: 124.7700,
        type: 'waypoint',
        order: 3,
        completed: false,
        eta: '12 min',
        distance: 3.5
      },
      {
        id: '4',
        name: 'Dalirig Elementary',
        lat: 8.4450,
        lng: 124.7750,
        type: 'waypoint',
        order: 4,
        completed: false,
        eta: '18 min',
        distance: 5.8
      },
      {
        id: '5',
        name: 'Agora Terminal',
        lat: 8.4500,
        lng: 124.7800,
        type: 'dropoff',
        order: 5,
        completed: false,
        eta: '25 min',
        distance: 8.2
      }
    ];

    setRouteStops(stops);
  };

  const generateOrganicMapsUrl = (mode: 'nav' | 'dir' = 'nav') => {
    if (routeStops.length === 0) return '';

    const remainingStops = routeStops.filter(s => !s.completed);
    
    if (remainingStops.length === 0) return '';

    const lastStop = remainingStops[remainingStops.length - 1];
    const waypoints = remainingStops.slice(1, -1);

    // Organic Maps v2 API format
    // https://omaps.app/v2/nav or om://v2/nav
    const baseUrl = mode === 'nav' ? 'https://omaps.app/v2/nav' : 'https://omaps.app/v2/dir';
    
    let url = `${baseUrl}?`;
    
    // For navigation, origin is current location
    url += `origin=currentLocation&`;
    url += `origin_name=Current Location&`;
    
    // Destination
    url += `destination=${lastStop.lat},${lastStop.lng}&`;
    url += `destination_name=${encodeURIComponent(lastStop.name)}&`;
    
    // Waypoints
    if (waypoints.length > 0) {
      const waypointCoords = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
      const waypointNames = waypoints.map(w => encodeURIComponent(w.name)).join('|');
      url += `waypoints=${waypointCoords}&`;
      url += `waypoint_names=${waypointNames}&`;
    }
    
    // Mode of transport
    url += `mode=drive`;
    
    return url;
  };

  const openOrganicMaps = (mode: 'nav' | 'dir' = 'nav') => {
    const url = generateOrganicMapsUrl(mode);
    if (url) {
      // Try to open in Organic Maps app first
      const appUrl = url.replace('https://omaps.app', 'om://');
      
      // Create a hidden link to trigger the deep link
      const link = document.createElement('a');
      link.href = appUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback to web version after a short delay
      setTimeout(() => {
        window.open(url, '_blank');
      }, 1000);
    }
  };

  const downloadOrganicMaps = () => {
    // Redirect to Organic Maps download page
    window.open('https://organicmaps.app/get', '_blank');
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const totalDistance = routeStops.reduce((sum, stop) => sum + (stop.distance || 0), 0);
  const remainingStops = routeStops.filter(s => !s.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Organic Maps Navigation</h1>
        <p className="text-white/60">3D offline navigation using Organic Maps app</p>
      </div>

      {/* Organic Maps Info Card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
            <Smartphone size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Organic Maps Integration</h2>
            <p className="text-white/60 text-sm mb-4">
              Organic Maps is a fast, open-source, and privacy-focused alternative to Google Maps. 
              It provides clean 3D navigation, fast offline routing, and visual track logging without any ads or tracking scripts.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle size={16} className="text-green-400" />
                <span>Offline Maps</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle size={16} className="text-green-400" />
                <span>3D Navigation</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle size={16} className="text-green-400" />
                <span>Privacy-Focused</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle size={16} className="text-green-400" />
                <span>No Ads</span>
              </div>
            </div>
          </div>
        </div>

        {!isOrganicMapsInstalled && (
          <button
            onClick={downloadOrganicMaps}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <Download size={20} />
            Download Organic Maps
          </button>
        )}
      </div>

      {/* Route Summary */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Navigation className="text-orange-400" size={20} />
          Route Summary
        </h2>
        
        {selectedTrip ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Bus Number</p>
                <p className="text-white font-medium">#{selectedTrip.buses?.bus_number}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Route</p>
                <p className="text-white font-medium">{selectedTrip.buses?.route}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Total Distance</p>
                <p className="text-white font-medium">{formatDistance(totalDistance)}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Remaining Stops</p>
                <p className="text-white font-medium">{remainingStops}</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => openOrganicMaps('nav')}
                className="flex-1 primary-btn primary-btn--primary"
              >
                <Play size={20} />
                Start Navigation
              </button>
              <button
                onClick={() => openOrganicMaps('dir')}
                className="flex-1 primary-btn primary-btn--secondary"
              >
                <MapPin size={20} />
                Preview Route
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white/40">No active trip found. Please contact dispatch.</p>
        )}
      </div>

      {/* Route Stops */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="text-orange-400" size={20} />
          Route Stops
        </h2>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {routeStops.map((stop, index) => (
            <div
              key={stop.id}
              className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                stop.completed
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                stop.completed ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {stop.completed ? <CheckCircle size={20} className="text-white" /> : index + 1}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{stop.name}</p>
                <p className="text-white/60 text-sm capitalize">{stop.type}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{stop.eta}</p>
                <p className="text-white/60 text-sm">{formatDistance(stop.distance || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-white font-medium">Install Organic Maps</p>
              <p className="text-white/60 text-sm">Download the free Organic Maps app from your app store</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-white font-medium">Download Offline Maps</p>
              <p className="text-white/60 text-sm">Download the Philippines/region maps for offline navigation</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-white font-medium">Start Navigation</p>
              <p className="text-white/60 text-sm">Click "Start Navigation" to open your route in Organic Maps</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <p className="text-white font-medium">Navigate with 3D Guidance</p>
              <p className="text-white/60 text-sm">Enjoy 3D turn-by-turn navigation with offline support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Note */}
      <div className="glass-card p-4 border border-orange-500/30">
        <div className="flex items-start gap-3">
          <ExternalLink className="text-orange-400 size={20} flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">Deep Link Integration</p>
            <p className="text-white/60 text-sm">
              This system uses Organic Maps v2 API deep links to launch navigation directly in the app. 
              The system generates route URLs with your current stops and opens them in Organic Maps for 
              seamless 3D navigation experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}