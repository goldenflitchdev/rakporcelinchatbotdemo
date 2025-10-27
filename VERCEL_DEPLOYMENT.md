# 🚀 Vercel Deployment Guide

## Quick Deploy from GitHub

Your RAK Porcelain Chatbot is ready to deploy to Vercel directly from GitHub!

---

## 📋 Prerequisites

- ✅ Code is on GitHub: `github.com/goldenflitchdev/rakporcelinchatbotdemo`
- ✅ OpenAI API key ready
- ✅ Vercel account (free tier works)

---

## 🎯 Step-by-Step Deployment

### 1. Go to Vercel

Visit: **https://vercel.com/new**

### 2. Import Your Repository

- Click "Import Git Repository"
- Select or search for: `goldenflitchdev/rakporcelinchatbotdemo`
- Click "Import"

### 3. Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave default)

**Build Command:** `npm run build` (auto-detected)

**Output Directory:** `.next` (auto-detected)

### 4. Add Environment Variables

Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | `sk-proj-your-actual-key-here` |

**Important:** Use your actual OpenAI API key.

### 5. Deploy

- Click "Deploy"
- Wait 2-3 minutes for build to complete
- Your chatbot will be live! 🎉

---

## 🔗 After Deployment

### Your URLs

You'll get:
- **Production:** `https://rakporcelinchatbotdemo.vercel.app`
- **Preview:** Unique URL for each branch/PR

### Auto-Deploy Setup

Vercel automatically deploys when you:
- Push to `main` branch → Production deployment
- Open a PR → Preview deployment
- Push to any branch → Preview deployment

---

## ⚙️ How It Works

### Build Process

1. Vercel pulls code from GitHub
2. Runs `npm install` (installs dependencies)
3. Runs `npm run build` (builds Next.js)
4. **Runs `npm run postbuild`** (seeds vector database automatically)
5. Deploys to edge network

### Vector Database

The `postbuild` script automatically:
- Creates the vector store during build
- Seeds with 18 RAK Porcelain documents
- Stores in `.next/server` (persists across requests)

**Note:** In production, consider upgrading to:
- Vercel Blob Storage
- Pinecone
- Or external vector database

---

## 🧪 Testing Your Deployment

Once deployed, test these questions:

```
1. "What is RAK Porcelain?"
2. "Tell me about your plates"
3. "How do I care for porcelain?"
4. "Do you offer B2B services?"
5. "What is the warranty policy?"
```

All should return accurate answers with source citations!

---

## 🔧 Troubleshooting

### Build Fails

**Issue:** "OPENAI_API_KEY is not defined"
- **Solution:** Add environment variable in Vercel dashboard

**Issue:** "Module not found"
- **Solution:** Check package.json has all dependencies
- Run: `npm install` locally to verify

### Runtime Errors

**Issue:** "Vector store is empty"
- **Solution:** Check build logs to ensure `postbuild` ran
- May need to manually run: `npm run seed:real`

**Issue:** "API timeout"
- **Solution:** Increase function timeout in vercel.json (already set to 30s)

---

## 📊 Monitoring

### View Logs

1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment
5. View "Functions" tab for logs

### Usage Tracking

Monitor in Vercel dashboard:
- Request count
- Bandwidth usage
- Function duration
- Error rates

---

## 💰 Cost Considerations

### Vercel Free Tier Limits

- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours serverless function execution
- ✅ Unlimited deployments
- ✅ Unlimited previews

### OpenAI Costs

- ~$0.01-0.02 per conversation
- Estimate: 100 conversations/day = ~$30-60/month

---

## 🔄 Updating Your Deployment

### Automatic (Recommended)

Just push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main
```

Vercel automatically redeploys! ✅

### Manual

In Vercel dashboard:
1. Click "Redeploy"
2. Wait for build
3. Done!

---

## 🌐 Custom Domain (Optional)

### Add Your Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `chat.rakporcelain.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## 🎉 You're Done!

Your RAK Porcelain chatbot is now:
- ✅ Deployed on Vercel
- ✅ Auto-deploys from GitHub
- ✅ Globally distributed (edge network)
- ✅ SSL enabled
- ✅ Monitored and scalable

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **GitHub Issues:** Open an issue in your repo

---

**Built with Next.js + OpenAI + Vercel** 🚀

