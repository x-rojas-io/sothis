-- 1. Fix RLS on Clients Table
-- The previous policy might be failing if 'users' table lookup fails or 'auth.uid()' is not matching 'users.id' correctly
-- Let's simplify Admin Access: just allow if the auth user has role 'service_role' (for API) or checks 'users' table.

DROP POLICY IF EXISTS "Admins can do everything on clients" ON clients;

CREATE POLICY "Admins can do everything on clients"
    ON clients
    FOR ALL
    USING (
        (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        OR
        (SELECT role FROM users WHERE id = auth.uid()) = 'provider'
    );

-- 2. Create Trigger to Sync Bookings -> Clients
-- When a booking is created, upsert into clients. This ensures the Clients list is always up to date.
CREATE OR REPLACE FUNCTION public.sync_booking_to_client()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO clients (email, name, phone, address, city, state, zip)
    VALUES (
        LOWER(TRIM(NEW.client_email)), 
        NEW.client_name, 
        NEW.client_phone, 
        NEW.client_address, 
        NEW.client_city, 
        NEW.client_state, 
        NEW.client_zip
    )
    ON CONFLICT (email) DO UPDATE SET
        -- Only update fields if they are provided in the new booking (non-null)
        -- Or maybe we prefer to keep the latest stats? 
        -- User wants 'Clients' table to be master.
        -- Let's only update if the existing client data is missing OR if we want latest contact info.
        -- Usually latest booking info is most current.
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, clients.phone),
        address = COALESCE(EXCLUDED.address, clients.address),
        city = COALESCE(EXCLUDED.city, clients.city),
        state = COALESCE(EXCLUDED.state, clients.state),
        zip = COALESCE(EXCLUDED.zip, clients.zip),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_booking_client ON bookings;
CREATE TRIGGER trigger_sync_booking_client
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_booking_to_client();
