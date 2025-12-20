# Public Cloud RAG Tutorial: Building "Nancy" with Gemini & Supabase

**Objective**: Build a scalable, high-accuracy chatbot using best-in-class Cloud APIs.
**Use Case**: Public-facing websites, businesses without strict data sovereignty laws.

---

## 1. Theory: The "Brain" Mechanics
Before writing code, we must understand **Semantic Search**.

*   **Vector**: A mathematical bookmark. It represents the *meaning* of a sentence as a list of numbers (e.g., `[0.1, -0.5, 0.9...]`).
*   **Embedding**: The translation layer. We give English text to an AI model, and it gives us back a Vector.
*   **Cosine Similarity**: The search algorithm. It measures the "angle" between two vectors. A small angle means high relevance.

---

## 2. Architecture (The Cloud Stack)
*   **LLM (The Writer)**: **Google Gemini 1.5 Flash**. Fast, cheap, and smart.
*   **Embeddings (The Translator)**: **Gemini text-embedding-004**.
*   **Database (The Memory)**: **Supabase** (PostgreSQL) with `pgvector`.

---

## 3. Implementation Steps

### Step A: Database Setup
1.  Go to Supabase.com -> SQL Editor.
2.  Enable Vector Search:
    ```sql
    create extension vector;
    create table documents (
      id bigserial primary key,
      content text,
      embedding vector(768) -- Matches Gemini's output
    );
    ```
3.  Create the Search Function:
    *(See `SUPABASE_CHAT.sql` in repo for full code)*

### Step B: The Knowledge Ingestion (ETL)
We need to load our brain.
1.  **Read**: Load `knowledge.md`.
2.  **Chunk**: Split by headers (`##`).
3.  **Embed**:
    ```typescript
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const { embedding } = await model.embedContent(textChunk);
    ```
4.  **Save**: Upload `embedding.values` to Supabase.

### Step C: The Search API
When a user asks a question:
1.  **Embed** their question using the same Gemini model.
2.  **Search** Supabase using `match_documents` RPC.
3.  **Generate**:
    ```typescript
    const prompt = `Use this context: ${foundChunks}. Answer: ${userQuestion}`;
    const response = await gemini.generateContent(prompt);
    ```

---

## 4. Advanced: Multimodal Data
*   **PDFs**: Use `pdf-parse` to extract text -> Clean it -> Vectorize it.
*   **Video**: Use **Gemini 1.5 Pro** which can accept video files directly for analysis, or transcribe with OpenAI Whisper.
