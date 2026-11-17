# نشر توصيل أونلاين

كل الخدمات المستخدمة **مجانية** وما بتطلب بطاقة بنكية:

| الجزء | الخدمة | الرابط بعد النشر (مثال) |
|---|---|---|
| قاعدة البيانات | [Neon](https://neon.tech) (PostgreSQL) | — |
| السيرفر (API) | [Render](https://render.com) | `https://tawseel-api.onrender.com` |
| الواجهة | [Vercel](https://vercel.com) | `https://tawseel.vercel.app` |

سجّل بالثلاث خدمات بحساب GitHub تبعك عشان يقدروا يوصلوا للريبو.

> **مهم:** الترتيب بيفرق. قاعدة البيانات أول، بعدها السيرفر، وبعدها الواجهة، وآخر إشي بترجع تحط رابط الواجهة بالسيرفر.

---

## 1. قاعدة البيانات (Neon)

1. من Neon اعمل **New Project** وسمّيه `tawseel`. اختار المنطقة **Europe (Frankfurt)** لأنها الأقرب.
2. بصفحة المشروع اضغط **Connect**:
   - **طفّي** خيار **Connection pooling**، لأن Prisma بحتاج الاتصال المباشر عشان يعمل الـ migrations.
   - انسخ الرابط. شكله هيك:
     `postgresql://USER:PASSWORD@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. احفظ الرابط عندك، رح تحتاجه بالخطوة 2 والخطوة 4. **لا تحطه بالريبو ولا تبعته لحدا**، لأنه فيه كلمة السر.

## 2. السيرفر (Render)

1. من Render اضغط **New → Blueprint**، واختار ريبو `Tawseel-Project`.
2. Render رح يقرأ ملف `render.yaml` من الريبو ويعمل خدمة اسمها `tawseel-api`. رح يطلب منك تعبي القيم التالية:

   | المتغير | القيمة |
   |---|---|
   | `DATABASE_URL` | رابط Neon من الخطوة 1 |
   | `CLIENT_URL` | حط `http://localhost:5173` مؤقتاً، وبنغيّره بالخطوة 5 |
   | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | اتركهم فاضيين هلأ (شوف قسم الإيميل تحت) |

   `JWT_SECRET` بيتولّد لحاله، ما بدك تعمل إشي.
3. اضغط **Apply**. البناء بياخد كم دقيقة، وبيعمل الجداول بقاعدة البيانات لحاله (`prisma migrate deploy`).
4. لما يخلص، افتح `https://<اسم-الخدمة>.onrender.com/api/health`. لازم يطلعلك `{"ok":true}`.

> الخطة المجانية بـ Render بتنام بعد 15 دقيقة بدون استخدام، وأول طلب بعدها بياخد حوالي 50 ثانية. **قبل العرض أو المناقشة افتح الموقع بدقيقة** عشان يصحى.

## 3. الواجهة (Vercel)

1. من Vercel اضغط **Add New → Project** واختار ريبو `Tawseel-Project`.
2. بالإعدادات:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (بيتعرف لحاله)
   - **Environment Variables**: ضيف
     `VITE_API_URL` = `https://<اسم-الخدمة>.onrender.com/api`
     (رابط Render من الخطوة 2 وبآخره `/api`)
3. اضغط **Deploy**. بعد دقيقة بيعطيك رابط مثل `https://tawseel.vercel.app`.

## 4. البيانات التجريبية (مرة وحدة بس)

عشان يكون بالموقع المطاعم الأربعة وحسابات التجربة، شغّل الـ seed من جهازك على قاعدة Neon:

```bash
cd server
npm install
DATABASE_URL="رابط-Neon-هون" npm run db:seed
```

على Windows (PowerShell):

```powershell
cd server
npm install
$env:DATABASE_URL="رابط-Neon-هون"; npm run db:seed
```

> ⚠️ الـ seed **بيمسح كل البيانات** وبيرجع البيانات التجريبية. شغّله مرة وحدة بس بالبداية، أو لما بدك ترجّع الموقع لحالته الأولى قبل العرض.

## 5. ربط الواجهة بالسيرفر

ارجع على Render، وافتح خدمة `tawseel-api` ← **Environment**، وغيّر:

`CLIENT_URL` = رابط Vercel، مثلاً `https://tawseel.vercel.app` (بدون `/` بالآخر)

احفظ، و Render رح يعيد التشغيل لحاله. هاد ضروري لسببين:
- السيرفر ما بيقبل طلبات إلا من الموقع هاد (CORS).
- رابط استعادة كلمة المرور بالإيميل بيفتح على هاد الرابط.

إذا عندك أكثر من رابط (مثلاً دومين خاص)، افصل بينهم بفاصلة: `https://tawseel.vercel.app,https://tawseel.com`

## 6. التجربة

افتح رابط Vercel وجرّب:
1. ادخل كزبون: `customer@tawseel.test` / `password123` ← اطلب من «بيتزا روما».
2. بنافذة خاصة (Incognito) ادخل كمطعم: `pizza@tawseel.test` / `password123` ← اقبل الطلب وغيّر حالته.
3. ارجع لنافذة الزبون، وبعد ثواني بتشوف الحالة تغيّرت.

---

## إيميل استعادة كلمة المرور (SMTP)

بدون SMTP، رابط الاستعادة بينطبع بس بـ **Logs** السيرفر على Render. لإرسال إيميل حقيقي استخدم Gmail:

1. فعّل **التحقق بخطوتين (2-Step Verification)** على حساب Gmail.
2. من [App passwords](https://myaccount.google.com/apppasswords) اعمل كلمة سر للتطبيق، بتكون 16 حرف.
3. حط بـ Render ← Environment:

   | المتغير | القيمة |
   |---|---|
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | إيميل Gmail |
   | `SMTP_PASS` | كلمة سر التطبيق (16 حرف) |
   | `MAIL_FROM` | `Tawseel <إيميلك@gmail.com>` |

## التحديثات بعد النشر

ما في داعي تعمل إشي: كل ما ينعمل merge على `main`، Render و Vercel بيعيدوا النشر لحالهم. وإذا في migration جديدة بقاعدة البيانات، Render بيطبّقها أثناء البناء.

## مشاكل شائعة

| المشكلة | الحل |
|---|---|
| الموقع بيفتح بس المطاعم ما بتظهر و«تعذّر الاتصال بالخادم» | تأكد إن `VITE_API_URL` بـ Vercel صحيح وبآخره `/api`، وبعد أي تغيير اعمل **Redeploy**. السبب الثاني ممكن يكون إن السيرفر نايم، استنى دقيقة. |
| خطأ CORS بالـ Console | `CLIENT_URL` بـ Render لازم يطابق رابط Vercel بالزبط، بدون `/` بالآخر. |
| البناء على Render فشل بـ `P1001` | رابط `DATABASE_URL` غلط، أو إنت ناسخ رابط الـ pooled. انسخ الرابط المباشر. |
| الصفحة بتعطي 404 لما أعمل Refresh على صفحة داخلية | تأكد إن الـ Root Directory بـ Vercel هو `client` (ملف `vercel.json` موجود هناك). |
