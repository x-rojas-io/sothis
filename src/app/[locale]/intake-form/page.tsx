'use client';

import React, { useState, useEffect } from 'react';
import { 
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useSession, signIn } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    IntakeState, 
    INITIAL_STATE, 
    TABS, 
    BRAND_ORANGE 
} from '@/lib/intake-constants';
import IntakeFormFields from '@/components/IntakeFormFields';
import Button from '@/components/Button';

export default function IntakeForm() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = searchParams.get('id');
    const bookingId = searchParams.get('booking_id');

    const [activeTab, setActiveTab] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    const [form, setForm] = useState<IntakeState>(INITIAL_STATE);

    // 1. Auth Monitoring & Data Loading
    useEffect(() => {
        if (status === 'unauthenticated') {
            const callbackUrl = window.location.pathname + window.location.search;
            signIn(undefined, { callbackUrl });
            return;
        }

        if (session?.user?.email) {
            // Mode New: We still fetch demographic data but reset clinical questions
            const isNewMode = searchParams.get('mode') === 'new';
            fetchIntakeData(isNewMode);
        }
    }, [session, status, formId]);

    async function fetchIntakeData(isNewMode: boolean = false) {
        try {
            // If fetching history, we might need a specific ID
            const url = formId ? `/api/user/intake?history=all` : `/api/user/intake`;
            const res = await fetch(url);
            
            if (res.ok) {
                const data = await res.json();
                let targetIntake = data.intake;

                if (formId && data.history) {
                    targetIntake = data.history.find((h: any) => h.id === formId);
                }

                if (targetIntake) {
                    if (isNewMode) {
                        // PRESERVE Demographics, CLEAR clinical/medical questions
                        setForm({
                            ...INITIAL_STATE,
                            full_name: targetIntake.full_name || data.client_name || '',
                            phone_day: targetIntake.phone_day || '',
                            address: targetIntake.address || '',
                            city_state_zip: targetIntake.city_state_zip || '',
                            occupation: targetIntake.occupation || '',
                            date_of_birth: targetIntake.date_of_birth || '',
                            emergency_contact: targetIntake.emergency_contact || '',
                            emergency_phone: targetIntake.emergency_phone || '',
                            client_email: targetIntake.client_email || session?.user?.email || ''
                        });
                        setIsLocked(false);
                    } else {
                        // Check 1-year lock
                        const createdAt = new Date(targetIntake.created_at);
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        if (createdAt < oneYearAgo && !formId) {
                            setIsLocked(true);
                        }

                        setForm({
                            ...targetIntake,
                            questions: { ...INITIAL_STATE.questions, ...targetIntake.medical_history }
                        });
                    }
                } else if (data.client_name) {
                    // New form, pre-fill name from registry
                    setForm(prev => ({ ...prev, full_name: data.client_name }));
                }
            }
        } catch (err) {
            console.log('Error fetching intake data:', err);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!form.consent_name) {
            alert('Print name required for consent');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Prepare Data
            const payload = {
                client_id: (session?.user as any)?.id, // Relational Link (Auth ID)
                client_email: session?.user?.email,
                full_name: form.full_name,
                phone_day: form.phone_day,
                address: form.address,
                city_state_zip: form.city_state_zip,
                date_of_birth: form.date_of_birth,
                occupation: form.occupation,
                emergency_contact: form.emergency_contact,
                emergency_phone: form.emergency_phone,
                initial_visit_date: form.initial_visit_date,
                medical_history: form.questions,
                concentrate_on: form.concentrate_on,
                consent_at: new Date().toISOString(),
                signature_date: new Date().toISOString(),
                updated_by_email: session?.user?.email,
                booking_id: bookingId, // Pass the linkage back to the API
                consent_name: form.consent_name,
                updated_by: (session?.user as any)?.id // Audit Traceability
            };

            const res = await fetch('/api/user/intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCompleted(true);
            }
        } catch (err) {
            console.log('Error submitting intake:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center py-24">Loading Clinical Profile...</div>;

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-[#d0d0d0] flex items-center justify-center p-6 text-stone-900 leading-relaxed font-serif">
                <div className="bg-white max-w-2xl w-full p-20 shadow-2xl text-center space-y-10 animate-scale-in">
                    <div className="flex justify-center">
                        <CheckCircleIcon className="w-24 h-24 text-[#f5a623]" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-serif font-bold text-[#1a1a1a]">Intake Complete</h1>
                        <p className="text-xl text-stone-500 font-serif italic">
                            Your medical profile has been updated {bookingId ? 'for your new appointment' : 'for your next session'}.
                        </p>
                    </div>
                    
                    <div className="pt-10 border-t border-stone-100">
                        <button 
                            onClick={() => router.push('/my-bookings')}
                            className="bg-stone-900 text-white px-10 py-5 rounded-lg hover:bg-stone-800 transition-all font-bold tracking-widest uppercase text-sm shadow-xl"
                        >
                            View Appointment Details
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 pb-24 pt-12">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-900 sm:text-4xl">
                            {bookingId ? 'Complete Your Booking Profile' : 'Clinical Health Intake'}
                        </h1>
                        <p className="mt-2 text-stone-600">
                            {bookingId ? "Please provide your medical history for your new appointment." : "Your therapeutic journey begins with a clear understanding of your health history."}
                        </p>
                    </div>
                </div>

                {/* 5-TAB NAVIGATION */}
                <nav className="flex justify-between bg-white/80 backdrop-blur-md p-3 shadow-lg gap-2 sticky top-6 z-50">
                    {TABS.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-3 py-4 transition-all duration-300 group ${activeTab === tab.id ? BRAND_ORANGE + ' text-white shadow-xl scale-[1.02]' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}>
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'animate-bounce-subtle' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] hidden md:block">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.18)] p-[36px_44px_40px] font-serif text-[#1a1a1a] leading-relaxed">
                    <div className="text-center mb-10">
                        <span className="text-[10px] text-stone-400 uppercase tracking-[0.2em] block mb-2">Page {activeTab} · Sothis Clinical Intake</span>
                        <h1 className="text-xl font-bold text-[#1a1a1a] uppercase tracking-wide border-b-2 border-[#222] pb-2">Client Intake Form – Therapeutic Massage</h1>
                    </div>

                    <IntakeFormFields 
                        form={form}
                        setForm={setForm}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isReadOnly={isLocked}
                        isNameDisabled={true}
                    />

                    {activeTab === 5 && (
                        <div className="flex justify-between pt-12 items-center">
                            <button type="button" onClick={() => setActiveTab(4)} className="text-[#888] font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                Back
                            </button>
                            {isLocked ? (
                                <div className="text-stone-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 border border-stone-200 px-6 py-4 bg-stone-50">
                                    🔒 Record Locked (Historical)
                                </div>
                            ) : (
                                <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`px-12 py-7 text-lg rounded-sm ${BRAND_ORANGE} text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.05] transition-all disabled:opacity-50`}>
                                    {isSubmitting ? 'Processing...' : 'DONE'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                /* Clinical Safari Resets */
                input:not([type="checkbox"]), select, textarea, button {
                    -webkit-appearance: none;
                    appearance: none;
                    border-radius: 0;
                    box-shadow: none;
                }

                /* Clinical Checkbox Styling */
                input[type="checkbox"] {
                    cursor: pointer;
                }

                input[type="date"]::-webkit-inner-spin-button,
                input[type="date"]::-webkit-calendar-picker-indicator {
                    display: block;
                    -webkit-appearance: none;
                }

                /* Ensure smooth clinical typography */
                body {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                @keyframes tab-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-tab-in {
                    animation: tab-in 0.4s ease-out forwards;
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
                .font-serif {
                    font-family: 'Times New Roman', Times, serif;
                }
            `}</style>
        </div>
    );
}
