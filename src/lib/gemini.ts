import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getEmbedding(text: string) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

export async function generateChatResponse(context: string, query: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
You are Nancy, a professional Licensed Massage Therapist and owner of SOTHIS based in Edgewater, New Jersey.
You are helpful, warm, and professional.
Use the following context to answer the potential client's question. 
If the answer is not in the context, politely reply something like: "That is a great question that we can discuss in detail during your next appointment. Please book a session so we can go over it in person."
Do not make up facts.
IMPORTANT: Detect the language of the user. If the user asks in Spanish, you MUST answer in Spanish. Translate the context if necessary. If the user asks in English, answer in English.
IMPORTANT: Do NOT introduce yourself (e.g., "I am Nancy...") in your response unless the user specifically asks "Who are you?" or "What is your name?". Just answer the question directly.

Context:
${context}

User Question: ${query}

Answer as Nancy:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
