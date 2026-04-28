'use client';

import React, { useEffect, useState } from 'react';
import IntakeFormFields from '@/components/IntakeFormFields';
import { 
    IntakeState,
    INITIAL_STATE, 
    TABS 
} from '@/lib/intake-constants';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

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
            setMobileHistoryOpen(false);
        } else {
            setViewingVersion(v.id);
            const snap = v.snapshot;
            setForm({
                ...INITIAL_STATE,
                ...snap,
                questions: { ...INITIAL_STATE.questions, ...snap.medical_history }
            });
            setMobileHistoryOpen(false);
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
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-4 z-[100]">
            <div className="bg-[#f2f2f2] w-full max-w-7xl shadow-2xl flex flex-col h-full md:h-[92vh] relative animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 md:rounded-lg overflow-hidden">
                
                {/* Mobile Header */}
                <div className="lg:hidden bg-stone-900 p-4 flex justify-between items-center border-b border-stone-800 shrink-0">
                    <div>
                        <h2 className="text-white font-serif font-black uppercase text-sm tracking-tight">{client?.name || "Client Profile"}</h2>
                        <p className="text-[9px] text-stone-500 uppercase font-bold tracking-widest">{sourceLabel}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setMobileHistoryOpen(!mobileHistoryOpen)}
                            className="bg-stone-800 text-white p-2 rounded-md border border-stone-700"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="bg-stone-800 text-white p-2 rounded-md border border-stone-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    
                    {/* Sidebar: Audit History - Desktop: Fixed, Mobile: Toggleable Slide-over */}
                    <div className={`
                        w-72 bg-stone-900 text-stone-300 p-6 lg:p-10 flex flex-col gap-8 lg:gap-10 border-r border-stone-800
                        fixed lg:relative inset-y-0 left-0 z-[110] lg:z-0 transform transition-transform duration-300
                        ${mobileHistoryOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        lg:flex
                    `}>
                        {/* Mobile Sidebar Close */}
                        <div className="lg:hidden flex justify-end mb-4">
                            <button onClick={() => setMobileHistoryOpen(false)} className="text-stone-500 hover:text-white">✕ Close History</button>
                        </div>

                        <div className="hidden lg:block">
                            <div className="w-12 h-1 bg-primary mb-6"></div>
                            <h2 className="text-2xl font-serif font-black text-white uppercase tracking-tight leading-tight mb-2">
                                {client?.name}
                            </h2>
                            <p className="text-[10px] text-stone-500 font-sans font-bold uppercase tracking-[0.3em] mb-10">
                                {sourceLabel}
                            </p>
                            
                            <div className="space-y-3 pb-6 border-b border-stone-800">
                                <button 
                                    onClick={onClose} 
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white border border-stone-700 hover:border-white px-4 py-3 w-full transition-all"
                                >
                                    ✕ Close View
                                </button>

                                {viewingVersion === 'current' && form.id && !form.therapist_signature_at && (
                                    <button 
                                        onClick={saveSignature}
                                        disabled={loading}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white hover:bg-white hover:text-primary border border-primary px-4 py-3 w-full transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? 'Certifying...' : '✍️ Sign & Complete'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-500">Document Snapshots</h4>
                            
                            {loading && auditHistory.length === 0 ? (
                                <div className="text-xs italic text-stone-500 animate-pulse">Scanning audit trail...</div>
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
                                                <span className="text-[9px] font-mono opacity-50">{new Date(audit.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                            </div>
                                            <p className="text-[9px] opacity-60 truncate font-medium">ID: {audit.id.slice(0, 8)}</p>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Overlay for Mobile Sidebar */}
                    {mobileHistoryOpen && (
                        <div 
                            className="lg:hidden fixed inset-0 bg-black/60 z-[105]"
                            onClick={() => setMobileHistoryOpen(false)}
                        />
                    )}

                    {/* Main Content: Form Viewer */}
                    <div className="flex-1 bg-stone-200 lg:p-12 overflow-y-auto relative custom-scrollbar">
                        <div className="max-w-5xl mx-auto space-y-6 lg:space-y-12 p-4 lg:p-0">
                            {/* Navigation Tabs */}
                            <nav className="flex justify-between bg-stone-900/10 backdrop-blur-md p-1.5 shadow-sm gap-1 lg:gap-1.5 sticky top-2 z-50 rounded-lg">
                                {TABS.map((tab) => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id)} 
                                        className={`flex-1 flex items-center justify-center gap-2 lg:gap-3 py-3 lg:py-4 transition-all duration-300 rounded-md ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
                                    >
                                        <tab.icon className="w-4 h-4 lg:w-5 h-5" />
                                        <span className="text-[9px] uppercase font-black tracking-widest hidden lg:block">{tab.label}</span>
                                        <span className="text-xs font-black lg:hidden">{tab.id}</span>
                                    </button>
                                ))}
                            </nav>

                            {/* Clinical Document Rendering */}
                            <div className="bg-white shadow-2xl p-6 md:p-12 lg:p-20 font-serif min-h-[90vh] pointer-events-auto relative border border-stone-200 rounded-sm">
                                <div className="flex justify-between items-start mb-10 md:mb-16 border-b-4 border-stone-900 pb-6 md:pb-8 text-stone-900">
                                    <div className="text-left">
                                        <h1 className="text-2xl md:text-4xl font-serif font-black uppercase tracking-tighter leading-none">Confidential clinical Profile</h1>
                                        <p className="text-[9px] md:text-xs text-stone-400 uppercase tracking-[0.2em] mt-2 font-sans font-bold">Medical Examination Snapshot · sothis</p>
                                    </div>
                                </div>
                                
                                <IntakeFormFields 
                                    form={form} 
                                    setForm={setForm} 
                                    activeTab={activeTab} 
                                    setActiveTab={setActiveTab} 
                                    isReadOnly={viewingVersion !== 'current'} 
                                    isTherapistView={true} 
                                    onSave={saveSignature}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
