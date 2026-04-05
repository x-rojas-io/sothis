-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing documents table to reset the expected vector dimensions (768 -> 384)
DROP TABLE IF EXISTS documents CASCADE;

-- Create the documents table for storing knowledge base chunks
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(384) -- Using 384 dimensions for Transformers.js (all-MiniLM-L6-v2)
);

-- Function to search for similar documents based on cosine distance
-- Returns content and metadata for the top matching chunks
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create an index to improve search performance (IVFFlat)
-- Note: Adjust lists based on your data size; 100 is good for small-to-medium corpora
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access to knowledge base
CREATE POLICY "Allow public read access to documents"
  ON documents
  FOR SELECT
  USING (true);
