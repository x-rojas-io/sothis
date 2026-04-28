'use client';

import React, { useState, useEffect } from 'react';
import Button from './Button';
import { 
    XMarkIcon, 
    ClipboardDocumentCheckIcon, 
    HandRaisedIcon, 
    MagnifyingGlassIcon, 
    ArrowPathIcon,
    CheckCircleIcon,
    CalendarIcon,
    UserIcon,
    ClipboardIcon,
    DocumentTextIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export interface SoapNote {
    id?: string;
    booking_id: string;
    client_email: string;
    treatment_goal: string;
    subjective_symptoms: string;
    subjective_pain_intensity: number;
    subjective_notes: string;
    objective_findings: string;
    objective_tests: string;
    assessment_summary: string;
    assessment_conclusion: string;
    plan_treatment: string;
    plan_frequency: string;
    plan_self_care: string;
    body_markings: any;
    status: 'draft' | 'completed';
    created_at?: string;
}

interface SoapNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    clientName: string;
    clientEmail: string;
    date: string;
    clientNotes?: string;
    onSave: (note: SoapNote) => Promise<void>;
}

export default function SoapNoteModal({
    isOpen,
    onClose,
    bookingId,
    clientName,
    clientEmail,
    date,
    clientNotes,
    onSave
}: SoapNoteModalProps) {
    const [note, setNote] = useState<SoapNote>({
        booking_id: bookingId,
        client_email: clientEmail,
        treatment_goal: '',
        subjective_symptoms: '',
        subjective_pain_intensity: 0,
        subjective_notes: '',
        objective_findings: '',
        objective_tests: '',
        assessment_summary: '',
        assessment_conclusion: '',
        plan_treatment: '',
        plan_frequency: '',
        plan_self_care: '',
        body_markings: [],
        status: 'draft'
    });

    const [history, setHistory] = useState<SoapNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'S' | 'O' | 'A' | 'P'>('S');
    const [viewingId, setViewingId] = useState<string | 'current'>('current');
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNote();
            fetchHistory();
        }
    }, [isOpen, bookingId]);

    async function fetchNote() {
        setLoading(true);
        setViewingId('current');
        try {
            const res = await fetch(`/api/admin/soap-notes?booking_id=${bookingId}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setNote(data);
                } else {
                    setNote({
                        booking_id: bookingId,
                        client_email: clientEmail,
                        treatment_goal: '',
                        subjective_symptoms: '',
                        subjective_pain_intensity: 0,
                        subjective_notes: '',
                        objective_findings: '',
                        objective_tests: '',
                        assessment_summary: '',
                        assessment_conclusion: '',
                        plan_treatment: '',
                        plan_frequency: '',
                        plan_self_care: '',
                        body_markings: [],
                        status: 'draft'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch SOAP note', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchHistory() {
        try {
            const res = await fetch(`/api/admin/soap-notes?client_email=${clientEmail}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    }

    const selectVersion = (id: string | 'current') => {
        if (id === 'current') {
            setViewingId('current');
            fetchNote();
        } else {
            const histItem = history.find(h => h.id === id);
            if (histItem) {
                setViewingId(id);
                setNote(histItem);
            }
        }
    };

    const handleSave = async (status: 'draft' | 'completed' = 'draft') => {
        setIsSaving(true);
        try {
            const finalNote = { ...note, status };
            await onSave(finalNote);
            setNote(finalNote);
            fetchHistory(); // Refresh sidebar
            if (status === 'completed') {
                onClose();
            }
        } catch (error) {
            alert('Failed to save SOAP note');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'S', label: 'Subjective', icon: HandRaisedIcon },
        { id: 'O', label: 'Objective', icon: MagnifyingGlassIcon },
        { id: 'A', label: 'Assessment', icon: ClipboardDocumentCheckIcon },
        { id: 'P', label: 'Plan', icon: ArrowPathIcon },
    ];

    return (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-4 z-[100]">
            <div className="bg-[#f2f2f2] w-full max-w-7xl shadow-2xl flex flex-col h-full md:h-[92vh] relative animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 md:rounded-lg overflow-hidden">
                
                {/* Mobile Header */}
                <div className="lg:hidden bg-stone-900 p-4 flex justify-between items-center border-b border-stone-800 shrink-0">
                    <div>
                        <h2 className="text-white font-serif font-black uppercase text-sm tracking-tight">{clientName}</h2>
                        <p className="text-[9px] text-stone-500 uppercase font-bold tracking-widest">SOAP Documentation</p>
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
                    
                    {/* Sidebar: Identity & Encounter History - Desktop: Fixed, Mobile: Toggleable Slide-over */}
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
                                {clientName}
                            </h2>
                            <p className="text-[10px] text-stone-500 font-sans font-bold uppercase tracking-[0.3em] mb-10">
                                SOAP Documentation
                            </p>
                            
                            <div className="space-y-3 pb-6 border-b border-stone-800">
                                <button 
                                    onClick={onClose} 
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white border border-stone-700 hover:border-white px-4 py-3 w-full transition-all"
                                >
                                    ✕ Close View
                                </button>

                                {viewingId === 'current' && note.status !== 'completed' && (
                                    <button 
                                        onClick={() => handleSave('completed')}
                                        disabled={isSaving}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white hover:bg-white hover:text-primary border border-primary px-4 py-3 w-full transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {isSaving ? 'Certifying...' : '✍️ Sign & Complete'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile Actions (Visible only in mobile sidebar) */}
                        <div className="lg:hidden space-y-4 mb-6">
                            {viewingId === 'current' && note.status !== 'completed' && (
                                <button 
                                    onClick={() => { handleSave('completed'); setMobileHistoryOpen(false); }}
                                    disabled={isSaving}
                                    className="text-xs font-black uppercase tracking-widest bg-primary text-white p-4 w-full rounded-md shadow-lg"
                                >
                                    ✍️ Sign & Complete Note
                                </button>
                            )}
                        </div>

                            {clientNotes && (
                                <div className="mt-6 p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                        <DocumentTextIcon className="w-3 h-3" /> Client Symptoms
                                    </h4>
                                    <p className="text-[10px] text-stone-300 font-serif italic leading-relaxed line-clamp-4">
                                        "{clientNotes}"
                                    </p>
                                </div>
                            )}

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-500">Encounter History</h4>
                            
                            <button 
                                onClick={() => { selectVersion('current'); setMobileHistoryOpen(false); }} 
                                className={`w-full text-left p-5 border transition-all relative ${viewingId === 'current' ? 'bg-primary border-primary text-white shadow-lg scale-[1.03] z-10' : 'border-stone-800 hover:bg-stone-800'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-[11px] uppercase tracking-wider">Active Session</span>
                                    <span className="text-[9px] font-mono opacity-50">{date}</span>
                                </div>
                                <p className="text-[10px] opacity-60 font-medium">Current Documentation</p>
                            </button>

                            {history.filter(h => h.booking_id !== bookingId).map((hist) => (
                                <button 
                                    key={hist.id} 
                                    onClick={() => { selectVersion(hist.id!); setMobileHistoryOpen(false); }} 
                                    className={`w-full text-left p-5 border transition-all ${viewingId === hist.id ? 'bg-white border-white text-stone-900 shadow-2xl scale-[1.03] z-10' : 'border-stone-800/50 hover:bg-stone-800/80 opacity-50'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-[10px] uppercase tracking-widest">Encounter</span>
                                        <span className="text-[9px] font-mono opacity-50">{new Date(hist.created_at!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                    <p className="text-[9px] opacity-60 truncate font-medium">{hist.treatment_goal || 'Routine Session'}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overlay for Mobile Sidebar */}
                    {mobileHistoryOpen && (
                        <div 
                            className="lg:hidden fixed inset-0 bg-black/60 z-[105]"
                            onClick={() => setMobileHistoryOpen(false)}
                        />
                    )}

                    {/* Main Content: Document Workspace */}
                    <div className="flex-1 bg-stone-200 lg:p-12 overflow-y-auto relative custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-6 lg:space-y-12 p-4 lg:p-0">
                            
                            {/* Navigation Tabs */}
                            <nav className="flex justify-between bg-stone-900/10 backdrop-blur-md p-1.5 shadow-sm gap-1 lg:gap-1.5 sticky top-2 z-50 rounded-lg">
                                {tabs.map((tab) => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id as any)} 
                                        className={`flex-1 flex items-center justify-center gap-2 lg:gap-3 py-3 lg:py-4 transition-all duration-300 rounded-md ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
                                    >
                                        <tab.icon className="w-4 h-4 lg:w-5 h-5" />
                                        <span className="text-[10px] uppercase font-black tracking-widest hidden sm:block">{tab.label}</span>
                                        <span className="text-xs font-black sm:hidden">{tab.id}</span>
                                    </button>
                                ))}
                            </nav>

                            {/* Clinical Paper Surface */}
                            <div className="bg-white shadow-2xl p-6 md:p-12 lg:p-20 font-serif min-h-[90vh] pointer-events-auto relative border border-stone-300 rounded-sm">
                                {/* Header of the "Paper" */}
                                <div className="flex justify-between items-start mb-10 md:mb-16 border-b-4 border-stone-900 pb-6 md:pb-8 text-stone-900">
                                    <div className="text-left">
                                        <h1 className="text-2xl md:text-4xl font-serif font-black uppercase tracking-tighter leading-none">Clinical SOAP Encounter</h1>
                                        <p className="text-[9px] md:text-xs text-stone-400 uppercase tracking-[0.2em] mt-2 font-sans font-bold">Enc-ID: {bookingId.slice(0, 8)} · {date}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className={`px-4 py-2 border-2 text-[10px] font-black uppercase tracking-widest ${note.status === 'completed' ? 'border-green-600 text-green-600' : 'border-stone-300 text-stone-300'}`}>
                                            {note.status === 'completed' ? 'Certified' : 'Clinical Draft'}
                                        </div>
                                    </div>
                                </div>

                                {loading && viewingId === 'current' ? (
                                    <div className="flex items-center justify-center h-64 text-stone-300 animate-pulse font-serif italic text-2xl">Accessing secure documentation...</div>
                                ) : (
                                    <div className="space-y-12">
                                        {/* Subjective Section */}
                                        {activeTab === 'S' && (
                                            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-10">
                                                <div className="border-l-4 border-primary pl-8">
                                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Subjective Findings</h3>
                                                    <div className="space-y-8">
                                                        <div className="group">
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block group-focus-within:text-primary transition-colors">Treatment Goal for Today</label>
                                                            <input 
                                                                type="text"
                                                                value={note.treatment_goal}
                                                                onChange={e => setNote({...note, treatment_goal: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border-b-2 border-stone-100 focus:border-primary py-4 text-xl font-serif italic outline-none transition-all disabled:bg-transparent"
                                                                placeholder="Enter primary clinical objective..."
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 block">Pain Intensity (Subjective 0-10)</label>
                                                            <div className="flex items-center gap-10">
                                                                <input 
                                                                    type="range" min="0" max="10" step="1"
                                                                    value={note.subjective_pain_intensity}
                                                                    onChange={e => setNote({...note, subjective_pain_intensity: parseInt(e.target.value)})}
                                                                    disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                    className="flex-1 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                                                />
                                                                <div className="text-5xl font-black text-stone-900 w-20 text-center">{note.subjective_pain_intensity}</div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Symptoms / Onset / Frequency</label>
                                                            <textarea 
                                                                value={note.subjective_symptoms}
                                                                onChange={e => setNote({...note, subjective_symptoms: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border border-stone-100 p-8 min-h-[300px] text-lg font-serif leading-relaxed outline-none focus:border-primary transition-all rounded-sm disabled:bg-stone-50/30"
                                                                placeholder="Describe the patient's complaints and history of current symptoms..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Objective Section */}
                                        {activeTab === 'O' && (
                                            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-10">
                                                <div className="border-l-4 border-amber-500 pl-8">
                                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Objective Observations</h3>
                                                    <div className="space-y-8">
                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Physical Examination & Findings</label>
                                                            <textarea 
                                                                value={note.objective_findings}
                                                                onChange={e => setNote({...note, objective_findings: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border border-stone-100 p-8 min-h-[350px] text-lg font-serif leading-relaxed outline-none focus:border-amber-500 transition-all rounded-sm disabled:bg-stone-50/30"
                                                                placeholder="Record palpation results, hypertonicity, postural analysis..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Measurable Tests (ROM, Orthopedic, etc)</label>
                                                            <textarea 
                                                                value={note.objective_tests}
                                                                onChange={e => setNote({...note, objective_tests: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border border-stone-100 p-6 min-h-[150px] text-lg font-serif leading-relaxed outline-none focus:border-amber-500 transition-all rounded-sm disabled:bg-stone-50/30"
                                                                placeholder="Record specific test results..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Assessment Section */}
                                        {activeTab === 'A' && (
                                            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-10">
                                                <div className="border-l-4 border-purple-500 pl-8">
                                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Clinical Assessment</h3>
                                                    <div className="space-y-8">
                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Assessment Summary</label>
                                                            <textarea 
                                                                value={note.assessment_summary}
                                                                onChange={e => setNote({...note, assessment_summary: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border border-stone-100 p-8 min-h-[350px] text-lg font-serif leading-relaxed outline-none focus:border-purple-500 transition-all rounded-sm disabled:bg-stone-50/30"
                                                                placeholder="Professional interpretation of findings..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Conclusion & Patient Response</label>
                                                            <textarea 
                                                                value={note.assessment_conclusion}
                                                                onChange={e => setNote({...note, assessment_conclusion: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border border-stone-100 p-6 min-h-[150px] text-lg font-serif leading-relaxed outline-none focus:border-purple-500 transition-all rounded-sm disabled:bg-stone-50/30"
                                                                placeholder="How did the patient respond to treatment? Conclusions for next session."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Plan Section */}
                                        {activeTab === 'P' && (
                                            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-10">
                                                <div className="border-l-4 border-green-600 pl-8">
                                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Treatment Plan</h3>
                                                    <div className="space-y-8">
                                                        <div>
                                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Treatment Performed / Techniques Used</label>
                                                            <textarea 
                                                                value={note.plan_treatment}
                                                                onChange={e => setNote({...note, plan_treatment: e.target.value})}
                                                                disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                className="w-full border border-stone-100 p-8 min-h-[300px] text-lg font-serif leading-relaxed outline-none focus:border-green-600 transition-all rounded-sm disabled:bg-stone-50/30"
                                                                placeholder="Document the exact techniques and areas treated..."
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                            <div>
                                                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Frequency & Duration</label>
                                                                <input 
                                                                    type="text"
                                                                    value={note.plan_frequency}
                                                                    onChange={e => setNote({...note, plan_frequency: e.target.value})}
                                                                    disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                    className="w-full border-b-2 border-stone-100 focus:border-green-600 py-3 text-lg font-serif italic outline-none transition-all disabled:bg-transparent"
                                                                    placeholder="e.g., Twice monthly for maintenance"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 block">Self Care & Home Instructions</label>
                                                                <input 
                                                                    type="text"
                                                                    value={note.plan_self_care}
                                                                    onChange={e => setNote({...note, plan_self_care: e.target.value})}
                                                                    disabled={viewingId !== 'current' || note.status === 'completed'}
                                                                    className="w-full border-b-2 border-stone-100 focus:border-green-600 py-3 text-lg font-serif italic outline-none transition-all disabled:bg-transparent"
                                                                    placeholder="Stretching, hydration, etc..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Footer / Save Draft */}
                                        {viewingId === 'current' && note.status !== 'completed' && (
                                            <div className="flex justify-end pt-12 border-t border-stone-100 gap-4">
                                                <button 
                                                    onClick={() => handleSave('draft')}
                                                    disabled={isSaving}
                                                    className="px-10 py-4 bg-stone-100 text-stone-900 text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all rounded-sm disabled:opacity-50"
                                                >
                                                    {isSaving ? 'Saving...' : 'Save Work in Progress'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
