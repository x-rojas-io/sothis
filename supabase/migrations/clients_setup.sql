-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on clients"
    ON clients
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Backfill from bookings
DO $$
DECLARE
    booking RECORD;
BEGIN
    FOR booking IN SELECT * FROM bookings ORDER BY created_at ASC LOOP
        INSERT INTO clients (email, name, phone, address, city, state, zip)
        VALUES (
            LOWER(TRIM(booking.client_email)), 
            booking.client_name, 
            booking.client_phone, 
            booking.client_address, 
            booking.client_city, 
            booking.client_state, 
            booking.client_zip
        )
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            phone = COALESCE(EXCLUDED.phone, clients.phone),
            address = COALESCE(EXCLUDED.address, clients.address),
            city = COALESCE(EXCLUDED.city, clients.city),
            state = COALESCE(EXCLUDED.state, clients.state),
            zip = COALESCE(EXCLUDED.zip, clients.zip),
            updated_at = NOW();
    END LOOP;
END $$;
