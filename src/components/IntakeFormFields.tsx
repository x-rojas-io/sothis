'use client';

import React from 'react';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
    IntakeState, 
    FIELD_BG, 
    BRAND_ORANGE, 
    BODY_REGIONS, 
    CONDITIONS 
} from '@/lib/intake-constants';
import Button from "@/components/Button";

interface IntakeFormFieldsProps {
    form: IntakeState;
    setForm: (form: IntakeState) => void;
    activeTab: number;
    setActiveTab: (tab: number) => void;
    isReadOnly?: boolean;
    isNameDisabled?: boolean;
    isTherapistView?: boolean;
}

export default function IntakeFormFields({ 
    form, 
    setForm, 
    activeTab, 
    setActiveTab,
    isReadOnly = false,
    isNameDisabled = false,
    isTherapistView = false
}: IntakeFormFieldsProps) {

    // Helper: Yes/No Pills
    const YNPill = ({ value, state, onChange }: { value: boolean, state: boolean | null, onChange: (v: boolean) => void }) => (
        <button 
            type="button" 
            disabled={isReadOnly}
            onClick={() => onChange(value)}
            className={`flex items-center gap-2 px-3 py-1 border rounded-sm transition-all text-xs font-bold uppercase ${state === value ? 'bg-[#fff8ee] border-[#f5a623] text-[#1a1a1a]' : 'bg-[#fff8ee] border-[#e0c89a] text-[#888]'} ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
        >
            <div className={`w-3 h-3 rounded-full border p-0.5 flex items-center justify-center ${state === value ? 'border-[#f5a623]' : 'border-[#e0c89a]'}`}>
                {state === value && <div className="w-full h-full bg-[#f5a623] rounded-full" />}
            </div>
            {value ? 'Yes' : 'No'}
        </button>
    );

    const handleRegionToggle = (id: string) => {
        if (isReadOnly) return;
        setForm({
            ...form,
            concentrate_on: form.concentrate_on.includes(id)
                ? form.concentrate_on.filter(r => r !== id)
                : [...form.concentrate_on, id]
        });
    };

    const handleConditionToggle = (condition: string) => {
        if (isReadOnly) return;
        setForm({
            ...form,
            questions: {
                ...form.questions,
                q14_conditions: form.questions.q14_conditions.includes(condition)
                    ? form.questions.q14_conditions.filter(c => c !== condition)
                    : [...form.questions.q14_conditions, condition]
            }
        });
    };

    return (
        <div className="clinical-fields">
            {/* TAB 1: PERSONAL INFORMATION */}
            {activeTab === 1 && (
                <div className="space-y-8 animate-tab-in">
                    <div className="flex flex-col gap-1 border-b-2 border-stone-800 pb-2">
                        <h2 className="text-2xl font-serif font-black uppercase tracking-tighter">Personal Information</h2>
                        <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold italic">Clinical Registration & Contact Audit</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Name</label>
                                <input 
                                    disabled={isReadOnly || isNameDisabled} 
                                    type="text" 
                                    value={form.full_name} 
                                    onChange={e => setForm({...form, full_name: e.target.value})} 
                                    className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors ${isNameDisabled ? 'cursor-not-allowed text-stone-500' : ''}`} 
                                />
                            </div>
                            <div className="w-1/3 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Phone</label>
                                <input disabled={isReadOnly} type="text" value={form.phone_day} onChange={e => setForm({...form, phone_day: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <label className="text-[12px] whitespace-nowrap pt-2">Address</label>
                            <input disabled={isReadOnly} type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">City, State, Zip</label>
                                <input disabled={isReadOnly} type="text" value={form.city_state_zip} onChange={e => setForm({...form, city_state_zip: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Occupation</label>
                                <input disabled={isReadOnly} type="text" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Date of Birth</label>
                                <input disabled={isReadOnly} type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Initial Visit Date</label>
                                <input disabled={isReadOnly} type="date" value={form.initial_visit_date} onChange={e => setForm({...form, initial_visit_date: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Emergency Contact</label>
                                <input disabled={isReadOnly} type="text" value={form.emergency_contact} onChange={e => setForm({...form, emergency_contact: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                            <div className="flex-1 flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap pt-2">Emergency Phone</label>
                                <input disabled={isReadOnly} type="text" value={form.emergency_phone} onChange={e => setForm({...form, emergency_phone: e.target.value})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 py-1 outline-none focus:bg-white focus:border-[#f5a623] transition-colors`} />
                            </div>
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="flex justify-end pt-10">
                            <Button type="button" onClick={() => setActiveTab(2)} className={`${BRAND_ORANGE} text-white px-10 py-5 font-bold uppercase tracking-widest text-xs`}>
                                Next: Lifestyle
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: LIFESTYLE */}
            {activeTab === 2 && (
                <div className="space-y-10 animate-tab-in text-[12.5px]">
                    <div className="bg-stone-50 p-6 border-l-4 border-stone-800 italic text-stone-600 leading-relaxed shadow-sm">
                        "The following information will be used to help plan safe and effective massage sessions. Please answer the questions to the best of your knowledge."
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold">1. Have you ever received a professional massage before?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q1_massage_before} onChange={(v) => setForm({...form, questions: {...form.questions, q1_massage_before: v}})} />
                                    <YNPill value={false} state={form.questions.q1_massage_before} onChange={(v) => setForm({...form, questions: {...form.questions, q1_massage_before: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2">
                                <label className="text-[12px] italic whitespace-nowrap">If yes, how often?</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q1_frequency} onChange={e => setForm({...form, questions: {...form.questions, q1_frequency: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold">2. Do you have any difficulty lying on your front, back, or side?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q2_lying_difficulty} onChange={(v) => setForm({...form, questions: {...form.questions, q2_lying_difficulty: v}})} />
                                    <YNPill value={false} state={form.questions.q2_lying_difficulty} onChange={(v) => setForm({...form, questions: {...form.questions, q2_lying_difficulty: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2">
                                <label className="text-[12px] italic whitespace-nowrap">If yes, please explain</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q2_explain} onChange={e => setForm({...form, questions: {...form.questions, q2_explain: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold">3. Do you have any allergies to oils, lotions, or ointments?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q3_allergies} onChange={(v) => setForm({...form, questions: {...form.questions, q3_allergies: v}})} />
                                    <YNPill value={false} state={form.questions.q3_allergies} onChange={(v) => setForm({...form, questions: {...form.questions, q3_allergies: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2">
                                <label className="text-[12px] italic whitespace-nowrap">If yes, please explain</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q3_explain} onChange={e => setForm({...form, questions: {...form.questions, q3_explain: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <span className="font-bold">4. Do you have sensitive skin?</span>
                            <div className="flex gap-2">
                                <YNPill value={true} state={form.questions.q4_sensitive_skin} onChange={(v) => setForm({...form, questions: {...form.questions, q4_sensitive_skin: v}})} />
                                <YNPill value={false} state={form.questions.q4_sensitive_skin} onChange={(v) => setForm({...form, questions: {...form.questions, q4_sensitive_skin: v}})} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="font-bold block italic border-b border-stone-200 pb-1">5. Do you wear any of the following?</span>
                            <div className="flex gap-6 pl-2">
                                {['contacts', 'dentures', 'hearing_aid'].map(field => (
                                    <label key={field} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            disabled={isReadOnly}
                                            type="checkbox" 
                                            checked={(form.questions as any)[`q5_${field}`]} 
                                            onChange={e => setForm({...form, questions: {...form.questions, [`q5_${field}`]: e.target.checked}})} 
                                            className="w-4 h-4 accent-[#f5a623]" 
                                        />
                                        <span className="capitalize group-hover:text-[#f5a623] transition-colors">{field.replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold">6. Do you sit at a workstation for many hours?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q6_workstation} onChange={(v) => setForm({...form, questions: {...form.questions, q6_workstation: v}})} />
                                    <YNPill value={false} state={form.questions.q6_workstation} onChange={(v) => setForm({...form, questions: {...form.questions, q6_workstation: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2">
                                <label className="text-[12px] italic whitespace-nowrap">If yes, please describe</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q6_describe} onChange={e => setForm({...form, questions: {...form.questions, q6_describe: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold">7. Do you perform any repetitive movement in your work, sports, or hobbies?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q7_repetitive_movement} onChange={(v) => setForm({...form, questions: {...form.questions, q7_repetitive_movement: v}})} />
                                    <YNPill value={false} state={form.questions.q7_repetitive_movement} onChange={(v) => setForm({...form, questions: {...form.questions, q7_repetitive_movement: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2">
                                <label className="text-[12px] italic whitespace-nowrap">If yes, please describe</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q7_describe} onChange={e => setForm({...form, questions: {...form.questions, q7_describe: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="font-bold">8. Do you experience stress in your daily life?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q8_stress} onChange={(v) => setForm({...form, questions: {...form.questions, q8_stress: v}})} />
                                    <YNPill value={false} state={form.questions.q8_stress} onChange={(v) => setForm({...form, questions: {...form.questions, q8_stress: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 space-y-4">
                                <div className="flex items-end gap-2">
                                    <label className="text-[12px] italic whitespace-nowrap">How does it affect your health?</label>
                                    <input disabled={isReadOnly} type="text" value={form.questions.q8_health_affect} onChange={e => setForm({...form, questions: {...form.questions, q8_health_affect: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] italic block">What symptoms do you experience?</label>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 pl-2">
                                        {['headaches', 'insomnia', 'fatigue', 'muscle tension', 'digestive problems'].map(s => (
                                            <label key={s} className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                    disabled={isReadOnly}
                                                    type="checkbox" 
                                                    checked={form.questions.q8_symptoms.includes(s)} 
                                                    onChange={e => {
                                                        const news = e.target.checked 
                                                            ? [...form.questions.q8_symptoms, s]
                                                            : form.questions.q8_symptoms.filter(x => x !== s);
                                                        setForm({...form, questions: {...form.questions, q8_symptoms: news}});
                                                    }} 
                                                    className="w-4 h-4 accent-[#f5a623]" 
                                                />
                                                <span className="capitalize group-hover:text-[#f5a623] transition-colors">{s}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex items-end gap-2 pl-2 pt-2">
                                        <label className="text-[11px] whitespace-nowrap uppercase tracking-widest text-[#888]">Other</label>
                                        <input disabled={isReadOnly} type="text" value={form.questions.q8_symptoms_other} onChange={e => setForm({...form, questions: {...form.questions, q8_symptoms_other: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="flex justify-between pt-10">
                            <button type="button" onClick={() => setActiveTab(1)} className="text-[#888] font-bold uppercase tracking-widest text-[10px] items-center flex gap-2">
                                <ChevronLeftIcon className="w-4 h-4" />
                                Back
                            </button>
                            <Button type="button" onClick={() => setActiveTab(3)} className={`${BRAND_ORANGE} text-white px-10 py-5 font-bold uppercase tracking-widest text-xs`}>
                                Next: Medical History
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: MEDICAL HISTORY & MAPPING */}
            {activeTab === 3 && (
                <div className="space-y-12 animate-tab-in">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
                            <span className="font-bold">9. Are there specific areas of tension, pain or stiffness that you wish to identify?</span>
                            <div className="flex gap-2">
                                <YNPill value={true} state={form.questions.q9_tension_pain} onChange={(v) => setForm({...form, questions: {...form.questions, q9_tension_pain: v}})} />
                                <YNPill value={false} state={form.questions.q9_tension_pain} onChange={(v) => setForm({...form, questions: {...form.questions, q9_tension_pain: v}})} />
                            </div>
                        </div>
                        <div className="pl-6 flex items-end gap-2 text-[12px]">
                            <label className="italic whitespace-nowrap">If yes, please explain</label>
                            <input disabled={isReadOnly} type="text" value={form.questions.q9_identify} onChange={e => setForm({...form, questions: {...form.questions, q9_identify: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                        </div>
                    </div>

                    <div className="clinical-row grid md:grid-cols-[1fr_auto_1fr] gap-8 items-start pt-6 border-t border-stone-100">
                        <div className="space-y-4">
                            <div className="bg-stone-50 p-4 border border-stone-200">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-stone-800 mb-2">Instructions</h4>
                                <p className="text-[12px] leading-relaxed italic text-stone-600">
                                    Select any specific areas you would like the massage therapist to concentrate on during the session.
                                    <span className="block mt-2 font-bold text-stone-900 not-italic">Tap a region to select · tap again to deselect</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-12 justify-center py-4 bg-white p-6 rounded-sm shadow-inner border border-stone-50">
                            {/* FRONT FIGURE */}
                            <div className="text-center">
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-4">Front</span>
                                <svg className="w-[120px] h-auto drop-shadow-sm" viewBox="0 0 80 175" xmlns="http://www.w3.org/2000/svg">
                                    <line className="stroke-stone-300 stroke-[0.5]" x1="40" y1="39" x2="40" y2="81" />
                                    {BODY_REGIONS.slice(0, 22).map(region => (
                                        <g 
                                            key={region.id} 
                                            className={`cursor-pointer transition-colors ${form.concentrate_on.includes(region.id) ? 'fill-[#f5a623] stroke-[#d48c1b]' : 'fill-stone-100 stroke-stone-300'} hover:fill-stone-200`} 
                                            onClick={() => handleRegionToggle(region.id)}
                                        >
                                            {region.id === 'head_front' && <ellipse cx="40" cy="16" rx="13" ry="15" />}
                                            {region.id === 'neck' && <rect x="34" y="30" width="12" height="9" rx="2" />}
                                            {region.id === 'chest_left' && <rect x="23" y="39" width="17" height="22" rx="2" />}
                                            {region.id === 'chest_right' && <rect x="40" y="39" width="17" height="22" rx="2" />}
                                            {region.id === 'abdomen_left' && <rect x="23" y="61" width="17" height="20" rx="2" />}
                                            {region.id === 'abdomen_right' && <rect x="40" y="61" width="17" height="20" rx="2" />}
                                            {region.id === 'left_shoulder' && <rect x="8" y="39" width="16" height="10" rx="4" />}
                                            {region.id === 'left_upper_arm' && <rect x="8" y="49" width="14" height="25" rx="4" />}
                                            {region.id === 'left_forearm' && <rect x="4" y="74" width="14" height="30" rx="4" />}
                                            {region.id === 'left_hand' && <rect x="2" y="104" width="14" height="15" rx="6" />}
                                            {region.id === 'right_shoulder' && <rect x="56" y="39" width="16" height="10" rx="4" />}
                                            {region.id === 'right_upper_arm' && <rect x="58" y="49" width="14" height="25" rx="4" />}
                                            {region.id === 'right_forearm' && <rect x="62" y="74" width="14" height="30" rx="4" />}
                                            {region.id === 'right_hand' && <rect x="64" y="104" width="14" height="15" rx="6" />}
                                            {region.id === 'left_thigh_front' && <rect x="23" y="81" width="17" height="40" rx="4" />}
                                            {region.id === 'right_thigh_front' && <rect x="40" y="81" width="17" height="40" rx="4" />}
                                            {region.id === 'left_knee' && <rect x="23" y="121" width="17" height="12" rx="4" />}
                                            {region.id === 'right_knee' && <rect x="40" y="121" width="17" height="12" rx="4" />}
                                            {region.id === 'left_shin' && <rect x="23" y="133" width="17" height="32" rx="4" />}
                                            {region.id === 'right_shin' && <rect x="40" y="133" width="17" height="32" rx="4" />}
                                            {region.id === 'left_foot' && <rect x="18" y="165" width="22" height="8" rx="2" />}
                                            {region.id === 'right_foot' && <rect x="40" y="165" width="22" height="8" rx="2" />}
                                        </g>
                                    ))}
                                </svg>
                            </div>

                            {/* BACK FIGURE */}
                            <div className="text-center">
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-4">Back</span>
                                <svg className="w-[120px] h-auto drop-shadow-sm" viewBox="0 0 80 175" xmlns="http://www.w3.org/2000/svg">
                                    <line className="stroke-stone-300 stroke-[0.5]" x1="40" y1="39" x2="40" y2="81" />
                                    {BODY_REGIONS.slice(22).map(region => (
                                        <g 
                                            key={region.id} 
                                            className={`cursor-pointer transition-colors ${form.concentrate_on.includes(region.id) ? 'fill-[#f5a623] stroke-[#d48c1b]' : 'fill-stone-100 stroke-stone-300'} hover:fill-stone-200`} 
                                            onClick={() => handleRegionToggle(region.id)}
                                        >
                                            {region.id === 'head_back' && <ellipse cx="40" cy="16" rx="13" ry="15" />}
                                            {region.id === 'neck_back' && <rect x="34" y="30" width="12" height="9" rx="2" />}
                                            {region.id === 'upper_back_left' && <rect x="23" y="39" width="17" height="20" rx="2" />}
                                            {region.id === 'upper_back_right' && <rect x="40" y="39" width="17" height="20" rx="2" />}
                                            {region.id === 'mid_back_left' && <rect x="23" y="59" width="17" height="15" rx="2" />}
                                            {region.id === 'mid_back_right' && <rect x="40" y="59" width="17" height="15" rx="2" />}
                                            {region.id === 'lower_back_left' && <rect x="23" y="74" width="17" height="15" rx="2" />}
                                            {region.id === 'lower_back_right' && <rect x="40" y="74" width="17" height="15" rx="2" />}
                                            {region.id === 'glutes_left' && <rect x="23" y="89" width="17" height="20" rx="4" />}
                                            {region.id === 'glutes_right' && <rect x="40" y="89" width="17" height="20" rx="4" />}
                                            {region.id === 'left_hamstring' && <rect x="23" y="109" width="17" height="35" rx="4" />}
                                            {region.id === 'right_hamstring' && <rect x="40" y="109" width="17" height="35" rx="4" />}
                                            {region.id === 'left_calf' && <rect x="23" y="144" width="17" height="25" rx="4" />}
                                            {region.id === 'right_calf' && <rect x="40" y="144" width="17" height="25" rx="4" />}
                                            {region.id === 'left_heel' && <rect x="23" y="169" width="17" height="6" rx="2" />}
                                            {region.id === 'right_heel' && <rect x="40" y="169" width="17" height="6" rx="2" />}
                                            {/* BACK ARMS */}
                                            {region.id === 'left_shoulder_back' && <rect x="8" y="39" width="15" height="10" rx="4" />}
                                            {region.id === 'left_upper_arm_back' && <rect x="8" y="49" width="14" height="25" rx="4" />}
                                            {region.id === 'left_forearm_back' && <rect x="4" y="74" width="14" height="30" rx="4" />}
                                            {region.id === 'left_hand_back' && <rect x="2" y="104" width="14" height="15" rx="6" />}
                                            {region.id === 'right_shoulder_back' && <rect x="57" y="39" width="15" height="10" rx="4" />}
                                            {region.id === 'right_upper_arm_back' && <rect x="58" y="49" width="14" height="25" rx="4" />}
                                            {region.id === 'right_forearm_back' && <rect x="62" y="74" width="14" height="30" rx="4" />}
                                            {region.id === 'right_hand_back' && <rect x="64" y="104" width="14" height="15" rx="6" />}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        </div>

                        <div className="sidebar pt-8">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4 border-b pb-2">Selected areas</h4>
                            <div className="flex flex-wrap gap-2">
                                {form.concentrate_on.length === 0 ? (
                                    <span className="text-stone-300 italic text-xs">No areas identified</span>
                                ) : (
                                    form.concentrate_on.map(id => (
                                        <span key={id} className="bg-[#fff8ee] border border-[#f5a623] text-[#1a1a1a] px-2 py-1 text-[10px] uppercase font-bold tracking-tight">
                                            {id.replace(/_/g, ' ')}
                                        </span>
                                    ))
                                )}
                            </div>
                            {form.concentrate_on.length > 0 && !isReadOnly && (
                                <button 
                                    type="button" 
                                    onClick={() => setForm({...form, concentrate_on: []})} 
                                    className="text-[13px] text-[#e07b20] underline mt-4 block hover:text-[#b85e10]"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-stone-100">
                        <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
                            <span>10. Do you have any particular goals in mind for this massage session?</span>
                            <div className="flex gap-2">
                                <YNPill value={true} state={form.questions.q10_goals} onChange={(v) => setForm({...form, questions: {...form.questions, q10_goals: v}})} />
                                <YNPill value={false} state={form.questions.q10_goals} onChange={(v) => setForm({...form, questions: {...form.questions, q10_goals: v}})} />
                            </div>
                        </div>
                        <div className="pl-6 flex items-end gap-2 text-[12px]">
                            <label className="italic whitespace-nowrap">Please explain</label>
                            <input disabled={isReadOnly} type="text" value={form.questions.q10_explain} onChange={e => setForm({...form, questions: {...form.questions, q10_explain: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                        </div>

                        <div className="space-y-2 pt-6">
                            <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
                                <span>11. Are you currently under medical supervision?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q11_under_supervision} onChange={(v) => setForm({...form, questions: {...form.questions, q11_under_supervision: v}})} />
                                    <YNPill value={false} state={form.questions.q11_under_supervision} onChange={(v) => setForm({...form, questions: {...form.questions, q11_under_supervision: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2 text-[12px]">
                                <label className="italic whitespace-nowrap">If yes, please explain</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q11_explain} onChange={e => setForm({...form, questions: {...form.questions, q11_explain: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
                            <span>12. Do you see a chiropractor?</span>
                            <div className="flex gap-2">
                                <YNPill value={true} state={form.questions.q12_chiropractor} onChange={(v) => setForm({...form, questions: {...form.questions, q12_chiropractor: v}})} />
                                <YNPill value={false} state={form.questions.q12_chiropractor} onChange={(v) => setForm({...form, questions: {...form.questions, q12_chiropractor: v}})} />
                            </div>
                            <div className="flex items-end gap-2">
                                <label className="text-[12px] whitespace-nowrap">If yes, how often?</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q12_frequency} onChange={e => setForm({...form, questions: {...form.questions, q12_frequency: e.target.value}})} className={`w-[120px] border-0 border-b border-[#888] ${FIELD_BG} px-2 py-0.5 outline-none`} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-4 text-[12.5px]">
                                <span>13. Are you currently taking any medication?</span>
                                <div className="flex gap-2">
                                    <YNPill value={true} state={form.questions.q13_medication} onChange={(v) => setForm({...form, questions: {...form.questions, q13_medication: v}})} />
                                    <YNPill value={false} state={form.questions.q13_medication} onChange={(v) => setForm({...form, questions: {...form.questions, q13_medication: v}})} />
                                </div>
                            </div>
                            <div className="pl-6 flex items-end gap-2 text-[12px]">
                                <label className="italic whitespace-nowrap">If yes, please list</label>
                                <input disabled={isReadOnly} type="text" value={form.questions.q13_list} onChange={e => setForm({...form, questions: {...form.questions, q13_list: e.target.value}})} className={`flex-1 border-0 border-b border-[#888] ${FIELD_BG} px-2 outline-none`} />
                            </div>
                        </div>
                    </div>

                    {!isReadOnly && (
                        <div className="flex justify-between pt-10">
                            <button type="button" onClick={() => setActiveTab(2)} className="text-[#888] font-bold uppercase tracking-widest text-[10px] items-center flex gap-2">
                                <ChevronLeftIcon className="w-4 h-4" />
                                Back
                            </button>
                            <Button type="button" onClick={() => setActiveTab(4)} className={`${BRAND_ORANGE} text-white px-10 py-5 font-bold uppercase tracking-widest text-xs`}>
                                Next: Conditions
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: CONDITIONS */}
            {activeTab === 4 && (
                <div className="space-y-8 animate-tab-in text-[12px]">
                    <span className="font-bold text-[12.5px] block">14. Please check any condition listed below that applies to you:</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 pt-4">
                        <div className="flex flex-col gap-y-1.5">
                            {CONDITIONS.slice(0, 16).map(cond => (
                                <label key={cond} className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        disabled={isReadOnly}
                                        type="checkbox" 
                                        checked={form.questions.q14_conditions.includes(cond)} 
                                        onChange={() => handleConditionToggle(cond)} 
                                        className="w-3 h-3 accent-[#f5a623]" 
                                    />
                                    <span className="group-hover:text-[#f5a623] transition-colors leading-tight">{cond}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex flex-col gap-y-1.5">
                            {CONDITIONS.slice(16).map(cond => (
                                <label key={cond} className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        disabled={isReadOnly}
                                        type="checkbox" 
                                        checked={form.questions.q14_conditions.includes(cond)} 
                                        onChange={() => handleConditionToggle(cond)} 
                                        className="w-3 h-3 accent-[#f5a623]" 
                                    />
                                    <div className="flex-1 flex flex-wrap items-center gap-2">
                                        <span className="group-hover:text-[#f5a623] transition-colors leading-tight">{cond}</span>
                                        {cond === 'pregnancy' && (
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <span className="italic">If yes, how many months?</span>
                                                <input disabled={isReadOnly} type="text" value={form.questions.q14_pregnancy_months} onChange={e => setForm({...form, questions: {...form.questions, q14_pregnancy_months: e.target.value}})} className={`w-16 border-0 border-b border-[#888] ${FIELD_BG} px-1 outline-none`} />
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 space-y-2">
                        <label className="italic block">Please explain any condition that you have marked above</label>
                        <textarea disabled={isReadOnly} value={form.questions.q14_explanation} onChange={e => setForm({...form, questions: {...form.questions, q14_explanation: e.target.value}})} className={`w-full border-0 border-b border-[#888] ${FIELD_BG} p-2 outline-none focus:bg-white min-h-[60px]`} rows={2} />
                    </div>

                    <div className="pt-6 space-y-4">
                        <span className="text-[12.5px]">15. Is there anything else about your health history that you think would be useful to plan a safe and effective massage session?</span>
                        <input disabled={isReadOnly} type="text" value={form.questions.q15_useful_history} onChange={e => setForm({...form, questions: {...form.questions, q15_useful_history: e.target.value}})} className={`w-full border-0 border-b border-[#888] ${FIELD_BG} p-2 outline-none focus:bg-white`} />
                    </div>

                    {!isReadOnly && (
                        <div className="flex justify-between pt-10">
                            <button type="button" onClick={() => setActiveTab(3)} className="text-[#888] font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <ChevronLeftIcon className="w-4 h-4" />
                                Back
                            </button>
                            <Button type="button" onClick={() => setActiveTab(5)} className={`${BRAND_ORANGE} text-white px-10 py-5 font-bold uppercase tracking-widest text-xs`}>
                                Final: Consent
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 5: CONSENT */}
            {activeTab === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-tab-in">
                    <div className="p-8 bg-stone-50 border border-stone-200">
                        <h3 className="text-lg font-serif font-black uppercase mb-6 tracking-tight">Consent for Treatment</h3>
                        <div className="text-[11px] text-stone-600 leading-relaxed space-y-4 italic text-justify">
                            <p>Draping will be used during the session – only the area being worked on will be uncovered.</p>
                            <p>Clients under the age of 17 must be accompanied by a parent or legal guardian during the entire session.</p>
                            <p>Informed written consent must be provided by parent or legal guardian for any client under the age of 17.</p>
                            <div className="pt-4 border-t border-stone-200 space-y-3">
                                <p>
                                    I, <span className="font-bold border-b border-stone-400 px-4 inline-block min-w-[150px]">{form.consent_name || '_______________________________'}</span> (print name) 
                                    understand that the massage I receive is provided for the basic purpose of relaxation and relief of muscular tension. 
                                    If I experience any pain or discomfort during this session, I will immediately inform the therapist so that the pressure and/or strokes 
                                    may be adjusted to my level of comfort.
                                </p>
                                <p>
                                    I further understand that massage should not be construed as a substitute for medical examination, diagnosis, or treatment and 
                                    that I should see a physician, chiropractor or other qualified medical specialist for any mental or physical ailment that I am aware of. 
                                    I understand that massage therapists are not qualified to perform spinal or skeletal adjustments, diagnose, prescribe, or treat any 
                                    physical or mental illness, and that nothing said in the course of the session given should be construed as such.
                                </p>
                                <p>
                                    Because massage should not be performed under certain medical conditions, I affirm that I have stated all my known medical conditions, 
                                    and answered all questions honestly. I agree to keep the therapist updated as to any changes in my medical profile and understand 
                                    that there shall be no liability on the therapist’s part should I fail to do so.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 pt-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Patient Signature</span>
                            {form.consent_at ? (
                                <div className="space-y-1">
                                    <div className="text-3xl font-serif italic text-stone-900 border-b-2 border-stone-800 pb-1">
                                        {form.consent_name}
                                    </div>
                                    <div className="text-[10px] font-mono uppercase tracking-tighter text-stone-400 font-bold">
                                        DIGITALLY SIGNED ON {new Date(form.consent_at).toISOString().replace('T', ' ').split('.')[0]}
                                    </div>
                                </div>
                            ) : (
                                <input 
                                    disabled={isReadOnly} 
                                    type="text" 
                                    value={form.consent_name} 
                                    onChange={e => setForm({...form, consent_name: e.target.value})} 
                                    className={`text-2xl font-serif italic border-0 border-b-2 border-stone-800 ${FIELD_BG} px-2 py-2 outline-none focus:bg-white`} 
                                    placeholder="Type Full Name to Sign" 
                                />
                            )}
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Date</span>
                                <div className="border-b border-stone-300 py-2 font-serif">
                                    {form.consent_at ? new Date(form.consent_at).toLocaleDateString() : new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* THERAPIST SIGNATURE */}
                        <div className="flex flex-col gap-2 pt-8 border-t border-stone-100">
                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Massage Therapist Signature</span>
                            {form.therapist_signature_at ? (
                                <div className="space-y-1">
                                    <div className="text-3xl font-serif italic text-stone-900 border-b-2 border-stone-800 pb-1">
                                        {form.therapist_signature_name}
                                    </div>
                                    <div className="text-[10px] font-mono uppercase tracking-tighter text-[#f5a623] font-bold">
                                        VERIFIED BY PROVIDER ON {new Date(form.therapist_signature_at).toISOString().replace('T', ' ').split('.')[0]} 
                                        <span className="ml-2 opacity-50">[IP: {form.therapist_signature_ip}]</span>
                                    </div>
                                </div>
                            ) : isTherapistView ? (
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        value={form.therapist_signature_name} 
                                        onChange={e => setForm({...form, therapist_signature_name: e.target.value})} 
                                        className={`text-2xl font-serif italic border-0 border-b-2 border-[#f5a623] ${FIELD_BG} px-2 py-2 outline-none focus:bg-white`} 
                                        placeholder="Therapist Signature (Type Name)" 
                                    />
                                    <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold italic">
                                        Signing as Licensed Massage Therapist · Forensic IP will be logged.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-2xl font-serif italic text-stone-300 border-b-2 border-stone-200 pb-2">
                                        _______________________________
                                    </div>
                                    <p className="text-[9px] text-stone-300 uppercase tracking-widest font-bold italic">
                                        Pending Provider Review & Signature
                                    </p>
                                </div>
                            )}
                        </div>

                        {!isReadOnly && (
                            <div className="pt-10 flex justify-between">
                                <button type="button" onClick={() => setActiveTab(4)} className="text-[#888] font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    Back
                                </button>
                                <span />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
