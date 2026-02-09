'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import type { Provider, Service } from '@/lib/supabase'; // Import Service type
import { ChevronLeftIcon } from '@heroicons/react/24/solid';

// ... (imports)

export default function AdminBookingPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    // Steps: 'lookup' -> 'register' (optional) -> 'details' -> 'confirm'
    const [step, setStep] = useState<'lookup' | 'register' | 'details' | 'confirm'>('lookup');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Data
    const [email, setEmail] = useState('');
    const [clientData, setClientData] = useState<any>(null);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [services, setServices] = useState<Service[]>([]); // New: Services state

    // Booking Form
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [selectedService, setSelectedService] = useState<Service | null>(null); // New: Selected Service
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    // Registration Form
    const [regForm, setRegForm] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: ''
    });

    // 1. Auth & Initial Load
    useEffect(() => {
        if (status === 'authenticated') {
            // @ts-ignore
            if (session?.user?.role !== 'admin' && session?.user?.role !== 'provider') {
                router.push('/');
            }
            fetchData(); // Renamed to fetchData
        } else if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, session, router]);

    const fetchData = async () => {
        setIsLoading(true);
        // Fetch Providers
        const { data: provData } = await supabase.from('providers').select('*').eq('is_active', true);
        if (provData && provData.length > 0) {
            setProviders(provData);
            setSelectedProvider(provData[0].id);
        }

        // Fetch Services
        const { data: servData } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (servData && servData.length > 0) {
            setServices(servData);
            setSelectedService(servData[0]); // Default to first service
        }
        setIsLoading(false);
    };

    // 2. Lookup Client
    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const res = await fetch(`/api/auth/check-user?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            if (data.exists && data.user) {
                setClientData(data.user);
                setMessage('Client found!');
                setStep('details');
            } else {
                setMessage('Client not found. Please register.');
                setStep('register');
            }
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Register New Client
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const res = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    ...regForm
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create client');

            setClientData({ email, ...regForm, id: data.id });
            setMessage('Client registered successfully!');
            setStep('details');
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    const [conflictSuggestion, setConflictSuggestion] = useState<string | null>(null);

    const handleBooking = async () => {
        if (!selectedProvider || !date || !time || !selectedService) {
            setMessage('Please fill in all booking details.');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setConflictSuggestion(null);

        try {
            // Format notes with timestamp if present
            let formattedNotes = notes;
            if (notes.trim()) {
                const now = new Date();
                const timestamp = now.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                formattedNotes = `[${timestamp}]: ${notes}`;
            }

            const res = await fetch('/api/admin/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: clientData.name,
                    client_email: clientData.email,
                    client_phone: clientData.phone || regForm.phone,
                    client_address: clientData.address,
                    client_city: clientData.city,
                    client_state: clientData.state,
                    client_zip: clientData.zip,
                    notes: formattedNotes,
                    provider_id: selectedProvider,
                    service_type: selectedService.title['en'], // Send English title as service_type
                    date,
                    time
                })
            });

            const data = await res.json();

            if (res.status === 409 && data.nextAvailable) {
                setConflictSuggestion(data.nextAvailable);
                setMessage('');
                return;
            }

            if (!res.ok) throw new Error(data.error || 'Booking failed');

            setStep('confirm');
            setMessage('Booking confirmed successfully!');

        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };



    // Helper to book specifically the suggested time immediately
    const bookSuggested = async () => {
        if (!conflictSuggestion) return;
        confirmSuggestedBooking(conflictSuggestion);
    };

    const confirmSuggestedBooking = async (overrideTime: string) => {
        if (!selectedService) return;
        setIsLoading(true);
        setMessage('');
        setConflictSuggestion(null);
        setTime(overrideTime);

        try {
            // Format notes with timestamp if present
            let formattedNotes = notes;
            if (notes.trim()) {
                const now = new Date();
                const timestamp = now.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                formattedNotes = `[${timestamp}]: ${notes}`;
            }

            const res = await fetch('/api/admin/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: clientData.name,
                    client_email: clientData.email,
                    client_phone: clientData.phone || regForm.phone,
                    client_address: clientData.address,
                    client_city: clientData.city,
                    client_state: clientData.state,
                    client_zip: clientData.zip,
                    notes: formattedNotes,
                    provider_id: selectedProvider,
                    service_type: selectedService.title['en'],
                    date,
                    time: overrideTime
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking failed');

            setStep('confirm');
            setMessage('Booking confirmed successfully!');
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep('lookup');
        setEmail('');
        setClientData(null);
        setDate('');
        setTime('');
        setNotes('');
        setRegForm({ name: '', phone: '', address: '', city: '', state: '', zip: '' });
        setMessage('');
        setConflictSuggestion(null);
        if (providers.length > 0) setSelectedProvider(providers[0].id);
        if (services.length > 0) setSelectedService(services[0]);
    };

    if (status === 'loading') return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-stone-100 rounded-full">
                    <ChevronLeftIcon className="w-5 h-5 text-stone-600" />
                </button>
                <h1 className="text-3xl font-serif font-bold text-stone-900">Admin Booking</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                {/* Progress Header */}
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex gap-4 text-sm font-medium text-stone-500">
                    <span className={step === 'lookup' ? 'text-secondary font-bold' : ''}>1. Client</span>
                    <span>&rarr;</span>
                    <span className={step === 'register' ? 'text-secondary font-bold' : ''}>2. Register</span>
                    <span>&rarr;</span>
                    <span className={step === 'details' ? 'text-secondary font-bold' : ''}>3. Details</span>
                    <span>&rarr;</span>
                    <span className={step === 'confirm' ? 'text-secondary font-bold' : ''}>4. Confirm</span>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}

                    {/* STEP 1: LOOKUP */}
                    {step === 'lookup' && (
                        <form onSubmit={handleLookup} className="max-w-md mx-auto space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Client Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full rounded-md border border-stone-300 px-4 py-3"
                                    placeholder="client@example.com"
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full justify-center">
                                {isLoading ? 'Checking...' : 'Find Client'}
                            </Button>
                        </form>
                    )}

                    {/* STEP 2: REGISTER */}
                    {step === 'register' && (
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-xl font-bold text-stone-900 mb-6">New Client Registration</h2>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700">Email</label>
                                        <input type="email" value={email} disabled className="w-full rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-stone-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700">Full Name</label>
                                        <input type="text" required value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700">Phone</label>
                                        <input type="tel" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700">Address</label>
                                        <input type="text" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700">City</label>
                                        <input type="text" value={regForm.city} onChange={e => setRegForm({ ...regForm, city: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700">State / Zip</label>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="State" value={regForm.state} onChange={e => setRegForm({ ...regForm, state: e.target.value })} className="w-1/2 rounded-md border border-stone-300 px-3 py-2" />
                                            <input type="text" placeholder="Zip" value={regForm.zip} onChange={e => setRegForm({ ...regForm, zip: e.target.value })} className="w-1/2 rounded-md border border-stone-300 px-3 py-2" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setStep('lookup')} className="flex-1 py-2 text-stone-600 hover:text-stone-900">Back</button>
                                    <Button type="submit" disabled={isLoading} className="flex-1 justify-center">Create Client</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* STEP 3: DETAILS (Provider, Service & Time) */}
                    {step === 'details' && clientData && (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-blue-900">Booking for: {clientData.name}</h3>
                                    <p className="text-blue-700 text-sm">{clientData.email}</p>
                                </div>
                                <button onClick={() => setStep('lookup')} className="text-xs text-blue-600 hover:underline">Change Client</button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-serif font-bold text-stone-900 mb-3">1. Select Provider</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {providers.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedProvider(p.id)}
                                                className={`p-4 rounded-lg border text-left flex items-center gap-3 transition-all ${selectedProvider === p.id
                                                    ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                                                    : 'border-stone-200 hover:border-stone-300'
                                                    }`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500">
                                                    {p.name[0]}
                                                </div>
                                                <span className="font-medium text-stone-900">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* New: Service Selection */}
                                <div>
                                    <label className="block text-lg font-serif font-bold text-stone-900 mb-3">2. Select Service</label>
                                    <div className="space-y-3">
                                        {services.map(service => (
                                            <button
                                                key={service.id}
                                                onClick={() => setSelectedService(service)}
                                                className={`w-full p-4 rounded-lg border text-left flex justify-between items-center transition-all ${selectedService?.id === service.id
                                                    ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                                                    : 'border-stone-200 hover:border-stone-300'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-medium text-stone-900">{service.title['en']}</div>
                                                    <div className="text-xs text-stone-500">{service.duration['en']}</div>
                                                </div>
                                                <div className="font-bold text-stone-900">
                                                    {service.price['en']}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-lg font-serif font-bold text-stone-900 mb-3">3. Date & Time</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-stone-600 mb-1">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={date}
                                                onChange={e => setDate(e.target.value)}
                                                className="w-full rounded-md border border-stone-300 px-4 py-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-stone-600 mb-1">Time (24h)</label>
                                            <input
                                                type="time"
                                                required
                                                value={time}
                                                onChange={e => setTime(e.target.value)}
                                                className="w-full rounded-md border border-stone-300 px-4 py-3"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-2">
                                        * Admin Override: You can select any time, regardless of slot availability.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-lg font-serif font-bold text-stone-900 mb-3">4. Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full rounded-md border border-stone-300 px-4 py-3 h-24"
                                        placeholder="Internal notes or client requests..."
                                    />
                                </div>

                                {conflictSuggestion && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-amber-600 text-xl">⚠️</span>
                                            <p className="text-amber-800 font-medium">
                                                This time is not available for the appointment. Next available is {conflictSuggestion}. Book now?
                                            </p>
                                        </div>
                                        <Button
                                            onClick={bookSuggested}
                                            variant="secondary"
                                            className="whitespace-nowrap"
                                        >
                                            Book {conflictSuggestion}
                                        </Button>
                                    </div>
                                )}

                                <Button
                                    onClick={handleBooking}
                                    disabled={isLoading || !selectedProvider || !selectedService || !date || !time}
                                    className="w-full justify-center text-lg py-4"
                                >
                                    {isLoading ? 'Booking...' : `Confirm Appointment ${selectedService ? `(${selectedService.price['en']})` : ''}`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: CONFIRMATION */}
                    {step === 'confirm' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Booking Confirmed!</h2>
                            <p className="text-stone-600 mb-8">
                                The appointment has been booked and confirmation emails have been sent.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button onClick={() => router.push('/admin')} className="bg-stone-200 text-stone-800 hover:bg-stone-300">
                                    Dashboard
                                </Button>
                                <Button onClick={reset}>
                                    Book Another
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
