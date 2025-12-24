'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import type { TimeSlot, Provider } from '@/lib/supabase';
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
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

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
    const [step, setStep] = useState<'auth' | 'register' | 'verify' | 'provider' | 'slots' | 'confirm'>('auth');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

    // Fetch providers on mount
    useEffect(() => {
        supabase.from('providers').select('*').eq('is_active', true).then(({ data }) => {
            if (data) setProviders(data);
        });
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
    }, [step, currentDate]);


    async function fetchAvailableSlots() {
        setLoadingSlots(true);
        try {
            // Calculate start and end of the calendar view (including padding days)
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            const calendarStart = startOfWeek(monthStart).toISOString().split('T')[0];
            const calendarEnd = endOfWeek(monthEnd).toISOString().split('T')[0];

            // Also ensure we don't show past slots if we are in current month
            const today = new Date().toISOString().split('T')[0];
            const fetchStart = calendarStart < today ? today : calendarStart;

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

            setMessage(t('errors.bookingConfirmed'));
            setTimeout(() => {
                router.push('/my-bookings');
            }, 2000);
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
                        <form onSubmit={handleRegister} className="space-y-4">
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
                                    onClick={() => { setSelectedProvider(null); setStep('slots'); }}
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
                                        onClick={() => { setSelectedProvider(provider); setStep('slots'); }}
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
                                                        <span className={`
                                                            inline-flex w-7 h-7 items-center justify-center rounded-full
                                                            ${isTodayDate ? 'bg-secondary/10' : ''}
                                                            ${hasSlots && !isPast ? 'md:bg-transparent bg-stone-100' : ''} 
                                                        `}>
                                                            {format(day, 'd')}
                                                        </span>

                                                        {/* Mobile Dot */}
                                                        {hasSlots && !isPast && (
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
                                            {selectedDay && getSlotsForDate(selectedDay).length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                    {getSlotsForDate(selectedDay).map((slot) => (
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
                                                    ))}
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
                                <label className="block text-sm font-medium text-stone-700 mb-2">{t('confirm.reasonLabel')}</label>
                                <textarea
                                    required rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    placeholder={t('confirm.reasonPlaceholder')}
                                    autoFocus
                                />
                            </div>

                            <Button type="submit" disabled={processing} className="w-full justify-center">
                                {processing ? t('confirm.processing') : t('confirm.submit')}
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
