'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';

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

    const [imageUrl, setImageUrl] = useState(formData.image_url);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Auto-translate Spanish fields (mock)
    const handleAutoTranslate = (field: 'title' | 'desc' | 'price' | 'duration') => {
        // In a real app, call an API. Here we just copy or append [ES] for demo
        // Ideally we would integrate Gemini here!
        if (field === 'title') setFormData(prev => ({ ...prev, title_es: prev.title_en }));
        if (field === 'desc') setFormData(prev => ({ ...prev, desc_es: prev.desc_en + ' (Traducido)' }));
        // ...
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setLoading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload
            const { error: uploadError } = await supabase.storage
                .from('service-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get URL
            const { data } = supabase.storage
                .from('service-images')
                .getPublicUrl(filePath);

            setImageUrl(data.publicUrl);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            alert('Error uploading image');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            image_url: formData.image_url,
            title: { en: formData.title_en, es: formData.title_es },
            description: { en: formData.desc_en, es: formData.desc_es },
            price: { en: formData.price_en, es: formData.price_es },
            duration: { en: formData.duration_en, es: formData.duration_es },
        };

        try {
            if (service?.id) {
                // Update
                const res = await fetch(`/api/services/${service.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Failed to update');
            } else {
                // Create
                const res = await fetch('/api/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Failed to create');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to save service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Title (EN)</label>
                    <input type="text" name="title_en" value={formData.title_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700">Title (ES)</label>
                    <div className="flex gap-2">
                        <input type="text" name="title_es" value={formData.title_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                        <button type="button" onClick={() => handleAutoTranslate('title')} className="text-xs text-secondary underline">Copy EN</button>
                    </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700">Description (EN)</label>
                    <textarea name="desc_en" rows={3} value={formData.desc_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700">Description (ES)</label>
                    <textarea name="desc_es" rows={3} value={formData.desc_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Price (EN)</label>
                    <input type="text" name="price_en" value={formData.price_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700">Price (ES)</label>
                    <input type="text" name="price_es" value={formData.price_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-stone-700">Duration (EN)</label>
                    <input type="text" name="duration_en" value={formData.duration_en} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700">Duration (ES)</label>
                    <input type="text" name="duration_es" value={formData.duration_es} onChange={handleChange} required className="mt-1 block w-full rounded-md border-stone-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm border p-2" />
                </div>

                {/* Image */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700">Service Image</label>
                    <div className="mt-2 flex items-center gap-4">
                        {imageUrl && <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded bg-stone-100" />}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-secondary/90" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Service'}</Button>
            </div>
        </form>
    );
}
