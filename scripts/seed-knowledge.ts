
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.GEMINI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env variables');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getEmbedding(text: string) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

async function seed() {
    console.log('🌱 Starting knowledge seeding...');

    // 0. Cleanup old knowledge
    console.log('🧹 Clearing old knowledge base...');
    const { error: deleteError } = await supabase.from('documents').delete().neq('id', 0);
    if (deleteError) console.error('Error clearing old documents:', deleteError);


    // 1. Read Messages for structured content
    const messagesPath = path.join(__dirname, '../messages/en.json');
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

    const chunks = [];

    // General Identity
    chunks.push({
        content: "I am Nancy, a Licensed Massage Therapist (LMT) and the owner of SOTHIS in Edgewater, NJ. I specialize in Therapeutic Massage, Deep Tissue, and Sports Massage. My goal is to help you heal and relax.",
        metadata: { topic: "identity" }
    });

    // Services
    Object.entries(messages.ServicesPage.items).forEach(([key, service]: [string, any]) => {
        const text = `Service: ${service.title}. 
        Description: ${service.description}
        Duration: ${service.duration}
        Price: ${service.price}`;

        chunks.push({
            content: text,
            metadata: { topic: "service", service: key }
        });
    });

    // General Benefits
    const benefits = Object.values(messages.ServicesPage.benefits.items).join(" ");
    chunks.push({
        content: `Benefits of massage at Sothis include: ${benefits}`,
        metadata: { topic: "benefits" }
    });

    // 3. Read from Custom Knowledge File (knowledge.md)
    try {
        const knowledgePath = path.join(__dirname, '../content/knowledge.md');
        if (fs.existsSync(knowledgePath)) {
            const knowledgeContent = fs.readFileSync(knowledgePath, 'utf8');
            // Simple chunking by headers
            const sections = knowledgeContent.split(/^## /m).filter(s => s.trim().length > 0);

            sections.forEach(section => {
                const [title, ...body] = section.split('\n');
                const content = body.join('\n').trim();
                // Skip if content is just a placeholder or empty
                if (content && !content.includes("[Add")) {
                    chunks.push({
                        content: `${title.trim()}: ${content}`,
                        metadata: { topic: "custom_knowledge", title: title.trim() }
                    });
                }
            });
            console.log(`📚 Loaded ${sections.length} sections from knowledge.md`);
        }
    } catch (e) {
        console.error('Error reading knowledge.md', e);
    }


    // 4. Process and Insert
    console.log(`Found ${chunks.length} chunks to embed.`);

    for (const chunk of chunks) {
        try {
            const embedding = await getEmbedding(chunk.content);

            const { error } = await supabase.from('documents').insert({
                content: chunk.content,
                metadata: chunk.metadata,
                embedding
            });

            if (error) console.error('Error inserting chunk:', error);
            else console.log(`✅ Indexed: ${chunk.content.substring(0, 50)}...`);

        } catch (e) {
            console.error('Error processing chunk:', e);
        }

        // Rate limit kindness
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('Done!');
}

seed();
