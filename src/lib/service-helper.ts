import { Service } from './supabase';

export interface ServiceVariant {
    duration: number;      // e.g. 60
    durationStr: string;   // e.g. "60 min"
    price: number;         // e.g. 130
    priceStr: string;      // e.g. "$130"
}

/**
 * Parses the price and duration JSONB fields of a Service into an array of variants.
 * Handles single values as well as "/" delimited variations (e.g. "$130 / $195").
 */
export function parseServiceVariants(service: Service | null | undefined): ServiceVariant[] {
    if (!service) return [];

    const priceStr = service.price?.en || '';
    const durationStr = service.duration?.en || '';

    const priceParts = priceStr.split('/').map(p => p.trim()).filter(Boolean);
    const durationParts = durationStr.split('/').map(d => d.trim()).filter(Boolean);

    const variants: ServiceVariant[] = [];
    const maxLen = Math.max(priceParts.length, durationParts.length);

    for (let i = 0; i < maxLen; i++) {
        const rawPrice = priceParts[i] || priceParts[priceParts.length - 1] || '';
        const rawDuration = durationParts[i] || durationParts[durationParts.length - 1] || '';

        // Extract numeric price (e.g., "$130" -> 130)
        const numericPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

        // Extract numeric duration (e.g., "60 min" -> 60)
        const numericDuration = parseInt(rawDuration.replace(/[^0-9]/g, ''), 10) || 0;

        // Formulate clean display strings
        const cleanPriceStr = rawPrice.startsWith('$') ? rawPrice : `$${rawPrice}`;
        const cleanDurationStr = rawDuration.toLowerCase().includes('min') ? rawDuration : `${rawDuration} min`;

        variants.push({
            duration: numericDuration,
            durationStr: cleanDurationStr,
            price: numericPrice,
            priceStr: cleanPriceStr,
        });
    }

    return variants;
}
