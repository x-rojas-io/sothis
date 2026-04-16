'use client';

import React, { useEffect, useState } from 'react';
import IntakeFormFields from '@/components/IntakeFormFields';
import { 
    IntakeState,
    INITIAL_STATE, 
    TABS 
} from '@/lib/intake-constants';

interface ClinicalIntakeModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: {
        id: string;
        name: string;
    } | null;
    sourceLabel?: string;
}

export default function ClinicalIntakeModal({ isOpen, onClose, client, sourceLabel = "Clinical Profile" }: ClinicalIntakeModalProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<IntakeState>(INITIAL_STATE);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(1);
    const [viewingVersion, setViewingVersion] = useState<'current' | string>('current');

    useEffect(() => {
        if (isOpen && client) {
            fetchIntakeData();
        }
    }, [isOpen, client]);

    async function fetchIntakeData() {
        if (!client) return;
        setLoading(true);
        setViewingVersion('current');
        try {
            const res = await fetch(`/api/admin/intake?client_id=${client.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.intake) {
                    setForm({
                        ...INITIAL_STATE,
                        ...data.intake,
                        questions: { ...INITIAL_STATE.questions, ...data.intake.medical_history }
                    });
                } else {
                    setForm(INITIAL_STATE);
                }
                setAuditHistory(data.auditHistory || []);
            }
        } catch (error) {
            console.error('Failed to fetch intake:', error);
        } finally {
            setLoading(false);
        }
    }

    const selectVersion = (v: 'current' | any) => {
        if (v === 'current') {
            setViewingVersion('current');
            fetchIntakeData();
        } else {
            setViewingVersion(v.id);
            const snap = v.snapshot;
            setForm({
                ...INITIAL_STATE,
                ...snap,
                questions: { ...INITIAL_STATE.questions, ...snap.medical_history }
            });
        }
    };

    const saveSignature = async () => {
        if (!client || !form.id) return;
        if (!form.therapist_signature_name) {
            alert("Please type your signature before certifying.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form // Includes id and therapist_signature_name already
                })
            });

            if (res.ok) {
                alert("Clinical Certification Successful. Record is now forensic-signed.");
                fetchIntakeData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed to save signature'}`);
            }
        } catch (error) {
            console.error('Failed to save signature:', error);
            alert("Failed to connect to certification server.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#f2f2f2] w-full max-w-7xl shadow-2xl flex flex-col h-[92vh] relative animate-in zoom-in-95 duration-300 rounded-lg overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Identity & History */}
                    <div className="w-72 bg-stone-900 text-stone-300 p-10 flex flex-col gap-10 border-r border-stone-800">
                        <div>
                            <div className="w-12 h-1 bg-primary mb-6"></div>
                            <h2 className="text-2xl font-serif font-black text-white uppercase tracking-tight leading-tight mb-2">
                                {client?.name}
                            </h2>
                            <p className="text-[10px] text-stone-500 font-sans font-bold uppercase tracking-[0.3em] mb-10">
                                {sourceLabel} History
                            </p>
                            
                            <div className="space-y-3 pb-6 border-b border-stone-800">
                                <button 
                                    onClick={onClose} 
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white border border-stone-700 hover:border-white px-4 py-3 w-full transition-all"
                                >
                                    ✕ Close View
                                </button>

                                {viewingVersion === 'current' && !form.therapist_signature_at && (
                                    <button 
                                        onClick={saveSignature}
                                        disabled={loading}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white hover:bg-white hover:text-primary border border-primary px-4 py-3 w-full transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? 'Certifying...' : '✍️ Sign & Certify'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {loading && viewingVersion === 'current' ? (
                                <div className="text-[10px] animate-pulse">Gathering records...</div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => selectVersion('current')} 
                                        className={`w-full text-left p-5 border transition-all relative ${viewingVersion === 'current' ? 'bg-primary border-primary text-white shadow-lg scale-[1.03] z-10' : 'border-stone-800 hover:bg-stone-800'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-[11px] uppercase tracking-wider">Live Profile</span>
                                        </div>
                                        <p className="text-[10px] opacity-60 font-medium">Primary Active Snapshot</p>
                                    </button>

                                    {auditHistory.map((audit) => (
                                        <button 
                                            key={audit.id} 
                                            onClick={() => selectVersion(audit)} 
                                            className={`w-full text-left p-5 border transition-all ${viewingVersion === audit.id ? 'bg-white border-white text-stone-900 shadow-2xl scale-[1.03] z-10' : 'border-stone-800/50 hover:bg-stone-800/80 opacity-50'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-[10px] uppercase tracking-widest">Snapshot</span>
                                                <span className="text-[9px] font-mono opacity-50">{new Date(audit.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[9px] opacity-60 truncate font-medium">ID: {audit.id.slice(0, 8)}</p>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content: Form Viewer */}
                    <div className="flex-1 bg-[#e0e0e0] p-12 overflow-y-auto relative">
                        <div className="max-w-5xl mx-auto space-y-12">
                            {/* Navigation Tabs */}
                            <nav className="flex justify-between bg-stone-900/10 backdrop-blur-md p-1.5 shadow-sm gap-1.5 sticky top-0 z-50 rounded-lg">
                                {TABS.map((tab) => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id)} 
                                        className={`flex-1 flex items-center justify-center gap-3 py-3 transition-all duration-300 ${activeTab === tab.id ? 'bg-primary text-white' : 'text-stone-400 hover:bg-stone-50'}`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="text-[9px] uppercase font-black tracking-widest hidden lg:block">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>

                            {/* Clinical Document Rendering */}
                            <div className="bg-white shadow-2xl p-20 font-serif min-h-[1100px] pointer-events-auto relative border border-stone-200 rounded-sm">
                                <div className="flex justify-between items-start mb-16 border-b-4 border-stone-900 pb-8 text-stone-900">
                                    <div className="text-left">
                                        <h1 className="text-4xl font-serif font-black uppercase tracking-tighter">Confidential clinical Profile</h1>
                                        <p className="text-xs text-stone-400 uppercase tracking-[0.2em] mt-2 font-sans font-bold">Medical Examination Snapshot · sothis</p>
                                    </div>
                                </div>
                                
                                <IntakeFormFields 
                                    form={form} 
                                    setForm={setForm} 
                                    activeTab={activeTab} 
                                    setActiveTab={setActiveTab} 
                                    isReadOnly={viewingVersion !== 'current'} 
                                    isTherapistView={true} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
