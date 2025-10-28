# 🔐 Vercel Environment Variables

## Complete list of environment variables for Vercel deployment

---

## 📋 **Copy These to Vercel Dashboard**

Go to: **Project Settings → Environment Variables**

Add each of these:

---

### **1. OPENAI_API_KEY** (Required)

```
[Copy from your .env.local file]
```

**Environment:** Production, Preview, Development (all 3)

---

### **2. DB_HOST** (Required for products)

```
stage-db.c5oi8wqcejl3.eu-central-1.rds.amazonaws.com
```

**Environment:** Production, Preview, Development (all 3)

---

### **3. DB_USER** (Required for products)

```
postgres
```

**Environment:** Production, Preview, Development (all 3)

---

### **4. DB_PWD** (Required for products)

```
5NeKiaKqoAIg7XNa5I5Q
```

**Environment:** Production, Preview, Development (all 3)

---

### **5. DB_PORT** (Required for products)

```
5432
```

**Environment:** Production, Preview, Development (all 3)

---

### **6. DB_DATABASE** (Required for products)

```
rakstage
```

**Environment:** Production, Preview, Development (all 3)

---

### **7. RAK_BASE** (Optional)

```
https://www.rakporcelain.com/us-en
```

**Environment:** Production, Preview, Development (all 3)

---

### **8. NODE_ENV** (Optional)

```
production
```

**Environment:** Production only

---

## 🎯 **Quick Add Guide**

### **In Vercel Dashboard:**

1. **Go to:** Your Project → Settings → Environment Variables
2. **Click:** "Add New"
3. **For each variable above:**
   - Name: `OPENAI_API_KEY` (example)
   - Value: `sk-proj-...` (paste from above)
   - Environments: Check all 3 (Production, Preview, Development)
   - Click "Save"
4. **Repeat** for all 8 variables

---

## ✅ **Verification**

After adding all variables, you should see:

```
✓ OPENAI_API_KEY (Production, Preview, Development)
✓ DB_HOST (Production, Preview, Development)
✓ DB_USER (Production, Preview, Development)
✓ DB_PWD (Production, Preview, Development)
✓ DB_PORT (Production, Preview, Development)
✓ DB_DATABASE (Production, Preview, Development)
✓ RAK_BASE (Production, Preview, Development)
✓ NODE_ENV (Production)
```

Total: **8 environment variables**

---

## 🔄 **After Adding Variables**

1. **Redeploy** your project (if already deployed)
2. **Or deploy** for the first time
3. **Test** the live URL
4. **Verify** products show and chatbot works

---

## 🚨 **Important Notes**

- **DO NOT** commit .env files to GitHub (they're in .gitignore)
- **KEEP** these credentials secure
- **UPDATE** in Vercel dashboard if credentials change
- **USE** the same values for all environments for consistency

---

## 📊 **What Each Variable Does**

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | AI responses & embeddings | ✅ Yes |
| `DB_HOST` | Database connection | ✅ Yes (for products) |
| `DB_USER` | Database username | ✅ Yes (for products) |
| `DB_PWD` | Database password | ✅ Yes (for products) |
| `DB_PORT` | Database port | ✅ Yes (for products) |
| `DB_DATABASE` | Database name | ✅ Yes (for products) |
| `RAK_BASE` | Website URL | No (has default) |
| `NODE_ENV` | Environment mode | No (auto-set) |

---

## 🎉 **Ready to Deploy!**

All environment variables are documented and ready to copy into Vercel!

**Next step:** Go to https://vercel.com/new and import your project!

