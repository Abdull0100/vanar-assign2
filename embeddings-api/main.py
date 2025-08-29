from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import google.generativeai as genai
import os
import asyncio
from contextlib import asynccontextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "local"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "123")
    )

# Gemini client
gemini_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global gemini_client
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        logger.warning("GEMINI_API_KEY not set. Embeddings will not work.")
    else:
        genai.configure(api_key=gemini_api_key)
        gemini_client = genai
        logger.info("Gemini client initialized")

    yield

    # Shutdown
    # Gemini client doesn't need explicit cleanup

app = FastAPI(title="Embeddings API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class EmbedRequest(BaseModel):
    text: str = Field(..., description="Text to embed")
    user_id: str = Field(..., description="User ID for the embedding")

class BatchEmbedRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to embed")
    user_id: str = Field(..., description="User ID for the embeddings")

class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int

class BatchEmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int

class SimilarityRequest(BaseModel):
    query_embedding: List[float] = Field(..., description="Query embedding vector")
    user_id: str = Field(..., description="User ID to filter results")
    limit: int = Field(10, description="Maximum number of results")
    threshold: float = Field(0.7, description="Similarity threshold (0-1)")

class SimilarityResult(BaseModel):
    chunk_id: str
    content: str
    similarity: float
    document_id: str
    metadata: Optional[Dict[str, Any]] = None

class SimilarityResponse(BaseModel):
    results: List[SimilarityResult]
    total_found: int

async def get_gemini_embedding(text: str, model: str = "models/embedding-001") -> List[float]:
    """Get embedding from Gemini"""
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized")

    try:
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.post("/embed", response_model=EmbedResponse)
async def create_embedding(request: EmbedRequest):
    """Create embedding for a single text"""
    try:
        embedding = await get_gemini_embedding(request.text)
        return EmbedResponse(embedding=embedding, dimensions=len(embedding))
    except Exception as e:
        logger.error(f"Error creating embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed/batch", response_model=BatchEmbedResponse)
async def create_batch_embeddings(request: BatchEmbedRequest):
    """Create embeddings for multiple texts"""
    try:
        # Gemini allows batch embedding
        tasks = [get_gemini_embedding(text) for text in request.texts]
        embeddings = await asyncio.gather(*tasks)

        return BatchEmbedResponse(
            embeddings=embeddings,
            dimensions=len(embeddings[0]) if embeddings else 0
        )
    except Exception as e:
        logger.error(f"Error creating batch embeddings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SimilarityResponse)
async def vector_search(request: SimilarityRequest):
    """Search for similar vectors using cosine similarity"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Convert embedding to PostgreSQL vector format
        embedding_str = "[" + ",".join(map(str, request.query_embedding)) + "]"

        # Query for similar chunks using pgvector with optimized operators
        query = """
        SELECT
            "id",
            "content",
            1 - (embedding <=> %s::vector) as similarity,
            "documentId",
            "metadata"
        FROM "documentChunks"
        WHERE "userId" = %s
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> %s::vector) >= %s
        ORDER BY embedding <=> %s::vector
        LIMIT %s
        """

        cursor.execute(query, (
            embedding_str,
            request.user_id,
            embedding_str,
            request.threshold,
            embedding_str,
            request.limit
        ))

        results = cursor.fetchall()

        # Convert results to response format
        similarity_results = []
        for row in results:
            similarity_results.append(SimilarityResult(
                chunk_id=row['id'],
                content=row['content'],
                similarity=float(row['similarity']),
                document_id=row['documentId'],
                metadata=row['metadata'] if row['metadata'] else None
            ))

        cursor.close()
        conn.close()

        return SimilarityResponse(
            results=similarity_results,
            total_found=len(similarity_results)
        )

    except Exception as e:
        logger.error(f"Error in vector search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()

        return {
            "status": "healthy",
            "database": "connected",
            "gemini": "initialized" if gemini_client else "not_initialized"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
