
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

if (!process.env.GEMINI_API_KEY) {
    console.error('No API KEY');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
    try {
        // There isn't a direct listModels on genAI instance in the node SDK generally exposed easily in one line, 
        // but often it's done via a model manager or just trying standard ones.
        // Actually, looking at reference, it might not be exposed in the high level GoogleGenerativeAI class easily.
        // But the error message said "Call ListModels".
        // Let's try to just hit the REST API to be sure.

        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error(e);
    }
}

list();
