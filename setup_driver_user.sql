-- Setup Driver User for CommutAI
-- This script creates a driver user in both Supabase Auth and staff_users table

-- First, create the user in Supabase Auth (you'll need to do this manually via Supabase dashboard)
-- Email: driver@commutai.com
-- Password: Driver123! (change this in production)
-- Make sure to enable email confirmation if required

-- Then insert into staff_users table
INSERT INTO staff_users (
  id,
  email,
  full_name,
  role,
  is_active,
  contact_number,
  assigned_bus,
  created_at,
  updated_at
) VALUES (
  -- Replace this with the actual UUID from Supabase Auth after creating the user
  '00000000-0000-0000-0000-000000000000',
  'driver@commutai.com',
  'Juan Dela Cruz',
  'driver',
  true,
  '+639123456789',
  'OMANFORTSCO-001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  contact_number = EXCLUDED.contact_number,
  assigned_bus = EXCLUDED.assigned_bus,
  updated_at = NOW();

-- Create a sample trip for the driver
INSERT INTO trips (
  id,
  bus_id,
  operator_id,
  conductor_id,
  route,
  origin,
  destination,
  status,
  scheduled_departure,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM buses WHERE bus_number = 'OMANFORTSCO-001' LIMIT 1),
  (SELECT id FROM staff_users WHERE email = 'driver@commutai.com' LIMIT 1),
  (SELECT id FROM staff_users WHERE role = 'conductor' LIMIT 1),
  'Manolo Fortich → Cagayan de Oro',
  'Manolo Fortich Terminal',
  'Cagayan de Oro Terminal',
  'scheduled',
  NOW() + INTERVAL '1 hour',
  NOW(),
  NOW()
);