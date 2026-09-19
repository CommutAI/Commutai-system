import { useEffect, useState, useRef } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  Navigation, Play, Square, 
  ArrowRight, CheckCircle, Volume2, VolumeX,
  Compass, Route, Maximize2, Minimize2, MapPin
} from 'lucide-react';
// @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { DriverTrip } from '../types';

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

interface RouteInfo {
  totalDistance: number;
  totalDuration: number;
  currentLeg: {
    distance: number;
    duration: number;
    instructions: string[];
  };
}

interface NavigationState {
  isNavigating: boolean;
  currentStopIndex: number;
  progress: number;
  remainingStops: number;
}

export default function DriverNavigation() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // @ts-ignore - maplibregl.Map type reference
  const map = useRef<any>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [navState, setNavState] = useState<NavigationState>({
    isNavigating: false,
    currentStopIndex: 0,
    progress: 0,
    remainingStops: 0
  });
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
    map.current = new (maplibregl as any).Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Free OpenStreetMap tiles
      center: [124.76, 8.43], // Manolo Fortich - Agora route center
      zoom: 13,
      pitch: 45, // 3D perspective
      bearing: 0,
      antialias: true
    });

    // Add navigation controls
    if (map.current) {
      // @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
      map.current.addControl(new (maplibregl as any).NavigationControl({ visualizePitch: true }), 'top-right');
      // @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
      map.current.addControl(new (maplibregl as any).ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    }

    // Add 3D buildings layer when style loads
    if (map.current) {
      map.current.on('load', () => {
        if (map.current) {
          map.current.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        });
        }
      });
    }

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          if (map.current) {
            map.current.flyTo({ center: [longitude, latitude], zoom: 16, pitch: 60 });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Fetch active trip and route information
  useEffect(() => {
    void fetchActiveTrip();
    
    const subscription = supabase
      .channel('driver-navigation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        void fetchActiveTrip();
      })
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, []);

  const fetchActiveTrip = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('id')
        .eq('email', 'driver@commutai.test') // Using actual driver email from database
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
        setSelectedTrip(tripData as DriverTrip);
        // Generate route stops based on the route
        generateRouteStops(tripData.buses?.route || 'Manolo Fortich - Cagayan de Oro');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trip:', error);
      setLoading(false);
    }
  };

  const generateRouteStops = (_routeName: string) => {
    // Sample route stops for Manolo Fortich - Cagayan de Oro route
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
        name: 'Cagayan de Oro Terminal',
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
    setRouteInfo({
      totalDistance: 8.2,
      totalDuration: 25,
      currentLeg: {
        distance: 1.2,
        duration: 5,
        instructions: [
          'Head north on Highway',
          'Turn right at Poblacion Market',
          'Continue straight for 2km'
        ]
      }
    });
    setNavState({
      isNavigating: false,
      currentStopIndex: 1,
      progress: 20,
      remainingStops: 4
    });

    // Draw route on map
    if (map.current) {
      const routeCoordinates = stops.map(stop => [stop.lng, stop.lat]);
      
      if (map.current.getSource('route')) {
        // @ts-ignore - GeoJSONSource type
        (map.current.getSource('route') as any).setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          },
          properties: {}
        });
      } else {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates
            },
            properties: {}
          }
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#F97316',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      }

      // Add stop markers
      stops.forEach((stop, index) => {
        const el = document.createElement('div');
        el.className = 'stop-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = stop.completed ? '#22C55E' : '#F97316';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '12px';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.textContent = String(index + 1);

        // @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
        new (maplibregl as any).Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          // @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
          .setPopup(new (maplibregl as any).Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${stop.name}</strong><br>
              <span style="color: #666; font-size: 12px;">${stop.type}</span>
            </div>
          `))
          .addTo(map.current!);
      });
    }
  };

  const startNavigation = () => {
    setNavState(prev => ({ ...prev, isNavigating: true }));
    // Start GPS tracking and navigation
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Update progress and ETA based on movement
          updateNavigationProgress(latitude, longitude);
        },
        (error) => {
          console.error('GPS error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  };

  const updateNavigationProgress = (lat: number, lng: number) => {
    // Calculate progress based on distance to next stop
    const nextStop = routeStops[navState.currentStopIndex];
    if (nextStop) {
      const distance = calculateDistance(lat, lng, nextStop.lat, nextStop.lng);
      const progress = Math.max(0, Math.min(100, ((nextStop.distance || 0) - distance) / (nextStop.distance || 1) * 100));
      
      setNavState(prev => ({
        ...prev,
        progress: progress
      }));

      // Check if arrived at stop
      if (distance < 0.05) { // Within 50 meters
        completeStop(navState.currentStopIndex);
      }
    }
  };

  const completeStop = (stopIndex: number) => {
    const updatedStops = [...routeStops];
    updatedStops[stopIndex].completed = true;
    setRouteStops(updatedStops);

    if (stopIndex < routeStops.length - 1) {
      setNavState(prev => ({
        ...prev,
        currentStopIndex: stopIndex + 1,
        remainingStops: prev.remainingStops - 1,
        progress: 0
      }));
      
      // Update map markers
      if (map.current) {
        const el = document.createElement('div');
        el.className = 'stop-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#22C55E';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '12px';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.textContent = String(stopIndex + 1);

        // @ts-ignore - maplibre-gl doesn't have perfect TypeScript definitions
        new (maplibregl as any).Marker({ element: el })
          .setLngLat([updatedStops[stopIndex].lng, updatedStops[stopIndex].lat])
          .addTo(map.current);
      }
    } else {
      // Route completed
      setNavState(prev => ({ ...prev, isNavigating: false, remainingStops: 0 }));
      completeTrip();
    }
  };

  const completeTrip = async () => {
    if (selectedTrip) {
      try {
        await (supabase
          .from('trips') as any)
          .update({ 
            status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', selectedTrip.id);
        
        // Log activity
        await (supabase
          .from('activity_logs') as any)
          .insert({
            user_id: selectedTrip.operator_id,
            action: 'trip_completed_via_navigation',
            trip_id: selectedTrip.id,
            bus_id: selectedTrip.bus_id,
            created_at: new Date().toISOString()
          });
        
        alert('Trip completed successfully!');
      } catch (error) {
        console.error('Error completing trip:', error);
      }
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainer.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Driver Navigation</h1>
        <p className="text-white/60">Turn-by-turn navigation for your route</p>
      </div>

      {/* Navigation Status Card */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${navState.isNavigating ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
              <Navigation size={24} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Navigation Status</p>
              <p className="text-white font-semibold">
                {navState.isNavigating ? 'Active - En Route' : 'Ready to Start'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isSoundEnabled ? <Volume2 size={20} className="text-white" /> : <VolumeX size={20} className="text-white/60" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={20} className="text-white" /> : <Maximize2 size={20} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Route Progress */}
        {routeInfo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Route Progress</span>
              <span className="text-white font-semibold">{navState.progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${navState.progress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-white/40 text-xs">Total Distance</p>
                <p className="text-white font-semibold">{formatDistance(routeInfo.totalDistance)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/40 text-xs">Total Time</p>
                <p className="text-white font-semibold">{routeInfo.totalDuration} min</p>
              </div>
              <div className="text-center">
                <p className="text-white/40 text-xs">Remaining Stops</p>
                <p className="text-white font-semibold">{navState.remainingStops}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3D Map */}
      <div className="glass-card p-4" style={{ height: isFullscreen ? 'calc(100vh - 200px)' : '500px', overflow: 'hidden' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-white">Loading navigation map...</div>
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-full rounded-lg" />
        )}
      </div>

      {/* Navigation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Turn Instructions */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Compass className="text-orange-400" size={20} />
            Next Turn
          </h2>
          {routeInfo?.currentLeg ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <ArrowRight className="text-orange-400" size={24} />
                  <div>
                    <p className="text-white font-medium">Turn right at Poblacion Market</p>
                    <p className="text-white/60 text-sm">in 200 meters</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {routeInfo.currentLeg.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/60 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-white/40">Start navigation to see turn-by-turn directions</p>
          )}
        </div>

        {/* Route Stops */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Route className="text-orange-400" size={20} />
            Route Stops
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {routeStops.map((stop, index) => (
              <div
                key={stop.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index === navState.currentStopIndex
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : stop.completed
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  stop.completed ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  {stop.completed ? <CheckCircle size={16} className="text-white" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{stop.name}</p>
                  <p className="text-white/60 text-xs capitalize">{stop.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{stop.eta}</p>
                  <p className="text-white/60 text-xs">{formatDistance(stop.distance || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!navState.isNavigating ? (
          <button
            onClick={startNavigation}
            className="flex-1 primary-btn primary-btn--primary"
          >
            <Play size={20} />
            Start Navigation
          </button>
        ) : (
          <button
            onClick={() => setNavState(prev => ({ ...prev, isNavigating: false }))}
            className="flex-1 primary-btn primary-btn--danger"
          >
            <Square size={20} />
            Stop Navigation
          </button>
        )}
        <button
          onClick={() => completeStop(navState.currentStopIndex)}
          disabled={!navState.isNavigating}
          className="flex-1 primary-btn primary-btn--secondary"
        >
          <CheckCircle size={20} />
          Mark Stop Complete
        </button>
      </div>

      {/* Current Location Info */}
      {currentLocation && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <MapPin className="text-green-400" size={20} />
            <div>
              <p className="text-white/60 text-sm">Current Location</p>
              <p className="text-white font-medium">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}