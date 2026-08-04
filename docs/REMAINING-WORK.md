# 🚧 S Kawsar Sunnah Mart — Remaining Work (Implement + Integrate)

> **Status:** Core system **coded, QA-tested & working** (120/128 checkpoints ✅, 3 bugs fixed).
> This file lists ONLY what is still **left to do** — to the point.
> **Last updated:** 2026-07-30

---

## 1️⃣ Integrations — code READY, just need credentials (enable-on-key-drop)

কোড লেখা আছে — শুধু key বসালেই লাইভ হবে, আর কোনো কোড লাগবে না।

| # | Integration | এখন কী চলছে | লাগবে |
|---|-------------|-------------|-------|
| 1 | **Email / SMTP** | console-এ log হয়, real email যায় না | Gmail address + **App Password** |
| 2 | **Cloudinary** (image hosting) | local disk-এ সেভ | `CLOUDINARY_CLOUD_NAME` + `API_KEY` + `API_SECRET` |
| 3 | **bKash** payment | dev-simulation | App Key/Secret/Username/Password (real API কোড আছে ✅) |
| 4 | **SSLCommerz** payment | dev-simulation | Store ID + Password (real API কোড আছে ✅) |
| 5 | **Steadfast** courier | 503 (graceful) | `STEADFAST_API_KEY` + `SECRET_KEY` (+ optional webhook secret) |
| 6 | **Google OAuth** login | button hidden | `GOOGLE_CLIENT_ID` + `SECRET` + client `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| 7 | **AI Vision** (image search upgrade) | smart color-matcher (কাজ করছে) | যেকোনো ১টা: OpenAI / Google Vision / Clarifai / HuggingFace key |

---

## 2️⃣ Code completion বাকি (key দিলেও কোড লিখতে হবে)

এগুলো এখন dev-simulation/placeholder-এ চলে — লাইভ করতে বাকি কোড লিখতে হবে।

- [ ] **Nagad live** — provider session HTTP call বাকি → `payment.service.ts` `TODO(nagad-live)` (init → sign challenge → complete)
- [ ] **Rocket / DBBL live** — merchant checkout call বাকি → `payment.service.ts` `TODO(rocket-live)`
- [ ] **Google "Connect" button (admin/user profile)** — এখন `"coming soon"` toast; real connect/link flow wiring বাকি (login পেজের Google flow কিন্তু সম্পূর্ণ, শুধু profile-এর connect button placeholder)

> bKash + SSLCommerz এর live API কোড **সম্পূর্ণ** — শুধু key দরকার (Section 1)।

---

## 3️⃣ Feature / UI বাকি (নতুন করে বানাতে হবে)

- [ ] **Finance report — Date-range filter UI** (custom period; এখন full-range summary চলে)
- [ ] **Legal pages content** — Terms / Privacy / Refund এখন খালি (`"Content coming soon"`); admin panel → Site Content থেকে লেখা বসাতে হবে
- [ ] **Admin-saved theme load from API** — `ThemeContext.tsx` `TODO` (minor / optional)

---

## 4️⃣ Live testing বাকি (credential পাওয়ার পর একবার যাচাই)

- [ ] Order confirmation / invoice / OTP / reset email — **real delivery** (SMTP পেলে)
- [ ] Live bKash / SSLCommerz / Nagad / Rocket payment (real key দিয়ে)
- [ ] Steadfast — live booking + webhook + auto-sync cron (`STEADFAST_AUTO_SYNC=true`)

---

## 5️⃣ Infrastructure / Deployment বাকি

- [ ] **Domain + DNS** (যেমন `skawsarsunnahmart.com`)
- [ ] **Production hosting** — client (Vercel) + server (Render), ক্লায়েন্টের নিজের অ্যাকাউন্টে
- [ ] **MongoDB Atlas** — এখন dev cluster (`skawsar`); production-এ ক্লায়েন্টের নিজের অ্যাকাউন্টে নেওয়া (ডেটার মালিকানা)
- [ ] **Cloudinary** production account
- [ ] **Production JWT secrets** (নতুন করে generate)
- [ ] **Render keep-alive** (cron-job.org) — free tier ঘুমানো আটকাতে
- [ ] Env vars set on Vercel + Render (`.env`-এর সব key hosting-এ বসানো)

---

## 6️⃣ Business content — client থেকে নিতে হবে (কোড লাগে না)

Admin panel → **Site Content** থেকে বসানো যায়, কিন্তু তথ্য client দেবে।

- [ ] **যোগাযোগ:** support email · phone (1–2) · WhatsApp · office address · social links (FB/IG/YT/TikTok)
- [ ] **Manual payment numbers:** bKash / Nagad / Rocket number + type (Personal/Agent/Merchant) · COD on/off
- [ ] **Branding:** logo (PNG transparent) · favicon · hero banner images (3–5)
- [ ] **Legal text:** Terms & Conditions · Privacy Policy · Return/Refund Policy
- [ ] **Delivery:** ঢাকার ভেতরে/বাইরে charge · free-delivery threshold · কত দিন লাগে
- [ ] **Product catalog:** name · description · price · **cost price (net profit-এর জন্য জরুরি)** · stock · brand · color/size · images (প্রতি প্রোডাক্টে ≥3) — *Excel/CSV দিলে bulk upload দিয়ে একসাথে তোলা যাবে*

---

## 7️⃣ Optional cleanup (nice-to-have, non-blocking)

- [ ] User model-এ duplicate `email` index warning সরানো (`unique: true` + `schema.index({email})` — cosmetic Mongoose warning)
- [ ] QA test data cleanup — `node scripts/qa-cleanup.mjs` (S-Kawsar-Sunnah-Mart_server ফোল্ডার থেকে) চালালে dashboard finance ৳0 হবে
- [ ] Dead-code sweep (optional code-quality)

---

## ✅ যা ইতিমধ্যে সম্পূর্ণ (রেফারেন্সের জন্য)

Auth (register/login/OTP/reset/logout/guards) · Category & Product CRUD (variants/specs/bulk) · Image upload · Homepage/Listing/Search/Image-search · Cart/Checkout/Guest · **Coupons (stacking সহ)** · Order lifecycle + 7-step tracking · Payment (COD live + 4 gateway simulation) · **Real-time finance + socket notifications** · User & Admin dashboards · Wishlist/Reviews · Returns/Newsletter/Invoice · **SEO (robots + sitemap + metadata)** · Responsive UI · 0 TypeScript/console error.

**সংক্ষেপে:** সিস্টেম functionally ready — বাকি প্রায় সবই **credential/content/deploy** (কোড নয়), শুধু **Nagad+Rocket live** ও **date-range filter UI** নতুন কোড।
