import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding, generateChatResponse } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Generate Embedding for the query
        const queryEmbedding = await getEmbedding(message);

        // 2. Search Supabase for similar documents
        // Threshold 0.5 is a starting point, adjust if needed
        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.4,
            match_count: 5
        });

        if (error) {
            console.error('Supabase search error:', error);
            // Fallback if search fails (or table doesn't exist yet)
            return NextResponse.json({
                reply: "I'm having a little trouble accessing my memory right now. Please try again in a moment or use the contact form."
            });
        }

        // 3. Construct Context
        const context = documents
            ?.map((doc: any) => doc.content)
            .join('\n\n') || '';

        // 4. Generate Answer
        const reply = await generateChatResponse(context, message);

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
