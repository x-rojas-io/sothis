import { pipeline, env } from '@xenova/transformers';

// Optimization for Vercel: Force WASM backend to avoid 
// native Linux library dependencies (libonnxruntime.so).
(env.backends.onnx as any).wasm.numThreads = 1;
(env.backends.onnx as any).wasm.simd = false;
(env.backends.onnx as any).wasm.proxy = false;
env.allowLocalModels = false;

/**
 * Local Embedding Utility for RAG (Singleton Pattern for Vercel)
 */
class EmbeddingPipeline {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance() {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model);
        }
        return this.instance;
    }
}

/**
 * Generates a 384-dimensional embedding for the given text.
 */
export async function getLocalEmbedding(text: string): Promise<number[]> {
    try {
        const extractor = await EmbeddingPipeline.getInstance();
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error('Local Embedding Error:', error);
        throw new Error('Could not generate local embedding');
    }
}
