-- FIX RLS Infinite Recursion Bug

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage templates" ON availability_templates;
DROP POLICY IF EXISTS "Admins can manage all slots" ON time_slots;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

-- Create a secure function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is an admin
  -- SECURITY DEFINER allows this function to bypass RLS
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE email = (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create policies using the secure function

-- Users table
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin());

-- Availability Templates
CREATE POLICY "Admins can manage templates" ON availability_templates
    FOR ALL USING (is_admin());

-- Time Slots
CREATE POLICY "Admins can manage all slots" ON time_slots
    FOR ALL USING (is_admin());

-- Bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (is_admin());
