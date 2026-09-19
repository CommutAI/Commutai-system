import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          name?: string;
          created_at?: string;
        };
      };
      buses: {
        Row: {
          id: string;
          plate_number: string;
          route: string;
          capacity: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plate_number: string;
          route: string;
          capacity: number;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plate_number?: string;
          route?: string;
          capacity?: number;
          status?: string;
          created_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          bus_id: string;
          route_id: string;
          driver_id: string;
          conductor_id: string;
          start_time: string;
          end_time?: string;
          status: string;
          passengers: number;
          revenue: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bus_id: string;
          route_id: string;
          driver_id: string;
          conductor_id: string;
          start_time: string;
          end_time?: string;
          status: string;
          passengers?: number;
          revenue?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bus_id?: string;
          route_id?: string;
          driver_id?: string;
          conductor_id?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          passengers?: number;
          revenue?: number;
          created_at?: string;
        };
      };
    };
  };
};