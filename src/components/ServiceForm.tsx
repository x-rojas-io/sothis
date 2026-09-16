'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';

interface ServiceFormProps {
    service?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title_en: service?.title?.en || '',
        title_es: service?.title?.es || '',
        desc_en: service?.description?.en || '',
        desc_es: service?.description?.es || '',
        price_en: service?.price?.en || '',
        price_es: service?.price?.es || '',
        duration_en: service?.duration?.en || '60 / 90 min',
        duration_es: service?.duration?.es || '60 / 90 min',
        image_url: service?.image_url || '',
    });

    const [uploadingImage, setUploadingImage] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errorMessage) setErrorMessage(null);
    };

    // Auto-translate / copy Spanish fields
    const handleAutoTranslate = (field: 'title' | 'desc' | 'price' | 'duration') => {
        if (field === 'title') setFormData(prev => ({ ...prev, title_es: prev.title_en }));
        if (field === 'desc') setFormData(prev => ({ ...prev, desc_es: prev.desc_en }));
        if (field === 'price') setFormData(prev => ({ ...prev, price_es: prev.price_en }));
        if (field === 'duration') setFormData(prev => ({ ...prev, duration_es: prev.duration_en }));
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

            if (!res.ok) {
                throw new Error(result.error || 'Failed to upload image');
            }

            setFormData(prev => ({ ...prev, image_url: result.url }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setErrorMessage(error?.message || 'Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!formData.title_en) {
            setErrorMessage('Please provide an English title.');
            return;
        }

        setLoading(true);

        const payload = {
            image_url: formData.image_url || '/images/services/sothis-therapeutic-massage.jpg',
            title: { 
                en: formData.title_en, 
                es: formData.title_es || formData.title_en 
            },
            description: { 
                en: formData.desc_en, 
                es: formData.desc_es || formData.desc_en 
            },
            price: { 
                en: formData.price_en, 
                es: formData.price_es || formData.price_en 
            },
            duration: { 
                en: formData.duration_en, 
                es: formData.duration_es || formData.duration_en 
            },
        };

        try {
            if (service?.id) {
                // Update
                const res = await fetch(`/api/services/${service.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to update service');
            } else {
                // Create
                const res = await fetch('/api/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to create service');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Save service error:', error);
            setErrorMessage(error?.message || 'Failed to save service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Title (EN)</label>
                    <input type="text" name="title_en" value={formData.title_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-stone-700">Title (ES)</label>
                        <button type="button" onClick={() => handleAutoTranslate('title')} className="text-xs text-secondary hover:underline">Copy EN</button>
                    </div>
                    <input type="text" name="title_es" value={formData.title_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700">Description (EN)</label>
                    <textarea name="desc_en" rows={3} value={formData.desc_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-stone-700">Description (ES)</label>
                        <button type="button" onClick={() => handleAutoTranslate('desc')} className="text-xs text-secondary hover:underline">Copy EN</button>
                    </div>
                    <textarea name="desc_es" rows={3} value={formData.desc_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Price (EN) <span className="text-xs text-stone-400">(e.g. $50 or $120 / $180)</span></label>
                    <input type="text" name="price_en" value={formData.price_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-stone-700">Price (ES)</label>
                        <button type="button" onClick={() => handleAutoTranslate('price')} className="text-xs text-secondary hover:underline">Copy EN</button>
                    </div>
                    <input type="text" name="price_es" value={formData.price_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Duration (EN) <span className="text-xs text-stone-400">(e.g. 30 min or 60 / 90 min)</span></label>
                    <input type="text" name="duration_en" value={formData.duration_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-stone-700">Duration (ES)</label>
                        <button type="button" onClick={() => handleAutoTranslate('duration')} className="text-xs text-secondary hover:underline">Copy EN</button>
                    </div>
                    <input type="text" name="duration_es" value={formData.duration_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Image */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700">Service Image</label>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                        {formData.image_url ? (
                            <div className="relative group">
                                <img src={formData.image_url} alt="Service Preview" className="h-24 w-24 object-cover rounded-lg border border-stone-200 shadow-sm" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs shadow hover:bg-red-700"
                                    title="Remove Image"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : null}
                        <div className="flex-1 min-w-[200px]">
                            <input 
                                type="file" 
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" 
                                onChange={handleImageUpload} 
                                disabled={uploadingImage}
                                className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-secondary/90 disabled:opacity-50" 
                            />
                            {uploadingImage && <p className="text-xs text-secondary mt-1 font-medium animate-pulse">Uploading image to cloud storage...</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={loading || uploadingImage}>{loading ? 'Saving...' : 'Save Service'}</Button>
            </div>
        </form>
    );
}
