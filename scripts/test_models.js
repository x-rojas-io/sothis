const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy to get client
    // actually, we need the model manager equivalent.
    // The Node SDK doesn't have a direct listModels on the client instance in some versions?
    // Let's rely on the error message suggestion "Call ListModels".
    // Actually, the SDK might not expose listModels directly on the main class in all versions.
    // Let's try to just fetch the model list if possible or use a known working model.

    // Alternative: Try `embedding-001` or `text-embedding-004` (maybe I made a typo?)
    console.log("Checking models...");
}

// Better approach: Just try to embed with a known fallback like 'embedding-001'
async function testEmbedding(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("Hello world");
        console.log(`Success with ${modelName}`);
    } catch (e) {
        console.log(`Failed with ${modelName}: ${e.message}`);
    }
}

async function main() {
    await testEmbedding("text-embedding-004");
    await testEmbedding("embedding-001");
    // Text embedding gecko?
    await testEmbedding("models/text-embedding-004");
}

main();
