import { supabase } from '@/lib/supabase';
import type { Service } from '@/lib/supabase';
import { getTranslations } from 'next-intl/server';
import ClientServicesPage from './ClientServicesPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ServicesPage' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

// Fetch services on the server
async function getServices() {
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true }); // Or order by a 'sort_order' field if added later

    return services as Service[] | null;
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const services = await getServices();

    return <ClientServicesPage locale={locale} services={services || []} />;
}
