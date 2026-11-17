# نشر توصيل أونلاين (Supabase + Railway)

| الجزء | الخدمة |
|---|---|
| قاعدة البيانات (PostgreSQL) | [Supabase](https://supabase.com) |
| الموقع والسيرفر مع بعض | [Railway](https://railway.com) |

على Railway في **خدمة وحدة** بتبني واجهة React وبتشغّل سيرفر Express، والسيرفر هو اللي بيعرض الموقع والـ API **على نفس الرابط**. هيك ما في داعي لإعدادات CORS ولا لرابط API منفصل.

الإعدادات كلها موجودة بالريبو:
- `railway.json`: أوامر البناء والتشغيل وفحص صحة السيرفر.
- `package.json` بجذر الريبو: بيبني `client` وبيشغّل `server`.

---

## 1. قاعدة البيانات (Supabase)

1. اعمل **New project**:
   - **Name**: `tawseel`
   - **Database Password**: اختار كلمة سر قوية واحفظها عندك. **الأسهل تكون حروف وأرقام بس** (بدون `@ # / ? %`) عشان ما تخرب الرابط.
   - **Region**: Frankfurt (eu-central-1)، لأنها الأقرب.
2. لما يجهز المشروع، اضغط **Connect** من فوق.
3. اختار **Session pooler** وانسخ الرابط. شكله هيك:
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
4. حط كلمة السر مكان `[YOUR-PASSWORD]`، وضيف بآخر الرابط `?connection_limit=5`:
   ```
   postgresql://postgres.abcdefgh:كلمة-السر@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=5
   ```
   هاد هو `DATABASE_URL`. **لا تحطه بالريبو ولا تبعته لحدا.**

> **ليش Session pooler بالذات؟**
> - **Direct connection** بيشتغل بس على IPv6، و Railway ممكن ما يوصله.
> - **Transaction pooler** (البورت 6543) ما بيزبط مع الـ migrations تبعت Prisma.
> - **Session pooler** بيشتغل مع الاثنين.

> **الأمان:** Supabase بيفتح الجداول عن طريق Data API تبعه. فيه migration بالمشروع (`enable_rls`) بتفعّل RLS على كل الجداول، وهيك ما حدا بيقدر يقرأ البيانات من برا السيرفر تبعنا. التطبيق نفسه ما بيتأثر.

## 2. الموقع والسيرفر (Railway)

1. من Railway اختار **New Project ← Deploy from GitHub repo** واختار `Tawseel-Project`. لو ما ظهر، اضغط **Configure GitHub App** واسمح لـ Railway يوصل للريبو.
2. افتح الخدمة اللي انعملت، وروح على **Variables** وضيف:

   | المتغير | القيمة |
   |---|---|
   | `DATABASE_URL` | رابط Supabase من الخطوة 1 |
   | `JWT_SECRET` | نص عشوائي طويل. اكتب بالقيمة `${{secret(64)}}` و Railway بيولّده لحاله |
   | `NODE_ENV` | `production` |

3. روح على **Settings ← Networking** واضغط **Generate Domain**. بيعطيك رابط مثل `https://tawseel-production.up.railway.app`.
4. Railway بيعمل deploy لحاله، وأثناءه:
   - بيبني الواجهة.
   - بيطبّق الـ migrations على Supabase (`npm run migrate`)، يعني بيعمل الجداول.
   - بيشغّل السيرفر، وبيتأكد إنه شغال من `/api/health`.
5. افتح `https://<رابطك>/api/health`. لازم يطلعلك `{"ok":true}`.

> رابط استعادة كلمة المرور بياخد رابط Railway لحاله، فما في داعي لـ `CLIENT_URL`. بس إذا ربطت دومين خاص، ضيف `CLIENT_URL=https://دومينك`.

## 3. البيانات التجريبية (مرة وحدة بس)

عشان تنضاف المطاعم الأربعة وحسابات التجربة، شغّل الـ seed من جهازك على Supabase:

```bash
cd server
npm install
DATABASE_URL="رابط-Supabase-هون" npm run db:seed
```

على Windows (PowerShell):

```powershell
cd server
npm install
$env:DATABASE_URL="رابط-Supabase-هون"; npm run db:seed
```

> ⚠️ الـ seed **بيمسح كل البيانات** وبيرجع البيانات التجريبية. شغّله مرة وحدة بالبداية، أو لما بدك ترجّع الموقع لحالته الأولى قبل العرض.

بتقدر تشوف الجداول والبيانات من Supabase ← **Table Editor**.

## 4. التجربة

افتح رابط Railway وجرّب:
1. ادخل كزبون: `customer@tawseel.test` / `password123` ← اطلب من «بيتزا روما».
2. بنافذة خاصة (Incognito) ادخل كمطعم: `pizza@tawseel.test` / `password123` ← اقبل الطلب وغيّر حالته.
3. ارجع لنافذة الزبون، وبعد ثواني بتشوف الحالة تغيّرت.

---

## إيميل استعادة كلمة المرور (SMTP)

بدون SMTP، رابط الاستعادة بينطبع بس بالـ **Deploy Logs** على Railway. لإرسال إيميل حقيقي استخدم Gmail:

1. فعّل **التحقق بخطوتين (2-Step Verification)** على حساب Gmail.
2. من [App passwords](https://myaccount.google.com/apppasswords) اعمل كلمة سر للتطبيق، بتكون 16 حرف.
3. ضيف بـ Railway ← Variables:

   | المتغير | القيمة |
   |---|---|
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | إيميل Gmail |
   | `SMTP_PASS` | كلمة سر التطبيق (16 حرف) |
   | `MAIL_FROM` | `Tawseel <إيميلك@gmail.com>` |

> ملاحظة: بعض خطط Railway بتمنع الاتصال بـ SMTP. إذا الإيميل ما وصل وطلع بالـ Logs خطأ timeout، استخدم خدمة إيميل بتشتغل عن طريق API مثل Resend أو Brevo، أو رقّي الخطة.

## التحديثات بعد النشر

كل merge على `main` بيخلي Railway يعيد البناء والنشر لحاله، وإذا في migration جديدة بيطبّقها قبل ما يشغّل النسخة الجديدة.

## التكلفة

- **Supabase**: الخطة المجانية بتكفي المشروع. المشروع المجاني بيتوقف إذا ما انستخدم أسبوع، وبترجعه من لوحة التحكم بكبسة **Restore**.
- **Railway**: بيعطي رصيد تجريبي ببداية الحساب، وبعده الخطة Hobby بـ 5$ بالشهر. شيّك على الرصيد قبل المناقشة.

## مشاكل شائعة

| المشكلة | الحل |
|---|---|
| الـ Deploy فشل بـ `P1001: Can't reach database server` | تأكد إنك ناسخ رابط **Session pooler** (البورت 5432 على `pooler.supabase.com`) مش الـ Direct connection، وإن مشروع Supabase مش موقف. |
| `P1000: Authentication failed` | كلمة السر بالرابط غلط، أو فيها رموز خاصة. غيّرها من Supabase ← Settings ← Database ← Reset database password لكلمة فيها حروف وأرقام بس. |
| `FATAL: Max client connections reached` | تأكد إن بآخر الرابط `?connection_limit=5`. |
| السيرفر بيوقف وبالـ Logs `JWT_SECRET must be set in production` | ضيف `JWT_SECRET` بالـ Variables. |
| الموقع بيفتح بس ما بتظهر مطاعم | شغّل الـ seed (الخطوة 3). |
