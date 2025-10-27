# RAK Porcelain Customer Support Chatbot

An AI-powered customer support chatbot for RAK Porcelain US, built with Next.js 15, OpenAI, and ChromaDB.

## Features

- 🤖 **Intelligent Responses** - Powered by OpenAI GPT-4o-mini with RAG (Retrieval Augmented Generation)
- 🔍 **Website Knowledge** - Automatically crawls and indexes rakporcelain.com/us-en
- 💬 **Modern Chat UI** - Beautiful, responsive chat interface
- 📚 **Source Citations** - Shows sources for each response
- ⚡ **Fast Search** - Vector similarity search with ChromaDB
- 🎨 **Dark Mode** - Automatic dark/light mode support

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Index the website** (takes 15-30 minutes):
   ```bash
   npm run index
   ```
   
   This will:
   - Crawl the RAK Porcelain website
   - Extract and chunk content
   - Generate embeddings
   - Store in ChromaDB vector database

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify Setup

To check if everything is configured correctly:

```bash
npm run verify
```

## Usage

1. Open the application in your browser
2. Type your question in the input field
3. Press Enter or click the send button
4. The AI will respond with information from the RAK Porcelain website
5. Click on source links to view the original pages

### Example Questions

- "What products does RAK Porcelain offer?"
- "How do I care for my RAK porcelain dinnerware?"
- "What is the warranty policy?"
- "Do you offer B2B or wholesale options?"
- "What certifications do RAK products have?"
- "How can I contact customer support?"

## Project Structure

```
rakporcelinchatbotdemo/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── page.tsx                   # Main page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── components/
│   └── chat-interface.tsx         # Chat UI component
├── lib/
│   ├── chroma.ts                  # ChromaDB client & queries
│   ├── chunker.ts                 # Text chunking logic
│   ├── config.ts                  # Configuration
│   ├── openai.ts                  # OpenAI client & embeddings
│   ├── prompts.ts                 # System prompts
│   └── utils.ts                   # Utility functions
├── scripts/
│   ├── crawl-and-index.ts         # Website crawler & indexer
│   └── verify-setup.ts            # Setup verification
├── data/
│   ├── chroma/                    # Vector database (generated)
│   └── index-report.json          # Indexing report (generated)
├── .env.local                     # Environment variables (create this)
└── package.json
```

## Configuration

Edit `.env.local` to customize:

```env
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional
RAK_BASE=https://www.rakporcelain.com/us-en
CRAWL_MAX_PAGES=1200
CRAWL_CONCURRENCY=6
NODE_ENV=development
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run index` - Crawl and index the website
- `npm run verify` - Verify setup

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **AI:** OpenAI GPT-4o-mini
- **Embeddings:** OpenAI text-embedding-3-large
- **Vector DB:** ChromaDB
- **UI:** React 19, Tailwind CSS 4, Radix UI
- **Language:** TypeScript 5

## How It Works

1. **Crawling:** The script fetches pages from the RAK Porcelain sitemap
2. **Chunking:** Content is split into semantic chunks (~1000 tokens each)
3. **Embedding:** Each chunk is converted to a vector embedding
4. **Storage:** Embeddings are stored in ChromaDB with metadata
5. **Query:** User questions are embedded and matched against stored chunks
6. **Generation:** Top matches are provided as context to GPT-4o-mini
7. **Response:** AI generates accurate answers based on the context

## Troubleshooting

### "Database not initialized" error
Run `npm run index` to crawl and index the website.

### "OpenAI API key not configured" error
Make sure `.env.local` exists and contains a valid `OPENAI_API_KEY`.

### Slow responses
This is normal on first run. Subsequent queries are faster due to caching.

### No results found
The website may not contain information about your query. Try rephrasing or asking about RAK Porcelain products/services.

## Development

### Re-indexing

To update the knowledge base:

```bash
npm run index
```

This will re-crawl the website and update the vector database.

### Adding New Features

- **Custom prompts:** Edit `lib/prompts.ts`
- **UI changes:** Modify `components/chat-interface.tsx`
- **API logic:** Update `app/api/chat/route.ts`
- **Crawler settings:** Adjust `scripts/crawl-and-index.ts`

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables on your hosting platform

3. Run the indexer once in production:
   ```bash
   npm run index
   ```

4. Start the server:
   ```bash
   npm run start
   ```

### Recommended Platforms

- Vercel (recommended for Next.js)
- Railway
- Render
- Any Node.js hosting

**Note:** Make sure the `data/` directory persists between deployments for the vector database.

## License

MIT

## Support

For issues or questions, please open a GitHub issue or contact the development team.

---

Built with ❤️ using Next.js, OpenAI, and ChromaDB
