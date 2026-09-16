'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/Button';
import NewsletterForm from '@/components/NewsletterForm';
import {
    EnvelopeIcon,
    UserGroupIcon,
    PaperAirplaneIcon,
    DocumentDuplicateIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

interface Newsletter {
    id: string;
    title: string;
    preview_text?: string;
    body: string;
    image_url?: string;
    cta_text?: string;
    cta_url?: string;
    status: 'draft' | 'queued' | 'sent';
    sent_at?: string;
    recipients_count?: number;
    created_at: string;
    updated_at: string;
}

interface Subscriber {
    id: string;
    email: string;
    is_active: boolean;
    source: string;
    created_at: string;
    unsubscribed_at?: string;
    client?: { id: string; name: string; phone?: string };
}

export default function AdminNewsletterPage() {
    const [activeTab, setActiveTab] = useState<'newsletters' | 'subscribers'>('newsletters');
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);

    // Form & Modal States
    const [isEditing, setIsEditing] = useState(false);
    const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | undefined>(undefined);
    const [previewNewsletter, setPreviewNewsletter] = useState<Newsletter | null>(null);

    // Action Modals
    const [singleSendTarget, setSingleSendTarget] = useState<Newsletter | null>(null);
    const [singleEmail, setSingleEmail] = useState('');
    const [singleNote, setSingleNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Subscriber Search / Filter
    const [subSearch, setSubSearch] = useState('');
    const [subFilter, setSubFilter] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        fetchNewsletters();
        fetchSubscribers();
    }, []);

    async function fetchNewsletters() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/newsletter');
            const data = await res.json();
            if (Array.isArray(data)) setNewsletters(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSubscribers() {
        try {
            const res = await fetch('/api/admin/newsletter/subscribers');
            const data = await res.json();
            if (Array.isArray(data)) setSubscribers(data);
        } catch (err) {
            console.error(err);
        }
    }

    const showFeedback = (type: 'success' | 'error', text: string) => {
        setFeedbackMessage({ type, text });
        setTimeout(() => setFeedbackMessage(null), 5000);
    };

    // --- Action Handlers ---

    // 1. Send Test Email to Nancy
    const handleSendTest = async (newsletter: Newsletter) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/newsletter/${newsletter.id}/send-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send test email');
            showFeedback('success', data.message || 'Test email sent successfully to your inbox!');
        } catch (err: any) {
            showFeedback('error', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 2. Send to Specific Client
    const handleSendSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleSendTarget || !singleEmail) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/newsletter/${singleSendTarget.id}/send-single`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: singleEmail, note: singleNote }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send');
            showFeedback('success', `Newsletter sent successfully to ${singleEmail}!`);
            setSingleSendTarget(null);
            setSingleEmail('');
            setSingleNote('');
        } catch (err: any) {
            showFeedback('error', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Duplicate & Queue (Recycle evergreen content)
    const handleDuplicate = async (newsletter: Newsletter) => {
        setActionLoading(true);
        try {
            const payload = {
                title: `${newsletter.title} (Copy)`,
                preview_text: newsletter.preview_text,
                body: newsletter.body,
                image_url: newsletter.image_url,
                cta_text: newsletter.cta_text,
                cta_url: newsletter.cta_url,
                status: 'queued',
            };
            const res = await fetch('/api/admin/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to duplicate');
            showFeedback('success', `Cloned "${newsletter.title}" and queued for next broadcast!`);
            fetchNewsletters();
        } catch (err: any) {
            showFeedback('error', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Broadcast to All Active Subscribers
    const handleBroadcast = async (newsletter: Newsletter) => {
        const activeCount = subscribers.filter(s => s.is_active).length;
        if (!confirm(`Are you sure you want to broadcast "${newsletter.title}" right now to all ${activeCount} active subscribers?`)) {
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/newsletter/${newsletter.id}/broadcast`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to broadcast');
            showFeedback('success', data.message || `Successfully sent to ${data.recipientsCount} subscribers!`);
            fetchNewsletters();
        } catch (err: any) {
            showFeedback('error', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 5. Delete Newsletter
    const handleDelete = async (newsletter: Newsletter) => {
        if (!confirm(`Delete "${newsletter.title}"?`)) return;

        try {
            const res = await fetch(`/api/admin/newsletter/${newsletter.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            showFeedback('success', 'Newsletter deleted.');
            fetchNewsletters();
        } catch (err: any) {
            showFeedback('error', err.message);
        }
    };

    // 6. Toggle Subscriber Status
    const handleToggleSubscriber = async (subscriber: Subscriber) => {
        const newStatus = !subscriber.is_active;
        try {
            const res = await fetch('/api/admin/newsletter/subscribers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: subscriber.id, is_active: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update subscriber');
            setSubscribers(prev => prev.map(s => s.id === subscriber.id ? { ...s, is_active: newStatus } : s));
        } catch (err: any) {
            showFeedback('error', err.message);
        }
    };

    const activeSubscribersCount = subscribers.filter(s => s.is_active).length;
    const filteredSubscribers = subscribers.filter(s => {
        if (subFilter === 'active' && !s.is_active) return false;
        if (subFilter === 'inactive' && s.is_active) return false;
        if (subSearch && !s.email.toLowerCase().includes(subSearch.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Newsletter Suite</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Craft scannable tips, queue weekly broadcasts, and connect directly with clients via WhatsApp.
                    </p>
                </div>
                {!isEditing && activeTab === 'newsletters' && (
                    <Button onClick={() => { setEditingNewsletter(undefined); setIsEditing(true); }}>
                        + Create Newsletter
                    </Button>
                )}
            </div>

            {/* Feedback Alert */}
            {feedbackMessage && (
                <div className={`p-4 rounded-xl text-sm flex items-center gap-2 border shadow-sm ${
                    feedbackMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                    {feedbackMessage.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
                    <span>{feedbackMessage.text}</span>
                </div>
            )}

            {/* Tabs Navigation */}
            {!isEditing && (
                <div className="flex gap-4 border-b border-stone-200">
                    <button
                        onClick={() => setActiveTab('newsletters')}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'newsletters'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <EnvelopeIcon className="w-4 h-4" /> Newsletters & Queue ({newsletters.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('subscribers')}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'subscribers'
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        <UserGroupIcon className="w-4 h-4" /> Active Subscribers ({activeSubscribersCount})
                    </button>
                </div>
            )}

            {/* View / Form Modes */}
            {isEditing ? (
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-serif font-bold text-stone-900">
                            {editingNewsletter ? 'Edit Newsletter' : 'Draft New Newsletter'}
                        </h2>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-sm text-stone-500 hover:text-stone-800"
                        >
                            ✕ Cancel
                        </button>
                    </div>
                    <NewsletterForm
                        newsletter={editingNewsletter}
                        onSuccess={() => {
                            setIsEditing(false);
                            fetchNewsletters();
                            showFeedback('success', 'Newsletter saved successfully!');
                        }}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            ) : activeTab === 'newsletters' ? (
                /* Tab 1: Newsletters Table */
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-stone-500">Loading newsletters...</div>
                    ) : newsletters.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                                <EnvelopeIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-serif font-bold text-stone-800">No newsletters yet</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto">
                                Create your first wellness tip or seasonal promotion to test manual sending.
                            </p>
                            <Button onClick={() => { setEditingNewsletter(undefined); setIsEditing(true); }}>
                                + Create Newsletter
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {newsletters.map((nl) => (
                                <div key={nl.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-stone-50/50 transition-colors">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                nl.status === 'sent'
                                                    ? 'bg-stone-100 text-stone-700'
                                                    : nl.status === 'queued'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                {nl.status === 'queued' ? 'Queued for Send' : nl.status.toUpperCase()}
                                            </span>
                                            {nl.sent_at && (
                                                <span className="text-xs text-stone-400">
                                                    Sent on {new Date(nl.sent_at).toLocaleDateString()} to {nl.recipients_count} clients
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-serif font-bold text-stone-900 truncate">
                                            {nl.title}
                                        </h3>
                                        {nl.preview_text && (
                                            <p className="text-xs text-stone-500 truncate">
                                                {nl.preview_text}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons Toolbar */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => setPreviewNewsletter(nl)}
                                            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1"
                                            title="Preview Layout"
                                        >
                                            <EyeIcon className="w-3.5 h-3.5" /> Preview
                                        </button>

                                        <button
                                            onClick={() => handleSendTest(nl)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1"
                                            title="Send a preview to your personal inbox"
                                        >
                                            <SparklesIcon className="w-3.5 h-3.5 text-secondary" /> Send Test to Me
                                        </button>

                                        <button
                                            onClick={() => { setSingleSendTarget(nl); setSingleEmail(''); setSingleNote(''); }}
                                            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1"
                                            title="Send to a specific client"
                                        >
                                            <PaperAirplaneIcon className="w-3.5 h-3.5 text-blue-600" /> Send to Client...
                                        </button>

                                        <button
                                            onClick={() => handleDuplicate(nl)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1"
                                            title="Clone into a new draft"
                                        >
                                            <DocumentDuplicateIcon className="w-3.5 h-3.5" /> Duplicate
                                        </button>

                                        <button
                                            onClick={() => handleBroadcast(nl)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary-dark text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                                            title="Broadcast to all subscribers now"
                                        >
                                            <PaperAirplaneIcon className="w-3.5 h-3.5" /> Broadcast Now
                                        </button>

                                        <button
                                            onClick={() => { setEditingNewsletter(nl); setIsEditing(true); }}
                                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(nl)}
                                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Tab 2: Subscribers Table */
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={subSearch}
                                onChange={(e) => setSubSearch(e.target.value)}
                                placeholder="Search by email..."
                                className="px-3 py-2 border border-stone-300 rounded-lg text-xs w-64 focus:ring-secondary focus:border-secondary"
                            />
                            <select
                                value={subFilter}
                                onChange={(e: any) => setSubFilter(e.target.value)}
                                className="px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                            >
                                <option value="all">All Subscribers ({subscribers.length})</option>
                                <option value="active">Active Only ({activeSubscribersCount})</option>
                                <option value="inactive">Unsubscribed ({subscribers.length - activeSubscribersCount})</option>
                            </select>
                        </div>

                        <a
                            href="/api/admin/newsletter/subscribers?format=csv"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-700 shadow-sm"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200 text-xs">
                            <thead className="bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider text-left">
                                <tr>
                                    <th className="px-4 py-3">Subscriber Email</th>
                                    <th className="px-4 py-3">Client Name</th>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Subscribed Date</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredSubscribers.map((sub) => (
                                    <tr key={sub.id} className={!sub.is_active ? 'bg-stone-50/70 text-stone-400' : ''}>
                                        <td className="px-4 py-3 font-medium text-stone-900">{sub.email}</td>
                                        <td className="px-4 py-3 text-stone-600">{sub.client?.name || '—'}</td>
                                        <td className="px-4 py-3 text-stone-500 uppercase text-[10px]">{sub.source || 'home_popup'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                sub.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'
                                            }`}>
                                                {sub.is_active ? 'Active' : 'Unsubscribed'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-stone-500">
                                            {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleToggleSubscriber(sub)}
                                                className={`text-xs font-semibold ${sub.is_active ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}`}
                                            >
                                                {sub.is_active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- Modals --- */}

            {/* 1. Send Single Client Modal */}
            {singleSendTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-serif font-bold text-stone-900">Send to Specific Client</h3>
                            <button onClick={() => setSingleSendTarget(null)} className="text-stone-400 hover:text-stone-700">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-stone-500">
                            Send <strong>&ldquo;{singleSendTarget.title}&rdquo;</strong> directly to a single client or inquiry.
                        </p>
                        <form onSubmit={handleSendSingleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Recipient Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={singleEmail}
                                    onChange={(e) => setSingleEmail(e.target.value)}
                                    placeholder="client@example.com"
                                    required
                                    className="w-full p-2.5 border border-stone-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    Optional Note from Nancy <span className="text-stone-400 font-normal">(appears at top of email)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={singleNote}
                                    onChange={(e) => setSingleNote(e.target.value)}
                                    placeholder="e.g. Hi Sarah, following up on our conversation today about shoulder pain!"
                                    className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" type="button" onClick={() => setSingleSendTarget(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={actionLoading}>
                                    {actionLoading ? 'Sending...' : 'Send Newsletter'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Full Preview Modal */}
            {previewNewsletter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Email Preview</span>
                            <button onClick={() => setPreviewNewsletter(null)} className="text-stone-400 hover:text-stone-700">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="text-center pb-4 border-b border-stone-100 flex flex-col items-center">
                                <img
                                    src="/logo.jpg"
                                    alt="Sothis Logo"
                                    className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shadow-md mb-2"
                                />
                                <div className="font-serif font-bold text-xl uppercase tracking-widest text-stone-900 leading-none">
                                    SOTHIS
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 mt-1">
                                    THERAPEUTIC MASSAGE
                                </div>
                            </div>
                            <h2 className="font-serif text-2xl font-bold text-stone-900">{previewNewsletter.title}</h2>
                            {previewNewsletter.preview_text && (
                                <p className="text-stone-500 text-sm">{previewNewsletter.preview_text}</p>
                            )}
                            {previewNewsletter.image_url && (
                                <img src={previewNewsletter.image_url} alt="" className="w-full max-h-64 object-cover rounded-xl border border-stone-100" />
                            )}
                            <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {previewNewsletter.body}
                            </div>
                            <div className="py-4 text-center">
                                <div className="inline-block px-8 py-3.5 bg-[#25D366] text-white font-bold rounded-full text-sm shadow-md">
                                    💬 {previewNewsletter.cta_text || 'Chat with Nancy on WhatsApp'}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-stone-100 text-xs text-stone-500">
                                <div><strong>Nancy Raza, LMT</strong></div>
                                <div>Licensed Massage Therapist & Founder</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
