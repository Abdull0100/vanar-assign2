# Chat System with RAG and pgvector

This enhanced chat system now includes document upload, processing, and Retrieval-Augmented Generation (RAG) capabilities using pgvector for efficient vector similarity search.

## Features

- **Document Upload & Processing**: Upload PDF, DOCX, and TXT files
- **RAG Integration**: AI responses are enhanced with relevant document context
- **Vector Search**: Fast similarity search using pgvector
- **Citation System**: Source citations in AI responses
- **FastAPI Backend**: Dedicated embeddings service
- **Docker Integration**: Complete containerized setup

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SvelteKit     │    │   FastAPI       │    │   PostgreSQL    │
│   Frontend      │◄──►│ Embeddings API  │◄──►│   + pgvector    │
│                 │    │                 │    │                 │
│ - Chat UI       │    │ - OpenAI API    │    │ - Documents     │
│ - File Upload   │    │ - Vector Search │    │ - Chunks        │
│ - Citations     │    │ - Batch Embed   │    │ - Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Environment Setup

Create environment files:

**Main application:**

```bash
# .env (create this file)
OPENAI_API_KEY=your_openai_api_key_here
```

**Embeddings API:**

```bash
# embeddings-api/.env (create this file)
OPENAI_API_KEY=your_openai_api_key_here
DB_HOST=db
DB_PORT=5432
DB_NAME=local
DB_USER=postgres
DB_PASSWORD=123
```

### 2. Start Services

```bash
# Start all services (database + embeddings API)
npm run services:start

# In another terminal, start the SvelteKit app
npm run dev
```

### 3. Alternative Manual Setup

If you prefer to run services individually:

```bash
# Terminal 1: Start database
npm run db:start

# Terminal 2: Install and start embeddings API
npm run embeddings:install
npm run embeddings:dev

# Terminal 3: Start SvelteKit app
npm run dev
```

### 4. Database Migration

```bash
# Generate and apply migrations
npm run db:generate
npm run db:migrate
```

## API Endpoints

### SvelteKit API (Port 5173)

- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - List user documents
- `DELETE /api/documents/[id]` - Delete documents
- `GET /api/chat/[messageId]/citations` - Get message citations

### FastAPI Embeddings API (Port 8000)

- `POST /embed` - Single text embedding
- `POST /embed/batch` - Batch text embeddings
- `POST /search` - Vector similarity search
- `GET /health` - Health check

## Usage

1. **Upload Documents**: Click the "Documents" button in the chat header
2. **Ask Questions**: Chat with your documents - the AI will automatically use relevant context
3. **View Citations**: See source documents cited in AI responses
4. **Manage Documents**: View, organize, and delete uploaded files

## File Support

- **PDF**: Full text extraction
- **DOCX**: Microsoft Word document support
- **TXT**: Plain text and Markdown files
- **Size Limit**: 10MB per file

## Vector Search Features

- **pgvector Integration**: Efficient vector similarity using PostgreSQL extension
- **Cosine Similarity**: Industry-standard similarity metric
- **Batch Processing**: Optimized embedding generation for multiple chunks
- **Threshold Filtering**: Configurable similarity thresholds
- **User Isolation**: Documents and embeddings are user-specific

## Development

### Adding New Document Types

1. Extend `DocumentProcessor.extractText()` method
2. Update file type validation in upload endpoint
3. Add appropriate MIME type detection

### Customizing Embeddings

1. Modify `embeddings-api/main.py` for different embedding models
2. Update vector dimensions in database schema
3. Adjust similarity thresholds in RAG service

### Monitoring

- **Health Checks**: Both APIs include health endpoints
- **Logging**: Comprehensive logging for debugging
- **Fallbacks**: Graceful degradation when services are unavailable

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running on port 5432
2. **OpenAI API Key**: Verify your API key is valid and has sufficient credits
3. **Port Conflicts**: Make sure ports 5432, 8000, and 5173 are available
4. **pgvector Extension**: Database automatically enables pgvector extension

### Logs

```bash
# View database logs
docker compose logs db

# View embeddings API logs
docker compose logs embeddings-api

# View SvelteKit logs (from npm run dev)
```

## Production Deployment

For production deployment:

1. **Environment Variables**: Use proper secret management
2. **Database**: Use managed PostgreSQL with pgvector
3. **Scaling**: Consider horizontal scaling for embeddings API
4. **Caching**: Add Redis for frequently accessed embeddings
5. **Monitoring**: Implement proper logging and metrics

## License

This project is licensed under the MIT License.
