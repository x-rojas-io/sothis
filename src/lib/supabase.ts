import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type AvailabilityTemplate = {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration: number;
    buffer_minutes: number;
    is_active: boolean;
    provider_id?: string; // Should be FK to providers
    created_at: string;
    updated_at: string;
};

export type Provider = {
    id: string;
    user_id?: string; // Link to auth.users/public.users
    name: string;
    bio?: string;
    specialties?: string[];
    image_url?: string;
    color_code?: string;
    is_active: boolean;
};

export type TimeSlot = {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: 'available' | 'booked' | 'blocked';
    provider_id?: string; // FK to providers
    created_at: string;
    updated_at: string;
};

export type Booking = {
    id: string;
    time_slot_id: string; // This links to TimeSlot -> Provider implicitly
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    client_city?: string;
    client_state?: string;
    client_zip?: string;
    service_type: string;
    notes?: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    cancellation_token: string;
    created_at: string;
    updated_at: string;
};

export type User = {
    id: string;
    email: string;
    role: 'admin' | 'client' | 'provider';
    created_at: string;
};

export type Client = {
    id: string;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
};

export type Service = {
    id: string;
    image_url: string;
    is_active: boolean;
    title: { [key: string]: string }; // { en: "...", es: "..." }
    description: { [key: string]: string };
    price: { [key: string]: string };
    duration: { [key: string]: string };
    created_at: string;
    updated_at: string;
};
