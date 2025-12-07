-- Sothis Therapeutic Massage - Booking System Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for admin authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability templates (Nancy's general schedule)
CREATE TABLE availability_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL, -- in minutes (60 or 90)
    buffer_minutes INTEGER NOT NULL DEFAULT 15, -- 15-minute buffer between appointments
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time slots (released slots available for booking)
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'blocked')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, start_time) -- Prevent duplicate slots
);

-- Bookings (confirmed appointments)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    service_type TEXT NOT NULL DEFAULT 'Therapeutic Massage',
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'confirmed',
    cancellation_token UUID DEFAULT uuid_generate_v4(), -- For secure cancellation links
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_time_slots_status ON time_slots(status);
CREATE INDEX idx_bookings_time_slot ON bookings(time_slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_cancellation_token ON bookings(cancellation_token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_availability_templates_updated_at
    BEFORE UPDATE ON availability_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user (Nancy)
-- Replace 'nancy@sothistherapeutic.com' with actual email
INSERT INTO users (email, role) VALUES ('sothistherapeutic@gmail.com', 'admin');

-- Sample availability template (Mon, Wed, Fri 9am-5pm with 60-min slots and 15-min buffer)
INSERT INTO availability_templates (day_of_week, start_time, end_time, slot_duration, buffer_minutes) VALUES
(1, '09:00', '17:00', 60, 15), -- Monday
(3, '09:00', '17:00', 60, 15), -- Wednesday
(5, '09:00', '17:00', 60, 15); -- Friday

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Only admins can view/modify
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

-- Availability templates: Admins can manage, public can view active ones
CREATE POLICY "Anyone can view active templates" ON availability_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON availability_templates
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

-- Time slots: Public can view available slots, admins can manage all
CREATE POLICY "Anyone can view available slots" ON time_slots
    FOR SELECT USING (status = 'available' AND date >= CURRENT_DATE);

CREATE POLICY "Admins can manage all slots" ON time_slots
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

-- Bookings: Public can create, admins can view/manage all
CREATE POLICY "Anyone can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own bookings via token" ON bookings
    FOR SELECT USING (true); -- Will validate via cancellation_token in app

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin'));

-- Function to automatically mark time slot as booked when booking is created
CREATE OR REPLACE FUNCTION mark_slot_as_booked()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE time_slots
    SET status = 'booked'
    WHERE id = NEW.time_slot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_created_mark_slot
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION mark_slot_as_booked();

-- Function to mark slot as available when booking is cancelled
CREATE OR REPLACE FUNCTION mark_slot_as_available_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE time_slots
        SET status = 'available'
        WHERE id = NEW.time_slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_cancelled_mark_slot
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION mark_slot_as_available_on_cancel();
