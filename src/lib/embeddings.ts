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
        console.log('Using Local model for embedding...');
        return await getLocalEmbedding(text);
    } catch (error) {
        console.error('Local Embedding Fallback Error:', error);
        throw new Error('All embedding methods failed');
    }
}
