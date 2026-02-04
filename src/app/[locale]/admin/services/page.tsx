'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/Button';
import ServiceForm from '@/components/ServiceForm';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/lib/supabase';

export default function AdminServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingService, setEditingService] = useState<Service | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    async function fetchServices() {
        setLoading(true);
        // Fetch ALL services (including inactive) for admin
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error && data) {
            setServices(data as Service[]);
        }
        setLoading(false);
    }

    const handleToggleActive = async (service: Service) => {
        const newStatus = !service.is_active;
        // Optimistic update
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: newStatus } : s));

        try {
            const res = await fetch(`/api/services/${service.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newStatus })
            });
            if (!res.ok) throw new Error('Failed');
        } catch {
            // Revert
            setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: !newStatus } : s));
            alert('Failed to update status');
        }
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setEditingService(undefined);
        setIsEditing(true);
    };

    const handleSuccess = () => {
        setIsEditing(false);
        fetchServices();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-stone-900">Manage Services</h1>
                {!isEditing && (
                    <Button onClick={handleAddNew}>+ Add New Service</Button>
                )}
            </div>

            {isEditing ? (
                <div className="bg-white p-6 rounded-lg shadow border border-stone-200">
                    <h2 className="text-xl font-bold mb-6">{editingService ? 'Edit Service' : 'New Service'}</h2>
                    <ServiceForm
                        service={editingService}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-stone-500">Loading services...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Price (EN)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-stone-200">
                                {services.map((service) => (
                                    <tr key={service.id} className={!service.is_active ? 'bg-stone-50 opacity-75' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={service.image_url} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-stone-900">{service.title['en']}</div>
                                                    <div className="text-sm text-stone-500 truncate max-w-xs">{service.description['en']}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                            {service.price['en']}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'
                                                    }`}
                                            >
                                                {service.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => handleToggleActive(service)}
                                                className={`text-${service.is_active ? 'red' : 'green'}-600 hover:opacity-75`}
                                            >
                                                {service.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                            <button onClick={() => handleEdit(service)} className="text-secondary hover:text-secondary-dark">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {services.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-stone-500">No services found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
