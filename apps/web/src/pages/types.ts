export interface QRCard {
  id: string;
  card_uid: string;
  owner_name: string;
  contact_number?: string;
  balance: number;
  status: 'active' | 'lost' | 'replaced' | 'deactivated';
  card_type: 'regular' | 'student' | 'senior_citizen' | 'pwd';
  purchase_price: number;
  allowed_routes?: string[];
  passenger_id?: string;
  issued_by?: string;
  created_at: string;
  expires_at?: string;
}

export interface Transaction {
  id: string;
  card_id?: string;
  temp_ticket_id?: string;
  trip_id?: string;
  type: 'fare_validation' | 'card_issuance';
  amount: number;
  channel: string;
  staff_id?: string;
  created_at: string;
  baggage_category?: string;
  baggage_weight?: number;
  baggage_fee?: number;
  balance_after?: number;
  // For UI compatibility
  passengerName?: string;
  timestamp?: string;
  method?: string;
}

export interface Passenger {
  id: string;
  name: string;
  contactNumber?: string;
  phone?: string;
  passengerType: 'Regular' | 'Student' | 'Senior Citizen' | 'PWD';
}

export interface CustomerServiceLog {
  id: string;
  trip_id?: string;
  handled_by?: string;
  action: 'complaint' | 'inquiry' | 'refund' | 'lost_card' | 'other';
  description?: string;
  created_at: string;
}

export interface TemporaryTicket {
  id: string;
  ticket_uid: string;
  fare_amount: number;
  status: 'issued' | 'validated' | 'expired';
  allowed_routes?: string[];
  passenger_id?: string;
  trip_id?: string;
  issued_by?: string;
  issued_at: string;
  validated_at?: string;
}

// Driver-specific types
export interface DriverTrip {
  id: string;
  bus_id: string;
  operator_id: string;
  conductor_id?: string;
  route: string;
  origin: string;
  destination: string;
  status: 'scheduled' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_departure: string;
  started_at?: string;
  ended_at?: string;
  estimated_arrival?: string;
  buses?: {
    bus_number: string;
    plate_number: string;
    status: string;
    seat_capacity: number;
  };
  conductor?: {
    full_name: string;
    is_active: boolean;
  };
}

export interface GPSStatus {
  connected: boolean;
  current_location: { lat: number; lng: number } | null;
  last_update: string;
  speed: number;
  accuracy?: number;
  satellites?: number;
}

export interface PassengerOccupancy {
  current_count: number;
  available_capacity: number;
  occupancy_percentage: number;
  ai_count: number;
  qr_validations: number;
}

export interface ConductorInfo {
  name: string;
  status: string;
  current_trip: string;
  shift_status: string;
}

export interface BusStatus {
  bus_number: string;
  plate_number: string;
  status: string;
  gps_status: string;
  raspberry_pi_status: string;
  camera_status: string;
  internet_status: string;
}

export interface EmergencyAlert {
  id: string;
  driver_id: string;
  bus_id: string;
  trip_id: string;
  emergency_type: 'medical_emergency' | 'accident' | 'vehicle_problem' | 'passenger_incident' | 'security_safety' | 'other';
  description?: string;
  gps_location: { lat: number; lng: number };
  status: 'active' | 'resolved' | 'acknowledged';
  created_at: string;
  resolved_at?: string;
}

export interface IncidentReport {
  id: string;
  driver_id: string;
  bus_id: string;
  trip_id: string;
  incident_type: 'vehicle_problem' | 'road_obstruction' | 'accident' | 'passenger_issue' | 'gps_problem' | 'system_problem' | 'other';
  description: string;
  gps_location: { lat: number; lng: number };
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  sender: string;
  created_at: string;
  read: boolean;
  priority: 'info' | 'warning' | 'emergency';
}

export interface DriverNotification {
  id: string;
  driver_id: string;
  type: 'trip_assigned' | 'trip_starting' | 'gps_disconnected' | 'gps_restored' | 'emergency' | 'operator_message' | 'system_maintenance' | 'route_announcement' | 'bus_status_warning';
  message: string;
  priority: 'info' | 'warning' | 'emergency';
  read: boolean;
  created_at: string;
}

export interface DriverProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  bus_id?: string;
  license_number?: string;
  license_expiry?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  current_status: string;
  account_status: string;
  created_at: string;
}

export interface DriverTripHistory {
  id: string;
  route: string;
  bus_number: string;
  start_time: string;
  end_time?: string;
  status: string;
  passenger_count?: number;
}