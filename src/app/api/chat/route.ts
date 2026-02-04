import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding, generateChatResponse } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { getServicesContext, getAvailabilityContext } from '@/lib/context-providers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Generate Embedding for the query
        const queryEmbedding = await getEmbedding(message);

        // 2. Search Supabase for similar documents (RAG)
        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.4,
            match_count: 5
        });

        if (error) {
            console.error('Supabase search error:', error);
            // Non-blocking error, we proceed with other contexts
        }

        // 3. Fetch Real-time Contexts Parallelly
        const [servicesCtx, availabilityCtx] = await Promise.all([
            getServicesContext(),
            getAvailabilityContext()
        ]);

        // 4. Construct Full Context
        const ragContext = documents
            ?.map((doc: any) => doc.content)
            .join('\n\n') || '';

        const fullContext = `
REAL-TIME AVAILABILITY:
${availabilityCtx}

CURRENT SERVICES & PRICES:
${servicesCtx}

GENERAL KNOWLEDGE BASE:
${ragContext}
        `.trim();

        // 5. Generate Answer
        const reply = await generateChatResponse(fullContext, message);

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
