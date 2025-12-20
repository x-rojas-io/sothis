# Private Local RAG Tutorial: Building "Nancy" with Zero Data Egress

**Objective**: Build a secure chatbot where **no data leaves your server**.
**Use Case**: Healthcare (HIPAA), Finance, Government, or Internal Enterprise tools.

---

## 1. Theory: Why Local?
The math (Vectors, Cosine Similarity) is identical to the cloud version. The difference is **Compute Location**.
*   **Cloud**: You send text to Google; Google does the math; Google sends numbers back.
*   **Local**: Your CPU/GPU does the math.

---

## 2. Architecture (The Privacy Stack)
We replace every Cloud API with an Open Source local equivalent.

| Component | Cloud | **Local Replacement** |
| :--- | :--- | :--- |
| **LLM** | Gemini | **Ollama** (Running Llama 3 or Mistral) |
| **Embeddings** | Gemini API | **SentenceTransformers** (HuggingFace) |
| **Database** | Supabase | **Local Postgres** (Docker) |

---

## 3. Implementation Steps

### Step A: The Local Engine (Ollama)
1.  Download **Ollama** from ollama.com.
2.  Pull a model: `ollama pull llama3`.
3.  It now serves an API at `http://localhost:11434`.

### Step B: The Local Database (Docker)
Instead of Supabase, we run Postgres locally.
```bash
docker run -d \
  --name private-db \
  -e POSTGRES_PASSWORD=mysecret \
  -p 5432:5432 \
  ankane/pgvector
```
*This image (`ankane/pgvector`) comes with vector support pre-installed.*

### Step C: Local Embeddings (The tricky part)
We don't call an API. We load a model into memory using `Transformers.js` (Node) or `SentenceTransformers` (Python).

*Example (Node.js)*:
```typescript
import { pipeline } from '@xenova/transformers';

// Loads model to RAM (approx 100MB)
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function getLocalVector(text) {
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data); // Returns the vector list
}
```

### Step D: The Local Search API
1.  **Receive** user question.
2.  **Embed** locally using `getLocalVector()`.
3.  **Query** local Postgres using standard SQL libraries (`pg`, `postgres`).
4.  **Generate** using Ollama:
    ```typescript
    import ollama from 'ollama';
    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }]
    });
    ```

---

## 4. Hardware Requirements
Privacy comes at a cost: **Hardware**.
*   **RAM**: At least 16GB (32GB recommended) to hold the LLM in memory.
*   **GPU**: NVIDIA RTX card recommended for acceptable speed. Running on CPU is possible but slow (5-10 words/sec).
