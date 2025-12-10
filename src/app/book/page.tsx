'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import type { TimeSlot } from '@/lib/supabase';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';

// Wrap the content in a separate component to use useSearchParams
function BookingContent() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Auth Flow State
    const [step, setStep] = useState<'auth' | 'register' | 'verify' | 'slots' | 'confirm'>('auth');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [existingUser, setExistingUser] = useState<{ exists: boolean; name?: string } | null>(null);

    const [formData, setFormData] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        client_city: '',
        client_state: '',
        client_zip: '',
        notes: '',
    });
    const [message, setMessage] = useState('');

    // 1. Initial State Check
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            setStep('slots');
            fetchAvailableSlots();

            // Pre-fill data
            setFormData(prev => ({ ...prev, client_email: session.user?.email! }));
            fetch('/api/user/last-booking')
                .then(res => res.json())
                .then(data => {
                    if (data.booking) {
                        setFormData(prev => ({
                            ...prev,
                            client_name: data.booking.client_name || session.user?.name || '',
                            client_phone: data.booking.client_phone || '',
                            client_address: data.booking.client_address || '',
                            client_city: data.booking.client_city || '',
                            client_state: data.booking.client_state || '',
                            client_zip: data.booking.client_zip || '',
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, client_name: session.user?.name || '' }));
                    }
                });
        } else if (status === 'unauthenticated') {
            setStep('auth');
        }
    }, [status, session]);


    async function fetchAvailableSlots() {
        setLoadingSlots(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('time_slots')
                .select('*')
                .eq('status', 'available')
                .gte('date', today)
                .order('date')
                .order('start_time')
                .limit(50);

            if (error) throw error;
            setAvailableSlots(data || []);
        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    }

    // AUTH ACTION: Check Email
    const handleEmailCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setMessage('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage('❌ Please enter a valid email address.');
            setProcessing(false);
            return;
        }

        try {
            const res = await fetch(`/api/auth/check-user?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            if (data.exists) {
                setExistingUser({ exists: true, name: data.user?.name });
                // Stay on auth step, but show login button instead of "Continue"
            } else {
                setExistingUser({ exists: false });
                setFormData(prev => ({ ...prev, client_email: email }));
                setStep('register');
            }
        } catch (err) {
            console.error(err);
            setMessage('Error checking email. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    // AUTH ACTION: Send OTP (for existing user)
    const handleSendOtp = async () => {
        setProcessing(true);
        setMessage('');
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send code');

            if (data.dev_otp) {
                alert(`DEV MODE: Your verification code is: ${data.dev_otp}`);
            }

            setMessage('✅ Code sent to your email.');
            setStep('verify');
        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    // AUTH ACTION: Verify OTP & Login
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setMessage('');

        try {
            const result = await signIn('credentials', {
                email: email || formData.client_email,
                code: otp,
                redirect: false
            });

            if (result?.error) {
                throw new Error('Invalid code or expired.');
            }

            // Success! The session will update, passing the effect hook to show slots
            setMessage('✅ Verification successful!');
            // The useEffect listening to [status] will likely take over, but we can force step slightly faster
            // Wait for session update...

        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
            setProcessing(false); // Stop processing only on error, otherwise wait for redirect/session update
        }
    };

    // AUTH ACTION: Register New User & THEN Send OTP
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.client_email)) {
            setMessage('❌ Please enter a valid email address.');
            setProcessing(false);
            return;
        }

        try {
            // Create User Account (Unverified conceptually, but we create them)
            const userRes = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.client_name,
                    email: formData.client_email,
                    phone: formData.client_phone,
                    address: formData.client_address,
                    city: formData.client_city,
                    state: formData.client_state,
                    zip: formData.client_zip
                })
            });

            if (!userRes.ok) {
                const err = await userRes.json();
                // If user exists error is okay, we proceed to verify.
                // But ideally we caught that in check-user.
                if (err.error !== 'User already exists') {
                    throw new Error(err.error || 'Failed to create account');
                }
            }

            // Send OTP
            const otpRes = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.client_email })
            });

            if (!otpRes.ok) throw new Error('Account created, but failed to send verification code.');

            const otpData = await otpRes.json();
            if (otpData.dev_otp) {
                alert(`DEV MODE: Your verification code is: ${otpData.dev_otp}`);
            }

            setEmail(formData.client_email); // Ensure email state is set for verify step
            setStep('verify');
            setMessage('✅ Account created! We sent a code to your email to verify.');

        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleSlotSelect = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };

    const handleConfirmBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) return;
        setProcessing(true);

        try {
            const bookingRes = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    time_slot_id: selectedSlot.id,
                    ...formData
                })
            });

            if (!bookingRes.ok) {
                const err = await bookingRes.json();
                throw new Error(err.error || 'Failed to create booking');
            }

            setMessage('✅ Booking confirmed! Check your email for details.');
            setTimeout(() => {
                router.push('/my-bookings');
            }, 2000);
        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    // Group slots by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    if (status === 'loading') return <div className="text-center py-24">Loading...</div>;

    return (
        <div className="min-h-screen bg-white py-24">
            <div className="mx-auto max-w-3xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">
                        Book Your Appointment
                    </h1>
                    <p className="mt-2 text-lg text-stone-600">
                        {step === 'auth' && 'Please sign in or register to view available appointments.'}
                        {step === 'register' && 'Please complete your registration.'}
                        {step === 'verify' && 'Check your email for the verification code.'}
                        {step === 'slots' && 'Select a time for your appointment.'}
                        {step === 'confirm' && 'Confirm your booking details.'}
                    </p>
                </div>

                <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 md:p-8 shadow-sm">
                    {/* STEP 1: AUTHENTICATION */}
                    {step === 'auth' && (
                        <form onSubmit={handleEmailCheck} className="max-w-md mx-auto space-y-6">
                            {!existingUser?.exists ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-md border border-stone-300 px-4 py-3 text-lg"
                                            placeholder="you@example.com"
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full justify-center">
                                        {processing ? 'Checking...' : 'Continue'}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="text-green-600 font-medium mb-2 text-lg">Welcome back, {existingUser.name}!</div>
                                    <p className="text-stone-600 mb-6">
                                        Please sign in to view appointments. We'll send a focused verification code to your email.
                                    </p>
                                    <Button onClick={handleSendOtp} type="button" disabled={processing} className="w-full justify-center bg-stone-800">
                                        Send Code
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => { setExistingUser(null); setEmail(''); }}
                                        className="mt-4 text-sm text-stone-500 hover:text-stone-800"
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {/* STEP 1.5: VERIFY OTP */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto space-y-6 text-center">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Enter Verification Code</label>
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full text-center tracking-[1em] font-bold text-2xl rounded-md border border-stone-300 px-4 py-3"
                                    placeholder="123456"
                                    maxLength={6}
                                    autoFocus
                                />
                                <p className="text-xs text-stone-500 mt-2">Sent to {email}</p>
                            </div>
                            <Button type="submit" disabled={processing} className="w-full justify-center">
                                {processing ? 'Verifying...' : 'Verify & Sign In'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep('auth'); }}
                                className="mt-4 text-sm text-stone-500 hover:text-stone-800"
                            >
                                Back
                            </button>
                        </form>
                    )}


                    {/* STEP 1.5: REGISTRATION */}
                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <h3 className="font-semibold text-lg text-stone-900 mb-4">Create your account</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">Email</label>
                                    <input
                                        type="email" disabled
                                        value={formData.client_email}
                                        className="w-full rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-stone-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">Full Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.client_name}
                                        onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.client_phone}
                                        onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">Address</label>
                                    <input
                                        type="text"
                                        value={formData.client_address}
                                        onChange={e => setFormData({ ...formData, client_address: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">City</label>
                                    <input
                                        type="text"
                                        value={formData.client_city}
                                        onChange={e => setFormData({ ...formData, client_city: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">State / Zip</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" placeholder="State"
                                            className="w-1/2 rounded-md border border-stone-300 px-3 py-2"
                                            value={formData.client_state}
                                            onChange={e => setFormData({ ...formData, client_state: e.target.value })}
                                        />
                                        <input
                                            type="text" placeholder="Zip"
                                            className="w-1/2 rounded-md border border-stone-300 px-3 py-2"
                                            value={formData.client_zip}
                                            onChange={e => setFormData({ ...formData, client_zip: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" disabled={processing} className="w-full justify-center mt-6">
                                {processing ? 'Creating Account...' : 'Continue'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep('auth'); setExistingUser(null); }}
                                className="w-full text-center text-sm text-stone-500 hover:text-stone-800 mt-4"
                            >
                                Cancel
                            </button>
                        </form>
                    )}

                    {/* STEP 2: SELECT SLOT */}
                    {step === 'slots' && (
                        <div className="space-y-6">
                            {loadingSlots ? (
                                <div className="text-center py-12 text-stone-500">Loading availability...</div>
                            ) : Object.keys(slotsByDate).length === 0 ? (
                                <div className="text-center py-12 text-stone-500">No appointments available right now.</div>
                            ) : (
                                Object.entries(slotsByDate).map(([date, slots]) => (
                                    <div key={date} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                                        <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                                            <h3 className="font-semibold text-stone-900">
                                                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'long', month: 'long', day: 'numeric'
                                                })}
                                            </h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => handleSlotSelect(slot)}
                                                    className="px-3 py-2 rounded-md text-sm font-medium bg-stone-100 text-stone-900 hover:bg-secondary hover:text-white transition-colors"
                                                >
                                                    {slot.start_time.slice(0, 5)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* STEP 3: CONFIRMATION */}
                    {step === 'confirm' && selectedSlot && (
                        <form onSubmit={handleConfirmBooking} className="space-y-6">
                            <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-lg">
                                <p className="text-sm font-medium text-stone-900">Appointment Time:</p>
                                <p className="text-xl font-bold text-secondary mt-1">
                                    {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'long', day: 'numeric'
                                    })} at {selectedSlot.start_time.slice(0, 5)}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-600 bg-white p-4 rounded-lg border border-stone-100">
                                <div>
                                    <span className="block font-medium text-stone-900">Name</span>
                                    {formData.client_name}
                                </div>
                                <div>
                                    <span className="block font-medium text-stone-900">Email</span>
                                    {formData.client_email}
                                </div>
                                {formData.client_phone && (
                                    <div>
                                        <span className="block font-medium text-stone-900">Phone</span>
                                        {formData.client_phone}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Reason for Visit *</label>
                                <textarea
                                    required rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    placeholder="Please describe any issues or areas of focus..."
                                    autoFocus
                                />
                            </div>

                            <Button type="submit" disabled={processing} className="w-full justify-center">
                                {processing ? 'Confirming...' : 'Confirm Appointment'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => { setStep('slots'); setSelectedSlot(null); }}
                                className="w-full text-center text-sm text-stone-500 hover:text-stone-800"
                            >
                                Back to Time Slots
                            </button>
                        </form>
                    )}

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg text-center ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="text-center py-24">Loading...</div>}>
            <BookingContent />
        </Suspense>
    );
}
