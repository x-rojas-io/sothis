import fs from 'fs';
import path from 'path';

export interface InstagramPost {
    id: string;
    caption: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    permalink: string;
    thumbnail_url?: string;
    timestamp: string;
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
    const rawToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (rawToken) {
        // Strip out the CRON_SECRET if it was merged in .env.local
        let token = rawToken;
        if (token.includes('CRON_SECRET')) {
            token = token.split('CRON_SECRET')[0];
        }
        if (token.endsWith('_')) {
            token = token.substring(0, token.length - 1);
        }

        const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`;

        try {
            console.log('Fetching live Instagram posts...');
            const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
            
            if (res.ok) {
                const data = await res.json();
                if (data && data.data) {
                    return data.data as InstagramPost[];
                }
            } else {
                console.error(`Instagram API returned status ${res.status}. Falling back to static data.`);
            }
        } catch (err) {
            console.error('Failed to fetch Instagram posts dynamically:', err);
        }
    } else {
        console.warn('INSTAGRAM_ACCESS_TOKEN is missing. Using static fallback data.');
    }

    // Fallback: Read static JSON from data/instagram.json
    try {
        const filePath = path.join(process.cwd(), 'data', 'instagram.json');
        if (fs.existsSync(filePath)) {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContents) as InstagramPost[];
        }
    } catch (err) {
        console.error('Failed to read static Instagram fallback data:', err);
    }

    return [];
}
