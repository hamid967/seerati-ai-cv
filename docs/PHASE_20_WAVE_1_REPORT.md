# Phase 20 Wave 1 — Adaptive Journey State Machine

**الفرع:** `feat/phase20-wave1-adaptive-journey`

**الأساس:** `origin/main` بعد دمج PR #53 (`be47fba`)

**الحالة:** تنفيذ أولي قابل للمراجعة — لم يتم الدمج

## الهدف

تنفيذ آلة حالات حتمية لرحلة Noura goal-first، بحيث يصبح الهدف والخطوة وحالة الخصوصية والموافقة والاقتراحات والاتصال والـdeletion حالة موحدة قابلة للاختبار، بدلاً من إدارة هذه الحالات بنصوص UI منفصلة.

## ما تم تنفيذه

أضيفت وحدة `src/modules/noura/journey.ts`، وتحتوي على عقود Zod للآتي:

- `JourneyQuestionFamily` لتحديد عائلة السؤال التالية بحسب الهدف؛
- `JourneyEvent` للأحداث المسموح بها؛
- `JourneySnapshot` لحالة الجلسة الحالية؛
- `createInitialJourney` لإنشاء حالة ضيف تبدأ بـ`idle` وبدون consent؛
- `transitionJourney` للانتقالات الحتمية؛
- `journeyPrompt` للنص العربي والإنجليزي المرتبط بعائلة السؤال.

تتوزع عائلات الأسئلة على الأهداف السبعة كما يلي:

| الهدف         | عائلة السؤال التالية  |
| ------------- | --------------------- |
| إنشاء سيرة    | persona and role      |
| تحسين سيرة    | resume source         |
| استهداف وظيفة | job description       |
| استيراد ملف   | file review           |
| فحص ATS       | ATS context           |
| خطاب تقديم    | evidence confirmation |
| مراجعة سريعة  | priority actions      |

تم ربط route `/assistant` بآلة الحالات باعتبارها مصدر `step` و`goal` و`nouraState`. يظهر السؤال التالي بعد اختيار الهدف، وتنتقل أزرار التالي والسابق عبر `transitionJourney`، كما يسجل consent الصريح انتقال `consent_granted` قبل تشغيل AI.

لم تتم إضافة remote provider أو database migration أو localStorage/IndexedDB/Cache Storage جديد. تبقى إجابات الضيف في state الذاكرة الحالية، وتظل صياغة AI محكومة بالموافقة الموجودة سابقاً.

## اختبارات Wave 1

أضيف الأمر:

```bash
bun run test:phase20-journey
```

وأصبح جزءاً من `bun run qa`.

يغطي smoke الاختبارات التالية:

- البداية من `idle` وstep zero وبدون consent؛
- goal-specific transitions للإنشاء واستهداف الوظيفة؛
- سؤال عربي وإنجليزي مختلف بحسب الهدف؛
- منع طلب AI عند غياب consent؛
- consent صريح ثم `ai_processing`؛
- الانتقال إلى `awaiting_approval` قبل أي completion؛
- completion بعد `approve_suggestion` فقط؛
- حالات `offline` و`retry`؛
- `session_expiring`؛
- `delete_data` ومسح الهدف والموافقة؛
- منع الأحداث الجديدة بعد `data_deleted`.

## نتائج التحقق

| الفحص                       | النتيجة                                        |
| --------------------------- | ---------------------------------------------- |
| Prettier للملفات المتغيرة   | Passed                                         |
| ESLint                      | Passed؛ 20 تحذيراً pre-existing ولا توجد أخطاء |
| TypeScript noEmit           | Passed                                         |
| Build تحت Node 24           | Passed                                         |
| Client environment guard    | Passed                                         |
| `test:phase20-journey`      | Passed                                         |
| Noura foundation smoke      | Passed                                         |
| Phase 19 intelligence smoke | Passed                                         |
| Phase 19 Evaluation         | 500/500، 100% intent accuracy                  |

البناء المحلي تحت Node 22 فشل بدورة ESM/CJS داخل `@lovable.dev/vite-tanstack-config` مع Vite 8؛ البناء نفسه نجح تحت Node 24، وهو runtime أقرب إلى بيئة CI الحالية. لا توجد دلالة أن الخطأ سببه كود Wave 1.

## Browser verification status

تم تشغيل Noura browser harness على Chromium. نجحت assertions الخاصة بالهوية، الدور، السؤال الواحد، غياب الافتراضات، الخصوصية، keyboard، overflow، والأدوات قبل الفتح. لكن assertion فتح Capability Hub بقيت غير ناجحة؛ الزر ظل ظاهراً ولم يظهر `#assistant-capabilities-title` بعد النقر. تم تحسين selector في harness ليستخدم `#assistant-capabilities > button`، لكن يلزم تشغيل متابعة مستقلة لتحديد سبب hydration/click قبل اعتبار browser gate مكتملة.

لذلك لا يدعي هذا التقرير اكتمال Release Hardening أو Network Privacy browser gate في Wave 1. تبقى تلك البوابات شرطاً قبل جعل PR جاهزاً للمراجعة النهائية.

## الخصوصية والحدود

هذه الموجة لا تضيف تخزيناً للضيف، ولا تنقل CV أو prompt أو response إلى telemetry، ولا تشغل remote AI تلقائياً، ولا تطبق أي اقتراح بصمت. `delete_data` داخل العقد يمسح goal وconsent ويمنع الانتقالات اللاحقة في snapshot؛ التكامل النهائي مع `PrivacyRuntime.clearSession()` يبقى خطوة مطلوبة في hardening التالي.

## الملفات الرئيسية

- `src/modules/noura/journey.ts`
- `src/modules/noura/index.ts`
- `src/routes/assistant.tsx`
- `scripts/phase20-journey-smoke.ts`
- `scripts/noura-foundation-verification.mjs`
- `package.json`

## الخطوات التالية

1. إصلاح أو إعادة تهيئة browser harness وفتح Capability Hub فعلياً في التحقق.
2. ربط `delete_data` بـ`PrivacyRuntime.clearSession()` في route-level event handler.
3. إضافة fixtures لانتقالات كل هدف من الأهداف السبعة، بما فيها الرجوع والتخطي.
4. تشغيل Network Privacy وPDF/Print وChromium/Firefox/WebKit بعد استقرار route interaction.
5. فتح Draft PR مستقلة بعد اكتمال هذه البوابات، دون دمج تلقائي.

## Rollback

يمكن عكس الموجة بحذف `journey.ts` وexport الخاص بها، وإرجاع ربط `/assistant` إلى state المحلي السابق، وإزالة `test:phase20-journey` من `package.json`. لا توجد database migrations أو تغييرات destructive في store.
