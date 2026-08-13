# Phase 15 Change Manifest

## الهدف

إثبات جودة مساعد سيرتي ونظام ATS للسوق السعودي، خفض LCP للمسارات الأساسية، إغلاق فجوات الخصوصية والأمن، وتجهيز Beta سعودية محدودة دون إجبار المستخدم على التسجيل أو تخزين بيانات الزائر افتراضيًا.

## نطاق التنفيذ

| المسار            | النطاق                                                                   | دليل القبول                                                        |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Performance P0    | Bundle graph، LCP tracing، route-specific providers، lazy loading        | median LCP ≤2.5s للمسارات المستهدفة أو تقرير موثق للفجوة           |
| AI evaluation     | Dataset اصطناعية، schema checks، hallucination/factuality/safety harness | النتائج قابلة لإعادة التشغيل وموسومة حسب model/prompt/dataset hash |
| ATS validation    | structured/plain/PDF parser checks ومعايرة scoring                       | F1/precision/recall موثقة دون ادعاء ضمان ATS                       |
| Saudi review      | rubric عربية/إنجليزية ومراجعة قطاعية synthetic                           | quality وsafety وnon-discrimination rubric موثقة                   |
| Security red-team | prompt injection، uploads، XSS/CSRF/IDOR، headers، secrets، rate limits  | critical PII/secret/privilege/XSS/upload bypass = صفر              |
| Data deletion     | memory/local/session/cache/object URLs/pending work                      | عدم استعادة بيانات synthetic بعد الحذف أو refresh                  |
| Global experience | theme/tokens/typography/intro اختياري غير حاجب                           | WCAG AA، reduced motion، لا يرفع LCP أو CLS                        |
| Controlled beta   | خطة cohort وconsent وprivacy-safe analytics                              | لا إطلاق عام ولا ادعاء production readiness دون موافقة المالك      |

## الملفات المخطط لها

- `docs/PHASE_15_BASELINE.md`
- `docs/PHASE_15_CHANGE_MANIFEST.md`
- `docs/EVALUATION_DATASET_SPEC.md`
- `docs/EVALUATION_DATA_POLICY.md`
- `docs/AI_EVALUATION_FRAMEWORK.md`
- `docs/AI_EVALUATION_RESULTS.md`
- `docs/AI_MODEL_RELEASE_CARD.md`
- `docs/ATS_VALIDATION_METHOD.md`
- `docs/ATS_SCORING_CALIBRATION.md`
- `docs/ATS_VALIDATION_RESULTS.md`
- `docs/SAUDI_CAREER_REVIEW_RUBRIC.md`
- `docs/SAUDI_CONTENT_VALIDATION.md`
- `docs/PHASE_15_THREAT_MODEL.md`
- `docs/RED_TEAM_PLAN.md`
- `docs/RED_TEAM_RESULTS.md`
- `docs/SECURITY_RELEASE_DECISION.md`
- `docs/DATA_DELETION_VALIDATION.md`
- `docs/GLOBAL_EXPERIENCE_BENCHMARK.md`
- `docs/SEERATI_VISUAL_DIFFERENTIATION.md`
- `docs/DESIGN_SYSTEM_2.md`
- `docs/THEME_MIGRATION_PLAN.md`

## Privacy constraints

بيانات المستخدم الحقيقية ممنوعة من source وCI artifacts وscreenshots وprompts وlogs. Guest state memory-only افتراضيًا، ولا تُضاف sessionStorage أو analytics payloads إلا بموافقة صريحة وتوثيق واضح. لا تُرسل بيانات المستخدم إلى خدمة ATS خارجية دون موافقة.

## Release gates

Network Privacy، guest deletion، critical accessibility، PDF selectable/directional text، critical PII/secret leaks، privilege escalation، cross-user access، stored/reflected XSS، وmalicious-upload bypass بوابات مانعة. Performance/LCP تبقى staged warnings إلى أن تثبت variance ويوافق المالك على جعلها blocking.

## الاستثناءات

لا يشمل هذا الفرع دمجًا إلى `main` أو تفعيل beta عامة أو استخدام بيانات بشرية حقيقية أو ادعاء ضمان ATS أو نتائج توظيف. كما لا يجوز نسخ تصاميم أو نصوص أو أصول منافسين.

## التراجع

التراجع يكون بإلغاء PR Phase 15 أو الرجوع إلى merge commit Phase 14 `19bfffa`. لا يُسمح بـ force push أو إعادة كتابة history.
