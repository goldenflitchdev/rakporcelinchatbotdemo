# 🗄️ PostgreSQL Database Integration

## Overview

The RAK Porcelain Chatbot now connects directly to your PostgreSQL staging database and uses **intelligent crawling** to build a comprehensive knowledge base.

---

## 🎯 Features

### **1. Database Crawling**
- ✅ Connects to RAK Porcelain PostgreSQL database (292 tables)
- ✅ Intelligently extracts products, categories, collections, blogs
- ✅ Creates vector embeddings for all content
- ✅ Stores in searchable vector database

### **2. Nightly Auto-Updates**
- ✅ Scheduled sync every night at 2:00 AM (configurable)
- ✅ Automatically fetches latest data from database
- ✅ Updates vector embeddings
- ✅ Keeps chatbot knowledge current

### **3. Intelligent Responses**
- ✅ AI understands product specifications
- ✅ Knows about categories and collections
- ✅ Aware of latest blogs and news
- ✅ Provides accurate, up-to-date information

---

## 📊 Database Schema

Your PostgreSQL database contains:

| Table Category | Count | Examples |
|----------------|-------|----------|
| **Products** | 5,556 rows | Plates, bowls, cups, etc. |
| **Categories** | 103 rows | Dinnerware, serveware, etc. |
| **Collections** | 29 rows | Classic Gourmet, Banquet, Ease |
| **Blogs** | 163 rows | News, articles, updates |
| **Sub-categories** | 1,226 rows | Detailed product classifications |
| **Product Types** | 37 rows | Plates, bowls, cups types |
| **Novelties** | 70 rows | New product launches |
| **Events** | 100 rows | Trade shows, exhibitions |
| **Total Tables** | 292 | Complete Strapi CMS |

---

## 🔄 How It Works

### **Data Flow:**

```
PostgreSQL Database (AWS RDS)
         ↓
    [Nightly Sync at 2 AM]
         ↓
Extract: Products, Categories, Collections, Blogs
         ↓
    [Text Chunking]
         ↓
Create Embeddings (OpenAI)
         ↓
Store in Vector Database
         ↓
    [User Asks Question]
         ↓
Vector Search finds relevant data
         ↓
AI generates response
         ↓
User receives accurate answer
```

---

## ⚙️ Configuration

### **Environment Variables**

Add to `.env.local`:

```env
# Database Configuration
DB_HOST=stage-db.c5oi8wqcejl3.eu-central-1.rds.amazonaws.com
DB_USER=postgres
DB_PWD=your-password-here
DB_PORT=5432
DB_DATABASE=rakstage

# Update Schedule
NIGHTLY_UPDATE_TIME=02:00  # 24-hour format (HH:MM)
```

---

## 🚀 Usage

### **Manual Database Sync**

```bash
# Inspect database schema
npm run db:inspect

# Sync database to vector store
npm run db:sync

# This will:
# - Connect to PostgreSQL
# - Extract products, categories, collections, blogs
# - Create embeddings
# - Update vector database
```

### **Start Nightly Scheduler**

```bash
# Run as background process
npm run db:schedule

# This will:
# - Run initial sync immediately
# - Schedule nightly updates at 2:00 AM
# - Keep running (use PM2 or systemd in production)
```

### **Production Deployment**

Use a process manager:

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start "npm run db:schedule" --name rak-db-sync

# Using systemd (Linux)
# Create /etc/systemd/system/rak-db-sync.service
```

---

## 📊 What Gets Indexed

### **1. Products (500 most recent)**
- Product name and code
- Descriptions and specifications
- Material, shape, capacity
- Safety features (microwave/dishwasher safe)
- Dimensions and pricing

**Example:**
```
Product: Classic Gourmet Plate
Code: CLGU27WH
Material: Porcelain
Shape: Round
Features: Microwave safe, Dishwasher safe
Description: Premium white porcelain dinner plate...
Specifications: 27cm diameter, chip-resistant...
```

### **2. Categories (all published)**
- Category names
- Descriptions
- SEO information

**Example:**
```
Category: Plates
Description: Explore our wide range of porcelain plates...
```

### **3. Collections (all published)**
- Collection names
- Descriptions
- Design themes

**Example:**
```
Collection: Classic Gourmet
Description: Timeless elegance with modern functionality...
```

### **4. Blogs/News (100 most recent)**
- Blog titles and content
- Company news
- Product announcements

**Example:**
```
Blog: New Sustainable Porcelain Line Launched
Content: RAK Porcelain announces...
```

### **5. Product Types**
- All product type classifications

### **6. Novelties**
- Latest product launches
- New collections

### **7. Events**
- Upcoming trade shows
- Exhibitions
- Company events

### **8. Sustainability**
- Environmental initiatives
- Certifications
- Green practices

### **9. Contact Information**
- Support details
- Office locations
- Contact methods

---

## 🧠 Intelligence Features

### **Smart Query Understanding**

The chatbot can now answer questions about:

**Product-Specific:**
- "Tell me about product code CLGU27WH"
- "What plates are microwave safe?"
- "Show me products in the Classic Gourmet collection"
- "What's the capacity of [product name]?"

**Category/Collection:**
- "What's in the Banquet collection?"
- "Tell me about your plates category"
- "Compare Classic Gourmet vs Ease collection"

**Latest Information:**
- "What's new at RAK Porcelain?"
- "Tell me about recent news"
- "Any upcoming events?"

**Detailed Specifications:**
- "What materials do you use?"
- "Are your products dishwasher safe?"
- "What sizes are available?"

---

## ⏰ Nightly Updates

### **How It Works:**

1. **Scheduler starts** at application launch
2. **Runs initial sync** immediately
3. **Schedules nightly task** for 2:00 AM
4. **Every night:**
   - Connects to database
   - Fetches latest data
   - Creates new embeddings
   - Updates vector store
   - Logs results

### **Monitoring:**

```bash
# Check sync logs
cat data/db-sync-report.json

# Example output:
{
  "timestamp": "2025-10-28T02:00:05.123Z",
  "tablesProcessed": 8,
  "totalRecords": 1250,
  "totalChunks": 1100,
  "stats": {
    "products": 500,
    "categories": 99,
    "collections": 21,
    "blogs": 100,
    "other": 530
  },
  "errors": []
}
```

---

## 🔧 Customization

### **Change Sync Time**

```env
# .env.local
NIGHTLY_UPDATE_TIME=03:30  # 3:30 AM
```

### **Adjust Data Limits**

Edit `scripts/sync-database.ts`:

```typescript
// Change product limit
LIMIT 500  // ← Adjust this

// Add more tables
await crawlCustomTable(report);
```

### **Add Custom Tables**

```typescript
async function crawlCustomTable(report: SyncReport) {
  const data = await query('SELECT * FROM your_table');
  // Process and create chunks
  // Create embeddings
  // Upsert to vector store
}
```

---

## 📈 Performance

### **Initial Sync**

| Operation | Time | Cost |
|-----------|------|------|
| **Database query** | ~10 seconds | Free |
| **Create 1000 embeddings** | ~30 seconds | ~$0.10 |
| **Store vectors** | ~5 seconds | Free |
| **Total** | ~1-2 minutes | ~$0.10-0.30 |

### **Nightly Sync**

- **Frequency:** Once per day (2:00 AM)
- **Duration:** 1-2 minutes
- **Cost:** ~$0.10-0.30 per sync
- **Monthly:** ~$3-9 for nightly updates

---

## 🛡️ Security

### **Database Credentials**

- ✅ Never committed to Git (in `.env.local`)
- ✅ SSL/TLS encryption enabled
- ✅ AWS RDS security groups protect database
- ✅ Read-only queries (no modifications)

### **Best Practices**

```env
# Production: Use environment variables
# Vercel: Add in dashboard
# Railway: Add in settings
# Docker: Pass via docker-compose
```

---

## 🧪 Testing

### **Test Database Connection**

```bash
npm run db:inspect
```

**Expected output:**
```
✅ Database connected
📊 Found 292 tables
...table listings...
```

### **Test Sync**

```bash
npm run db:sync
```

**Expected output:**
```
✅ Products: 500 indexed
✅ Categories: 99 indexed
✅ Collections: 21 indexed
✅ Blogs: 100 indexed
Total chunks: ~700-1000
```

### **Test Chatbot**

After syncing, test with:
- "What products do you have in the Classic Gourmet collection?"
- "Tell me about product code CLGU27WH"
- "What's new at RAK Porcelain?"

---

## 🐛 Troubleshooting

### **Connection Failed**

```
Error: Connection timeout
```

**Solution:**
- Check network connectivity
- Verify DB_HOST is accessible
- Check firewall/security groups
- Verify credentials

### **Column Not Found**

```
Error: column "name" does not exist
```

**Solution:**
- Run `npm run db:inspect` to see actual columns
- Update `sync-database.ts` with correct column names

### **Out of Memory**

```
Error: JavaScript heap out of memory
```

**Solution:**
- Reduce LIMIT in queries
- Process in smaller batches
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`

---

## 📝 Maintenance

### **Regular Tasks:**

```bash
# Weekly: Check sync reports
cat data/db-sync-report.json

# Monthly: Review and optimize queries
# - Remove unused tables
# - Adjust limits based on usage

# Quarterly: Update embeddings model if OpenAI releases new versions
```

---

## 🚀 Deployment Considerations

### **For Vercel:**

1. **Add environment variables** in dashboard:
   - `DB_HOST`, `DB_USER`, `DB_PWD`, `DB_PORT`, `DB_DATABASE`

2. **Nightly scheduler won't work** (serverless)
   - Use Vercel Cron Jobs instead
   - Or external cron service (EasyCron, cron-job.org)

3. **Alternative:** Use Vercel's Edge Config or KV for caching

### **For Railway/Render:**

1. **Add environment variables** in settings
2. **Run scheduler as separate service**
3. **Persistent filesystem** works great

### **For Production:**

**Recommended setup:**
```
Main App (Vercel/Railway)
     +
Scheduler Service (Railway/Render)
     ↓
Shared Vector Database (Pinecone/Weaviate)
```

---

## 💡 Advanced Features

### **Future Enhancements:**

- [ ] Incremental updates (only sync changed records)
- [ ] Multi-language support (index all locales)
- [ ] Product image analysis
- [ ] Real-time updates via database triggers
- [ ] Semantic search across all tables
- [ ] Custom business logic (pricing, availability)

---

## 📊 Current Sync Status

```bash
# Check last sync
cat data/db-sync-report.json

# View logs
# Logs are output to console during sync
```

---

**Your chatbot now has intelligent, auto-updating knowledge from your PostgreSQL database!** 🎉

**Next sync:** Tonight at 2:00 AM (or run `npm run db:sync` manually)

