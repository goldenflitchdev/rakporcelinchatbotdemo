# 🚀 Manual Vercel Deployment Guide

Since automatic deployment isn't working, let's set it up manually.

---

## ✅ **Option 1: Import Project from GitHub (Recommended)**

### **Step 1: Go to Vercel**
👉 **https://vercel.com/new**

### **Step 2: Connect GitHub Account**

1. Click **"Import Git Repository"**
2. If not connected, click **"Connect GitHub Account"**
3. Authorize Vercel to access your GitHub
4. Grant access to your repositories

### **Step 3: Import Your Repository**

1. Search for: **`goldenflitchdev/rakporcelinchatbotdemo`**
2. Click **"Import"**

### **Step 4: Configure Project**

**Framework Preset:** Next.js ✅ (auto-detected)

**Root Directory:** `./` (leave as default)

**Build Command:** (leave empty - auto-detected)

**Output Directory:** (leave empty - auto-detected)

### **Step 5: Add Environment Variable**

Click **"Environment Variables"** section:

- **Key:** `OPENAI_API_KEY`
- **Value:** (paste your API key from `.env.local`)
- Click **"Add"**

### **Step 6: Deploy**

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app will be live! 🎉

---

## ✅ **Option 2: Deploy with Vercel CLI**

If the web interface doesn't work, use the CLI:

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login**
```bash
vercel login
```
- Enter your email
- Click the verification link in your email

### **Step 3: Deploy**
```bash
cd /Users/eternal.arka/Coding\ projects\ 2025/RAK\ Demo/rakporcelinchatbotdemo
vercel
```

**Answer the prompts:**
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N**
- Project name? **rakporcelinchatbotdemo** (or press Enter)
- Directory? **./** (press Enter)
- Override settings? **N**

### **Step 4: Add Environment Variable**
```bash
vercel env add OPENAI_API_KEY
```
- Select environment: **Production**
- Paste your API key
- Press Enter

### **Step 5: Deploy to Production**
```bash
vercel --prod
```

---

## 🔧 **Why Automatic Deployment Isn't Working**

### **Common Reasons:**

1. **GitHub Integration Not Set Up**
   - Vercel needs permission to access your GitHub
   - Need to install Vercel GitHub App

2. **Repository Not Linked**
   - Project exists on GitHub but not connected to Vercel
   - Need to import/link the repository

3. **Vercel Project Doesn't Exist**
   - You haven't created a Vercel project yet
   - Need to do initial import first

---

## 🔗 **Set Up Automatic Deployments (After First Deploy)**

Once you've deployed manually once, set up auto-deploy:

### **Step 1: Verify GitHub Integration**

1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"**
3. Go to **"Git"** section
4. Verify it shows:
   - ✅ Connected to GitHub
   - ✅ Repository: `goldenflitchdev/rakporcelinchatbotdemo`
   - ✅ Production Branch: `main`

### **Step 2: Configure Auto-Deploy Settings**

In Git settings, ensure:
- ✅ **Automatic Deployments:** ON
- ✅ **Deploy Hooks:** Enabled
- ✅ **Production Branch:** `main`
- ✅ **Preview Deployments:** ON (optional)

### **Step 3: Test Auto-Deploy**

Make a small change and push:

```bash
cd /Users/eternal.arka/Coding\ projects\ 2025/RAK\ Demo/rakporcelinchatbotdemo

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

Vercel should automatically:
1. Detect the push
2. Start building
3. Deploy to production

---

## 📊 **Deployment Status Check**

### **Via Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Look for your project
3. Check "Deployments" tab
4. Should see builds from your commits

### **Via CLI:**
```bash
vercel ls
```

Should show your project and deployments.

---

## 🆘 **Troubleshooting**

### **Problem: "No projects found"**

**Solution:** You haven't created a Vercel project yet. Use Option 1 or 2 above.

### **Problem: "GitHub integration not found"**

**Solution:**
1. Go to: https://vercel.com/account/login-connections
2. Click **"Connect"** next to GitHub
3. Authorize and grant permissions
4. Try importing again

### **Problem: "Repository not found"**

**Solution:**
1. Make sure repository is not private, OR
2. Grant Vercel access to private repositories:
   - GitHub Settings → Applications → Vercel
   - Grant access to repository

### **Problem: "Build fails on Vercel but works locally"**

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure `OPENAI_API_KEY` is set in Vercel
3. Verify Node.js version matches (18.x)

---

## 🎯 **Quick Start (Fastest Way)**

### **Using Vercel Web Interface:**

1. **Go to:** https://vercel.com/new
2. **Click:** "Import Git Repository"
3. **Authorize:** GitHub access (if needed)
4. **Select:** `goldenflitchdev/rakporcelinchatbotdemo`
5. **Add:** `OPENAI_API_KEY` environment variable
6. **Click:** "Deploy"
7. **Wait:** 2-3 minutes
8. **Done:** Your app is live! 🎉

---

## 📝 **After First Deployment**

Once deployed successfully:

1. ✅ **Auto-deploy is enabled** - Every push to `main` triggers deployment
2. ✅ **Preview deployments** - Every PR gets a preview URL
3. ✅ **Production URL** - `https://rakporcelinchatbotdemo.vercel.app`
4. ✅ **Custom domain** - Can add your own domain in settings

---

## 🔗 **Useful Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Import Project:** https://vercel.com/new
- **GitHub Integration:** https://vercel.com/docs/deployments/git/vercel-for-github
- **Vercel CLI Docs:** https://vercel.com/docs/cli

---

## ✅ **Expected Result**

After following these steps:

1. ✅ Project deployed to Vercel
2. ✅ Live URL available
3. ✅ Auto-deploy enabled
4. ✅ Future pushes automatically deploy

---

**Let me know which option you want to try first!** 🚀

**Recommended:** Option 1 (Web Interface) - Easiest and most visual

