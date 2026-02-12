import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ status: 'error', message: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use the chat model for a quick ping
        const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest";
        const model = genAI.getGenerativeModel({ model: modelName });

        // Simple ping to check if model is active and key is valid
        const result = await model.generateContent("ping");
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            status: 'ok',
            model: modelName,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('AI Health Check Failed:', error);

        // If the model failed, try to list available models to help the user fix it
        let availableModels: string[] = [];
        try {
            // We can't use the SDK easily for listing in all environments, so we use fetch
            // This is a "best effort" to provide helpful debug info
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
            const listRes = await fetch(listUrl);
            if (listRes.ok) {
                const data = await listRes.json();
                availableModels = data.models
                    ?.map((m: any) => m.name)
                    .filter((name: string) => name.includes('gemini') || name.includes('embedding'));
            }
        } catch (listError) {
            console.error('Failed to list models during health check failure:', listError);
        }

        return NextResponse.json({
            status: 'error',
            message: error.message,
            available_models: availableModels.length > 0 ? availableModels : 'Could not fetch list',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

