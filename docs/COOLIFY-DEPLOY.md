# 🚀 Coolify Deployment Guide — S Kawsar Sunnah Mart

এই প্রজেক্টে **দুটো আলাদা অ্যাপ** (আলাদা GitHub repo) → Coolify-তে **দুটো Application** বানাতে হবে।
Database = **MongoDB Atlas** (external, already connected)।

| App | Repo | Port | Build | Start |
|-----|------|------|-------|-------|
| **Server (API)** | `sakkib443/S-Kawsar-Sunnah-Mart_server` | `5000` | `npm run build` (tsc → dist) | `npm start` (`node index.js`) |
| **Client (Next.js)** | `sakkib443/S-Kawsar-Sunnah-Mart_client` | `3000` | `npm run build` | `npm start` (`next start`) |

> **Build Pack (দুটোতেই):** Nixpacks (Coolify auto-detects Node/Next.js — আলাদা Dockerfile লাগে না)।
> **Deploy order:** আগে **Server**, পরে **Client** (client build-এ API URL লাগে)।

---

## 🔧 ধাপ ০ — আগে যা লাগবে

- Coolify চলছে এমন একটা **VPS/server**, আর একটা **domain** যেটার DNS Coolify server-এর IP-তে পয়েন্ট করা।
- ২টা subdomain ঠিক করুন, যেমন:
  - **API:** `api.yourdomain.com` → server
  - **Shop:** `yourdomain.com` (বা `shop.yourdomain.com`) → client
- **MongoDB Atlas → Network Access** → Coolify server-এর IP allow করুন (অথবা টেস্টের জন্য `0.0.0.0/0`)। ⚠️ না করলে DB connect হবে না।
- নতুন JWT secret বানান (লোক্যাল কমান্ড):
  ```bash
  node -e "const c=require('crypto');console.log('ACCESS='+c.randomBytes(48).toString('hex'));console.log('REFRESH='+c.randomBytes(48).toString('hex'))"
  ```

---

## 1️⃣ ধাপ ১ — Server (API) deploy

1. Coolify → একটা **Project** → **+ New Resource → Application → Public/Private Repository**।
2. Repo: `https://github.com/sakkib443/S-Kawsar-Sunnah-Mart_server` · Branch: `main` · Build Pack: **Nixpacks**।
3. **Build/Start commands** (Nixpacks সাধারণত নিজে ধরে; না ধরলে "Configuration → General"-এ সেট করুন):
   - Install: `npm ci`
   - Build: `npm run build`
   - Start: `npm start`
4. **Ports → "Ports Exposes":** `5000`
5. **Domain:** `https://api.yourdomain.com` (Coolify নিজে SSL দেবে)
6. **Health Check** (Configuration → Health Check): Path `/api/health` · Port `5000`
7. **Environment Variables** (runtime — Coolify → Environment Variables):
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/skawsar?appName=Cluster0
   JWT_ACCESS_SECRET=<generated ACCESS>
   JWT_REFRESH_SECRET=<generated REFRESH>
   JWT_ACCESS_EXPIRES_IN=1d
   JWT_REFRESH_EXPIRES_IN=7d
   BCRYPT_SALT_ROUNDS=12
   FRONTEND_URL=https://yourdomain.com        # ← client domain (CORS)
   BACKEND_URL=https://api.yourdomain.com
   ```
   *(ঐচ্ছিক — চাইলে পরে যোগ করুন: `CLOUDINARY_*`, `EMAIL_*`, `BKASH_*`, `SSLCZ_*`, `STEADFAST_*`, `GOOGLE_CLIENT_ID/SECRET`)*
8. **Deploy** → Logs-এ দেখুন: `🔌 Connecting to MongoDB...` → `✅ MongoDB Connected` → `Server Started`।
9. টেস্ট: ব্রাউজারে `https://api.yourdomain.com/` → `{"success":true,...API Server is running!}`

---

## 2️⃣ ধাপ ২ — Client (Next.js) deploy

1. Coolify → **+ New Resource → Application** → repo `sakkib443/S-Kawsar-Sunnah-Mart_client` · Branch `main` · Build Pack **Nixpacks**।
2. **Ports Exposes:** `3000`
3. **Domain:** `https://yourdomain.com`
4. **Environment Variables** — ⚠️ **খুব জরুরি:** এগুলো **Build-time variable** করতে হবে (Coolify-তে ভ্যারিয়েবলের পাশে **"Build Variable / Available at Buildtime"** টগল অন করুন)। কারণ Next.js `NEXT_PUBLIC_*` **build-এর সময়** কোডে বসিয়ে দেয়:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api     # ← অবশ্যই /api সহ
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=                          # ঐচ্ছিক
   ```
5. **Deploy** → homepage খুলুন → প্রোডাক্ট লোড হচ্ছে কিনা দেখুন।
6. Admin: `https://yourdomain.com/login` → `admin@gmail.com`।

> Socket.IO (real-time notification/finance) নিজে থেকেই কাজ করবে — client `NEXT_PUBLIC_API_URL` থেকে `/api` বাদ দিয়ে WSS URL বানায়, আর Coolify-র Traefik WebSocket সাপোর্ট করে।

---

## ⚠️ জরুরি Gotchas (এগুলো মিস করলে সমস্যা হয়)

1. **`NEXT_PUBLIC_*` = build-time।** এগুলো বদলালে client শুধু restart নয়, **Rebuild/Redeploy** করতে হবে।
2. **CORS:** server-এর `FRONTEND_URL` অবশ্যই client domain-এর সাথে হুবহু মিলতে হবে।
3. **`NODE_ENV=production`** server-এ — নাহলে cookie secure হবে না, আর dev-mode-এ OTP/reset লিংক response-এ leak করবে।
4. **MongoDB Atlas IP whitelist** — Coolify server-এর IP allow করুন, নাহলে `MongoServerSelectionError`।
5. **Product image (Next.js `<Image>`):**
   - **Cloudinary** ব্যবহার করলে → `res.cloudinary.com` already whitelisted, সমস্যা নেই ✅ (সাজেস্টেড)।
   - **Disk upload** (Cloudinary key ছাড়া) ব্যবহার করলে → ছবি `https://api.yourdomain.com/uploads/...` থেকে আসবে, কিন্তু `next.config.ts`-এ শুধু `localhost:5000` whitelisted। তখন **`next.config.ts`-এর `images.remotePatterns`-এ আপনার API domain যোগ করতে হবে** (আমাকে বললে করে দেব)।
6. **Disk upload persistence:** Cloudinary ছাড়া `/uploads` container redeploy-এ মুছে যায় → হয় **Cloudinary** ব্যবহার করুন, নয়তো Coolify-তে একটা **Persistent Storage volume** `/app/uploads`-এ mount করুন।

---

## 🔁 ধাপ ৩ — ভবিষ্যতে development / redeploy

- **Auto-deploy:** Coolify → Source (GitHub) → Webhook enable করুন। এরপর `git push` করলেই Coolify নিজে rebuild + redeploy করবে।
- **Manual:** Coolify ড্যাশবোর্ডে অ্যাপের **"Redeploy"** বাটন।
- **লোকাল ডেভেলপমেন্ট আগের মতোই:** `npm run start:dev` (server) + `npm run dev` (client) — কোড ঠিক হলে push করলে Coolify লাইভে যাবে।

**সাধারণ ফ্লো:**
```
লোকালে কোড চেঞ্জ → test → git commit → git push origin main → Coolify auto-redeploy
```

---

## 🗄️ MongoDB নিয়ে নোট

এখন Atlas (`skawsar` cluster) ব্যবহার হচ্ছে। প্রোডাকশনে দুটো অপশন:
- **(সাজেস্টেড)** ক্লায়েন্টের নিজের Atlas অ্যাকাউন্টে একটা production cluster → সেই connection string `DATABASE_URL`-এ বসান (ডেটার মালিকানা ক্লায়েন্টের হাতে)।
- অথবা Coolify-তেই একটা **MongoDB resource** বানিয়ে সেটার internal connection string ব্যবহার করা (একই server-এ থাকলে দ্রুত)।

---

## 📦 বিকল্প: Dockerfile (Nixpacks-এ সমস্যা হলে)

Nixpacks সাধারণত Node/Next-এ ঠিকঠাক কাজ করে। যদি কোনো কারণে build fail করে, আমি প্রতিটা অ্যাপের জন্য optimized **Dockerfile** (multi-stage, Next standalone) বানিয়ে দিতে পারি — শুধু বললেই হবে।
