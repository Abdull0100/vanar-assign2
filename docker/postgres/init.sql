-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a function to calculate cosine similarity
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS float8 AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create an index function for better performance
CREATE OR REPLACE FUNCTION vector_cosine_ops(vector)
RETURNS vector AS $$
BEGIN
    RETURN $1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
