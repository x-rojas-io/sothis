import { NextResponse } from 'next/server';

const SOTHIS_PHONE = '15512414652';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic') || 'Newsletter Inquiry';
    const userAgent = request.headers.get('user-agent') || '';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const prefilledText = `Hi Nancy! I saw your newsletter about "${topic}" and would like to ask a question / reserve a session.`;

    if (isMobile) {
        // Deep-link directly into WhatsApp app on mobile
        const waUrl = `https://wa.me/${SOTHIS_PHONE}?text=${encodeURIComponent(prefilledText)}`;
        return NextResponse.redirect(waUrl);
    } else {
        // Redirect to Instant Concierge on laptop/desktop
        const conciergeUrl = new URL('/connect', request.url);
        conciergeUrl.searchParams.set('topic', topic);
        conciergeUrl.searchParams.set('message', prefilledText);
        return NextResponse.redirect(conciergeUrl);
    }
}
