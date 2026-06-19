const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
    console.error('Missing env configuration URL or serviceKey.');
    process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function testPricingAndDuration() {
    console.log('--- STARTING PRICING & DURATION DATABASE VERIFICATION ---');

    let providerId = null;
    let timeSlotId = null;
    let bookingId = null;

    try {
        // 1. Create a dummy provider
        console.log('Step 1: Creating a test provider...');
        const { data: provider, error: providerErr } = await supabase
            .from('providers')
            .insert([{
                name: 'Test Therapist',
                bio: 'A therapist created for database pricing validation tests.',
                specialties: ['Therapeutic'],
                color_code: '#4f46e5',
                is_active: true
            }])
            .select()
            .single();

        if (providerErr) throw providerErr;
        providerId = provider.id;
        console.log(`✅ Test provider created with ID: ${providerId}`);

        // 2. Create a dummy slot
        console.log('Step 2: Creating a test time slot...');
        const { data: slot, error: slotErr } = await supabase
            .from('time_slots')
            .insert([{
                date: '2026-12-31',
                start_time: '11:00:00',
                end_time: '12:00:00',
                status: 'available',
                provider_id: providerId
            }])
            .select()
            .single();

        if (slotErr) throw slotErr;
        timeSlotId = slot.id;
        console.log(`✅ Test slot created with ID: ${timeSlotId}`);

        // 3. Create a booking with price & duration
        console.log('Step 3: Creating a booking with custom price & duration...');
        const testPrice = 130.00;
        const testDuration = 60;
        const { data: booking, error: bookingErr } = await supabase
            .from('bookings')
            .insert([{
                time_slot_id: timeSlotId,
                client_name: 'Test Client',
                client_email: 'test-client@sothistherapeutic.com',
                client_phone: '1234567890',
                service_type: 'Therapeutic Massage',
                price: testPrice,
                duration: testDuration,
                status: 'confirmed'
            }])
            .select()
            .single();

        if (bookingErr) throw bookingErr;
        bookingId = booking.id;
        console.log(`✅ Test booking created with ID: ${bookingId}`);

        // 4. Verify values in database
        console.log('Step 4: Verifying values saved in database...');
        const { data: verifyData, error: verifyErr } = await supabase
            .from('bookings')
            .select('id, price, duration, service_type')
            .eq('id', bookingId)
            .single();

        if (verifyErr) throw verifyErr;

        console.log('Fetched Booking Details:', verifyData);

        if (parseFloat(verifyData.price) === testPrice && parseInt(verifyData.duration, 10) === testDuration) {
            console.log('🎉 SUCCESS: Price and duration are stored correctly in the database!');
        } else {
            console.error(`❌ FAILURE: Expected price ${testPrice} and duration ${testDuration}, but got price ${verifyData.price} and duration ${verifyData.duration}`);
            process.exitCode = 1;
        }

    } catch (err) {
        console.error('❌ Error during database test run:', err);
        process.exitCode = 1;
    } finally {
        // 5. Cleanup
        console.log('\n--- CLEANING UP TEST RECORDS ---');
        if (bookingId) {
            console.log('Deleting test booking...');
            await supabase.from('bookings').delete().eq('id', bookingId);
        }
        if (timeSlotId) {
            console.log('Deleting test time slot...');
            await supabase.from('time_slots').delete().eq('id', timeSlotId);
        }
        if (providerId) {
            console.log('Deleting test provider...');
            await supabase.from('providers').delete().eq('id', providerId);
        }
        console.log('✅ Cleanup completed.');
    }
}

testPricingAndDuration();
