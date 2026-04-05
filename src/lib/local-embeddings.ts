/**
 * Local Embedding Utility for RAG (Singleton Pattern for Vercel)
 * 
 * Uses Dynamic Imports to avoid Vercel crashing on native 'onnxruntime-node' 
 * dependencies that aren't available in serverless environments.
 */
class EmbeddingPipeline {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance() {
        if (this.instance === null) {
            try {
                // Dynamically load to prevent top-level crashes
                const { pipeline, env } = await import('@xenova/transformers');
                
                // Force WASM backend
                (env.backends.onnx as any).wasm.numThreads = 1;
                (env.backends.onnx as any).wasm.simd = false;
                (env.backends.onnx as any).wasm.proxy = false;
                env.allowLocalModels = false;

                this.instance = await pipeline(this.task as any, this.model);
            } catch (error) {
                console.error('CRITICAL: Transformers.js failed to load (likely missing native libs on Vercel):', error);
                return null;
            }
        }
        return this.instance;
    }
}

export async function getLocalEmbedding(text: string): Promise<number[] | null> {
    try {
        const extractor = await EmbeddingPipeline.getInstance();
        if (!extractor) return null; // Gracefully handle the load failure
        
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    } catch (error) {
        console.error('Local Embedding Error:', error);
        return null; // Return null instead of throwing to prevent 500s
    }
}
