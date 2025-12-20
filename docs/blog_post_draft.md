# How We Built "Nancy": A Context-Aware AI for Small Business

In an era of generic chatbots, small businesses need AI that understands *their* specific reality—their hours, their policies, and their voice.

For **Sothis Therapeutic Massage**, we didn't just want a chatbot; we wanted a digital extension of the therapist herself. We successfully built "Nancy," an AI agent that:
*   Knows the entire service menu and pricing.
*   Enforces cancellation policies strictly but politely.
*   never hallucinates services we don't offer.
*   detects languages and speaks Spanish fluently when needed.

## The Secret Sauce: RAG (Retrieval Augmented Generation)

Most chatbots fail because they rely solely on their training data (which doesn't know about *your* business). We solved this using **RAG**.

Instead of training a model from scratch, we:
1.  **Written Knowledge**: Created a "Brain File" (`knowledge.md`) with all our business facts.
2.  **Vectorized It**: Converted that text into mathematical vectors using **Google Gemini**.
3.  **Stored It**: Saved those vectors in a **Supabase** database.
4.  **Retrieved It**: When a user asks a question, we find the relevant "cheat sheet" and give it to the AI to answer.

## Build It Yourself

We believe in open source and sharing knowledge. We have prepared two comprehensive guides depending on your needs.

### Option 1: The Cloud Logic (Best for Most)
If you want speed, scalability, and zero server maintenance, follow our **Public Cloud Guide**. It uses Google Gemini and Supabase to get you up and running in minutes.
👉 **[Read the Cloud Tutorial](./tutorial_public_cloud.md)**

### Option 2: The Privacy-First Logic (Best for Sensitive Data)
If you are in healthcare or finance and cannot send data to the cloud, we have designed a **Zero Data Egress** architecture using local LLMs (Ollama) and local databases.
👉 **[Read the Private Local Tutorial](./tutorial_private_local.md)**

---

*This project is open source. Feel free to fork our repository and build your own assistant.*
