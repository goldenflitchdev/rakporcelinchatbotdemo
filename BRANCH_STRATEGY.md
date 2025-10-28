# 🌳 Git Branch Strategy

## Branch Structure

Your RAK Porcelain Chatbot now has a professional branching strategy!

---

## 📊 **Branches**

### **1. `production` Branch** 🟢
**Purpose:** Stable, production-ready code  
**Status:** Protected, tested, deployed  
**Deploys to:** Vercel production  
**Updates:** Only via pull requests from development  

**Contains:**
- All current working features
- Version: 1.2.5
- Last stable commit: `61457b4`
- 726 documents indexed
- All optimizations active

---

### **2. `development` Branch** 🔵
**Purpose:** Active development and new features  
**Status:** Current working branch  
**Deploys to:** Vercel preview deployments  
**Updates:** Direct commits allowed  

**Use for:**
- New features
- Experiments
- Bug fixes
- Improvements
- Testing

---

### **3. `main` Branch** ⚪
**Purpose:** Mirror of production (legacy)  
**Status:** Can be merged to production  
**Note:** You can continue using main or switch to new strategy  

---

## 🔄 **Workflow**

### **For New Development:**

```bash
# 1. Switch to development branch
git checkout development

# 2. Make your changes
# ... edit files ...

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin development

# 4. Vercel automatically deploys preview
# Test at preview URL

# 5. When ready for production:
git checkout production
git merge development
git push origin production

# Production automatically updates!
```

---

## 🎯 **Current Branch Status**

```
✅ production  - Stable code, ready for deployment
✅ development - Active branch for new work (YOU ARE HERE)
✅ main        - Original branch
```

---

## 🚀 **Vercel Configuration**

### **Recommended Setup:**

**Production Branch:** `production`
- Deploy to: https://rakporcelinchatbot.vercel.app

**Development Branch:** `development`  
- Deploy to: https://rakporcelinchatbot-dev.vercel.app (preview)

### **Auto-Deploy Settings:**

In Vercel Dashboard → Settings → Git:
- **Production Branch:** `production`
- **Preview Branches:** `development`, `main`
- **Auto-deploy:** ON for all branches

---

## 📝 **Best Practices**

### **DO:**
✅ Always work in `development` branch  
✅ Test thoroughly before merging to `production`  
✅ Use descriptive commit messages  
✅ Create pull requests for production merges  
✅ Keep `production` stable and clean  

### **DON'T:**
❌ Push untested code to `production`  
❌ Force push to any branch  
❌ Delete branches without backup  
❌ Commit secrets or API keys  

---

## 🔧 **Useful Commands**

```bash
# Check current branch
git branch

# Switch branches
git checkout production
git checkout development

# See what's different
git diff production development

# Merge development into production
git checkout production
git merge development
git push origin production

# Pull latest changes
git pull origin development
```

---

## 🎯 **Your Current Setup**

```
📁 Repository: goldenflitchdev/rakporcelinchatbotdemo

🌿 Branches:
   ├─ production (stable, for deployment)
   ├─ development (active, YOU ARE HERE ✅)
   └─ main (legacy/backup)

🚀 Ready for:
   - Safe development in 'development' branch
   - Protected production code in 'production' branch
   - Vercel auto-deploy from both branches
```

---

## ✅ **Next Steps**

1. **You're now on `development` branch** - Safe to make changes!
2. **Production code is safe** in `production` branch
3. **Deploy `production` branch** to Vercel for stable version
4. **All future work** happens in `development`

---

**Branch strategy is set up!** 🌳✨

**Current branch:** `development` (safe to develop!)

