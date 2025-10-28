# 🎨 Visual AI Product Analysis System

## Overview

Advanced AI-powered visual analysis system that uses **GPT-4 Vision** to analyze product images and map them to comprehensive aesthetic parameters from the **RAK Product Vector Training Data** schema.

---

## 🎯 What It Does

### Visual Analysis (GPT-4 Vision)
For each product image, the AI analyzes:

#### 1. **Aesthetic Style**
- Wabi-Sabi, Minimalist, Contemporary, Classic, Vintage
- Rustic, Industrial, Art Deco, Scandinavian, etc.

#### 2. **Art Movement Influence**
- Minimalism, Modernism, Bauhaus, Art Deco
- Art Nouveau, Organic Modernism, Japanese Aesthetics

#### 3. **Cultural Inspiration**
- Japanese, Chinese, European, French, Italian
- Middle Eastern, Scandinavian, Mediterranean

#### 4. **Visual Characteristics**
- **Pattern**: Textured/Organic, Geometric, Floral, Abstract
- **Colors**: All visible colors (primary, secondary, accent)
- **Finish**: Matte, Glossy, Satin, Reactive Glaze
- **Texture**: Smooth, Rough, Ribbed, Embossed
- **Edge Style**: Clean, Irregular, Beveled, Rustic
- **Form**: Round, Square, Oval, Organic

#### 5. **Material & Production**
- Material: Fine Porcelain, Bone China, Stoneware
- Method: Handmade, Industrial, Semi-handmade

#### 6. **Mood & Context**
- **Emotion**: Calm, Sophisticated, Warm, Bold, Serene
- **Theme**: Earthy, Elegant, Refined, Natural
- **Culinary**: Japanese, French, Italian, Fusion
- **Lighting**: Candlelight, Natural Light, Bright
- **Photogenic Value**: High/Medium/Low

#### 7. **Usage Context**
- **Use Case**: Fine Dining, Casual, Banquet, Hotel
- **Industry**: Restaurant, Hotel, Catering, Home
- **Price Segment**: Luxury, Premium, Mid-Range

---

## 🚀 How to Use

### Step 1: Run Visual Analysis

```bash
npm run db:analyze-vision
```

**What happens:**
- Fetches 100 products with images from database
- Analyzes each image with GPT-4 Vision
- Extracts 20+ aesthetic parameters per product
- Creates searchable embeddings
- Saves to `data/visual-vector-store.json`

**Time:** 20-30 minutes  
**Cost:** ~$15-20 (one-time for 100 products)

### Step 2: Query with Visual Parameters

The chatbot now understands queries like:

```
✅ "Show me Wabi-Sabi inspired plates with earthy tones"
✅ "I need minimalist Japanese-style pieces for fine dining"
✅ "Looking for bold, photogenic bowls with reactive glaze"
✅ "Find sophisticated European-inspired plates for candlelight"
✅ "Show rustic, handmade pieces perfect for natural light"
✅ "Contemporary Asian fusion plates with matte finish"
✅ "Elegant Art Deco pieces for luxury hotel"
```

---

## 📊 Training Data Schema

Based on: `RAK Product Vector Training Data.csv`

### Core Parameters (20+)

| Category | Parameters |
|----------|-----------|
| **Aesthetics** | Style, Art Movement, Cultural Inspiration |
| **Visual** | Motif/Pattern, Color Palette, Finish, Texture |
| **Form** | Edge Style, Geometry, Visual Theme |
| **Material** | Primary Material, Production Method |
| **Context** | Mood, Culinary, Lighting, Use Case |
| **Market** | Target Industry, Price Segment |

---

## 🎨 Search Priority

The system uses a 3-tier search strategy:

### 1. **Visual AI Search** (Highest Priority)
Triggers on highly specific visual queries:
- Style keywords: wabi-sabi, minimalist, rustic, etc.
- Cultural: Japanese, European, Scandinavian, etc.
- Visual qualities: textured, matte, handmade, etc.
- Mood: earthy, elegant, sophisticated, etc.

**Example:** *"Show me rustic, handmade Japanese plates with earthy tones"*  
**Result:** Products matching visual analysis data

### 2. **Aesthetic Search** (Fallback)
Triggers on style/mood keywords without visual specifics:
- Colors, styles, moods, settings
- Less specific than visual search

**Example:** *"Elegant white plates for fine dining"*

### 3. **Product Search** (Final Fallback)
Standard product name/category search:
- Product types, collections, categories

**Example:** *"Show me dinner plates"*

---

## 📁 Output Files

### 1. **`data/product-visual-analysis.json`**
Raw analysis data for each product:
```json
{
  "productId": 123,
  "productName": "Artisan Bowl",
  "aestheticStyle": ["Wabi-Sabi", "Rustic"],
  "culturalInspiration": ["Japanese"],
  "colorPalette": ["Beige", "Stone Grey"],
  "finishGlazeType": "Matte Reactive Glaze",
  "moodEmotionElicited": ["Calm", "Grounded"],
  "richVisualDescription": "...",
  ...
}
```

### 2. **`data/visual-vector-store.json`**
Vector embeddings for semantic search:
```json
{
  "visual-123": {
    "id": "visual-123",
    "productId": 123,
    "productName": "Artisan Bowl",
    "imageUrl": "https://...",
    "content": "Rich searchable text...",
    "embedding": [0.123, 0.456, ...],
    "analysis": { ... }
  }
}
```

---

## 🔍 Advanced Query Examples

### By Aesthetic Style
```
"Show me Wabi-Sabi pieces"
"Contemporary minimalist plates"
"Vintage Art Deco bowls"
```

### By Cultural Inspiration
```
"Japanese-inspired dinnerware"
"European classic plates"
"Middle Eastern fusion pieces"
```

### By Visual Characteristics
```
"Matte finish plates with organic textures"
"Glossy white bowls with clean lines"
"Reactive glaze pieces with earthy tones"
```

### By Mood & Context
```
"Sophisticated pieces for candlelight dining"
"Warm, inviting plates for casual settings"
"Bold, photogenic bowls for Instagram"
```

### Combined Parameters
```
"Rustic, handmade Japanese plates with matte finish for fine dining"
"Contemporary European bowls with glossy white finish for luxury hotels"
"Minimalist Scandinavian pieces with clean lines for modern restaurants"
```

---

## 📈 Statistics & Insights

After analysis, you'll see:

```
📊 ANALYSIS STATISTICS
═══════════════════════════════════════
Total products analyzed: 100
Failed analyses: 2
Vector documents: 98

Unique aesthetic styles: 12
Styles: Wabi-Sabi, Minimalist, Contemporary, Classic...

Unique cultural inspirations: 8
Cultures: Japanese, European, French, Italian...

Unique moods: 10
Moods: Calm, Sophisticated, Warm, Bold, Serene...
```

---

## 🎯 Benefits

### For Users
- **Natural queries** with visual descriptions
- **Better recommendations** based on aesthetics
- **Discover products** by mood, style, culture
- **Context-aware** suggestions (lighting, cuisine, setting)

### For Business
- **Higher engagement** with visual search
- **Better product discovery**
- **Personalized recommendations**
- **Data-driven insights** into product aesthetics

---

## 🔧 Technical Details

### GPT-4 Vision Configuration
```typescript
model: 'gpt-4o'
detail: 'high'  // High-resolution analysis
max_tokens: 1500
temperature: 0.3  // Consistent results
```

### Rate Limiting
- 3 products per batch
- 2-second delay between requests
- ~20-30 minutes for 100 products

### Cost Optimization
- High detail only for comprehensive analysis
- Batch processing to minimize API calls
- One-time analysis, reusable embeddings

---

## 🚨 Important Notes

1. **One-Time Setup**: Run analysis once, use embeddings forever
2. **API Costs**: Budget ~$15-20 for 100 products
3. **Time**: Allow 20-30 minutes for full analysis
4. **Updates**: Re-run when new products are added
5. **Fallback**: System gracefully falls back if visual DB not available

---

## 🎊 Result

Your chatbot now has **human-level visual understanding** of products, enabling queries like:

> *"I'm opening a Japanese fusion restaurant. Show me sophisticated, photogenic pieces with earthy tones and matte finish that work well with natural light."*

**The AI understands:**
- Cultural context (Japanese)
- Cuisine type (fusion)
- Aesthetic (sophisticated, earthy)
- Visual qualities (matte finish)
- Context (natural light, photogenic)

And returns **perfectly matched products**! ✨

