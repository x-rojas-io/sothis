import { getLocalEmbedding } from './local-embeddings';
import { getEmbedding as getGeminiEmbedding } from './gemini';

/**
 * Reliable Embedding Dispatcher
 * 
 * In Production: Prioritizes Gemini for speed and Vercel compatibility.
 * In Local/Fallback: Uses the local model or keyword search.
 */
export async function getReliableEmbedding(text: string): Promise<number[]> {
    // 1. Try Gemini (Primary for Production)
    try {
        if (process.env.GEMINI_API_KEY) {
            console.log('Using Gemini for embedding...');
            return await getGeminiEmbedding(text);
        }
    } catch (error) {
        console.error('Gemini Embedding Error:', error);
    }

    // 2. Try Local Embedding (Secondary Fallback)
    try {
        console.log('Attempting Local model embedding...');
        const localEmbedding = await getLocalEmbedding(text);
        if (localEmbedding) return localEmbedding;
    } catch (error) {
        console.error('Local Embedding Fallback Error:', error);
    }

    // 3. Final Fallback: Return empty or throw handled
    console.warn('All embedding methods failed. Falling back to keyword search.');
    return []; // Return empty so the route can trigger keyword search
}
