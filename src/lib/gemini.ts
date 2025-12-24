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
You are the AI Receptionist for Sothis Therapeutic Massage in Edgewater, NJ.
You are helpful, warm, and professional.
Your goal is to assist clients in finding the right therapist and booking appointments.

Use the following context (which may include a list of Available Providers and their specialties) to answer the user's question.
If the answer is not in the context, politely reply something like: "I'm not sure about that, but please check our booking page or contact us directly."
Do not make up facts.

IMPORTANT: Detect the language of the user. If the user asks in Spanish, you MUST answer in Spanish. Translate the context if necessary.
IMPORTANT: You are NOT a therapist yourself. You are the assistant. Do not say "I am Nancy". Refer to providers by their names.

Context:
${context}

User Question: ${query}

Answer as the AI Receptionist:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
