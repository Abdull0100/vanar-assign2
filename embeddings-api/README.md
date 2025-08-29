# Embeddings API

FastAPI service for generating embeddings and performing vector similarity search using OpenAI and pgvector.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export OPENAI_API_KEY=your_openai_api_key_here
export DB_HOST=db
export DB_PORT=5432
export DB_NAME=local
export DB_USER=postgres
export DB_PASSWORD=123
```

3. Run the service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### POST /embed
Generate embedding for a single text.

**Request:**
```json
{
  "text": "Your text here",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "embedding": [0.1, 0.2, ...],
  "dimensions": 1536
}
```

### POST /embed/batch
Generate embeddings for multiple texts.

**Request:**
```json
{
  "texts": ["Text 1", "Text 2", "Text 3"],
  "user_id": "user123"
}
```

**Response:**
```json
{
  "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...], [0.5, 0.6, ...]],
  "dimensions": 1536
}
```

### POST /search
Search for similar vectors using cosine similarity.

**Request:**
```json
{
  "query_embedding": [0.1, 0.2, ...],
  "user_id": "user123",
  "limit": 10,
  "threshold": 0.7
}
```

**Response:**
```json
{
  "results": [
    {
      "chunk_id": "chunk123",
      "content": "Similar content...",
      "similarity": 0.85,
      "document_id": "doc123",
      "metadata": {...}
    }
  ],
  "total_found": 1
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "openai": "initialized"
}
```

## Features

- OpenAI text-embedding-3-small integration
- pgvector for efficient vector similarity search
- Batch embedding generation
- Fallback error handling
- Health monitoring
- CORS support
