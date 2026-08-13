# Phase 15 Baseline

**الفرع:** `feat/phase-15-saudi-validation`  
**نقطة البداية:** `origin/main` عند `19bfffa7fe43dbf1f70ad550ef59021f7716fb0d`  
**تاريخ القياس:** 2026-08-13  
**بيئة القياس:** production build محلي مع synthetic Supabase environment وproduction preview على localhost

## نتيجة baseline

| البوابة                    | النتيجة                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Bun install                | Pass عبر Bun proxy؛ Bun غير ظاهر في PATH التفاعلي واستخدم `npm exec --yes bun` كبديل تشغيلي |
| Prettier 3.9.6             | Pass                                                                                        |
| ESLint                     | Pass مع 20 تحذيرًا و0 أخطاء                                                                 |
| TypeScript                 | Pass                                                                                        |
| Production build           | Pass                                                                                        |
| `bun run qa`               | Pass؛ QA_STATUS=0                                                                           |
| Chromium Release Hardening | Pass                                                                                        |
| Guest parity/privacy smoke | Pass                                                                                        |
| Lighthouse                 | Completed؛ Performance/LCP/SEO تحذيرات غير حاجبة                                            |

## Baseline Lighthouse

تم تشغيل Lighthouse ثلاث مرات على كل مسار. النتائج البارزة من baseline الحالي:

| المسار           |                     نتيجة الأداء |                          LCP الملاحظ | الحالة   |
| ---------------- | -------------------------------: | -----------------------------------: | -------- |
| `/`              |        ضمن baseline السابق ~0.81 |            يُعاد تثبيته من artifacts | غير حاجب |
| `/templates`     |   ضمن baseline السابق ~0.82–0.85 |            يُعاد تثبيته من artifacts | غير حاجب |
| `/features`      |        ضمن baseline السابق ~0.87 |            يُعاد تثبيته من artifacts | غير حاجب |
| `/privacy`       |        ضمن baseline السابق ~0.88 |            يُعاد تثبيته من artifacts | غير حاجب |
| `/assistant`     | ضمن baseline Phase 14 ~0.76–0.85 | بقي فوق هدف 2.5s في القياسات الباردة | P0 gap   |
| `/jobs`          |                             0.77 |                   median يقارب 4.36s | Warning  |
| `/cover-letters` |                            ~0.80 |                   median يقارب 4.05s | Warning  |

## Baseline hardening

نجحت الرحلة المجهولة في Network Privacy وguest parity، ونجحت اختبارات capability navigation وkeyboard وaxe وPDF/Print العربي والإنجليزي. بقي التحذير البصري المعروف للواجهة الإنجليزية في Assistant عند 1.08%، ولم يظهر فشل privacy أو PDF أو accessibility.

## Known gaps carried into Phase 15

يبدأ Phase 15 دون الادعاء بأن الجودة أو AI/ATS قد أُثبتت تجريبيًا. الفجوات الرئيسية هي: عدم الوصول إلى median LCP أقل من 2.5s، عدم وجود Golden Evaluation Dataset موحد من 300–500 حالة، عدم وجود AI/ATS evaluation harness شامل، الحاجة إلى red-team منظم واختبار حذف شامل، ووجود 20 ESLint warnings.

## Evidence

السجل الكامل موجود في `audit/phase15-baseline/baseline.log`. تم استخدام بيانات synthetic فقط، ولم تُرفع نصوص سير أو prompts حقيقية إلى artifacts.
