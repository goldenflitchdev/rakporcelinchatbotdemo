# ✅ Works Locally, Not on Vercel - Troubleshooting

## 🎯 Your Situation

- ✅ **Local:** Working perfectly at http://localhost:3000
- ❌ **Vercel:** Not working or not deployed

---

## 🔍 **Step 1: Check if Vercel Project Exists**

### **Go to Vercel Dashboard:**
👉 https://vercel.com/dashboard

### **Look for:**
- Do you see a project called `rakporcelinchatbotdemo`?
  - **YES** → Go to Step 2 (Debugging existing deployment)
  - **NO** → Go to Step 3 (Create new deployment)

---

## 🐛 **Step 2: If Project Exists - Debug It**

### **A. Check Deployment Status**

1. Click on your project
2. Go to **"Deployments"** tab
3. Check latest deployment status:

**If Status is "Error":**
```
Click on the deployment → View "Build Logs"
Look for error messages
```

**Common Errors & Solutions:**

#### ❌ **Error: "Module not found"**
**Solution:** Missing dependencies
```bash
# In Vercel dashboard
Settings → General → Node.js Version
Set to: 18.x

# Or redeploy
Deployments → Latest → Redeploy
```

#### ❌ **Error: "OPENAI_API_KEY is not defined"**
**Solution:** Environment variable missing
```bash
Settings → Environment Variables
Add: OPENAI_API_KEY = your-key-here
Then: Redeploy
```

#### ❌ **Error: "Build failed"**
**Solution:** TypeScript or build error
```bash
Check build logs for specific error
Compare with local build: npm run build
```

### **B. Check Environment Variables**

1. Go to: **Settings → Environment Variables**
2. Verify:
   - ✅ `OPENAI_API_KEY` exists
   - ✅ Value is correct (starts with `sk-proj-`)
   - ✅ Applied to: **Production** (checked)

**If missing:**
```bash
Add → Name: OPENAI_API_KEY
Value: [paste from .env.local]
Save → Redeploy
```

### **C. Force Fresh Deployment**

1. Go to: **Deployments** tab
2. Click: **"Redeploy"** on latest
3. **IMPORTANT:** Uncheck "Use existing Build Cache"
4. Click: **"Redeploy"**
5. Wait 2-3 minutes

---

## 🆕 **Step 3: If Project Doesn't Exist - Create It**

### **Option A: Import from GitHub (Easiest)**

1. **Go to:** https://vercel.com/new
2. **Click:** "Import Git Repository"
3. **Search:** `rakporcelinchatbotdemo`
4. **Click:** "Import"

5. **Configure:**
   - Framework: Next.js ✅ (auto-detected)
   - Root: `./` (default)
   - Build: (leave empty)

6. **Environment Variables:**
   ```
   OPENAI_API_KEY = [Copy your key from .env.local file]
   ```

7. **Click:** "Deploy"
8. **Wait:** 2-3 minutes

### **Option B: Use Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /Users/eternal.arka/Coding\ projects\ 2025/RAK\ Demo/rakporcelinchatbotdemo
vercel

# Add environment variable
vercel env add OPENAI_API_KEY production

# Deploy to production
vercel --prod
```

---

## 🔧 **Common Vercel-Specific Issues**

### **Issue 1: Environment Variables**

**Problem:** Works locally because `.env.local` exists, but Vercel doesn't have the key.

**Solution:**
```bash
Vercel Dashboard → Project → Settings → Environment Variables
Add: OPENAI_API_KEY
Value: [your key]
Environments: Production ✓
Save → Redeploy
```

### **Issue 2: Build Configuration**

**Problem:** Vercel using wrong build settings.

**Solution:**
```bash
Vercel Dashboard → Project → Settings → Build & Development Settings

Verify:
- Framework Preset: Next.js
- Build Command: (empty or "next build")
- Output Directory: (empty or ".next")
- Install Command: (empty or "npm install")

Save → Redeploy
```

### **Issue 3: Node.js Version**

**Problem:** Vercel using different Node version than local.

**Solution:**
```bash
Vercel Dashboard → Project → Settings → General
Node.js Version: 18.x
Save → Redeploy
```

### **Issue 4: Filesystem Issues**

**Problem:** Vector store trying to write to filesystem (read-only on Vercel).

**Solution:** Already fixed! Your code uses `ensureSeeded()` which handles this.

---

## 📊 **Verification Checklist**

Before redeploying, verify:

### **In Vercel Dashboard:**
- [ ] Project exists and is linked to GitHub
- [ ] `OPENAI_API_KEY` environment variable is set
- [ ] Node.js version is 18.x
- [ ] Framework preset is Next.js
- [ ] GitHub integration is connected

### **In Your Code (Already correct):**
- [x] `vercel.json` is empty `{}` ✅
- [x] `package.json` build has no `--turbopack` ✅
- [x] `maxDuration` exported in route.ts ✅
- [x] TypeScript builds without errors ✅
- [x] Database seeds automatically ✅

---

## 🧪 **Test After Deployment**

Once Vercel shows "Ready":

### **1. Test Homepage:**
```bash
curl https://YOUR-APP.vercel.app
```
Should return HTML with "RAK Porcelain"

### **2. Test API:**
```bash
curl -X POST https://YOUR-APP.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```
Should return JSON (may take 5-10s first time)

---

## 🎯 **Most Likely Issues (In Order)**

### **1. Environment Variable Missing (90% of cases)**
**Fix:** Add `OPENAI_API_KEY` in Vercel dashboard

### **2. Project Not Created Yet (5% of cases)**
**Fix:** Import project from GitHub

### **3. Build Cache Issue (3% of cases)**
**Fix:** Redeploy without cache

### **4. GitHub Not Connected (2% of cases)**
**Fix:** Connect GitHub integration in Vercel

---

## 🚀 **Quick Fix Steps**

### **If you haven't deployed yet:**
```
1. Go to: vercel.com/new
2. Import: goldenflitchdev/rakporcelinchatbotdemo
3. Add: OPENAI_API_KEY
4. Deploy
```

### **If deployment exists but failing:**
```
1. Settings → Environment Variables
2. Add/verify: OPENAI_API_KEY
3. Deployments → Redeploy (no cache)
4. Wait 2-3 minutes
```

---

## 📝 **What to Send Me**

If still not working, share:

1. **Vercel deployment URL** (e.g., `https://your-app.vercel.app`)
2. **Error message** from build logs
3. **Screenshot** of deployment status
4. **Environment variables** status (is OPENAI_API_KEY set?)

---

## 💡 **Key Differences: Local vs Vercel**

| Aspect | Local (Working) | Vercel |
|--------|-----------------|--------|
| **Env Vars** | `.env.local` file | Dashboard settings |
| **Filesystem** | Writable | Read-only (except tmp) |
| **Node Version** | Your system | Set in dashboard |
| **Build Cache** | Local | Managed by Vercel |
| **Hot Reload** | Yes | No (production build) |

---

## ✅ **Expected Success Indicators**

When working on Vercel:

1. ✅ Deployment status: "Ready"
2. ✅ Build logs: No errors
3. ✅ Homepage loads with RAK Porcelain UI
4. ✅ First API request: 5-10 seconds (seeds DB)
5. ✅ Subsequent requests: 3-5 seconds
6. ✅ Responses include sources

---

## 🆘 **If Nothing Works**

### **Nuclear Option - Fresh Start:**

1. **Delete Vercel project** (if exists)
   ```
   Dashboard → Project → Settings → Delete Project
   ```

2. **Clear all caches**
   ```
   GitHub: Actions → Clear cache (if any)
   Vercel: All cleared by deleting project
   ```

3. **Fresh import**
   ```
   vercel.com/new → Import → Fresh deploy
   ```

---

## 🎊 **Success Criteria**

Your deployment is working when:

1. ✅ Can open homepage in browser
2. ✅ Can ask a question and get response
3. ✅ Response includes RAK Porcelain information
4. ✅ Sources are included
5. ✅ No errors in console

---

**Let me know:**
1. Does the Vercel project exist? (Check dashboard)
2. What's the current status/error?
3. Is `OPENAI_API_KEY` set in Vercel?

I'll help you fix the specific issue! 🚀

