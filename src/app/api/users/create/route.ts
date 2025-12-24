
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, address, city, state, zip } = body;

        if (!email || !name) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        // Check if client already exists
        const { data: existingClient } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('email', email)
            .single();

        if (existingClient) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Create new client
        const { data: newClient, error } = await supabaseAdmin
            .from('clients')
            .insert({
                name,
                email,
                phone,
                address,
                city,
                state,
                zip
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating client:', error);
            // Fallback: If column missing (schema not updated), retry without them?
            // No, user instructions say schema update is part of task.
            return NextResponse.json({ error: `Failed to create user: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json(newClient);

    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
