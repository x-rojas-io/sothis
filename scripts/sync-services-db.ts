
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function updateServices() {
    console.log('🔄 Syncing services table...');

    // 1. Deactivate Deep Tissue
    const { error: deactivateError } = await supabase
        .from('services')
        .update({ is_active: false })
        .contains('title', { en: 'Deep Tissue Massage' });
    
    if (deactivateError) console.error('Error deactivating Deep Tissue:', deactivateError);
    else console.log('✅ Deep Tissue Massage deactivated.');

    // 2. Update/Insert Athletic Recovery (Formerly Sports)
    const { data: sportsData } = await supabase
        .from('services')
        .select('*')
        .contains('title', { en: 'Sports Massage' });

    if (sportsData && sportsData.length > 0) {
        const { error: updateSportsError } = await supabase
            .from('services')
            .update({
                title: { en: 'Athletic Recovery Massage' },
                price: { en: '$135 / $200' },
                duration: { en: '60 / 90 min' },
                description: { en: 'Designed for athletes; focuses on injury prevention, post-training muscle recovery, and pre-event preparation. It helps athletes of all levels maintain peak performance and recover faster from intense physical activity.' }
            })
            .eq('id', sportsData[0].id);
        if (updateSportsError) console.error('Error updating Sports Massage:', updateSportsError);
        else console.log('✅ Sports Massage renamed to Athletic Recovery.');
    }

    // 3. Update Existing Prices
    const updates = [
        { find: 'Therapeutic Massage', price: '$120 / $180' },
        { find: 'Prenatal Massage', price: '$130 / $195' },
        { find: 'Trigger Point Therapy', price: '$120 / $180' },
    ];

    for (const up of updates) {
        const { error } = await supabase
            .from('services')
            .update({ price: { en: up.price } })
            .contains('title', { en: up.find });
        if (error) console.error(`Error updating ${up.find}:`, error);
        else console.log(`✅ Updated price for ${up.find}`);
    }

    // 4. Insert New Services
    const news = [
        {
            title: { en: 'Aromatherapy Bliss Massage' },
            description: { en: "Relaxing massage treatment that combines therapeutic massage techniques with aromatic essential oils to enhance both physical and emotional well-being. Essential oils are chosen based on your needs to promote relaxation, stress relief, improve mood, or increase energy." },
            price: { en: '$130 / $195' },
            duration: { en: '60 / 90 min' },
            is_active: true
        },
        {
            title: { en: 'Hot Stone Therapy' },
            description: { en: "Relaxing therapeutic treatment that uses smooth, heated Basalt stones placed on specific areas of the body. Stones are also used to gently massage the muscles. The heat from the stones helps warm and loosen tight muscles, allowing deeper relaxation and relief without the need of intense pressure." },
            price: { en: '$130 / $195' },
            duration: { en: '60 / 90 min' },
            is_active: true
        }
    ];

    for (const n of news) {
        const { data: existing } = await supabase
            .from('services')
            .select('*')
            .contains('title', n.title);
        
        if (existing && existing.length > 0) {
            await supabase.from('services').update(n).eq('id', existing[0].id);
            console.log(`✅ Updated new service: ${n.title.en}`);
        } else {
            await supabase.from('services').insert(n);
            console.log(`✅ Inserted new service: ${n.title.en}`);
        }
    }

    console.log('🏁 Services sync complete.');
}

updateServices();
