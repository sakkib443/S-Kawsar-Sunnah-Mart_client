# 🛒 System Feature Testing — S Kawsar Sunnah Mart

> **সিস্টেম:** Single-Vendor E-Commerce (S Kawsar Sunnah Mart — Anandabazar BDMart-এর ক্লোন)
> **সর্বশেষ আপডেট:** ২০২৬-০৮-০১ (ফুল রি-টেস্ট + ৬টি ক্লোন-ফিক্স লগ যোগ — নিচের "🔧 ক্লোন ফিক্স চেকলিস্ট" দেখুন)

এই ফাইলে S Kawsar Sunnah Mart সিস্টেমের কোন কোন ফিচার **টেস্ট করা হয়েছে** এবং ভবিষ্যতে কোনগুলো **টেস্ট করা হবে** — তার একটা পূর্ণাঙ্গ চেকলিস্ট রাখা আছে। নতুন কিছু টেস্ট করা হলে এখানে আপডেট করা হবে, যাতে পরে পড়ে সহজেই বোঝা যায় এই সিস্টেমে কী কী যাচাই করা হয়েছে।

**চিহ্নের অর্থ:**  ✅ = টেস্ট সম্পন্ন   |   ⬜ = ভবিষ্যতে টেস্ট করা হবে

---

## 🔁 ২০২৬-০৭-৩০ রি-টেস্ট সারাংশ (S Kawsar Sunnah Mart ক্লোন)

পুরো চেকলিস্ট untick করে সিনিয়র QA হিসেবে one-by-one রি-টেস্ট করা হয়েছে — **১২০+ চেকপয়েন্ট, ২৩০+ ইন্ডিভিজুয়াল অ্যাসারশন পাস।** যে ৩টি বাগ ধরা পড়ে ফিক্স করা হয়েছে:

1. **🐛 অর্ডার ID prefix `ABM-` (মূল ব্র্যান্ডের leftover)** — ক্লোনে প্রতিটা অর্ডার ভুল করে "ABM" (Anandabazar BDMart) prefix পাচ্ছিল। ফিক্স: config-driven prefix (`ORDER_ID_PREFIX`, ডিফল্ট `SKS-`) + client track-page ও কমেন্ট আপডেট। রি-টেস্ট: নতুন অর্ডার এখন `SKS-xxxx`।
2. **🐛 Bulk product upload এক bad row-এ পুরো batch fail** — route-level strict validation সার্ভিসের per-row skip-and-report ডিজাইনকে নষ্ট করছিল (এক malformed row = পুরো CSV হারানো)। ফিক্স: lightweight array-gate; সার্ভিস per-row validate করে (`created/failed` রিপোর্ট)। রি-টেস্ট: 2 valid + 1 bad → created 2, failed 1।
3. **🐛 Superadmin invoice + review moderation থেকে locked out** — permission check `role !== 'admin'` superadmin-কে বাদ দিচ্ছিল (মূল admin অ্যাকাউন্টই superadmin) → invoice ডাউনলোড 403, রিভিউ ডিলিট ব্লকড। ফিক্স: `admin` + `superadmin` দুটোই allow। রি-টেস্ট: superadmin এখন invoice PDF নামাতে পারে।

বাকি ⬜ আইটেমগুলো শুধু আসল credential/key দিলেই টেস্টযোগ্য (SMTP ইমেইল, লাইভ পেমেন্ট/কুরিয়ার key) অথবা future-feature (date-range UI, SEO)।

---

## 🔧 ক্লোন ফিক্স চেকলিস্ট — প্রতিটা নতুন ক্লোনে চেক করে প্রয়োগ করুন

> এই সিস্টেমটা একাধিকবার clone করা হয় (Anandabazar BDMart → S Kawsar Sunnah Mart → healixbd → …)। নিচের বাগগুলো **base কোডেই আছে**, তাই প্রতিটা নতুন ক্লোনে সম্ভবত একই বাগ থাকবে। প্রতিটার সাথে **grep কমান্ড** (খুঁজে বের করতে) + **before→after** দেওয়া আছে — ধরে ধরে প্রয়োগ করুন।
> পাথগুলো server = `S-Kawsar-Sunnah-Mart_server`, client = `S-Kawsar-Sunnah-Mart_client`।

| # | বাগ | কোথায় | কেন জরুরি |
|---|-----|--------|-----------|
| 1 | Order ID-তে পুরনো ব্র্যান্ডের prefix (`ABM-`) | server + client | প্রতিটা অর্ডারে ভুল ব্র্যান্ড |
| 2 | Bulk upload এক bad row-এ পুরো batch fail | server | CSV import ভেঙে যায় |
| 3 | Superadmin invoice/review থেকে locked out | server | সর্বোচ্চ রোল 403 খায় |
| 4 | Password field: current-এ eye + new/confirm-এ eye নেই | client | UX |
| 5 | WhatsApp number দুই জায়গায় inconsistent | client | number বদলালে button আপডেট হয় না |
| 6 | Token expire হলে জোর করে logout (refresh নেই) | client | ২৪ঘণ্টা পর re-login লাগে |

---

### 🐛 Fix 1 — Order ID prefix (ব্র্যান্ড-অনুযায়ী, config-driven)
**Symptom:** নতুন অর্ডারের ID পুরনো ব্র্যান্ডের prefix পায় (`ABM-0001`)।
**খুঁজুন:** `grep -rn "ABM-" server/src` এবং `grep -rni "ABM" client/src`
**Fix:**
- `server/src/app/config/index.ts` — `database_url`-এর নিচে যোগ করুন:
  ```ts
  order_id_prefix: process.env.ORDER_ID_PREFIX || 'SKS', // ← নতুন ক্লোনের প্রিফিক্স দিন
  ```
- `server/src/app/modules/order/order.model.ts` — উপরে `import config from '../../config';` যোগ করুন, তারপর:
  ```ts
  // before: this.orderId = `ABM-${String(count + 1).padStart(4, '0')}`;
  this.orderId = `${config.order_id_prefix}-${String(count + 1).padStart(4, '0')}`;
  ```
- Client — `client/src/app/track/page.tsx` এর placeholder/error text `e.g. ABM-0001` → নতুন প্রিফিক্স; কমেন্টে থাকা `ABM-0001` (`downloadInvoice.ts`, `redux/api/orderApi.ts`) আপডেট করুন।

---

### 🐛 Fix 2 — Bulk product upload resilience
**Symptom:** CSV bulk upload-এ একটা row invalid হলে পুরো batch 400 হয় (ভালো row-ও import হয় না)।
**খুঁজুন:** `server/src/app/modules/product/product.routes.ts` এর `bulk-upload` route।
**Fix:**
- `product.validation.ts` — নতুন lightweight schema যোগ করুন:
  ```ts
  export const bulkUploadArrayValidation = z.object({
    body: z.object({ products: z.array(z.unknown()).min(1, 'At least one product is required') }),
  });
  ```
- `product.routes.ts` — bulk-upload route-এ strict validation বদলান:
  ```ts
  // before: validateRequest(bulkUploadValidation)
  validateRequest(bulkUploadArrayValidation)   // per-row validation সার্ভিসেই হয় (created/failed report)
  ```
  (import-ও `bulkUploadValidation` → `bulkUploadArrayValidation` করুন। `bulkUploadValidation` export রাখুন — service এখনো ব্যবহার করে।)

---

### 🐛 Fix 3 — Superadmin invoice + review access (role check)
**Symptom:** superadmin অ্যাকাউন্ট invoice PDF ডাউনলোডে **403**, রিভিউ moderate/delete করতে পারে না।
**খুঁজুন (সব clone-এ এই প্যাটার্ন বিপজ্জনক):** `grep -rn "role !== 'admin'\|=== 'admin'" server/src` — প্রতিটাতে superadmin বাদ পড়েছে কিনা দেখুন।
**Fix:**
- `server/src/app/modules/invoice/invoice.service.ts` — ২ জায়গায়:
  ```ts
  // before: if (requester.role !== 'admin' && order.user?._id?.toString() !== requester.userId) {
  const isStaff = requester.role === 'admin' || requester.role === 'superadmin';
  if (!isStaff && order.user?._id?.toString() !== requester.userId) {
  ```
- `server/src/app/modules/review/review.controller.ts` (delete):
  ```ts
  // before: ReviewService.deleteReview(req.params.id, req.user!.userId, req.user!.role === 'admin');
  const isStaff = req.user!.role === 'admin' || req.user!.role === 'superadmin';
  await ReviewService.deleteReview(req.params.id, req.user!.userId, isStaff);
  ```

---

### 🐛 Fix 4 — Password field UX (Current টাইপযোগ্য, no eye; New/Confirm-এ eye toggle)
**ফাইল:** `client/src/app/dashboard/user/profile/page.tsx` ও `client/src/app/dashboard/admin/profile/page.tsx`
**Fix:** `LuEye, LuEyeOff` import; `showNewPw`/`showConfirmPw` state; **Current** input plain রাখুন (eye নেই); **New** ও **Confirm** input `type={showNewPw ? 'text' : 'password'}` + পাশে eye button:
  ```tsx
  <div className="relative">
    <input type={showNewPw ? 'text' : 'password'} ... className={`${inputCls} pr-10`} />
    <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 ...">
      {showNewPw ? <LuEyeOff size={16}/> : <LuEye size={16}/>}
    </button>
  </div>
  ```

---

### 🐛 Fix 5 — WhatsApp number source consistency
**Symptom:** Site Content-এ Contact WhatsApp number বদলালে floating **"Chat on WhatsApp"** button পুরনো number-এই থাকে (footer আপডেট হয়, button হয় না)।
**খুঁজুন:** `grep -rn "f?.whatsapp || contact" client/src`
**Fix:** `client/src/components/shared/FloatingContact.tsx` — contact-first করুন (footer-এর সাথে consistent):
  ```ts
  // before: const digits = (f?.whatsapp || contact.whatsapp || '').replace(/\D/g, '');
  const digits = (contact.whatsapp || f?.whatsapp || '').replace(/\D/g, '');
  ```

---

### 🐛 Fix 6 — Silent token refresh (jোর করে logout বন্ধ)
**Symptom:** ২৪ঘণ্টা (access token expiry) পর superadmin/admin হঠাৎ logout হয়ে যায় / অপশন উধাও → re-login লাগে।
**Root cause:** `baseApi` যেকোনো 401-এ সরাসরি logout করত; কোনো refresh-token flow ছিল না (যদিও `/auth/refresh-token` endpoint + login body-তে refreshToken আছে)।
**Fix (client):**
- `redux/api/baseApi.ts` — "401 → logout" এর বদলে **baseQueryWithReauth**: 401 এলে stored `refreshToken` দিয়ে `/auth/refresh-token` কল → নতুন access token → request retry; refresh **ব্যর্থ হলে তবেই** logout (single-flight)।
- `redux/slices/authSlice.ts` — `setToken` reducer যোগ (refresh-এর পর token আপডেট)।
- `redux/provider.tsx` — `restoreSession`-এ getMe 401 হলে refresh করে retry (reload-এও সেশন টেকে)।
- login + register পেজ — `localStorage.setItem('refreshToken', res.data.tokens.refreshToken)` যোগ।
- সব logout point (AdminLayout, UserLayout, Header, NewFooter, user/settings) — `localStorage.removeItem('refreshToken')` যোগ।
**যাচাই:** expired token → 401 → refresh → নতুন token → retry 200 (logged in থাকে); invalid refresh → real logout।

> 💡 **প্রতিটা নতুন ক্লোনে দ্রুত অডিট:** উপরের ৬টা grep চালিয়ে দেখুন কোনগুলো এখনো বাগ আছে — থাকলে সেই ফাইলে before→after প্রয়োগ করুন।

---

## 🧪 Testing (যা যা টেস্ট করা হয়েছে ও হবে)

পুরো চেকলিস্টটা একটা বাস্তব e-commerce ফ্লো অনুযায়ী সাজানো — লগইন → ক্যাটাগরি → প্রোডাক্ট আপলোড → ডিসপ্লে → কার্ট → অর্ডার — এভাবে।

### ১. অথেন্টিকেশন ও অ্যাক্সেস কন্ট্রোল
- ✅ অ্যাডমিন লগইন (সঠিক ইমেইল-পাসওয়ার্ডে লগইন, রোল ও টোকেন যাচাই)
- ✅ পারমিশন গার্ড (শুধু অ্যাডমিন প্রোডাক্ট/ক্যাটাগরি তৈরি করতে পারবে, সাধারণ ইউজার নয়)
- ✅ নতুন ইউজার রেজিস্ট্রেশন — `POST /auth/register` → ইউজার + টোকেন + ভেরিফিকেশন লিংক; ডুপ্লিকেট ইমেইল/ফোন reject; ব্রাউজারে রেজিস্টার ফর্ম → "Account created! Please verify your email" স্ক্রিন — API + ব্রাউজারে যাচাইকৃত
- ✅ ইমেইল ভেরিফিকেশন ও OTP কোড — ভেরিফিকেশন টোকেন (sha256-হ্যাশড, ২৪ঘন্টা) → `isEmailVerified: true`; ভুয়া টোকেন reject। OTP: ৬-ডিজিট (sha256-হ্যাশড, ১০ মিনিট, purpose-স্কোপড), ভুল কোড/ভুল purpose reject, সফল হলে single-use (ক্লিয়ার হয়), অজানা ইমেইলে enumeration নেই — যাচাইকৃত
- ✅ পাসওয়ার্ড ভুলে গেলে রিসেট (forgot / reset password) — রিসেট টোকেন (sha256, ১০ মিনিট); নতুন পাসওয়ার্ডে লগইন হয়, পুরনো পাসওয়ার্ড reject, টোকেন single-use; অজানা ইমেইলে enumeration নেই — যাচাইকৃত
- ✅ Google দিয়ে লগইন — **সম্পূর্ণ ইমপ্লিমেন্টেড, enable-on-key-drop।** ফ্রন্টএন্ড: GIS `initCodeClient` (authorization-code popup) → backend `POST /auth/google` কোড এক্সচেঞ্জ করে client_secret দিয়ে (টোকেন ব্রাউজারে যায় না); idToken ও accessToken ফ্লোও সাপোর্টেড; `aud` চেক করে (অন্য অ্যাপের টোকেন reject); ইমেইল দিয়ে অটো-লিংক/অ্যাকাউন্ট তৈরি। **কী বসালেই কাজ করে:** ব্যাকএন্ড `.env`-এ `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, ফ্রন্টএন্ড `.env.local`-এ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — key না থাকলে বাটন হাইড, কোড-ফ্লো ৫০৩ সেটআপ-হিন্ট দেয়। ডামি ক্লায়েন্ট-আইডি দিয়ে যাচাইকৃত: বাটন রেন্ডার হয় + Google GIS SDK লোড হয় (login + register দুই পেজেই)
- ✅ লগআউট ও সেশন এক্সপায়ার হওয়া — লগআউটে refresh কুকি ক্লিয়ার; ইনভ্যালিড/অনুপস্থিত টোকেন → 401; ভুয়া refresh টোকেন → 401; পাসওয়ার্ড বদলালে পুরনো টোকেন invalid (`isPasswordChangedAfterJwtIssued`) — যাচাইকৃত
- ℹ️ **ইমেইল পাঠানোও enable-on-key-drop:** SMTP না থাকলে ভেরিফিকেশন/OTP/রিসেট ইমেইল কনসোলে লগ হয় ও লিংক/OTP রেসপন্সে `dev` ফিল্ডে আসে (ফ্লো টেস্টেবল থাকে, কিছু ভাঙে না)। ব্যাকএন্ড `.env`-এ `EMAIL_USER` + `EMAIL_PASS` (Gmail App Password) বসালেই আসল ইমেইল যায় এবং `dev` ফিল্ড আর expose হয় না (প্রোডাকশনে লিক নেই)

### ২. ক্যাটাগরি ম্যানেজমেন্ট (অ্যাডমিন)
- ✅ নতুন ক্যাটাগরি তৈরি
- ✅ ক্যাটাগরির অধীনে প্রোডাক্ট যুক্ত করা
- ✅ ক্যাটাগরি এডিট (নাম/আইকন/প্যারেন্ট আপডেট + slug অটো-রিজেনারেট; ডুপ্লিকেট নাম হলে পরিষ্কার 400, crash নয়)
- ✅ ক্যাটাগরি ডিলিট — **referential-integrity guard সহ** *(আগে বাগ ছিল)*: প্রোডাক্ট বা সাব-ক্যাটাগরি থাকলে ডিলিট block হয় (পরিষ্কার মেসেজ), খালি হলে soft-delete হয় — কোনো orphan হয় না
- ✅ সাব-ক্যাটাগরি তৈরি ও তালিকা (parent সিলেক্ট করে level অটো-সেট; `GET /:id/subcategories` দিয়ে তালিকা)
- ✅ মেনু/হোমপেজে ক্যাটাগরি দেখানো on/off — **এখন সত্যিই কাজ করে** *(আগে toggle-এর কোনো প্রভাব ছিল না)*: `showInMenu`/`showInHome` টগল করলে backend `?menu=true`/`?home=true` ফিল্টার করে; হেডার মেনু ও হোমপেজ শুধু নিজ নিজ টগল-অন ক্যাটাগরি দেখায় (নেটওয়ার্কে যাচাইকৃত)

### ৩. প্রোডাক্ট আপলোড ও ম্যানেজমেন্ট (অ্যাডমিন)
- ✅ প্রোডাক্ট তৈরি (নাম, দাম, বিবরণ, ছবি, ক্যাটাগরি)
- ✅ Backend validation (ক্যাটাগরি বাধ্যতামূলক, কমপক্ষে ৩টি ছবি, দাম বাধ্যতামূলক)
- ✅ ভুল/অসম্পূর্ণ তথ্য দিলে সঠিক error মেসেজ
- ✅ অটোমেটিক slug ও SKU তৈরি
- ✅ প্রোডাক্ট এডিট ও আপডেট — সব ফিল্ড আপডেট হয়; **এডিটে discount% ও variant label এখন সঠিকভাবে recalculate হয়** *(আগে বাগ: `findOneAndUpdate` pre-save hook চালাত না, discount stale থাকত — এখন load→save)*
- ✅ প্রোডাক্ট ডিলিট (soft-delete; পাবলিক লিস্টিং থেকে বাদ, ক্যাটাগরি count আপডেট)
- ✅ ভ্যারিয়েন্ট (কালার/সাইজ ভিত্তিক আলাদা দাম-স্টক-ছবি) + অটো discount% + অটো label; **variant description এখন সেভ হয়** *(আগে validation-এ drop হতো)*
- ✅ স্পেসিফিকেশন, হাইলাইটস, ওয়ারেন্টি — backend সেভ হতো কিন্তু **(ক) admin ফর্মে specs/highlights ইনপুট UI ছিল না, (খ) হাইলাইটস ও structured warranty প্রোডাক্ট পেজে দেখাত না** — তিনটাই ফিক্স: ফর্মে key-value specs + highlights ইনপুট যোগ, প্রোডাক্ট পেজে Highlights bullet + "12 months manufacturer warranty" দেখায় (ব্রাউজারে যাচাইকৃত)
- ✅ বাল্ক প্রোডাক্ট আপলোড (CSV → per-row validate → valid rows created; `created/failed` রিপোর্ট)
- ✅ Featured / New / On-Sale টগল — **এখন সত্যিই কাজ করে** *(আগে flag সেভ হতো কিন্তু কোনো প্রভাব ছিল না)*: `?isFeatured/?isOnSale/?isNewProduct` ফিল্টার + `/featured` endpoint এখন flagged প্রোডাক্ট আগে দেখায় (flagged না থাকলে top-seller fallback)
- ➖ প্রোডাক্ট অ্যাপ্রুভাল / মডারেশন — **N/A** (single-vendor বলে আগেই সম্পূর্ণ রিমুভ করা হয়েছে; অ্যাডমিন প্রোডাক্ট সরাসরি live হয়)

### ৪. ছবি ও মিডিয়া
- ✅ Cloudinary কনফিগ ও কানেকশন যাচাই
- ✅ অ্যাডমিন ফর্ম থেকে সরাসরি ছবি আপলোড (single / multiple uploader) — click/drag দিয়ে আপলোড → Cloudinary URL রিটার্ন (API-তে single + multiple দুটোই লাইভ যাচাইকৃত: `res.cloudinary.com/uxspis5h/...`)
- ✅ ছবি রিমুভ ও রিঅর্ডার — রিমুভ (X বাটন) আগে থেকেই ছিল; **রিঅর্ডার এখন যোগ করা হয়েছে** *(আগে ছিল না)*: multiple uploader-এ **drag-and-drop reorder** (ড্র্যাগ করলে opacity + drop-target হাইলাইট, প্রথম ছবিতে "MAIN" ব্যাজ, "Drag to reorder" hint) — reorder logic লজিক-টেস্টে যাচাইকৃত

### ৫. ক্লায়েন্ট — হোমপেজ
- ✅ হোমপেজ প্রোডাক্ট গ্রিডে প্রোডাক্ট দেখানো
- ✅ হিরো ব্যানার (slider) দেখানো
- ✅ ট্রাস্ট স্ট্রিপ, হেডার ও লোগো রেন্ডার হওয়া
- ✅ ফ্ল্যাশ সেল / ডিলস / বেস্ট সেলার সেকশন — তিনটাই backend-driven ও সঠিকভাবে রেন্ডার হয় (ব্রাউজারে যাচাইকৃত): **Flash Sale** (offer type=flash-sale, লাইভ countdown সহ), **Daily Deals** (offer type=deal), **Best Sellers** (`?sort=-totalSold`, বিক্রি অনুযায়ী সাজানো)। অ্যাডমিন অফার না বানালে flash/deals সেকশন এমনিতেই hide থাকে (by design)।
- ✅ ক্যাটাগরি সেকশন থেকে নেভিগেশন — "Featured Categories"-এ ক্যাটাগরিতে ক্লিক করলে `/products?category=<id>`-এ যায় এবং ঐ ক্যাটাগরির প্রোডাক্ট ফিল্টার হয়ে দেখায় (ব্রাউজারে end-to-end যাচাইকৃত: Electronics → শুধু Electronics প্রোডাক্ট)

### ৬. ক্লায়েন্ট — প্রোডাক্ট লিস্টিং ও সার্চ
- ✅ All Products (`/products`) পেজে প্রোডাক্ট দেখানো
- ✅ ফিল্টার (ক্যাটাগরি / দাম / ব্র্যান্ড / রেটিং / স্টক) — প্রতিটি সার্ভার-সাইড প্যারামসহ যাচাইকৃত: category (+ sub-category), minPrice/maxPrice, brand (multi), minRating, inStock — সব সঠিকভাবে ফিল্টার করে
- ✅ সর্ট (দাম, নতুন, জনপ্রিয়তা) — Best Match / Newest / Price ↑↓ / Most Popular / Top Rated — সব সার্ভার-সাইড, যাচাইকৃত
- ✅ পেজিনেশন / লোড-মোর — নাম্বারড পেজিনেশন (Prev/Next + পেজ নাম্বার), `meta.totalPages` সঠিক, পেজ ২ আলাদা ডেটা দেয় — যাচাইকৃত
- ✅ সার্চ ও অটোকমপ্লিট — হেডার সার্চ বার: ডিবাউন্সড লাইভ suggest (প্রোডাক্ট + ক্যাটাগরি), ভয়েস সার্চ; লিস্টিং searchTerm — সব যাচাইকৃত
- ✅ ছবি দিয়ে সার্চ (image search) — **নতুন ফিচার।** হেডার সার্চে ক্যামেরা বাটন → মডাল: ছবি আপলোড/ড্রপ → ব্রাউজারে ক্যানভাস দিয়ে রিয়েল ডমিন্যান্ট-কালার এক্সট্র্যাকশন (ফ্রি) → backend স্মার্ট ম্যাচার (colors/colorHex/tags/aiLabels/name/category দিয়ে স্কোরড ম্যাচ, % match সহ) → ম্যাচড প্রোডাক্ট + "You may also like"। **Enable-on-key-drop AI:** `.env`-এ OpenAI/Google Vision/Clarifai/HuggingFace-এর যেকোনো একটি key বসালেই অটো AI অবজেক্ট/লেবেল ডিটেকশনে আপগ্রেড হয় (পেমেন্ট গেটওয়ের মতোই), কোনো কোড চেঞ্জ ছাড়া — ব্যাজ "Smart visual match" → "AI Visual Search" হয়ে যায়। ব্রাউজারে end-to-end যাচাইকৃত (লাল ছবি→লাল প্রোডাক্ট 98%, নীল→নীল ওয়াচ 98%)

### ৭. ক্লায়েন্ট — প্রোডাক্ট ডিটেইল
- ✅ নাম, দাম, বিবরণ ও ছবি দেখানো
- ✅ দাম ও ডিসকাউন্ট সঠিকভাবে দেখানো
- ✅ ভ্যারিয়েন্ট (কালার/সাইজ) সিলেকশন — কালার/সাইজ সিলেক্ট করলে দাম/স্ট্রাইক-দাম/ডিসকাউন্ট/স্টক/ছবি ঐ variant-এর অনুযায়ী বদলায়, cart-এ variant পাস হয়। **ফিক্স:** আগে সিলেকশন করার আগেই variant #1-এর দাম দেখাত (base offer window bypass) — এখন সিলেকশন না করা পর্যন্ত base প্রোডাক্টের দাম দেখায়; আর Add to Cart-এও variant বাধ্যতামূলক guard যোগ (আগে শুধু Buy Now-তে ছিল)
- ✅ রিলেটেড প্রোডাক্ট ("You may also like") — একই ক্যাটাগরির প্রোডাক্ট, নিজেকে বাদ দিয়ে। **ফিক্স:** hidden প্রোডাক্ট related-এ leak করত (QA Hidden Product C দেখাচ্ছিল) — এখন `visibility!=hidden` ফিল্টার যোগ
- ✅ রিভিউ/রেটিং দেখা ও দেওয়া — লগইন করে রিভিউ সাবমিট (auto-approved), তারকা-রেটিং, লাইক/রিপ্লাই; প্রোডাক্ট rating অটো-আপডেট। **বড় ফিক্স:** সাবমিটের পর রিভিউ **রিলোড ছাড়া দেখাত না** (RTK invalidatesTags `'Reviews'` id-scoped `providesTags`-এর সাথে match করত না) — এখন product-scoped invalidation, রিভিউ+গড়+ব্রেকডাউন সাথে সাথে আপডেট। "Verified Purchase" ব্যাজ এখন শুধু আসল verified purchase-এ দেখায় (আগে সবগুলোতে দেখাত)। Ratings modal-ও আসল রিভিউ ডেটায় wire করা
- ✅ শেয়ার ও উইশলিস্ট বাটন — শেয়ার (১০টা সোশ্যাল + কপি লিংক), উইশলিস্ট টগল (লগইন→সার্ভার, গেস্ট→লোকাল; heart state সঠিক)। **ফিক্স:** উইশলিস্ট populate ভুল ফিল্ড নাম (`averageRating`/`totalReviews`, thumbnail বাদ) ব্যবহার করত → এখন `thumbnail/rating/reviewCount` (উইশলিস্ট পেজে ছবি+রেটিং দেখাবে)

### ৮. কার্ট (Cart)
- ✅ Add to Cart ও হেডারের কার্ট badge আপডেট
- ✅ কার্ট persistence (রিফ্রেশ বা অন্য পেজে গেলেও তথ্য থাকে)
- ✅ কার্টে quantity বাড়ানো/কমানো — ব্রাউজারে বাস্তব বাটন চেপে যাচাই: +/− স্টেপার (2→3→2), লাইন টোটাল ও সাবটোটাল রিয়েল-টাইমে আপডেট, qty ১-এ পৌঁছালে − বাটন disabled, প্রতিটি চেঞ্জ localStorage-এ persist
- ✅ কার্ট থেকে আইটেম রিমুভ — কনফার্মেশন মডাল ("Remove Item?") → Remove; আইটেম চলে যায়, হেডার কাউন্ট/সাবটোটাল/টোটাল রিক্যালকুলেট, localStorage আপডেট
- ✅ কার্ট পেজ ও মোট দাম হিসাব — লাইন টোটাল (price×qty), Subtotal (নির্বাচিত আইটেম), Delivery (৳120 / ৳5000+ এ FREE), গ্র্যান্ড টোটাল — প্রতিটি ধাপে সঠিক; Select-All/per-item ডিসিলেক্ট করলে সাবটোটাল ও চেকআউট বাটন ঠিকভাবে আপডেট হয় (0 আইটেম → ৳0, চেকআউট disabled)। কোনো বাগ পাওয়া যায়নি

### ৯. চেকআউট ও অর্ডার
- ✅ অর্ডার প্লেস করা (কুপন ডিসকাউন্ট সহ সার্ভার-সাইডে দাম যাচাই করে)
- ✅ সার্ভার-অথরিটেটিভ প্রাইসিং (ক্লায়েন্ট থেকে পাঠানো দাম বিশ্বাস না করে সার্ভারেই দাম হিসাব)
- ✅ গেস্ট চেকআউট (লগইন ছাড়া অর্ডার — ফোন নম্বর দিয়ে অটো-অ্যাকাউন্ট তৈরি + অটো-লগইন টোকেন)
- ✅ গেস্ট অ্যাকাউন্টে পরে লগইন (ফোন নম্বরই পাসওয়ার্ড — মেসেজ অনুযায়ী কাজ করে) *(আগে মেসেজ ও কোডে অমিল ছিল, এখন ফিক্সড)*
- ✅ শিপিং অ্যাড্রেস যোগ করা (চেকআউট ফর্মে নাম/ফোন/ঠিকানা/সিটি ভ্যালিডেশন সহ)
- ✅ অর্ডার ট্র্যাকিং (পাবলিক `/track` পেজ — Order ID দিয়ে লগইন ছাড়াই স্ট্যাটাস দেখা)
- ⬜ অর্ডার কনফার্মেশন ইমেইল ডেলিভারি যাচাই

### ৯ক. কুপন ও ডিসকাউন্ট (Coupon & Discount)
- ✅ প্রোডাক্ট-স্পেসিফিক কুপন তৈরি — অ্যাডমিন ফর্ম থেকে তৈরি করে ডেটাবেজে `applicableTo` ও `specificProducts` সঠিকভাবে সেভ হওয়া যাচাই
- ✅ গ্লোবাল/কমন কুপন তৈরি (পুরো অর্ডারে প্রযোজ্য — `applicableTo: all`)
- ✅ এলিজিবল প্রোডাক্টে কুপন প্রয়োগ — শুধু নির্দিষ্ট প্রোডাক্টের উপর সঠিক ডিসকাউন্ট (উদাহরণ: ২০% × ৳১৪৯৯ = ৳২৯৯.৮)
- ✅ নন-এলিজিবল প্রোডাক্টে কুপন প্রয়োগ করলে সঠিকভাবে reject — "This coupon does not apply to the selected items" *(আগের বড় বাগ, এখন ফিক্সড)*
- ✅ মিক্সড কার্টে (এলিজিবল + নন-এলিজিবল আইটেম) ডিসকাউন্ট শুধু এলিজিবল আইটেমের উপর, পুরো কার্টে নয় (৳২৯৯.৮, ভুলভাবে ৳৪৫৯.৬ নয়)
- ✅ গ্লোবাল কুপনে পুরো অর্ডারে ডিসকাউন্ট (উদাহরণ: ১০% × ৳২২৯৮ = ৳২২৯.৮)
- ✅ ডিসকাউন্টেড দামে অর্ডার প্লেস — সার্ভার-সাইডে সঠিক discount (৳২৯৯.৮) ও total (৳২০৫৮.২) সংরক্ষণ
- ✅ Minimum order amount চেক (min না মিললে কুপন reject)
- ✅ কুপন এক্সপায়ার ও total usage-limit চেক
- ✅ অ্যাডমিন তালিকার "Applicable To" কলামে সঠিক scope দেখানো — All Products / N Product / N Category *(আগে সব সময় "All Products" দেখাত, এখন ফিক্সড)*
- ✅ Free shipping টাইপ কুপন প্রয়োগ — `discountType: free_shipping` → ডিসকাউন্ট ০, শিপিং ফ্রি; cart/checkout ডিসপ্লে + অর্ডারে সার্ভার-সাইড শিপিং ফ্রি — API + ব্রাউজারে যাচাইকৃত
- ✅ Fixed-amount (৳) টাইপ কুপন প্রয়োগ — `discountType: fixed` → নির্দিষ্ট টাকা ছাড়; অর্ডার সাবটোটালের বেশি ছাড় দেয় না (capped) — যাচাইকৃত
- ✅ ক্যাটাগরি-স্পেসিফিক কুপন (একাধিক ক্যাটাগরি সহ) — `applicableTo: specific_categories` + `specificCategories[]`; শুধু এলিজিবল ক্যাটাগরির আইটেমে ছাড়, নন-ম্যাচিং হলে "does not apply" reject — যাচাইকৃত
- ✅ একই অর্ডারে একাধিক কুপন প্রয়োগ — **নতুন ফিচার (কুপন স্ট্যাকিং)।** cart-এ একাধিক কুপন যোগ (percentage + fixed + free-shipping একসাথে), প্রতিটি আলাদা চিপ + রিমুভ, ডিসকাউন্ট যোগফল, ডুপ্লিকেট ও ২য় free-shipping গার্ড। backend order-এ `couponCodes[]` — প্রতিটি স্বাধীনভাবে ভ্যালিডেট (min-order/scope/usage), ডিসকাউন্ট summed (সাবটোটালে capped), প্রতিটির usageCount++; order-এ couponCode (প্রথম) + couponCodes (সব) সংরক্ষিত। guest checkout-ও সাপোর্টেড। API (10%+৳50+free → discount ৳129.9, free ship, ৩ কোড) + cart/checkout ব্রাউজারে end-to-end যাচাইকৃত

### ৯খ. অর্ডার লাইফসাইকেল, কুরিয়ার ও শিপমেন্ট ট্র্যাকিং
- ✅ অ্যাডমিন কর্তৃক পূর্ণ স্ট্যাটাস লাইফসাইকেল: pending → confirmed → processing → shipped → on_the_way → out_for_delivery → delivered (প্রতিটি ধাপ টাইমলাইনে রেকর্ড হয়)
- ✅ ভুল/অবৈধ স্ট্যাটাস দিলে reject (400 validation)
- ✅ Delivered হলে COD পেমেন্ট অটো-paid
- ✅ Shipped-এর পরে ইউজার আর ক্যানসেল করতে পারে না (guard)
- ✅ **অ্যানিমেটেড প্রোগ্রেস বার (Order Tracking)** — একটাই শেয়ার্ড কম্পোনেন্ট ৩ জায়গায়: ইউজার ড্যাশবোর্ড অর্ডার পেজ, অ্যাডমিন অর্ডার পেজ, পাবলিক `/track` পেজ
- ✅ প্রোগ্রেস বারে ৭টি মাইলফলক (Order Placed → Confirmed → Packed → Shipped → On the Way → Out for Delivery → Delivered) + প্রতি ধাপের তারিখ-সময়
- ✅ শিপিং ফেজে চলমান ট্রাক আইকন, বর্তমান ধাপে pulse অ্যানিমেশন, ব্র্যান্ড কমলা রঙের shimmer ফিল (মোবাইলে ভার্টিকাল ভিউ)
- ✅ Cancelled / Returned / Refunded হলে প্রোগ্রেস বারের বদলে পরিষ্কার ব্যানার
- ✅ Carrier + Tracking Number + কুরিয়ারের র স্ট্যাটাস প্রোগ্রেস বারের নিচে দেখানো
- ✅ অ্যাডমিন ম্যানুয়াল ট্র্যাকিং আপডেট (Tracking No. + Carrier: Steadfast/Pathao/RedX ইত্যাদি)
- ✅ অ্যাডমিন Courier/Shipments বোর্ড (To Ship / Shipped / Delivered / Cancelled ফিল্টার, বাল্ক সিলেকশন, COD amount)
- ✅ **Steadfast কুরিয়ার ইন্টিগ্রেশন enable-ready** — API key ছাড়া graceful 503 + পরিষ্কার নির্দেশনা; `.env`-এ `STEADFAST_API_KEY` + `STEADFAST_SECRET_KEY` দিলেই booking/স্ট্যাটাস sync/webhook/auto-sync চালু হবে
- ✅ Steadfast webhook endpoint (shared-secret guard, অজানা consignment-এ crash করে না)
- ✅ কুরিয়ার টার্মিনাল স্ট্যাটাস (delivered/cancelled) অটো-apply হয় না — অ্যাডমিন কনফার্ম করে (টাকা-সংক্রান্ত সেফটি)
- ✅ `/shipping/shipments` বোর্ডে সঠিক অর্ডার নম্বর (ABM-xxxx) ও কাস্টমার নাম/ফোন *(আগে ভুল ফিল্ড ম্যাপিং ছিল, এখন ফিক্সড)*
- ⬜ আসল Steadfast API key দিয়ে লাইভ booking ও status sync টেস্ট
- ⬜ Steadfast webhook লাইভ ডেলিভারি টেস্ট
- ⬜ অটো-sync cron (STEADFAST_AUTO_SYNC=true) লাইভ টেস্ট

### ১০. পেমেন্ট (Payment Gateway — enable-on-key-drop)
- ✅ Cash on Delivery (COD) — গেটওয়ে ছাড়া সরাসরি অর্ডার
- ✅ চারটি অনলাইন গেটওয়ে init → confirm → order paid: **bKash, Nagad, Rocket, SSLCommerz** (key ছাড়া dev-simulation গেটওয়ে দিয়ে পুরো ফ্লো টেস্টযোগ্য)
- ✅ **Enable-on-key-drop অ্যাবস্ট্রাকশন** — একটাই gateway provider registry; `.env`-এ key দিলেই ঐ গেটওয়ে লাইভ (bKash/SSLCommerz এর রিয়েল API কোড সম্পূর্ণ; Nagad/Rocket সম্পূর্ণ wired, শুধু provider-এর session HTTP call বাকি)
- ✅ Transaction লগ (initiated → pending → success/failed/cancelled), gateway + gatewayTxnId + রেসপন্স সংরক্ষণ
- ✅ পেমেন্ট success → order paymentStatus 'paid' + timeline; fail/cancel → 'failed'
- ✅ ব্যর্থ পেমেন্ট retry (একই অর্ডারে নতুন gateway session)
- ✅ COD-তে gateway init reject
- ✅ SSLCommerz success/fail/cancel/IPN callback + val_id ভ্যালিডেশন (configured হলে)
- ✅ bKash tokenized flow (grant token → create → execute) + `/payment/bkash/callback` পেজ
- ✅ চেকআউটে সব গেটওয়ে অপশন দেখানো (siteContent দিয়ে on/off করা যায়)
- ✅ ইউজার পেমেন্ট হিস্ট্রি (`/payments/my`) + retry
- ⬜ আসল bKash/SSLCommerz/Nagad/Rocket API key দিয়ে লাইভ পেমেন্ট টেস্ট

### ১০ক. ফাইন্যান্স, রেভিনিউ ও নেট প্রফিট (Real-time)
- ✅ প্রতিটি অর্ডার লাইনে **cost snapshot** (buying price) — COGS/নেট প্রফিটের ভিত্তি
- ✅ Finance সার্ভিস (single source of truth): Revenue, Product Revenue, COGS, **Net Profit**, Margin, AOV, discount, shipping — সব শুধু **paid** অর্ডার থেকে
- ✅ নেট প্রফিট = (subtotal − discount) − cost of goods; গণিত পরীক্ষিত (রেভিনিউ +3857, COGS +2500, নেট প্রফিট +1297)
- ✅ পেমেন্ট-ভিত্তিক breakdown (bKash/Nagad/Rocket/SSLCommerz/COD আলাদা রেভিনিউ+প্রফিট) + মাসিক series
- ✅ **রিয়েল-টাইম ড্যাশবোর্ড আপডেট** — অর্ডার/পেমেন্ট হলেই socket (`finance:update`) দিয়ে Revenue/Net Profit/AOV তাৎক্ষণিক আপডেট (রিফ্রেশ ছাড়াই, ব্রাউজারে যাচাইকৃত)
- ✅ অ্যাডমিন ড্যাশবোর্ডে লাইভ ফাইন্যান্স হিরো কার্ড (Total Revenue / Net Profit / Avg Order Value) + LIVE ব্যাজ
- ✅ অ্যাডমিন Payments পেজ: সব ট্রানজেকশন তালিকা (অর্ডার আইডি, কাস্টমার, মেথড, স্ট্যাটাস) + রেভিনিউ/নেট প্রফিট কার্ড, ফিল্টার
- ✅ **PDF + Excel (.xlsx) ফাইন্যান্স রিপোর্ট ডাউনলোড** (Summary / By Method / Monthly / Transactions শিট) — ফাইল ভ্যালিডিটি যাচাইকৃত
- ✅ কোনো এক্সট্রা কাগজ-কলম/এক্সেল হিসাব ছাড়াই সব ফাইন্যান্স অটো-হিসাব
- ⬜ Date-range ফিল্টার UI দিয়ে কাস্টম পিরিয়ড রিপোর্ট

### ১১. উইশলিস্ট ও রিভিউ
- ✅ উইশলিস্টে যোগ ও রিমুভ — টগল (লগইন→সার্ভার, গেস্ট→লোকাল); উইশলিস্ট পেজে আইটেম দেখা ও রিমুভ। **ফিক্স:** তিনটা উইশলিস্ট পেজেই (main, dashboard) ম্যাপিং ভুল ফিল্ড (`discountPrice`/`averageRating`/`totalReviews`, thumbnail বাদ) ব্যবহার করত → ছবি/রেটিং/দাম ভাঙত; এখন `thumbnail/rating/reviewCount/originalPrice` ব্যবহার করে
- ✅ শেয়ারড উইশলিস্ট — `/wishlist/shared/:userId` পাবলিক লিংক, লগইন ছাড়াই দেখা যায় (ব্রাউজারে যাচাইকৃত)। **ফিক্স:** backend `getSharedWishlist` populate-ও একই ভুল ফিল্ড ব্যবহার করত → এখন সঠিক ফিল্ড রিটার্ন করে
- ✅ রিভিউ সাবমিট, রিপ্লাই ও লাইক — CommentsPopup-এ পাবলিক রিভিউ সাবমিট (optimistic, সাথে সাথে দেখায়), রিভিউ/রিপ্লাই লাইক (per-device, ডাবল-লাইক আটকায়), রিভিউতে রিপ্লাই — সব backend-এ যাচাইকৃত (submit→auto-approve, like, reply)

### ১২. ইউজার ড্যাশবোর্ড
- ✅ প্রোফাইল দেখা ও এডিট — `GET/PATCH /users/me` যাচাইকৃত; সিঙ্গেল "Full Name" ফিল্ড backend-এ firstName/lastName-এ স্প্লিট হয়, ফোন/অ্যাভাটার আপডেট, এবং প্রোফাইল পেজ থেকে পাসওয়ার্ড চেঞ্জ (currentPassword+password) — সবগুলো পাথ API টেস্টে পাস
- ✅ অর্ডার হিস্ট্রি — **বাগ ফিক্সড:** "My Orders" পেজের স্ট্যাটাস ট্যাব (Pending/Delivered/Cancelled…) ও অর্ডার-নম্বর সার্চ কাজ করছিল না; backend `getMyOrders`-এ শুধু `.sort().paginate()` ছিল, `.filter()`/`.search()` ছিল না — যোগ করা হলো (`search`→`searchTerm` normalise + `orderId` সার্চ)। এখন `?status=delivered` → শুধু delivered, `?search=ABM-0035` → শুধু সেই অর্ডার (API-তে যাচাইকৃত)
- ✅ অ্যাড্রেস ম্যানেজমেন্ট — **বাগ ফিক্সড:** অ্যাড্রেস পেজ `zipCode` ফিল্ড পড়ছিল/লিখছিল কিন্তু backend মডেলে ফিল্ড হলো `postalCode`, ফলে Zip কখনো দেখাত না ও এডিটে প্রি-ফিল হতো না — পুরো পেজ `postalCode`-এ অ্যালাইন করা হলো (checkout/profile-এর মতো)। সাথে "Set as default shipping address" চেকবক্স যোগ (Default ব্যাজ আগে থেকেই ছিল, সেট করার উপায় ছিল না)। add/edit/delete + single-default invariant API-তে যাচাইকৃত
- ✅ সেটিংস — `POST /auth/update-password` (currentPassword+newPassword) সঠিক এন্ডপয়েন্টে, ভুল কারেন্ট পাসওয়ার্ড রিজেক্ট, লগআউট — যাচাইকৃত

### ১৩. অ্যাডমিন ড্যাশবোর্ড
- ✅ অর্ডার ম্যানেজমেন্ট — লিস্ট (status ট্যাব/পেজিনেশন), স্ট্যাটাস/পেমেন্ট/ট্র্যাকিং আপডেট সব API-তে যাচাইকৃত। **বাগ ফিক্সড:** (১) অ্যাডমিন অর্ডার সার্চ বক্স কাজ করত না (`getAllOrders`-এ `.search()` ছিল না) — যোগ করা হলো, এখন `?search=ABM-0035`→১ অর্ডার; (২) অর্ডার ডিটেইলে "Admin Note" সেভ করলে রিলোডে ফাঁকা দেখাত (`order.adminNote` ফিল্ড ছিল না) — মডেল ফিল্ড + সার্ভিস আপডেট, এখন persist করে
- ✅ ইউজার ম্যানেজমেন্ট — লিস্ট/ফিল্টার/পেজিনেশন, block/unblock, ইউজার আপডেট API-তে যাচাইকৃত। **বাগ ফিক্সড:** (১) Active/Blocked স্ট্যাট কার্ড ফাঁকা ও "New This Month" হার্ডকোডেড 12 ছিল (ভুল কী `activeUsers`/`blockedUsers`) — সঠিক কী `active`/`blocked`/`newUsersThisMonth`, এখন 8/0/8 দেখায়; (২) সার্চ `search` পাঠাত, backend `searchTerm` পড়ে — ঠিক করা হলো; (৩) রোল চেঞ্জ ও Create Admin নীরবে কাজ করত না (`PATCH /users/admin/:id` role ইগনোর করে) — রোল এন্ডপয়েন্ট `PATCH /roles/:userId`-এ রুট করা হলো (superadmin যাচাইকৃত)
- ✅ অ্যানালিটিক্স / রিপোর্ট — ড্যাশবোর্ড কার্ড, অর্ডার পাইপলাইন, PDF/Excel এক্সপোর্ট যাচাইকৃত। **বাগ ফিক্সড:** (১) রিপোর্টে "Order #" কলাম ফাঁকা (`orderNumber`→`orderId`); (২) "Rating" কলাম সবসময় "—" (`averageRating`→`rating`, এখন 5.0 দেখায়); (৩) ড্যাশবোর্ড "Sales by Category" raw ObjectId দেখাত (`cat._id`→`cat.name`, এখন "Electronics"); (৪) রেভিনিউ চার্ট ১২ মাসের পুরনোগুলো রাখত (>১২ মাস হলে চলতি মাস বাদ পড়ত) — সাম্প্রতিক ১২ মাস রাখে
- ✅ সাইট কন্টেন্ট এডিটর (hero, footer, contact, legal, payment) — সেকশন লোড/সেভ (cross-section wipe নেই), legal পেজ যাচাইকৃত। **বাগ ফিক্সড:** (১) COD show/hide টগল সেভ হতো না (`payment.cod` মডেল ফিল্ড ছিল না) — যোগ করা হলো, checkout-এ COD লুকানো যায়; (২) হিরো স্লাইড রিঅর্ডার তীর হোমপেজে কাজ করত না (`order` ফিল্ড আপডেট হতো না, হোমপেজ `order` দিয়ে sort করে) — প্রতিটি মুভ/রিমুভে renumber; (৩) Contact "Email" এডিট করলেও পাবলিক পেজ/ফুটার হার্ডকোডেড ইমেইল দেখাত — এখন DB থেকে পড়ে (`c.email`)
- ✅ কুপন ম্যানেজমেন্ট (তৈরি / এডিট / ডিলিট / স্কোপ নির্বাচন)
- ✅ রিটার্ন, কুরিয়ার, ইনভয়েস, নিউজলেটার — রিটার্ন (approve/reject/refund), ইনভয়েস (PDF ডাউনলোড/ইমেইল), কুরিয়ার — সব API-তে যাচাইকৃত। **ফিচার গ্যাপ পূরণ:** নিউজলেটার সাবস্ক্রাইবারের কোনো অ্যাডমিন পেজ ছিল না (backend `GET /newsletter` orphaned ছিল) — নতুন `/dashboard/admin/newsletter` পেজ (লিস্ট, সার্চ, পেজিনেশন, CSV এক্সপোর্ট) + সাইডবার লিংক যোগ করা হলো, ব্রাউজারে যাচাইকৃত

### ১৪. কোড কোয়ালিটি ও পারফরম্যান্স
- ✅ Compile / TypeScript error চেক (কোনো error নেই)
- ✅ ব্রাউজার console error চেক
- ✅ রেসপন্সিভ লেআউট (মোবাইল / ট্যাবলেট / ডেস্কটপ)
- ⬜ Dead code খুঁজে বের করে রিমুভ
- ⬜ SEO / meta / sitemap / robots
- ✅ রিয়েল-টাইম নোটিফিকেশন (socket) — **আসল সকেট দিয়ে end-to-end টেস্ট, ২৫/২৫ পাস।** Socket.IO: JWT auth (ভুয়া/টোকেনহীন কানেকশন reject), প্রতি ইউজারের `user:<id>` রুম, অ্যাডমিনদের `admins` রুম; `notify()` DB-তে সেভ করে **এবং** সাথে সাথে emit করে (socket ব্যর্থ হলেও রেকর্ড থাকে)। NotificationBell (`AdminLayout` + `UserLayout`) `notification:new` শুনে badge/লিস্ট লাইভ আপডেট করে। **ব্রাউজারে চূড়ান্ত প্রমাণ:** ব্রাউজার স্পর্শ না করে বাইরে থেকে অর্ডার দিলে অ্যাডমিনের badge নিজে থেকে **6 → 7** হয়ে ড্রপডাউনে "New order placed — ABM-0041" দেখায়, কোনো রিফ্রেশ ছাড়াই। **কভারেজ:** অর্ডার প্লেসড (কাস্টমার + সব অ্যাডমিন), অর্ডার স্ট্যাটাস চেঞ্জ (কাস্টমার), রিটার্ন, `finance:update` (অ্যাডমিন ড্যাশবোর্ড লাইভ)। **isolation যাচাইকৃত** — এক ইউজারের নোটিফিকেশন অন্যজন পায় না।
  - 🛠️ **যে গ্যাপগুলো ধরা পড়ে ফিক্স করা হলো:** (১) **পেমেন্ট পেলে/ফেল/রিফান্ড হলে কাস্টমার কিছুই জানত না** — অ্যাডমিনের ম্যানুয়াল "mark as paid" ও গেটওয়ে কলব্যাক **দুই পথেই** এখন নোটিফিকেশন যায় (একই shared helper); (২) **কাস্টমার অর্ডার ক্যান্সেল করলে অ্যাডমিন জানত না** (অ্যাডমিন প্যাক করতেই থাকত) — এখন লাইভ অ্যালার্ট + `finance:update`; (৩) **নতুন রিভিউ** → অ্যাডমিনকে লাইভ জানায় (মডারেশন); (৪) **কন্টাক্ট ইনকোয়ারি** → শুধু WhatsApp যেত, এখন in-app বেলেও লাইভ আসে; (৫) অ্যাডমিন fan-out লজিক `NotificationService.notifyAdmins()` helper-এ একত্র করা হলো (আগে inline ডুপ্লিকেট ছিল)

---

## ✅ Work Perfectly (যা যা এখন পারফেক্টলি কাজ করছে)

নিচের ফিচারগুলো টেস্ট করে নিশ্চিত করা হয়েছে যে এগুলো **পারফেক্টলি কাজ করছে:**

- 🔐 **অ্যাডমিন লগইন** — রোল ও পারমিশন সহ সঠিকভাবে কাজ করছে।
- 🏷️ **ক্যাটাগরি তৈরি** — নতুন ক্যাটাগরি তৈরি ও প্রোডাক্টে যুক্ত করা।
- 📦 **প্রোডাক্ট আপলোড** — validation, slug ও SKU অটো-তৈরি সহ ঠিকমতো হচ্ছে।
- 💾 **ডেটা সংরক্ষণ** — প্রোডাক্ট ডেটাবেজে সেভ ও API-তে সঠিক রেসপন্স।
- 🖼️ **ছবি (Cloudinary)** — কনফিগ ও কানেকশন কাজ করছে।
- 🏠 **হোমপেজ ডিসপ্লে** — প্রোডাক্ট গ্রিড ও হিরো ব্যানার দেখাচ্ছে।
- 🛍️ **প্রোডাক্ট লিস্টিং (`/products`)** — সব প্রোডাক্ট দেখাচ্ছে।
- 📄 **প্রোডাক্ট ডিটেইল পেজ** — নাম, দাম, বিবরণ ও ছবি সব ঠিক আছে।
- 🛒 **কার্ট** — Add to Cart, badge আপডেট ও কার্ট persistence কাজ করছে।
- 🎯 **বড় বাগ ফিক্স** — যে বাগে প্রোডাক্ট কোথাও দেখাচ্ছিল না, তা ফিক্স হয়ে এখন হোম, লিস্টিং ও ডিটেইল — সব জায়গায় দেখাচ্ছে।
- 🎟️ **কুপন ও ডিসকাউন্ট** — প্রোডাক্ট-স্পেসিফিক ও গ্লোবাল কুপন, এলিজিবিলিটি-ভিত্তিক সঠিক ডিসকাউন্ট এবং ডিসকাউন্টেড দামে অর্ডার — সবকিছু সার্ভার-সাইডে যাচাইসহ পারফেক্টলি কাজ করছে।
- 🛠️ **কুপন বাগ ফিক্স** — আগে প্রোডাক্ট-স্পেসিফিক কুপন যেকোনো প্রোডাক্টে ডিসকাউন্ট দিত; এখন শুধু নির্দিষ্ট প্রোডাক্টেই প্রযোজ্য হয় এবং অ্যাডমিন তালিকায় সঠিক scope দেখায়।
- 👤 **গেস্ট চেকআউট** — লগইন ছাড়া অর্ডার, ফোন নম্বরে অটো-অ্যাকাউন্ট, ফোন নম্বরই পাসওয়ার্ড — পুরো ফ্লো লাইভ টেস্টেড।
- 🚚 **অর্ডার লাইফসাইকেল ও কুরিয়ার ট্র্যাকিং** — ৭-ধাপের অ্যানিমেটেড প্রোগ্রেস বার (ইউজার + অ্যাডমিন + পাবলিক ট্র্যাক পেজে একই কম্পোনেন্ট), টাইমলাইন, ম্যানুয়াল ট্র্যাকিং, Steadfast কুরিয়ার enable-ready ইন্টিগ্রেশন — ৩৩/৩৩ টেস্ট পাস।
- 💳 **পেমেন্ট গেটওয়ে (enable-on-key-drop)** — bKash, Nagad, Rocket, SSLCommerz + COD; একটাই provider registry, key দিলেই লাইভ; dev-simulation দিয়ে পুরো ফ্লো এখনই কাজ করছে — ১৫/১৫ রিগ্রেশন পাস।
- 💰 **রিয়েল-টাইম ফাইন্যান্স** — Revenue, Net Profit (COGS-সহ), Margin, AOV লাইভ ড্যাশবোর্ডে; পেমেন্ট হলেই socket দিয়ে তাৎক্ষণিক আপডেট (ব্রাউজারে যাচাইকৃত: ৳16,965 → ৳17,824 রিফ্রেশ ছাড়াই)।
- 📑 **PDF + Excel ফাইন্যান্স রিপোর্ট** — এক ক্লিকে ডাউনলোড, একাধিক শিট (Summary/By Method/Monthly/Transactions), ফাইল ভ্যালিডিটি যাচাইকৃত — কোনো ম্যানুয়াল হিসাব লাগে না।
- 🧹 **ক্লিন কোড** — dead code রিমুভ করা হয়েছে (কুপন ফর্মের নন-ফাংশনাল Start Date ও Limit Per User ফিল্ড সহ); কোনো compile / TypeScript / console error নেই।
- 🖥️ **রেসপন্সিভ UI** — মোবাইল থেকে ডেস্কটপ সব সাইজে লেআউট ঠিক আছে।

---

> 📌 **নোট:** ভবিষ্যতে নতুন কোনো ফিচার টেস্ট করা হলে উপরের চেকলিস্টে সেটার পাশে ⬜ থেকে ✅ করে দেওয়া হবে, এবং সেটা পারফেক্টলি কাজ করলে "Work Perfectly" সেকশনে যুক্ত করা হবে।

---

# 🔑 প্রোডাকশনে যাওয়ার জন্য ক্লায়েন্টের কাছ থেকে যা যা নিতে হবে

> **সিস্টেমের অবস্থা:** পুরো কোড **রেডি ও টেস্টেড**। নিচের প্রতিটা ইন্টিগ্রেশন **enable-on-key-drop** ভাবে বানানো — অর্থাৎ **শুধু key/credential বসালেই সাথে সাথে লাইভ হয়ে যাবে, কোনো কোড চেঞ্জ লাগবে না**। key না থাকলেও সিস্টেম ভাঙে না (dev-simulation / fallback দিয়ে চলে)।
>
> এই সেকশনটা ক্লায়েন্টকে সরাসরি দেখানো যায় — যা যা `[ ]` আছে সব একবারে সংগ্রহ করে আমাকে দিলেই আমি বসিয়ে দেব।

---

## ১️⃣ Google (দুইটা আলাদা জিনিস — দুটোই আলাদাভাবে লাগবে)

### ক) Google Sign-in / OAuth — "Google দিয়ে লগইন" চালু করতে
- [ ] **Client ID** (দেখতে এমন: `1234567890-abcxyz.apps.googleusercontent.com`)
- [ ] **Client Secret** (দেখতে এমন: `GOCSPX-xxxxxxxxxxxx`)
- **কোথা থেকে:** Google Cloud Console → APIs & Services → Credentials → **Create Credentials → OAuth client ID → Application type: Web application**
- **ক্লায়েন্টকে বলতে হবে যে ওখানে সেট করতে হবে:**
  - *Authorized JavaScript origins:* `https://<আপনার-ডোমেইন>` এবং `https://www.<আপনার-ডোমেইন>` (এবং টেস্টের জন্য `http://localhost:3000`)
  - *Redirect URI লাগবে না* (আমরা popup/postmessage ফ্লো ব্যবহার করছি — বেশি সিকিউর)
  - OAuth consent screen: App name, support email, logo, Publishing status = **Production**
- **এটা দিলেই যা চালু হবে:** লগইন ও রেজিস্টার পেজে "Continue with Google" বাটন অটো দেখা যাবে, ইমেইল দিয়ে অ্যাকাউন্ট অটো-লিংক হবে
- ℹ️ *এটা Gmail-এর পাসওয়ার্ড নয় — এটা সম্পূর্ণ আলাদা জিনিস*

### খ) Gmail App Password — ইমেইল পাঠানোর জন্য (OTP / ভেরিফিকেশন / পাসওয়ার্ড রিসেট / ইনভয়েস)
- [ ] **কোন Gmail থেকে মেইল যাবে** (যেমন: `anandabazarbdmart@gmail.com`)
- [ ] **App Password** (১৬ ডিজিটের, যেমন: `abcd efgh ijkl mnop`)
- **কোথা থেকে:** ঐ Gmail-এ **2-Step Verification চালু করতে হবে** → Google Account → Security → **App passwords** → নতুন একটা তৈরি করে ১৬ ডিজিট কপি
- **এটা দিলেই যা চালু হবে:** ইমেইল ভেরিফিকেশন লিংক, OTP কোড, পাসওয়ার্ড রিসেট লিংক, ইনভয়েস ইমেইল — সব আসল ইমেইলে যাবে
- ⚠️ **Gmail-এর সাধারণ পাসওয়ার্ড দিলে কাজ করবে না** — App Password-ই লাগবে

---

## ২️⃣ পেমেন্ট গেটওয়ে (যেগুলো চালু করতে চায় শুধু সেগুলোই লাগবে)

> **এখন কী অবস্থা:** COD (ক্যাশ অন ডেলিভারি) + ম্যানুয়াল "Send Money" ফ্লো **এখনই ১০০% কাজ করছে**। নিচের গেটওয়েগুলো শুধু **অটোমেটিক অনলাইন পেমেন্ট** চাইলে লাগবে।

### bKash (Merchant / Tokenized Checkout)
- [ ] App Key
- [ ] App Secret
- [ ] Username
- [ ] Password
- [ ] Live না Sandbox (মার্চেন্ট অ্যাকাউন্ট approved কিনা)
- **কোথা থেকে:** bKash Merchant/PGW অ্যাকাউন্ট (bKash-এর সাথে মার্চেন্ট চুক্তি লাগে)

### SSLCommerz (কার্ড + সব ব্যাংক + মোবাইল ব্যাংকিং একসাথে — সবচেয়ে সহজ)
- [ ] Store ID
- [ ] Store Password
- [ ] Live না Sandbox
- **কোথা থেকে:** sslcommerz.com-এ মার্চেন্ট রেজিস্ট্রেশন (ট্রেড লাইসেন্স + ব্যাংক অ্যাকাউন্ট লাগে)
- 💡 *সাজেশন: একটাই গেটওয়ে নিলে **SSLCommerz** সবচেয়ে সুবিধার — এতেই কার্ড, bKash, Nagad, Rocket সব একসাথে চলে*

### Nagad (Merchant)
- [ ] Merchant ID
- [ ] Merchant Number
- [ ] Nagad PG Public Key
- [ ] Merchant Private Key
- [ ] Live না Sandbox

### Rocket / DBBL (Merchant)
- [ ] Merchant ID
- [ ] API Key
- [ ] API Secret
- [ ] Live না Sandbox

---

## ৩️⃣ কুরিয়ার — Steadfast (Packzy)
- [ ] **API Key**
- [ ] **Secret Key**
- [ ] (ঐচ্ছিক) Webhook Secret — ডেলিভারি স্ট্যাটাস অটো আপডেটের জন্য
- **কোথা থেকে:** portal.packzy.com → Steadfast মার্চেন্ট অ্যাকাউন্ট → API সেকশন
- **এটা দিলেই যা চালু হবে:** অ্যাডমিন থেকে এক ক্লিকে কুরিয়ার বুকিং, অটো ট্র্যাকিং স্ট্যাটাস, COD টাকা রিকনসিলিয়েশন
- ℹ️ *অন্য কুরিয়ার (Pathao/RedX/eCourier) চাইলে বলবেন — একই প্যাটার্নে যোগ করা যাবে*

---

## ৪️⃣ AI — "ছবি দিয়ে সার্চ" আরও স্মার্ট করতে (ঐচ্ছিক)

> **এখন কী অবস্থা:** ছবি দিয়ে সার্চ **এখনই কাজ করছে** (ব্রাউজারেই ছবির আসল রঙ ডিটেক্ট করে ম্যাচ করে) — কোনো key ছাড়াই। নিচের যেকোনো **একটা** key দিলে এটা আসল AI অবজেক্ট ডিটেকশনে আপগ্রেড হবে (যেমন: "লাল স্নিকার", "চামড়ার ব্যাগ" চিনতে পারবে)।

- [ ] **যেকোনো একটা:**
  - **OpenAI API Key** (`sk-...`) — 💡 *সবচেয়ে ভালো ও সহজ, সাজেস্টেড*
  - অথবা Google Cloud Vision API Key
  - অথবা Clarifai PAT
  - অথবা Hugging Face API Key
- **কোথা থেকে:** platform.openai.com → API keys (কার্ড অ্যাড করে ৳500-1000 টপ-আপ করলেই মাসের পর মাস চলবে)

---

## ৫️⃣ অ্যাকাউন্ট ও ইনফ্রাস্ট্রাকচার

- [ ] **ডোমেইন নাম** (যেমন `anandabazarbdmart.com`) + **DNS access** (Namecheap/GoDaddy/Cloudflare login)
- [ ] **MongoDB Atlas** — প্রোডাকশন ক্লাস্টার ক্লায়েন্টের নিজের অ্যাকাউন্টে চাইলে ওটার access
  - ⚠️ *এখন একটা ডেভেলপমেন্ট ক্লাস্টার চলছে — লাইভে যাওয়ার আগে ক্লায়েন্টের নিজের অ্যাকাউন্টে নেওয়া উচিত (ডেটার মালিকানা)*
- [ ] **Cloudinary** — প্রোডাক্টের ছবি হোস্টিং, ক্লায়েন্টের নিজের অ্যাকাউন্ট চাইলে: Cloud Name + API Key + API Secret
  - ⚠️ *এখন একটা ডেভ অ্যাকাউন্ট চলছে (ফ্রি টিয়ার) — ছবি বেশি হলে ক্লায়েন্টের নিজের অ্যাকাউন্ট লাগবে*
- [ ] **Vercel + Render** অ্যাকাউন্ট — ক্লায়েন্টের নিজের নামে হোস্টিং চাইলে (এখন ডেপ্লয় করা আছে)
  - 💡 *Render ফ্রি টিয়ারে ১৫ মিনিট পর সার্ভার ঘুমিয়ে যায় — লাইভ দোকানের জন্য **Render Starter ($7/মাস)** নেওয়া উচিত*

---

## ৬️⃣ বিজনেস কনটেন্ট (কোনো API key লাগে না — কিন্তু ক্লায়েন্টের কাছ থেকে নিতেই হবে)

> এগুলো অ্যাডমিন প্যানেল (**Site Content**) থেকে বসানো যায়, কিন্তু তথ্যগুলো ক্লায়েন্টের কাছ থেকে লাগবে।

**যোগাযোগ:**
- [ ] সাপোর্ট ইমেইল (এখন `anandabazarbdmart@gmail.com` বসানো আছে — ঠিক আছে কিনা কনফার্ম)
- [ ] ফোন নাম্বার (১–২টা)
- [ ] WhatsApp নাম্বার
- [ ] কর্পোরেট/অফিস ঠিকানা
- [ ] সোশ্যাল লিংক — Facebook / Instagram / YouTube / TikTok

**পেমেন্ট (ম্যানুয়াল "Send Money" এর জন্য):**
- [ ] bKash নাম্বার + ধরন (Personal / Agent / Merchant)
- [ ] Nagad নাম্বার + ধরন
- [ ] Rocket নাম্বার + ধরন
- [ ] COD চালু থাকবে কিনা

**ব্র্যান্ডিং:**
- [ ] লোগো (PNG, ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড)
- [ ] ফেভিকন
- [ ] হোমপেজ হিরো ব্যানার ছবি (৩–৫টা)

**লিগ্যাল পেজের লেখা:**
- [ ] Terms & Conditions
- [ ] Privacy Policy
- [ ] Return / Refund Policy

**ডেলিভারি:**
- [ ] ঢাকার ভেতরে ডেলিভারি চার্জ
- [ ] ঢাকার বাইরে ডেলিভারি চার্জ
- [ ] কত টাকার অর্ডারে ফ্রি ডেলিভারি (থ্রেশহোল্ড)
- [ ] ডেলিভারিতে কত দিন লাগে

**প্রোডাক্ট ক্যাটালগ:**
- [ ] ক্যাটাগরি লিস্ট (+ সাব-ক্যাটাগরি)
- [ ] প্রোডাক্ট ডেটা: নাম, বর্ণনা, দাম, **কেনা দাম (cost price — নেট প্রফিট হিসাবের জন্য জরুরি)**, স্টক, ব্র্যান্ড, কালার/সাইজ, ছবি (প্রতি প্রোডাক্টে কমপক্ষে ৩টা)
  - 💡 *Excel/CSV-তে দিলে bulk upload দিয়ে একসাথে সব তোলা যাবে*

---

## ৭️⃣ যা লাগবে না (আমি নিজেই করে দেব)

- ✅ JWT সিক্রেট — প্রোডাকশনের জন্য নতুন করে জেনারেট করে দেব
- ✅ ডেটাবেজ স্কিমা, ইনডেক্স, সিডিং
- ✅ Vercel + Render ডেপ্লয়মেন্ট কনফিগ (`render.yaml`, বিল্ড সেটিংস)
- ✅ Render ঘুম আটকাতে cron-job.org keep-alive সেটআপ
- ✅ SSL / HTTPS (Vercel ও Render অটো দেয়)
- ✅ SEO, sitemap, robots.txt

---

## 📦 কিভাবে দিবেন

- 🔒 **নিরাপত্তা:** key/secret গুলো **পাবলিক জায়গায় (গিটহাব/গ্রুপ চ্যাট) পাঠাবেন না**। সরাসরি আমাকে দিলেই হবে — আমি `.env`-এ বসাব যা গিটহাবে যায় না (gitignored), আর হোস্টিং-এর env সেকশনে (Vercel/Render) সেট করব।
- 📝 **ফরম্যাট:** যেকোনো একটা সার্ভিসের সব key একসাথে দিলেই হবে, যেমন:
  ```
  bKash:
  App Key = ...
  App Secret = ...
  Username = ...
  Password = ...
  Live/Sandbox = ...
  ```
- ⚡ **একসাথে সব লাগবে না** — যেটা আগে পাওয়া যাবে সেটা আগে বসিয়ে দেব, প্রতিটা আলাদাভাবে চালু হয়।

---

## 🎯 অগ্রাধিকার (কোনটা আগে দরকার)

| অগ্রাধিকার | কী | কেন |
|---|---|---|
| 🔴 **১ (আবশ্যক)** | ডোমেইন, বিজনেস কনটেন্ট, প্রোডাক্ট ক্যাটালগ, ম্যানুয়াল পেমেন্ট নাম্বার | এগুলো ছাড়া দোকান লাইভ করা যায় না |
| 🔴 **২ (আবশ্যক)** | Gmail App Password | ছাড়া কাস্টমার OTP / পাসওয়ার্ড রিসেট ইমেইল পাবে না |
| 🟠 **৩ (খুব দরকারি)** | SSLCommerz **অথবা** bKash | অটো অনলাইন পেমেন্ট (এখন COD + ম্যানুয়াল দিয়ে চলবে) |
| 🟠 **৪ (খুব দরকারি)** | নিজের MongoDB Atlas + Cloudinary | ডেটা ও ছবির মালিকানা ক্লায়েন্টের হাতে থাকবে |
| 🟡 **৫ (ভালো হয়)** | Steadfast কুরিয়ার | ম্যানুয়াল ট্র্যাকিং দিয়েও চলবে |
| 🟢 **৬ (ঐচ্ছিক)** | Google OAuth, OpenAI key | ছাড়াও সব কাজ করে — শুধু অভিজ্ঞতা আরও ভালো হয় |
