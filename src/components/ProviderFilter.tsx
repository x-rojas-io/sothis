'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProviderFilterProps {
    selectedProvider: string;
    onSelectProvider: (id: string) => void;
    showLabel?: boolean;
    className?: string;
}

export default function ProviderFilter({
    selectedProvider,
    onSelectProvider,
    showLabel = true,
    className = ''
}: ProviderFilterProps) {
    const [providers, setProviders] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        async function fetchProviders() {
            // Fetch directly from providers table for consistency
            const { data } = await supabase
                .from('providers')
                .select('id, name')
                .order('name');

            if (data) {
                setProviders(data);
            }
        }
        fetchProviders();
    }, []);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && <label className="text-sm font-medium text-stone-700">Filter View:</label>}
            <select
                value={selectedProvider}
                onChange={(e) => onSelectProvider(e.target.value)}
                className="block w-48 rounded-md border-0 py-1.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-600 sm:text-sm sm:leading-6"
            >
                <option value="all">All Providers</option>
                {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
        </div>
    );
}
