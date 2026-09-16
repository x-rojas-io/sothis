'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import { DevicePhoneMobileIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface NewsletterFormProps {
    newsletter?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function NewsletterForm({ newsletter, onSuccess, onCancel }: NewsletterFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const DEFAULT_BANNER = 'https://mmqystevqgvgpfymfqzk.supabase.co/storage/v1/object/public/service-images/newsletter-hero-banner.jpg';

    const [formData, setFormData] = useState({
        title: newsletter?.title || '',
        preview_text: newsletter?.preview_text || '',
        body: newsletter?.body || '',
        image_url: newsletter?.image_url !== undefined ? newsletter.image_url : DEFAULT_BANNER,
        cta_text: newsletter?.cta_text || 'Chat with Nancy on WhatsApp',
        cta_url: newsletter?.cta_url || '',
        status: newsletter?.status || 'draft',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errorMessage) setErrorMessage(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploadingImage(true);
        setErrorMessage(null);

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);

            const res = await fetch('/api/services/upload', {
                method: 'POST',
                body: uploadData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to upload image');

            setFormData(prev => ({ ...prev, image_url: result.url }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setErrorMessage(error?.message || 'Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        if (!formData.title.trim() || !formData.body.trim()) {
            setErrorMessage('Subject title and content body are required.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                title: formData.title,
                preview_text: formData.preview_text,
                body: formData.body,
                image_url: formData.image_url,
                cta_text: formData.cta_text,
                cta_url: formData.cta_url ? formData.cta_url.trim() : null,
                status: formData.status,
            };

            if (newsletter?.id) {
                // Update
                const res = await fetch(`/api/admin/newsletter/${newsletter.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to update newsletter');
            } else {
                // Create
                const res = await fetch('/api/admin/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to create newsletter');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Save newsletter error:', error);
            setErrorMessage(error?.message || 'Failed to save newsletter');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form Editor */}
            <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-stone-800 mb-1">
                            Subject / Headline <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. 5 Quick Stretches for Desk Workers"
                            required
                            className="w-full rounded-lg border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary text-sm border p-2.5 font-medium"
                        />
                        <p className="text-xs text-stone-400 mt-1">This is the 5-second hook your clients see in their email inbox.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-stone-800 mb-1">
                            Inbox Preview Text <span className="text-stone-400 font-normal">(Subtitle)</span>
                        </label>
                        <input
                            type="text"
                            name="preview_text"
                            value={formData.preview_text}
                            onChange={handleChange}
                            placeholder="e.g. Relieve neck and shoulder tension in under 2 minutes."
                            className="w-full rounded-lg border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary text-sm border p-2.5"
                        />
                    </div>

                    {/* Featured Image */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-800 mb-1">
                            Featured Banner Image <span className="text-stone-400 font-normal">(optional)</span>
                        </label>
                        <div className="flex items-center gap-4">
                            {formData.image_url && (
                                <div className="relative">
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="h-16 w-24 object-cover rounded-lg border border-stone-200 shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-[10px] shadow"
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                    className="block w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-white hover:file:bg-secondary/90 disabled:opacity-50"
                                />
                                {uploadingImage && <p className="text-xs text-secondary mt-1 font-medium animate-pulse">Uploading image...</p>}
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-semibold text-stone-800">
                                Message Body <span className="text-red-500">*</span>
                            </label>
                            <span className="text-xs text-stone-400">Use bullet points (- or •) for easy scanning</span>
                        </div>
                        <textarea
                            name="body"
                            rows={8}
                            value={formData.body}
                            onChange={handleChange}
                            placeholder="Write your short, scannable advice here...&#10;&#10;• Drop your shoulders away from your ears&#10;• Drink warm water before 4 PM&#10;&#10;Looking forward to seeing you!"
                            required
                            className="w-full rounded-lg border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary text-sm border p-3 leading-relaxed font-sans"
                        />
                    </div>

                    {/* Call to Action Button Text */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-stone-800 mb-1">
                                CTA Button Label
                            </label>
                            <input
                                type="text"
                                name="cta_text"
                                value={formData.cta_text}
                                onChange={handleChange}
                                placeholder="Chat with Nancy on WhatsApp"
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary text-sm border p-2.5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-stone-800 mb-1">
                                Queue Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-lg border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary text-sm border p-2.5 bg-white"
                            >
                                <option value="draft">Draft (Private / Work in progress)</option>
                                <option value="queued">Queued (Ready for scheduling / broadcast)</option>
                                {newsletter?.status === 'sent' && <option value="sent">Sent</option>}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-semibold text-stone-800">
                                CTA Button Target URL <span className="text-stone-400 font-normal">(optional override)</span>
                            </label>
                            <span className="text-[11px] text-teal-700 font-medium">Leave blank for smart auto-detect</span>
                        </div>
                        <input
                            type="url"
                            name="cta_url"
                            value={formData.cta_url}
                            onChange={handleChange}
                            placeholder="Auto: WhatsApp on mobile, Concierge on desktop"
                            className="w-full rounded-lg border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary text-xs border p-2.5 font-mono"
                        />
                        <p className="text-[11px] text-stone-400 mt-1">
                            Optional: enter a custom direct URL like <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-600">https://wa.me/15512414652</code> or a booking link.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
                        <Button type="submit" disabled={loading || uploadingImage}>
                            {loading ? 'Saving...' : (newsletter ? 'Update Newsletter' : 'Save Newsletter')}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Right Column: Live Smartphone Preview */}
            <div className="lg:col-span-5 bg-stone-100 p-6 rounded-2xl border border-stone-200 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-stone-500">
                    <DevicePhoneMobileIcon className="w-4 h-4" /> Live 5-Second Scan Preview
                </div>

                {/* iPhone Frame Mockup */}
                <div className="w-full max-w-[320px] bg-white rounded-3xl shadow-xl border-4 border-stone-800 overflow-hidden text-stone-900 text-xs">
                    {/* Top Notch Bar */}
                    <div className="bg-stone-800 py-1.5 px-4 text-white flex justify-between text-[10px] items-center">
                        <span>9:41</span>
                        <div className="w-16 h-3 bg-stone-950 rounded-full"></div>
                        <span>100%</span>
                    </div>

                    {/* Email Content Preview */}
                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        <div className="text-center pb-2 border-b border-stone-100 flex flex-col items-center">
                            <img
                                src="/logo.jpg"
                                alt="Sothis Logo"
                                className="w-9 h-9 rounded-full object-cover border border-teal-600 shadow-sm mb-1"
                            />
                            <div className="font-serif font-bold text-[12px] uppercase tracking-widest text-stone-900 leading-none">
                                SOTHIS
                            </div>
                            <div className="text-[7.5px] font-bold uppercase tracking-widest text-teal-600 mt-0.5">
                                THERAPEUTIC MASSAGE
                            </div>
                        </div>

                        {/* Title & Preview */}
                        <div>
                            <div className="font-serif font-bold text-stone-900 text-sm leading-snug">
                                {formData.title || 'Your Subject Headline Appears Here'}
                            </div>
                            {formData.preview_text && (
                                <div className="text-stone-500 text-[10px] mt-0.5">
                                    {formData.preview_text}
                                </div>
                            )}
                        </div>

                        {/* Image */}
                        {formData.image_url ? (
                            <img
                                src={formData.image_url}
                                alt=""
                                className="w-full h-28 object-cover rounded-lg border border-stone-100"
                            />
                        ) : (
                            <div className="w-full h-16 bg-stone-50 rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-400 text-[10px]">
                                <PhotoIcon className="w-4 h-4 mr-1" /> Optional Hero Banner
                            </div>
                        )}

                        {/* Body Snippet */}
                        <div className="text-stone-700 text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-6">
                            {formData.body || 'Write your short, scannable advice here...'}
                        </div>

                        {/* CTA Button Preview */}
                        <div className="pt-2 text-center">
                            <div className="w-full py-2 px-3 bg-[#25D366] text-white font-bold rounded-full text-[11px] shadow-sm flex items-center justify-center gap-1">
                                💬 {formData.cta_text || 'Chat with Nancy on WhatsApp'}
                            </div>
                            <div className="text-[9px] text-stone-400 mt-1">
                                Opens WhatsApp on mobile / Concierge on desktop
                            </div>
                        </div>

                        {/* Signature Preview */}
                        <div className="pt-2 border-t border-stone-100 text-[9px] text-stone-500">
                            <div><strong>Nancy Raza, LMT</strong></div>
                            <div className="text-stone-400">Sothis Therapeutic Massage</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
