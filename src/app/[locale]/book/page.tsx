'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import type { TimeSlot, Provider, Service } from '@/lib/supabase';
import { useSession, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { useTranslations } from 'next-intl';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday,
    isBefore,
    startOfDay,
    addDays,
    subDays,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// Wrap the content in a separate component to use useSearchParams
function BookingContent() {
    const t = useTranslations('BookPage');
    const { data: session, status } = useSession();
    const router = useRouter();

    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState<'month' | 'day'>('month');
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Auth Flow State
    const [step, setStep] = useState<'auth' | 'register' | 'verify' | 'provider' | 'service' | 'slots' | 'confirm' | 'urgent-request' | 'success'>('auth');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    
    // Intake Selection State
    const [intakeHistory, setIntakeHistory] = useState<any[]>([]);
    const [selectedIntakeId, setSelectedIntakeId] = useState<string>('new');
    const [loadingIntake, setLoadingIntake] = useState(false);

    // Fetch providers and services on mount
    useEffect(() => {
        // Fetch Providers and Services
        const fetchData = async () => {
            const { data: provData } = await supabase.from('providers').select('*').eq('is_active', true);
            if (provData) setProviders(provData);

            const { data: servData } = await supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });
            if (servData) setServices(servData);
        };
        fetchData();
    }, []);
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
        data_consent: false, // Mandatory Signup Consent
    });
    const [message, setMessage] = useState('');

    // 1. Initial State Check
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            // Check for Admin/Provider Role and Redirect
            const role = (session.user as any).role;
            if (role === 'admin' || role === 'provider') {
                router.push('/admin');
                return;
            }

            setStep('provider');
            // fetchAvailableSlots(); // Handled later

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
    }, [status, session, router]);


    // Fetch slots when switching to slots step or changing month
    useEffect(() => {
        if (step === 'slots') {
            fetchAvailableSlots();
        }
        if ((step === 'confirm' || step === 'urgent-request') && status === 'authenticated') {
            fetchIntakeHistory();
        }
    }, [step, currentDate, status]);

    async function fetchIntakeHistory() {
        setLoadingIntake(true);
        try {
            const res = await fetch('/api/user/intake?history=all', { cache: 'no-store' });
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                setIntakeHistory(data.history);
                // Default to the most recent one if available
                setSelectedIntakeId(data.history[0].id);
            } else {
                setSelectedIntakeId('new');
            }
        } catch (error) {
            console.error('Failed to fetch intake history:', error);
        } finally {
            setLoadingIntake(false);
        }
    }


    async function fetchAvailableSlots() {
        setLoadingSlots(true);
        try {
            // Calculate start and end of the calendar view
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            const calendarStart = startOfWeek(monthStart).toISOString().split('T')[0];
            const calendarEnd = endOfWeek(monthEnd).toISOString().split('T')[0];

            // POINT 2: Client can only book 7 days in advance
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const leadTimeDate = addDays(today, 7);
            const minDateStr = leadTimeDate.toISOString().split('T')[0];
            
            // We still fetch slots for the next 7 days so we can show "Request Urgent" info
            const fetchStart = calendarStart < today.toISOString().split('T')[0] ? today.toISOString().split('T')[0] : calendarStart;

            let query = supabase
                .from('time_slots')
                .select('*')
                .eq('status', 'available')
                .gte('date', fetchStart)
                .lte('date', calendarEnd)
                .order('date')
                .order('start_time');

            if (selectedProvider) {
                query = query.eq('provider_id', selectedProvider.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Mark slots as "Client-Disabled" if within 7 days
            const processedSlots = (data || []).map(slot => ({
                ...slot,
                isLeadTimeRestricted: slot.date < minDateStr
            }));

            setAvailableSlots(processedSlots);
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
            setMessage(t('errors.invalidEmail'));
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
            if (!res.ok) throw new Error(data.error || t('errors.sendCodeError'));

            // Alert removed for production flow

            setMessage(t('errors.codeSent'));
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
            setMessage(t('errors.verifySuccess'));
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
            setMessage(t('errors.invalidEmail'));
            setProcessing(false);
            return;
        }

        if (!formData.data_consent) {
            setMessage('❌ Please authorize the collection of your personal data to continue.');
            setProcessing(false);
            return;
        }

        try {
            // Create User Account
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
                    zip: formData.client_zip,
                    consent_at: new Date().toISOString(),
                    consent_version: 'v1.0-2024-04'
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
            // Alert removed for production flow

            setEmail(formData.client_email); // Ensure email state is set for verify step
            setStep('verify');
            setMessage(t('errors.accountCreated'));

        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleProviderSelect = (provider: Provider) => {
        setSelectedProvider(provider);
        // Automatically fetch slots or move to next step?
        // Let's move to Service Selection
        setStep('service');
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setStep('slots');
    };

    const handleSlotSelect = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };

    const handleConfirmBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) return; // Ensure slot is selected

        // Validate Notes (Mandatory)
        if (!formData.notes || formData.notes.trim().length === 0) {
            setMessage('❌ Please include a note or reason for your visit.');
            return;
        }

        setProcessing(true);

        try {
            // Timestamp the note
            const now = new Date();
            const timestamp = now.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const formattedNotes = `[${timestamp}]: ${formData.notes}`;

            const bookingRes = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    time_slot_id: selectedSlot.id,
                    service_type: selectedService ? selectedService.title['en'] : 'Therapeutic Massage', // Add fallback

                    ...formData,
                    notes: formattedNotes, // Send timestamped note
                    intake_form_id: selectedIntakeId === 'new' ? null : selectedIntakeId
                })
            });

            if (!bookingRes.ok) {
                const err = await bookingRes.json();
                throw new Error(err.error || 'Failed to create booking');
            }

            const bookingData = await bookingRes.json();
            const newBookingId = bookingData.booking?.id;

            setMessage('');
            
            // If "Create New" was selected, jump to intake form with booking context
            if (selectedIntakeId === 'new') {
                router.push(`/intake-form?booking_id=${newBookingId}`);
            } else {
                setStep('success');
            }
        } catch (error: any) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => { setCurrentDate(new Date()); setCalendarView('month'); };

    // Day Detail Navigation
    const nextDay = () => {
        if (!selectedDay) return;
        const next = addDays(selectedDay, 1);
        setSelectedDay(next);
        // If we cross month boundary, update current view
        if (!isSameMonth(next, currentDate)) setCurrentDate(next);
    };

    const prevDay = () => {
        if (!selectedDay) return;
        const prev = subDays(selectedDay, 1);
        // Prevent going into past relative to TODAY, not just any past
        if (isBefore(prev, startOfDay(new Date()))) return;

        setSelectedDay(prev);
        if (!isSameMonth(prev, currentDate)) setCurrentDate(prev);
    };

    // Group available slots by date for easy lookup
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        // Only include available slots (API filters this too, but safety check)
        if (slot.status !== 'available') return acc;

        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    const getSlotsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return slotsByDate[dateStr] || [];
    };

    const isUrgentDate = (date: Date) => {
        const today = startOfDay(new Date());
        const sevenDaysFromNow = addDays(today, 7);
        return isBefore(date, sevenDaysFromNow);
    };

    const isHiddenDate = (date: Date) => {
        const today = startOfDay(new Date());
        const fortyEightHoursFromNow = addDays(today, 2);
        return isBefore(date, fortyEightHoursFromNow);
    };

    const handleDayClick = (day: Date) => {
        if (isBefore(day, startOfDay(new Date()))) return; // Prevent clicking past days
        setSelectedDay(day);
        setCalendarView('day');
    };

    if (status === 'loading') return <div className="text-center py-24">{t('loading')}</div>;

    return (
        <div className="min-h-screen bg-white py-24">
            <div className="mx-auto max-w-3xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">
                        {t('heading')}
                    </h1>
                    <p className="mt-2 text-lg text-stone-600">
                        {step === 'auth' && t('steps.auth')}
                        {step === 'register' && t('steps.register')}
                        {step === 'verify' && t('steps.verify')}
                        {step === 'slots' && t('steps.slots')}
                        {step === 'verify' && t('steps.verify')}
                        {step === 'provider' && "Select a Provider"}
                        {step === 'slots' && t('steps.slots')}
                        {step === 'confirm' && t('steps.confirm')}
                    </p>
                </div>

                <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 md:p-8 shadow-sm">
                    {/* STEP 1: AUTHENTICATION */}
                    {step === 'auth' && (
                        <form onSubmit={handleEmailCheck} className="max-w-md mx-auto space-y-6">
                            {!existingUser?.exists ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">{t('auth.emailLabel')}</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-md border border-stone-300 px-4 py-3 text-lg"
                                            placeholder={t('auth.emailPlaceholder')}
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full justify-center">
                                        {processing ? t('auth.checking') : t('auth.submit')}
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="text-green-600 font-medium mb-2 text-lg">{t('auth.welcomeBack', { name: existingUser.name || '' })}</div>
                                    <p className="text-stone-600 mb-6">
                                        {t('auth.signInPrompt')}
                                    </p>
                                    <Button onClick={handleSendOtp} type="button" disabled={processing} className="w-full justify-center bg-stone-800">
                                        {t('auth.sendCode')}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => { setExistingUser(null); setEmail(''); }}
                                        className="mt-4 text-sm text-stone-500 hover:text-stone-800"
                                    >
                                        {t('auth.useDifferentEmail')}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {/* STEP 1.5: VERIFY OTP */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto space-y-6 text-center">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">{t('auth.verifyLabel')}</label>
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full text-center tracking-[1em] font-bold text-2xl rounded-md border border-stone-300 px-4 py-3"
                                    placeholder={t('auth.verifyPlaceholder')}
                                    maxLength={6}
                                    autoFocus
                                />
                                <p className="text-xs text-stone-500 mt-2">{t('auth.sentTo', { email })}</p>
                            </div>
                            <Button type="submit" disabled={processing} className="w-full justify-center">
                                {processing ? t('auth.verifying') : t('auth.verifySubmit')}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep('auth'); }}
                                className="mt-4 text-sm text-stone-500 hover:text-stone-800"
                            >
                                {t('auth.back')}
                            </button>
                        </form>
                    )}


                    {/* STEP 1.5: REGISTRATION */}
                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4 text-left">
                            <h3 className="font-semibold text-lg text-stone-900 mb-4">{t('register.title')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">{t('register.email')}</label>
                                    <input
                                        type="email" disabled
                                        value={formData.client_email}
                                        className="w-full rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-stone-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">{t('register.name')}</label>
                                    <input
                                        type="text" required
                                        value={formData.client_name}
                                        onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">{t('register.phone')}</label>
                                    <input
                                        type="tel"
                                        value={formData.client_phone}
                                        onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-stone-700">{t('register.address')}</label>
                                    <input
                                        type="text"
                                        value={formData.client_address}
                                        onChange={e => setFormData({ ...formData, client_address: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">{t('register.city')}</label>
                                    <input
                                        type="text"
                                        value={formData.client_city}
                                        onChange={e => setFormData({ ...formData, client_city: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">{t('register.stateZip')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" placeholder={t('register.statePlaceholder')}
                                            className="w-1/2 rounded-md border border-stone-300 px-3 py-2"
                                            value={formData.client_state}
                                            onChange={e => setFormData({ ...formData, client_state: e.target.value })}
                                        />
                                        <input
                                            type="text" placeholder={t('register.zipPlaceholder')}
                                            className="w-1/2 rounded-md border border-stone-300 px-3 py-2"
                                            value={formData.client_zip}
                                            onChange={e => setFormData({ ...formData, client_zip: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* CONSENT CHECKBOX */}
                                <div className="md:col-span-2 mt-4 p-4 bg-white border border-stone-200 rounded-lg shadow-sm">
                                    <label className="flex items-start gap-4 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            required
                                            checked={formData.data_consent}
                                            onChange={e => setFormData({ ...formData, data_consent: e.target.checked })}
                                            className="mt-1 w-5 h-5 rounded border-stone-300 text-secondary focus:ring-secondary"
                                        />
                                        <span className="text-sm text-stone-600 leading-relaxed font-medium">
                                            I authorize Sothis Therapeutic Massage to collect and process my personal data for the purpose of providing specialized massage therapy services and maintaining my clinical profile.
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full justify-center mt-6">
                                {processing ? t('register.processing') : t('register.submit')}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep('auth'); setExistingUser(null); }}
                                className="w-full text-center text-sm text-stone-500 hover:text-stone-800 mt-4"
                            >
                                {t('register.cancel')}
                            </button>
                        </form>
                    )}

                    {/* STEP 1.8: PROVIDER SELECTION */}
                    {step === 'provider' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-serif font-bold text-stone-900 text-center">Choose your Therapist</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Option: Any Provider */}
                                <button
                                    onClick={() => { setSelectedProvider(null); setStep('service'); }}
                                    className="p-6 rounded-xl border-2 border-dashed border-stone-300 hover:border-secondary hover:bg-stone-50 transition-all text-left flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold group-hover:bg-secondary/10 group-hover:text-secondary">
                                        ?
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-stone-900 group-hover:text-secondary">Any Provider</h4>
                                        <p className="text-sm text-stone-500">Maximum availability</p>
                                    </div>
                                </button>

                                {/* List Providers */}
                                {providers.map(provider => (
                                    <button
                                        key={provider.id}
                                        onClick={() => { setSelectedProvider(provider); setStep('service'); }}
                                        className="p-6 rounded-xl border border-stone-200 hover:border-secondary hover:bg-stone-50 transition-all text-left flex items-center gap-4 bg-white shadow-sm group"
                                    >
                                        {provider.image_url ? (
                                            <img src={provider.image_url} alt={provider.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: provider.color_code || '#78716c' }}
                                            >
                                                {provider.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-stone-900 group-hover:text-secondary">{provider.name}</h4>
                                            {provider.specialties && provider.specialties.length > 0 && (
                                                <p className="text-sm text-stone-500">{provider.specialties.join(', ')}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 1.9: SERVICE SELECTION */}
                    {step === 'service' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setStep('provider')}
                                className="flex items-center text-sm text-stone-500 hover:text-stone-900"
                            >
                                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                Back to Providers
                            </button>
                            <h2 className="text-2xl font-serif font-bold text-stone-900 text-center mb-6">Select a Service</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service)}
                                        className="text-left bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-secondary hover:shadow-md transition-all group flex flex-col h-full"
                                    >
                                        <div className="h-40 bg-stone-100 relative w-full">
                                            {service.image_url && (
                                                <img src={service.image_url} alt={service.title['en']} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-stone-900 group-hover:text-secondary transition-colors text-lg">
                                                    {service.title['en']}
                                                </h3>
                                            </div>
                                            <p className="text-secondary font-bold text-lg mb-3">{service.price['en']}</p>
                                            <p className="text-sm text-stone-500 line-clamp-3 mb-4 flex-1">
                                                {service.description['en']}
                                            </p>
                                            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider pt-4 border-t border-stone-100 w-full">
                                                Duration: {service.duration['en']}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SELECT SLOT (CALENDAR) */}
                    {step === 'slots' && (
                        <div className="space-y-6">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <div className="text-center">
                                    <h2 className="text-xl font-serif font-bold text-stone-900">
                                        {format(currentDate, 'MMMM yyyy')}
                                    </h2>
                                    <button
                                        onClick={goToToday}
                                        className="text-xs font-medium text-stone-500 hover:text-stone-900 mt-1 uppercase tracking-wide"
                                    >
                                        Today
                                    </button>
                                </div>
                                <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-full text-stone-600 transition-colors">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {loadingSlots ? (
                                <div className="text-center py-12 text-stone-500 flex flex-col items-center">
                                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
                                    loading slots...
                                </div>
                            ) : calendarView === 'month' ? (
                                /* === MONTH VIEW === */
                                <div className="animate-fade-in select-none">
                                    <div className="grid grid-cols-7 mb-2">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-stone-400 uppercase tracking-widest py-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                                        {eachDayOfInterval({
                                            start: startOfWeek(startOfMonth(currentDate)),
                                            end: endOfWeek(endOfMonth(currentDate))
                                        }).map((day) => {
                                            const isCurrentMonth = isSameMonth(day, currentDate);
                                            const isPast = isBefore(day, startOfDay(new Date()));
                                            const daySlots = getSlotsForDate(day);
                                            const hasSlots = daySlots.length > 0;
                                            const isTodayDate = isToday(day);

                                            return (
                                                <div
                                                    key={day.toString()}
                                                    className={`
                                                        aspect-square md:aspect-[0.8] rounded-lg relative transition-all duration-200 group
                                                        flex flex-col
                                                        ${!isCurrentMonth ? 'bg-stone-50/50' : 'bg-white'}
                                                        ${isPast ? 'opacity-40' : ''}
                                                        ${hasSlots && !isPast ? 'border-secondary/20 shadow-sm' : 'border-transparent'}
                                                        border
                                                    `}
                                                >
                                                    {/* Day Number Header */}
                                                    <button
                                                        onClick={() => !isPast && handleDayClick(day)}
                                                        disabled={isPast}
                                                        className={`
                                                            w-full text-center p-1 md:text-left md:p-2 text-sm font-medium
                                                            ${!isCurrentMonth ? 'text-stone-300' : 'text-stone-700'}
                                                            ${isTodayDate ? 'text-secondary font-bold' : ''}
                                                        `}
                                                    >
                                                        <span className={`relative z-10 ${isPast ? 'text-stone-300' : isHiddenDate(day) ? 'text-stone-400' : 'text-stone-700'}`}>
                                                            {format(day, 'd')}
                                                        </span>

                                                        {isUrgentDate(day) && !isHiddenDate(day) && !isPast && (
                                                            <span className="absolute top-1 right-1 text-[8px] font-black text-amber-500 uppercase leading-none">Review</span>
                                                        )}
                                                        
                                                        {isHiddenDate(day) && !isPast && (
                                                            <span className="absolute top-1 right-1 text-[8px] font-black text-stone-300 uppercase leading-none">Closed</span>
                                                        )}

                                                        {/* Mobile Dot */}
                                                        {hasSlots && !isPast && !isHiddenDate(day) && (
                                                            <div className="md:hidden mx-auto w-1.5 h-1.5 rounded-full bg-green-500 mt-1"></div>
                                                        )}
                                                    </button>

                                                    {/* Desktop Slots Preview */}
                                                    {!isPast && hasSlots && (
                                                        <div className="hidden md:flex flex-col gap-1 p-1 overflow-hidden">
                                                            {daySlots.slice(0, 3).map(slot => (
                                                                <button
                                                                    key={slot.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSlotSelect(slot);
                                                                    }}
                                                                    className="
                                                                        text-[10px] py-1 px-1 rounded bg-secondary/5 text-secondary 
                                                                        hover:bg-secondary hover:text-white transition-colors text-center font-medium
                                                                        truncate
                                                                    "
                                                                >
                                                                    {slot.start_time.slice(0, 5)}
                                                                </button>
                                                            ))}
                                                            {daySlots.length > 3 && (
                                                                <button
                                                                    onClick={() => handleDayClick(day)}
                                                                    className="text-[10px] text-stone-400 hover:text-stone-600 text-center"
                                                                >
                                                                    +{daySlots.length - 3} more
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Click target for empty space to open day view */}
                                                    {!isPast && (
                                                        <div
                                                            className="absolute inset-0 z-0 cursor-pointer"
                                                            onClick={() => handleDayClick(day)}
                                                        />
                                                    )}

                                                    {/* Make slots actionable above the overlay */}
                                                    <div className="relative z-10 pointer-events-none p-1 h-full flex flex-col justify-end">
                                                        <div className="pointer-events-auto contents">
                                                            {/* Children (slots) are already here via flex layout above */}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-500">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 md:hidden"></div>
                                            <span className="md:hidden">Available</span>
                                            <span className="hidden md:inline">Click a time to book directly</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* === DAY VIEW === */
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => setCalendarView('month')}
                                            className="flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
                                        >
                                            <ArrowLeftIcon className="w-4 h-4 mr-1" />
                                            Back to Month
                                        </button>

                                        {/* Day Navigation */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={prevDay}
                                                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 disabled:opacity-30"
                                                disabled={selectedDay ? isBefore(subDays(selectedDay, 1), startOfDay(new Date())) : true}
                                            >
                                                <ChevronLeftIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={nextDay}
                                                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"
                                            >
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-stone-900">
                                                    {selectedDay && format(selectedDay, 'EEEE, MMMM do')}
                                                </h3>
                                                <p className="text-stone-500 text-sm mt-0.5">Available Appointments</p>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            {selectedDay && isHiddenDate(selectedDay) ? (
                                                <div className="text-center py-12 px-6 bg-stone-50 border border-stone-100 rounded-2xl animate-fade-in">
                                                    <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <span className="text-2xl">🚫</span>
                                                    </div>
                                                    <h4 className="text-xl font-serif font-bold text-stone-900 mb-3">Notice: 48hr Window</h4>
                                                    <p className="text-stone-500 max-w-sm mx-auto leading-relaxed mb-6">
                                                        Our therapists require at least 48 hours notice to prepare for a session. While no specific time slots are guaranteed, you may submit a general urgent request.
                                                    </p>
                                                    <Button onClick={() => setStep('urgent-request')} className="w-full justify-center text-lg py-3">
                                                        Submit Urgent Request
                                                    </Button>
                                                </div>
                                            ) : selectedDay && getSlotsForDate(selectedDay).length > 0 ? (
                                                <div className="space-y-6">
                                                    {isUrgentDate(selectedDay) && (
                                                        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex gap-3 items-start shadow-sm">
                                                            <span className="text-xl">💬</span>
                                                            <div className="text-sm">
                                                                <p className="font-bold text-stone-900">Request Only Period</p>
                                                                <p className="text-stone-600">The following slots are available but require manual professional confirmation. Click any time to message us on WhatsApp.</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                        {getSlotsForDate(selectedDay).map((slot) => {
                                                            return (
                                                                <button
                                                                    key={slot.id}
                                                                    onClick={() => handleSlotSelect(slot)}
                                                                    className="
                                                                        py-3 px-4 rounded-lg border border-secondary text-secondary font-medium
                                                                        hover:bg-secondary hover:text-white transition-all duration-200
                                                                        focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-1
                                                                    "
                                                                >
                                                                    {slot.start_time.slice(0, 5)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-stone-500">
                                                    <CalendarDaysIcon className="w-12 h-12 mx-auto text-stone-200 mb-3" />
                                                    <p>No available slots for this day.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2.5: URGENT REQUEST (0-48h) */}
                    {step === 'urgent-request' && selectedDay && (
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!formData.notes || formData.notes.trim().length === 0) {
                                setMessage('❌ Please include a note or reason for your visit.');
                                return;
                            }
                            setProcessing(true);
                            try {
                                const now = new Date();
                                const timestamp = now.toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                });
                                const formattedNotes = `[${timestamp}]: ${formData.notes}`;

                                const res = await fetch('/api/urgent-request', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        ...formData,
                                        date: selectedDay.toISOString().split('T')[0],
                                        notes: formattedNotes,
                                        intake_form_id: selectedIntakeId === 'new' ? null : selectedIntakeId
                                    })
                                });

                                if (!res.ok) {
                                    const err = await res.json();
                                    throw new Error(err.error || 'Failed to submit request');
                                }

                                const data = await res.json();
                                setMessage('');
                                
                                if (selectedIntakeId === 'new') {
                                    // If no booking_id is returned (because it's a general request), we still redirect to intake but maybe without a booking_id? 
                                    // The intake form can be filled generically for the user.
                                    router.push(`/intake-form`);
                                } else {
                                    setStep('success');
                                }
                            } catch (error: any) {
                                setMessage(`❌ ${error.message}`);
                            } finally {
                                setProcessing(false);
                            }
                        }} className="space-y-6">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                                <p className="text-sm font-bold text-amber-800">Urgent Request for</p>
                                <p className="text-xl font-black text-amber-900 mt-1">
                                    {format(selectedDay, 'EEEE, MMMM do')}
                                </p>
                                <p className="text-xs text-amber-700 mt-2">No specific time slot is guaranteed.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-600 bg-white p-4 rounded-lg border border-stone-100">
                                <div><span className="block font-medium text-stone-900">{t('confirm.nameLabel')}</span>{formData.client_name}</div>
                                <div><span className="block font-medium text-stone-900">{t('confirm.emailLabel')}</span>{formData.client_email}</div>
                                {formData.client_phone && <div><span className="block font-medium text-stone-900">{t('confirm.phoneLabel')}</span>{formData.client_phone}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Preferred Times / Reason for Visit <span className="text-red-500">*</span>
                                </label>
                                <textarea required rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2" placeholder="e.g. I need an appointment anytime after 2pm for lower back pain..." autoFocus />
                            </div>

                            {/* Intake Selection */}
                            <div className="bg-stone-100/50 p-6 rounded-xl border border-stone-200">
                                <label className="block text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                                    <span className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px]">!</span>
                                    Mandatory Clinical Intake & Health Profile
                                </label>
                                {loadingIntake ? (
                                    <div className="flex items-center gap-2 text-stone-500 text-xs py-2"><div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>Fetching clinical history...</div>
                                ) : (
                                    <div className="space-y-4">
                                        {intakeHistory.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Use Latest Profile</p>
                                                {[intakeHistory[0]].map(form => (
                                                    <label key={form.id} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedIntakeId === form.id ? 'bg-white border-secondary shadow-sm ring-2 ring-secondary' : 'bg-white/50 border-stone-200 hover:border-stone-300'}`}>
                                                        <input type="radio" name="intake_select" value={form.id} checked={selectedIntakeId === form.id} onChange={() => setSelectedIntakeId(form.id)} className="text-secondary focus:ring-secondary"/>
                                                        <div className="flex-1"><div className="text-sm font-bold text-stone-800">Profile from {new Date(form.created_at).toLocaleDateString()}</div></div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        <div className="pt-2">
                                            <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedIntakeId === 'new' ? 'bg-white border-secondary shadow-sm ring-2 ring-secondary' : 'bg-white/50 border-stone-200 hover:border-stone-300'}`}>
                                                <input type="radio" name="intake_select" value="new" checked={selectedIntakeId === 'new'} onChange={() => setSelectedIntakeId('new')} className="text-secondary focus:ring-secondary"/>
                                                <div className="flex-1"><div className="text-sm font-bold text-stone-800">Create a New Clinical Profile</div><div className="text-xs text-stone-500 mt-1">Required for new clients or updated history.</div></div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs text-blue-700 leading-relaxed font-medium text-center">
                                    By clicking below, you submit an <strong>urgent appointment request</strong>. We will review and notify you. Your appointment will <strong>NOT</strong> be assigned until your Clinical Health Profile is submitted.
                                </p>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full justify-center text-lg py-4 shadow-xl">
                                {processing ? 'Processing Request...' : '🚀 Submit Urgent Request'}
                            </Button>

                            <button type="button" onClick={() => setStep('slots')} className="w-full text-center text-sm text-stone-500 hover:text-stone-800">
                                Back to Calendar
                            </button>
                        </form>
                    )}

                    {/* STEP 3: CONFIRMATION */}
                    {step === 'confirm' && selectedSlot && (
                        <form onSubmit={handleConfirmBooking} className="space-y-6">
                            <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-lg">
                                <p className="text-sm font-medium text-stone-900">{t('confirm.timeLabel')}</p>
                                <p className="text-xl font-bold text-secondary mt-1">
                                    {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'long', day: 'numeric'
                                    })} at {selectedSlot.start_time.slice(0, 5)}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-600 bg-white p-4 rounded-lg border border-stone-100">
                                <div>
                                    <span className="block font-medium text-stone-900">{t('confirm.nameLabel')}</span>
                                    {formData.client_name}
                                </div>
                                <div>
                                    <span className="block font-medium text-stone-900">{t('confirm.emailLabel')}</span>
                                    {formData.client_email}
                                </div>
                                {formData.client_phone && (
                                    <div>
                                        <span className="block font-medium text-stone-900">{t('confirm.phoneLabel')}</span>
                                        {formData.client_phone}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    {t('confirm.reasonLabel')} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    placeholder={t('confirm.reasonPlaceholder')}
                                    autoFocus
                                />
                            </div>

                            {/* Intake Selection (Mandatory Check) */}
                            <div className="bg-stone-100/50 p-6 rounded-xl border border-stone-200">
                                <label className="block text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                                    <span className="w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px]">!</span>
                                    Mandatory Clinical Intake & Health Profile
                                </label>
                                
                                {loadingIntake ? (
                                    <div className="flex items-center gap-2 text-stone-500 text-xs py-2">
                                        <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                                        Fetching clinical history...
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {intakeHistory.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Use Latest Profile</p>
                                                {[intakeHistory[0]].map(form => (
                                                    <label key={form.id} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedIntakeId === form.id ? 'bg-white border-secondary shadow-sm ring-2 ring-secondary' : 'bg-white/50 border-stone-200 hover:border-stone-300'}`}>
                                                        <input 
                                                            type="radio" 
                                                            name="intake_select" 
                                                            value={form.id} 
                                                            checked={selectedIntakeId === form.id}
                                                            onChange={() => setSelectedIntakeId(form.id)}
                                                            className="text-secondary focus:ring-secondary"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-stone-800">
                                                                Profile from {new Date(form.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${selectedIntakeId === 'new' ? 'bg-white border-secondary shadow-sm ring-2 ring-secondary' : 'bg-white/50 border-stone-200 hover:border-stone-300'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="intake_select" 
                                                    value="new" 
                                                    checked={selectedIntakeId === 'new'}
                                                    onChange={() => setSelectedIntakeId('new')}
                                                    className="text-secondary focus:ring-secondary"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-stone-800">
                                                        Create a New Clinical Profile
                                                    </div>
                                                    <div className="text-xs text-stone-500 mt-1">
                                                        Required for new clients or updated history.
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {selectedIntakeId === 'new' && (
                                            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                                    <strong>Important:</strong> To finalize your request, you must complete the Health Profile form on the next screen. Your appointment will not be reviewed until this is submitted.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs text-blue-700 leading-relaxed font-medium text-center">
                                    By clicking below, you submit an <strong>appointment request</strong>. A professional will review the details and reply with the available date and time, which may differ from your requested time. Your appointment will <strong>NOT</strong> be assigned until your Clinical Health Profile is submitted.
                                </p>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full justify-center text-lg py-4 shadow-xl">
                                {processing ? 'Processing Request...' : isUrgentDate(parseISO(selectedSlot.date)) ? '🚀 Request Specific Time' : 'Submit Appointment Request'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => { setStep('slots'); setSelectedSlot(null); }}
                                className="w-full text-center text-sm text-stone-500 hover:text-stone-800"
                            >
                                {t('confirm.back')}
                            </button>
                        </form>
                    )}

                    {/* STEP 4: SUCCESS & INTAKE SUGGESTION */}
                    {step === 'success' && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-12 text-center animate-fade-in shadow-sm">
                            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <span className="text-4xl">⏳</span>
                            </div>
                            <h3 className="text-3xl font-serif font-bold text-stone-900 mb-4">Request Received</h3>
                            <p className="text-stone-600 mb-10 max-w-md mx-auto leading-relaxed text-lg">
                                Your appointment request has been sent. <strong>A professional will review the details and confirm your session shortly.</strong>
                            </p>

                            <div className="bg-white border border-stone-100 rounded-2xl p-8 mb-10 shadow-sm text-left max-w-md mx-auto relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -translate-y-4 translate-x-4"></div>
                                <h4 className="font-bold text-stone-800 flex items-center gap-2 mb-3 text-lg">
                                    <span className="text-2xl">📋</span> Mandatory Health Profile
                                </h4>
                                <p className="text-sm text-stone-500 leading-relaxed mb-6">
                                    To finalize your request, please complete the clinical intake form. Your therapist cannot approve the session without this documentation.
                                </p>
                                <Button 
                                    onClick={() => router.push('/intake-form')} 
                                    className="w-full bg-stone-900 hover:bg-black justify-center shadow-md font-bold py-4 text-lg"
                                >
                                    Start Mandatory Intake
                                </Button>
                            </div>

                            <button 
                                onClick={() => router.push('/my-bookings')} 
                                className="text-stone-500 text-sm font-medium hover:text-stone-900 transition-colors py-2 border-b border-transparent hover:border-stone-900"
                            >
                                Skip for now, view my bookings
                            </button>
                        </div>
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
