# تقرير فحص Runtime تشخيصي (بدون أي تعديل)

## 1) السبب الجذري الدقيق

الموقع المنشور (`hrhbs.com` و `seerati-ai-cv.lovable.app`) يُرسل HTML صحيحًا من السيرفر (200 لكل المسارات)، لكن **حزمة الجافاسكربت للعميل لا تحتوي على قيم `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`**، فيرمي عميل الباك إند خطأً أثناء الـ hydration ويُبدَّل المحتوى بصفحة الخطأ.

الدليل:

- `src/integrations/supabase/client.ts` يقرأ المتغيرات بصيغة الأقواس: `import.meta.env["VITE_SUPABASE_URL"]`.
- الحزمة المنشورة `/assets/utils-BrulnN-4.js` لا تحتوي على معرّف مشروع الباك إند إطلاقًا (grep = 0 نتيجة)، أي أن الاستبدال وقت البناء لم يحدث.
- خطة المعالجة السابقة (المكوّن `inlineViteEnvBracketAccess` في `vite.config.ts` الذي يحوّل الأقواس إلى نقطة) **لا تعمل في البناء الحالي** (Vite 8 / Rolldown)، لذلك عاد الخطأ نفسه بعد Stage 10.

**ملف `src/components/landing-experience.tsx` و`src/landing-experience.css` وربطهما في `src/routes/index.tsx` ليست السبب**: لا يوجد أي خطأ متعلق بها في SSR أو الكونسول، و`LandingIntro` تقرأ `window` داخل `useEffect` فقط (سليم).

## 2) الأعراض والمسارات المتأثرة

- منشور (production): `/` و`/templates` و`/features` و`/ats` و`/auth` و`/dashboard` → HTML يظهر لحظيًا ثم تُستبدل الصفحة بصفحة خطأ (طول النص الظاهر بعد الـ hydration = 116 حرفًا فقط على كل المسارات). عمليًا: «الموقع لا يعمل».
- `/dashboard` يعيد التوجيه إلى `/auth` كما هو متوقع، لكن `/auth` نفسها معطوبة أيضًا → **تسجيل الدخول متعذّر تمامًا على الموقع المنشور**.
- محليًا (dev على 8080): كل المسارات 200 وتُحمّل فعليًا (الصفحة الرئيسية نص 4297 حرفًا، `/templates` 18032) لأن `.env` المحلي يوفّر المتغيرات — أي أن العطل لا يظهر في dev ولا في TypeScript/build.

## 3) الأخطاء الحرفية (مختصرة)

من كونسول المتصفح على `hrhbs.com` (متكرر على كل مسار):

```
[Supabase] Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY. Connect Supabase in Lovable Cloud.
Error: Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.
    at ba (https://hrhbs.com/assets/utils-BrulnN-4.js:11:54723)
    at Object.get (https://hrhbs.com/assets/utils-BrulnN-4.js:11:54908)
    at .../assets/store-...
```

من سجل dev server (حدث مرة واحدة أثناء إعادة تشغيل Vite بعد تغيّر `.env`، وليس عطلًا دائمًا):

```
Error: transport was disconnected, cannot call "fetchModule" ... at async eval (/dev-server/src/router.tsx:9:31) (status 500)
Error: h3 swallowed SSR error: {"status":500,"unhandled":true,"message":"HTTPError"}
```

ملاحظات ثانوية غير مسبِّبة للعطل: على dev ظهر `Failed to load resource: 401` (نداء غير مصادق للباك إند) و`net::ERR_ABORTED` لبعض وحدات Vite أثناء إعادة التحميل.

## 4) الإصلاحات اللازمة حسب الأولوية

1. **إعادة تمرير متغيرات العميل إلى حزمة الإنتاج** (حاجز مانع): توحيد القراءة على `import.meta.env.VITE_SUPABASE_URL` / `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` بصيغة النقطة عبر طبقة config خاصة بالمشروع تقرأها بقاء `client.ts` المُولَّد بدون تعديل، بدل الاعتماد على مكوّن Vite لتحويل الأقواس، ثم النشر والتحقق بأن الحزمة تحتوي القيمة فعلًا.
2. **إسقاط لطيف بدل الانهيار**: عدم رمي الخطأ عند غياب الإعداد في مسار الـ hydration، حتى تظل الصفحات التعريفية (`/`, `/templates`, `/features`, `/ats`) تعمل ولو تعطّل الاتصال بالباك إند.
3. **حراسة انحدار**: إضافة فحص بعد البناء يتأكد من وجود قيمة `VITE_SUPABASE_URL` داخل ناتج `dist/client`، وربطه بـ `bun run qa` لمنع تكرار العطل صامتًا.
4. **مراجعة نداء الـ 401 المتكرر** على المسارات العامة (نداء باك إند غير ضروري قبل تسجيل الدخول) — تحسين أداء لا أكثر.

لم يتم تعديل أي ملف أو قاعدة بيانات أو نشر في هذا الفحص. اعتمد الخطة لأبدأ تنفيذ الإصلاح رقم 1.
