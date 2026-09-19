export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operator' | 'driver' | 'conductor' | 'customer-service';
  name: string;
}

export interface Bus {
  id: string;
  plateNumber: string;
  route: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  fare: number;
}

export interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  conductorId: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  passengers: number;
  revenue: number;
}

export interface Passenger {
  id: string;
  name: string;
  cardNumber: string;
  balance: number;
  type: 'regular' | 'student' | 'senior' | 'pwd' | 'temp-regular' | 'temp-student' | 'temp-senior' | 'temp-pwd';
}

export interface Transaction {
  id: string;
  passengerId: string;
  tripId: string;
  amount: number;
  type: 'fare' | 'reload' | 'refund';
  timestamp: string;
}

export interface QRCard {
  id: string;
  card_number: string;
  card_type: 'regular' | 'student' | 'senior_citizen' | 'pwd' | 'temp_regular' | 'temp_student' | 'temp_senior' | 'temp_pwd';
  balance: number;
  status: 'active' | 'inactive' | 'blocked';
  issued_date: string;
  expiry_date?: string;
  passenger_name: string;
}