import React, { useState } from 'react';
import Button from './Button';

interface BookingNoteModalProps {
    bookingId: string;
    clientName: string;
    date: string;
    initialNotes: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (newNotes: string) => Promise<void>;
}

export default function BookingNoteModal({
    bookingId,
    clientName,
    date,
    initialNotes,
    isOpen,
    onClose,
    onSave
}: BookingNoteModalProps) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(notes);
            onClose();
        } catch (error) {
            console.error('Failed to save notes', error);
            alert('Failed to save notes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <div>
                        <h3 className="font-bold text-stone-900">Session Notes</h3>
                        <p className="text-xs text-stone-500">{clientName} • {date}</p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
                </div>

                <div className="p-6 flex flex-col h-[60vh]">
                    <div className="flex-1 mb-4 flex flex-col">
                        <label className="text-xs font-bold text-stone-500 uppercase mb-1">Full History (Editable)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="flex-1 w-full p-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary resize-none text-stone-700 font-mono text-sm"
                            placeholder="No notes yet..."
                        />
                    </div>

                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                        <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">Add New Entry</label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 border border-stone-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary"
                                placeholder="Type a new note here..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const now = new Date();
                                        const timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                        const newEntry = `\n\n[${timestamp}]: ${e.currentTarget.value}`;
                                        setNotes(prev => prev + newEntry);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                className="px-4 py-2 bg-stone-200 text-stone-700 font-medium rounded-md hover:bg-stone-300 text-sm"
                                onClick={(e) => {
                                    // Hacky way to get input value since I didn't verify controlled state for this temp input
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    if (input.value) {
                                        const now = new Date();
                                        const timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                        const newEntry = (notes ? '\n\n' : '') + `[${timestamp}]: ${input.value}`;
                                        setNotes(prev => prev + newEntry);
                                        input.value = '';
                                    }
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">
                            Press Enter to auto-append with timestamp.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Notes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
