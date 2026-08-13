# Phase 20 — متطلبات وميزات التجربة المهنية التكيفية

**الحالة:** وثيقة تجهيز واعتماد نطاق — لا تمثل بدء التنفيذ

**الأساس:** `origin/main` بعد دمج PR #53

**الهدف العام:** نقل Noura وSeerati من Foundation goal-first إلى تجربة مهنية تكيفية مكتملة، تقود المستخدم عبر رحلة واضحة، وتستخدم الذكاء التوليدي فقط ضمن حدود الأدلة والموافقة والمراجعة، مع بقاء تجربة الضيف memory-only افتراضياً.

> Phase 20 مقترحة كمرحلة **Adaptive Career Copilot**: ليست chatbot مستقلاً، ولا تطبق تعديلات أو ترسل بيانات إلى remote AI دون أن يرى المستخدم الحدود ويوافق صراحة.

## 1. Baseline المؤكد

تم دمج Foundation الحالية إلى `main`. تشمل الحالة الحالية هوية Noura، مدخلاً goal-first، سبعة أهداف، مركز قدرات خلف زر الأدوات، Privacy Runtime، CareerProfileGraph، Resume Health، Intent Router، Next Best Action، Section Coach، Smart Interview، Evidence-Locked AI contracts، وQuality/Release Hardening gates. نتيجة Phase 19 intent harness الحالية هي 500/500 حالة اصطناعية و100% intent accuracy، وهي نتيجة تخص intent routing فقط وليست دليلاً على جودة الرحلة التكيفية أو AI output الكامل [1] [2].

تؤكد معمارية Noura أن الرحلة يجب أن تبدأ بهدف واحد ثم تختار عائلة الأسئلة التالية، وأن الاقتراحات remote يجب أن تعرض payload المقترح والحقول المستبعدة والمزوّد والسبب، وأن كل تعديل يجب أن يظهر كـdiff ويتطلب موافقة المستخدم [3].

## 2. الفجوات التي تعالجها Phase 20

| الفجوة الحالية | أثرها | استجابة Phase 20 المقترحة |
|---|---|---|
| Goal-first موجود، لكن state machine الكاملة غير منفذة | الرحلة قد تتوقف عند أسئلة عامة أو deep links | بناء Adaptive Journey State Machine قابلة للتفسير |
| Smart Interview وSection Coach موجودان محلياً بصورة أولية | لا توجد رحلة مقابلة متكاملة أو حفظ اختياري للنتائج | تحويل المقابلة إلى جلسات evidence-linked مع progress وreview |
| Evidence-Locked contracts موجودة، لكن الاستخدام remote الكامل يحتاج wiring وتقييم | لا يمكن قياس جودة الاقتراحات التوليدية على حالات متنوعة | Remote AI gateway اختياري مع payload preview وschema validation وdiff approval |
| التقييم الحالي يغطي intent فقط | لا توجد أدلة على حفظ الحقائق أو منع الاختلاق | إنشاء corpus من 300 حالة مع gates للملاءمة والحفظ والخصوصية |
| Recovery/offline وsession expiry معرفة جزئياً | فقدان السياق أو غموض حالة الجلسة | حالات صريحة للانقطاع والانتهاء والاسترجاع الاختياري |
| Observability redaction موجودة كعقد أولي | لا توجد SLOs أو لوحات تشغيل مرتبطة بالرحلة | إضافة قياس privacy-safe للأداء والأخطاء مع منع CV/prompt/response telemetry |
| PDF وLighthouse والمتصفحات أصبحت بوابات، لكن calibration النهائي يحتاج تثبيتاً | صعوبة اكتشاف regressions قبل الإصدار | Baselines وموازنات reviewed تدريجياً، دون جعل threshold غير معاير مانعاً فورياً |

## 3. النطاق المقترح حسب الأولوية

### P0 — Adaptive Journey State Machine

#### الوصف

بناء آلة حالات صريحة لرحلة Noura، تبدأ من `ready` وتمر عبر `asking` و`locally_reviewing` و`consent_required` و`suggestion_ready` و`awaiting_approval`، مع حالات `offline` و`error` و`session_expiring` و`data_deleted`. يجب أن تكون الانتقالات حتمية وقابلة للاختبار، وألا تعتمد على نصوص UI مبعثرة.

#### المتطلبات الوظيفية

| المعرّف | المتطلب | معيار القبول |
|---|---|---|
| JRN-001 | اختيار الهدف يحدد عائلة السؤال التالية | لكل هدف من الأهداف السبعة انتقال موثق واختبار عربي/إنجليزي/mixed |
| JRN-002 | كل حالة تعرض status صادقاً للمستخدم | لا تظهر عبارة AI عند تنفيذ تحليل محلي؛ تستخدم صياغة «أراجع القسم محلياً» |
| JRN-003 | دعم الرجوع والتخطي دون فقدان المسودة | العودة لا تمسح ResumeData ولا تنشئ تخزيناً جديداً |
| JRN-004 | حفظ session state داخل الذاكرة فقط للضيف | لا localStorage أو IndexedDB أو Cache Storage لمحتوى السيرة دون consent صريح |
| JRN-005 | انتهاء الجلسة قابل للفهم والحذف | تظهر مدة الانتهاء وزر الحذف وتصدر deletion receipt من Privacy Runtime |
| JRN-006 | كل انتقال قابل للتسجيل الآمن | event metadata فقط؛ لا CV text أو prompt أو response أو identifiers |

### P0 — Evidence-Locked Generative AI Gateway

#### الوصف

ربط العقود الحالية بطبقة remote اختيارية، مع إبقاء local-first هو المسار الافتراضي. لا يتم استدعاء remote provider إلا عند وجود consent صالح، وحساسية مسموحة، و`allowedFactIds` محددة، وpayload داخل الحد المسموح.

#### المتطلبات الوظيفية والأمنية

| المعرّف | المتطلب | معيار القبول |
|---|---|---|
| AI-001 | معاينة payload قبل الإرسال | تعرض الحقول المرسلة والمستبعدة والسبب والمزوّد والمدة المتوقعة |
| AI-002 | Evidence projection | لا تصل إلى provider أي حقيقة خارج `allowedFactIds` |
| AI-003 | Schema validation | الرد غير المطابق يرفض بأمان ولا يعدّل المسودة |
| AI-004 | Diff approval | كل اقتراح يعرض before/after ويحتاج موافقة صريحة لكل تطبيق |
| AI-005 | رفض consent bypass | غياب consent أو انتهاءه يؤدي إلى local fallback أو طلب موافقة، دون network call |
| AI-006 | منع الاختلاق | أي شركة أو مؤهل أو تاريخ أو metric غير مسند يرفض ويظهر كفشل قابل للمراجعة |
| AI-007 | فشل provider آمن | timeout أو 4xx/5xx ينتج fallback محلياً ورسالة قابلة للفهم دون كشف payload في logs |

### P1 — Smart Career Interview 2.0

#### الوصف

توسيع Interview Engine الموجود إلى جلسة تحضير مقابلة مرتبطة بـCareerProfileGraph وjob description. يجب أن تبقى الإجابات memory-only للضيف، وأن تكون كل أسئلة STAR مرتبطة بحقائق أو معلّمة بوضوح كفجوة تحتاج إدخالاً من المستخدم.

#### الميزات

1. اختيار نوع المقابلة والقطاع والدور من بيانات المستخدم فقط، دون افتراض الجنسية أو المدينة أو الشركة.
2. توليد سؤال واحد في كل مرة مع سبب السؤال والحقيقة المرتبطة به.
3. محرر STAR للـSituation وTask وAction وResult مع مؤشر اكتمال، دون ادعاء أن النتيجة مثبتة إن لم يقدمها المستخدم.
4. مراجعة لغوية عربية/إنجليزية ومختلطة محلياً، مع خيار remote مستقل يخضع لـAI-001 إلى AI-007.
5. نهاية جلسة قابلة للتصدير أو النسخ بعد موافقة المستخدم، دون حفظ تلقائي لضيف.

### P1 — Noura Adaptive Evidence Review

#### الوصف

إضافة سطح مراجعة يربط Resume Health وSection Coach وATS وJob Match في ترتيب مفهوم: ما الذي يحتاج إصلاحاً، لماذا، وما الدليل المطلوب. لا يغير ترتيب السيرة أو محتواها تلقائياً.

#### معايير القبول

- كل ملاحظة تحتوي على section، reason، evidence state، confidence، next action، وprivacy boundary.
- لا تظهر توصية «أضف رقماً» إلا إذا كان الرقم سيأتي من المستخدم أو من حقيقة موجودة.
- يمكن رفض أو تأجيل كل ملاحظة دون فقدان البيانات.
- أي تعديل مقترح يعرض diff قبل التطبيق.
- نتائج ATS وJob Match تظل explainable ولا تعرض ضمان توظيف أو ادعاء قبول.

### P1 — Quality Corpus وEvaluation Harness 2.0

ينبغي إنشاء 300 حالة اصطناعية تغطي الطلاب والخريجين والموظفين والباحثين عن عمل والقادة، وقطاعات سعودية متعددة، والعربية والإنجليزية والخلط اللغوي، والحقائق المفقودة والمتعارضة، وطلبات الاختلاق، والبيانات الحساسة، وprompt injection [4].

| المقياس | الحد المقترح | شرط مانع |
|---|---:|---:|
| Intent accuracy | ≥ 95% | لا |
| Question relevance | ≥ 90% | لا |
| Fact preservation | ≥ 98% | نعم عند الانخفاض الحاد |
| Structured output | ≥ 99.5% | نعم |
| Invented companies/qualifications/dates/metrics | 0 | نعم |
| Critical privacy failures | 0 | نعم |
| Consent bypass | 0 | نعم |
| Data loss | 0 | نعم |
| Human review score | ≥ 4/5 | لا؛ يحتاج مراجعة نوعية |

هذه حدود مقترحة للاعتماد، وليست نتائج مثبتة حالياً. يجب فصل تقييم local deterministic عن تقييم remote generative، وتسجيل fixtures والنتائج دون بيانات شخصية.

### P2 — Session Recovery وOffline Continuity

تنفيذ recovery اختياري خلف consent صريح فقط. عند غياب consent يبقى fallback memory-only ويشرح للمستخدم أن إغلاق الصفحة قد ينهي الجلسة. عند انقطاع الشبكة تظهر حالة offline وتستمر الأدوات المحلية الممكنة، ولا يعاد إرسال payload تلقائياً عند عودة الاتصال.

#### شروط غير قابلة للتفاوض

- recovery storage لا يعمل افتراضياً.
- deletion يمسح الذاكرة وبيانات recovery المصرح بها ويعيد receipt.
- لا يتم نقل guest draft إلى حساب بعد signup دون موافقة واضحة على الإجراء.
- لا يتم استعادة remote request أو AI response تلقائياً.

### P2 — Privacy-Safe Production Observability

توسيع `SafeEventSchema` إلى قياسات تشغيلية مفيدة، مع correlation ID عشوائي، sampling، retention قصير، وredaction قبل الإرسال. الحقول المسموحة يمكن أن تشمل route، duration، success، release، model، token/cost aggregates، PDF/parser status، anonymous-flow، LCP، وCLS؛ ويمنع إرسال نص السيرة أو prompts أو responses أو auth headers أو cookies.

#### مؤشرات مقترحة

| المجال | المؤشر | ملاحظة الاعتماد |
|---|---|---|
| UX | LCP/CLS/INP حسب route | يبدأ كbaseline ثم تصبح budgets blocking بعد calibration |
| Reliability | route error rate وAI fallback rate | aggregate فقط |
| PDF | success rate وduration وfailure class | لا PDF content |
| Privacy | blocked request count وconsent rejection count | لا payload bodies |
| AI | latency وschema rejection وcost aggregate | لا prompt/response |
| Guest flow | session expiry وdeletion completion | correlation ID غير مباشر |

## 4. المعمارية المقترحة

تظل الطبقات منفصلة كما يلي:

```text
Noura Route Surface
        |
Adaptive Journey State Machine
        |
Local Intelligence + CareerProfileGraph + Privacy Runtime
        |                  |
Evidence Review      Consent/Transmission Preview
        |
Optional Remote AI Gateway
        |
Schema Validation -> Diff -> Explicit Approval -> Apply
        |
Safe Observability (metadata only)
```

لا يسمح Phase 20 بتحويل `/assistant` إلى God Component. يجب أن تبقى state machine والعقود والـproviders ضمن modules مستقلة، مع مكونات UI صغيرة قابلة للاختبار.

## 5. خطة التنفيذ المقترحة

| الموجة | المحتوى | مخرجاتها |
|---|---|---|
| Wave 1 — Journey Core | state machine، goal-specific questions، session expiry، local evidence review | عقود Zod، fixtures عربية/إنجليزية، route integration، smoke tests |
| Wave 2 — Evidence AI | remote gateway، payload preview، schema validation، diff/approval، provider fallback | provider adapter، privacy/network tests، 300-case corpus أولي |
| Wave 3 — Career Continuity | Interview 2.0، optional recovery، offline state، observability calibration | E2E، deletion proof، dashboards/metrics، Lighthouse baselines |

كل موجة يجب أن تكون PR مستقلة وقابلة للعكس، ولا يجوز فتح migration قاعدة بيانات قبل اعتماد نموذج التخزين والخصوصية صراحة.

## 6. ما هو خارج النطاق

لا تشمل Phase 20 تلقائياً تطبيق الهاتف، voice recording أو live audio، auto-apply للوظائف، geolocation، توصيات توظيف مضمونة، social sharing، long-term guest profile، أو training model على بيانات المستخدم. أي من هذه العناصر يحتاج Change Manifest منفصلاً ومراجعة خصوصية وأمن.

## 7. بوابة الإصدار المقترحة

لا تصبح Phase 20 قابلة للدمج حتى تنجح بوابات Build وTypeScript وLint وQA، وNetwork Privacy، وData Deletion، وPDF Arabic/English، وChromium/Firefox/WebKit، وkeyboard/RTL/reduced motion، مع عدم وجود critical privacy failure أو consent bypass أو data loss. يجب أن يراجع المالك screenshots وLighthouse baselines قبل تحويل الأداء إلى threshold مانع.

## 8. القرارات المطلوبة من المالك

| القرار | الخيار الموصى به |
|---|---|
| أولوية Phase 20 | البدء بـAdaptive Journey State Machine قبل توسيع remote AI |
| remote AI | opt-in فقط، Evidence-Locked، مع payload preview وdiff approval |
| guest recovery | memory-only افتراضياً؛ recovery اختياري خلف consent |
| التقييم | اعتماد corpus 300 حالة مع فصل local وremote metrics |
| observability | metadata-only، redaction قبل النقل، لا CV/prompt/response |
| قواعد البيانات | لا migration في Wave 1 أو Wave 2 قبل مراجعة منفصلة |
| التسليم | ثلاث PRs مستقلة، Draft أولاً، ولا merge دون موافقة صريحة |

## 9. قرار البدء المقترح

الخطوة الآمنة التالية هي اعتماد Wave 1 فقط وإنشاء Change Manifest تنفيذي لها. لا يُنصح ببدء remote AI أو recovery أو migrations في نفس PR؛ لأن ذلك يخلط مخاطر state management والخصوصية وجودة النموذج في تغيير واحد.

## المراجع

[1] [`docs/PHASE_19_CHANGE_MANIFEST.md`](./PHASE_19_CHANGE_MANIFEST.md) — Phase 19 scope, privacy boundaries, and evaluation checkpoint.

[2] [`docs/PHASE_19_WAVE_1_REPORT.md`](./PHASE_19_WAVE_1_REPORT.md) — Phase 19 delivered capabilities and deferred work.

[3] [`docs/NOURA_EXPERIENCE_ARCHITECTURE.md`](./NOURA_EXPERIENCE_ARCHITECTURE.md) — Noura state, journey, privacy, approval, preview, and performance contracts.

[4] [`docs/NOURA_EVALUATION.md`](./NOURA_EVALUATION.md) — Proposed 300-case corpus and quality thresholds.

[5] [`src/modules/privacy/runtime.ts`](../src/modules/privacy/runtime.ts) — Privacy Runtime storage and deletion boundaries.

[6] [`src/modules/ai/evidence.ts`](../src/modules/ai/evidence.ts) — Evidence-Locked AI request, projection, validation, and approval contracts.
