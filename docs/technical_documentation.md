# Technical Documentation: "Chat with Nancy" AI Feature

This document outlines the technical implementation of the AI chatbot "Nancy" for the Sothis website.

## 1. Architecture Overview
We implemented a **Retrieval Augmented Generation (RAG)** system to ensure the AI answers accurately based on specific business data (services, prices, policies) rather than hallucinating.

*   **LLM Provider**: Google Gemini API (`gemini-flash-latest`) for both text generation and embeddings (`text-embedding-004`).
*   **Vector Database**: Supabase (PostgreSQL) with `pgvector` extension.
*   **Framework**: Next.js (App Router).

## 2. Database Setup (Supabase)
We enabled vector search capabilities in the existing Supabase project.

*   **Extension**: Enabled `vector` extension.
*   **Table**: Created a `documents` table to store knowledge chunks.
    *   `id`: Primary Key
    *   `content`: The actual text (FAQ answer, service description).
    *   `metadata`: JSONB (source, title, etc.).
    *   `embedding`: `vector(768)` to match Gemini's embedding dimension.
*   **Function**: Created a PostgreSQL function `match_documents` to perform similarity search (cosine similarity) between the user's query embedding and stored document embeddings.

## 3. Knowledge Base & ETL Pipeline
We created a flexible system for managing the chatbot's knowledge without touching code.

*   **Source of Truth**: `content/knowledge.md`. This Markdown file contains all FAQs, policies, and business identities.
    *   *Structure*: Headers (`##`) define topics, which allows for cleaner chunking.
*   **Seeding Script**: `scripts/seed-knowledge.ts`.
    *   **Parsing**: Reads `knowledge.md` and `messages/en.json` (services data).
    *   **Chunking**: Splits the text into logical segments (e.g., one FAQ = one chunk).
    *   **Embedding**: Sends each chunk to Gemini (`text-embedding-004`) to convert text into a vector.
    *   **Storage**: Wipes the `documents` table and inserts the new vectors + content.
    *   *Usage*: Run `npx tsx scripts/seed-knowledge.ts` to apply updates.

## 4. Backend API (`/api/chat`)
The server-side route processes user messages.

1.  **Input**: Receives `{ message: string }` from frontend.
2.  **Vectorization**: Converts user message to an embedding.
3.  **Retrieval**: Calls `supabase.rpc('match_documents')` to find the 5 most relevant chunks from the database.
4.  **Context Construction**: Joins the retrieved chunks into a single text block.
5.  **Generation**: Sends a system prompt + Context + User Question to Gemini.
    *   *System Prompt*: Defines Nancy's persona (Edgewater, NJ), formatting rules, and **bilingual logic** (detects English/Spanish).

## 5. Frontend UI (`ChatWidget.tsx`)
A self-contained React component.

*   **State Management**: Handles open/closed state, message history, loading states, and the "CTA Bubble" visibility.
*   **UI Elements**:
    *   **Floating Avatar Bubble**: A minimal entry point (Nancy's face) that appears after 3 seconds.
    *   **Chat Window**: Fixed position panel with scrollable history.
    *   **Refresh Button**: Allows users to clear history and restart the conversation.
    *   **Typing Indicator**: Simple pulse animation during API calls.
*   **Styling**: Tailwind CSS for responsive, glass-like aesthetics.

## 6. Key Features
*   **Bilingual**: Automatically detects and speaks Spanish if addressed in Spanish.
*   **No Hallucinations**: Strictly restricted to the provided context via system prompt instructions.
*   **Avatar Integration**: Uses a "circular crop" CSS technique to display the therapist's photo.
