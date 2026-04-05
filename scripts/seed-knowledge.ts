
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getLocalEmbedding } from '../src/lib/local-embeddings.js';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.GEMINI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env variables');
    process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Removed internal getEmbedding in favor of the shared local library

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

    // 2. Blog Posts
    try {
        const blogPath = path.join(__dirname, '../content/blog');
        if (fs.existsSync(blogPath)) {
            const files = fs.readdirSync(blogPath).filter(f => f.endsWith('.md') && !f.endsWith('.es.md'));
            files.forEach(file => {
                const content = fs.readFileSync(path.join(blogPath, file), 'utf8');
                // Simple cleanup: remove frontmatter if it exists
                const text = content.replace(/^---[\s\S]*?---/, '').trim();
                chunks.push({
                    content: `Blog Post (${file}): ${text.substring(0, 1000)}`,
                    metadata: { topic: "blog", filename: file }
                });
            });
            console.log(`📝 Loaded ${files.length} blog posts.`);
        }
    } catch (e) {
        console.error('Error reading blog posts:', e);
    }

    // 3. Reviews / Testimonials
    try {
        const reviews = [messages.HomePage.Testimonials.review1, messages.HomePage.Testimonials.review2];
        reviews.forEach((review, index) => {
            if (review) {
                chunks.push({
                    content: `Client Review: ${review}`,
                    metadata: { topic: "review", index }
                });
            }
        });
        console.log(`⭐ Loaded ${reviews.length} reviews.`);
    } catch (e) {
        console.error('Error reading reviews:', e);
    }

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
            const embedding = await getLocalEmbedding(chunk.content);

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
