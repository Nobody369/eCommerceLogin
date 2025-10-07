# PDF Document Search with PostgreSQL FTS

This project includes PDF document search functionality using PostgreSQL's built-in Full Text Search (FTS) capabilities. No external extensions required!

## Features

- **PDF Text Extraction**: Automatically extracts text content from PDF files
- **Full Text Search**: Search documents using PostgreSQL's built-in FTS
- **Keyword Matching**: Find documents containing specific keywords
- **Relevance Ranking**: Results ranked by PostgreSQL's ts_rank algorithm
- **File Upload**: Upload and process new PDF documents
- **Document Management**: View, search, and delete documents
- **100% Built-in**: Uses only PostgreSQL's native features

## Setup Instructions

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set up PostgreSQL

Make sure your PostgreSQL database is running. No special extensions needed!

```sql
-- FTS is built into PostgreSQL, no extensions required
```

### 3. Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

**No API keys required!** The system uses only PostgreSQL's built-in features.

### 4. Database Migration

Run the database migration to create the documents table:

```bash
npm run db:migrate
```

### 5. Add PDF Files

Place your PDF files in the `web/public/assets/pdf/` directory.

### 6. Seed the Database

Run the seed script to process PDF files and create embeddings:

```bash
npm run db:seed
```

This will:
- Create test users
- Process all PDF files in the assets/pdf directory
- Extract text content
- Create FTS indexes for fast searching
- Store everything in the database

### 7. Start the Application

```bash
# Start the API server
cd api
npm run dev

# Start the web application (in another terminal)
cd web
npm run dev
```

## Usage

### Search Documents

1. Log in to the application
2. Navigate to the Dashboard
3. Use the search bar to enter your query
4. Results will show:
   - Document title and filename
   - Similarity score (percentage match)
   - Content preview
   - Link to view the full PDF

### Upload New Documents

Use the API endpoint to upload new PDF files:

```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@your-document.pdf"
```

### API Endpoints

- `POST /api/search` - Search documents
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload new PDF
- `DELETE /api/documents/:id` - Delete document

## How It Works

1. **PDF Processing**: When a PDF is uploaded or seeded, the system:
   - Extracts text content using `pdf-parse`
   - Generates a title from the filename
   - Creates PostgreSQL tsvector for full-text search

2. **Search Process**: When searching:
   - The search query is converted to tsquery format
   - PostgreSQL's FTS engine performs keyword matching
   - Results are ranked by relevance using ts_rank
   - Content is truncated for preview

3. **FTS Storage**: Text is stored as tsvector in PostgreSQL with GIN indexes for fast searching.

## Technical Details

- **Search Engine**: PostgreSQL Full Text Search (FTS)
- **Index Type**: GIN (Generalized Inverted Index)
- **Ranking**: ts_rank algorithm
- **Database**: PostgreSQL (any version)
- **Text Processing**: pdf-parse library for PDF text extraction
- **Search**: Native PostgreSQL FTS queries
- **Cost**: $0 - uses only built-in PostgreSQL features

## Troubleshooting

### Common Issues

1. **"No PDF files found"**: Make sure PDF files are in `web/public/assets/pdf/`
2. **"Search failed"**: Check if documents have been processed and stored
3. **"Database connection error"**: Verify PostgreSQL is running and connection string is correct

### Performance Tips

- Limit PDF file sizes (recommended: < 10MB)
- Use specific keywords for better search results
- Consider pagination for large result sets
- FTS is very fast with proper indexing

## Cost Considerations

- **$0 cost** - completely free to run
- No external dependencies
- Uses only PostgreSQL's built-in features
- Only requires server resources (CPU/RAM)
