import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';
import { getReliableEmbedding } from '@/lib/embeddings';
import { supabase } from '@/lib/supabase';
import { getServicesContext, getAvailabilityContext } from '@/lib/context-providers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Generate Reliable Embedding for search (Production-ready)
        let queryEmbedding: number[] | null = null;
        try {
            queryEmbedding = await getReliableEmbedding(message);
        } catch (e) {
            console.error('Embedding Generation Failed:', e);
        }

        // 2. Search Supabase for similar documents (RAG)
        let documents: any[] | null = null;
        
        if (queryEmbedding) {
            const { data, error } = await supabase.rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_threshold: 0.4,
                match_count: 5
            });
            if (!error) documents = data;
        }

        // 2.5 FALLBACK: Keyword Search (If vector search failed or returned nothing)
        if (!documents || documents.length === 0) {
            console.log('Falling back to keyword search...');
            const { data, error } = await supabase
                .from('documents')
                .select('content, metadata')
                .ilike('content', `%${message.substring(0, 50)}%`)
                .limit(3);
            
            if (!error) documents = data;
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

        // 5. Generate Answer (with Fallback for Reliability)
        let reply: string;
        try {
            reply = await generateChatResponse(fullContext, message);
        } catch (genError: any) {
            console.error('Generative AI Fallback Triggered:', genError.message);
            // Fallback: Provide a structured response based on the retrieved context
            reply = "I'm currently experiencing high demand, but I've found some information that might help you:\n\n" + 
                    (ragContext || "Please contact us directly at sothistherapeutic@gmail.com for assistance.");
        }

        // 6. Component Suggestion (Future UI)
        // Detect if the user is asking about booking or availability to suggest a component
        const lowercaseMsg = message.toLowerCase();
        let uiPayload = null;

        if (lowercaseMsg.includes('book') || lowercaseMsg.includes('appt') || lowercaseMsg.includes('available')) {
            uiPayload = {
                type: 'appointment-slots',
                data: availabilityCtx.split('\n').filter(line => line.includes('at')) // Simplistic extraction
            };
        }

        return NextResponse.json({ 
            reply, 
            ui: uiPayload 
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
