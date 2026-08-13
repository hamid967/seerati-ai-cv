# مراجعة مواصفة Phase 18 — Seerati Career Operating System

**تاريخ المراجعة:** 13 أغسطس 2026
**المستودع:** `hamid967/seerati-ai-cv`
**حالة الأساس:** `origin/main` عند `f5840d7`، ويتضمن دمج Phase 17 في PR #47.
**نطاق هذه الوثيقة:** مراجعة المواصفة وقابليتها للتنفيذ، وليست موافقة على بدء التطوير أو فتح فرع جديد.

## الخلاصة التنفيذية

المواصفة قوية كرؤية طويلة الأجل، وتضع مبادئ صحيحة في مجالات الخصوصية، قابلية التفسير، مصدر الحقيقة، عدم اختلاق بيانات السيرة، ودعم العربية وRTL. لكنها في وضعها الحالي أكبر من أن تُعامل كـPhase تنفيذية واحدة. فهي تجمع منصة بيانات مهنية، محرك مستندات، نظام قوالب، AI مقيد بالأدلة، ATS، مطابقة وظائف، استيراد وتصدير، Workspace، مقابلات، Portfolio، Privacy Runtime، Offline، Provider Architecture، إدارة، Observability، Security، Performance، واختبارات شاملة في خطة واحدة.

**التقييم الهندسي:** المواصفة مناسبة كـNorth Star وPortfolio Roadmap، لكنها تحتاج إلى تحويل رسمي إلى عقد تأسيسي صغير قبل التنفيذ. أوصي بألا تبدأ Phase 18 بكل أقسامها، بل بـ**Wave 1 محدودة** تتكون من CareerProfileGraph adapter، Privacy Runtime 2.0، حدود provider، وعقود اختبار قابلة للتشغيل. يجب تأجيل محرك المستندات الشامل، Template SDK، AI Engine، Taxonomy، ATS، Job Match، Workspace، Interview، Portfolio، Admin، وObservability إلى PRs مستقلة بعد نجاح الأساس.

> **قرار المراجعة:** Architecture concept = **Promising but not ready for implementation as written**. Wave 1 foundation = **قابلة للبدء بعد معالجة قرارات الحسم أدناه**. Production readiness = **غير مطروحة بعد**.

## ما تم التحقق منه في المستودع

تمت قراءة `AGENTS.md` وفحص `origin/main` وحالة PRs. لا توجد PRs مفتوحة حالياً، وPhase 17 مدمجة في `origin/main` عند `f5840d7`. المشروع ليس Monorepo؛ البنية الحالية هي TanStack Start + React 19 + Vite 8 + Tailwind v4، وتوجد معظم حدود المجال داخل `src/lib` و`src/components` و`src/routes`، مع عدم وجود `packages/` أو `src/modules/` حالياً.

النظام الحالي يحتوي بالفعل على أنواع Resume وResumeData، تخزين حسابي عبر Supabase، محرك ATS وlint، مطابقة وظائف، import pipeline أولية، PDF، قوالب، assistant، ومكونات خصوصية. لذلك فإن إنشاء CareerProfileGraph وDocument Engine من الصفر سيخلق خطر نموذجين متوازيين للحقائق إذا لم يبدأ كـ**adapter فوق النموذج الحالي**.

| محور baseline   | الحالة الحالية ذات الصلة                                                               | أثرها على Phase 18                                                                                    |
| --------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| بنية المشروع    | تطبيق واحد، لا Monorepo ولا `packages/`                                                | لا يُنصح بتحويل جذري؛ استخدم `src/modules/` تدريجياً أو طبقة domain مستقلة داخل `src/lib` أولاً.      |
| Guest storage   | `guest-store.ts` يحافظ على البيانات في الذاكرة؛ sessionStorage اختياري عند consent فقط | متوافق مع هدف Phase 18، لكن يجب إزالة أي وثائق قديمة تقول إن guest يعتمد localStorage افتراضياً.      |
| Account storage | Supabase/RLS للحسابات                                                                  | أي CareerProfileGraph دائم يجب أن يمر بموافقة صريحة ومخطط migration مستقل.                            |
| AI/ATS          | توجد طبقات AI وATS وjob-match وlint قائمة                                              | Phase 18 يجب أن توحّد العقود وتضيف provenance، لا أن تنشئ محركات موازية بلا migration.                |
| Import          | توجد مراحل normalizer وsection detection وprovenance وconflict                         | يمكن توسيعها إلى pipeline موحدة بعد تثبيت schema الوسيط.                                              |
| PDF/Print       | توجد export وPDF وRelease Hardening عربي/إنجليزي                                       | يجب بناء ResumeDocument deterministic فوق pipeline الحالية مع الحفاظ على مسار PDF المجاني.            |
| Templates       | 24 قالباً أصلياً نشطاً مع RTL وATS metadata                                            | Template Engine 2.0 يجب أن يكون compatibility layer وإصداراً تدريجياً، لا إعادة تسجيل القوالب يدوياً. |
| Performance     | Phase 17 أثبتت CLS جيداً، لكن LCP median كان نحو 4.241s على `/assistant`               | أي foundation جديدة يجب ألا تزيد initial bundle؛ الأداء قيد تصميم معماري وليس خطوة لاحقة.             |
| Database        | توجد migration موثقة لم تُطبق على قاعدة البيانات الحية وفق `AGENTS.md`                 | يجب إجراء live migration inventory قبل أي جداول Phase 18.                                             |
| CI              | QA وRelease Hardening وLighthouse موجودة ونجحت في PR #47                               | يجب إضافة اختبارات Phase 18 إلى نفس المسار تدريجياً، لا إنشاء CI منفصل غير متكامل.                    |

## نقاط القوة في المواصفة

أقوى جزء في المواصفة هو جعل **Evidence وProvenance وUser Approval** شروطاً للانتقال من suggestion إلى fact. القاعدة التي تمنع AI من اختراع الشركات أو المؤهلات أو الأرقام وتفرض عرض Diff قبل التطبيق مناسبة جداً لمنتج سيرة ذاتية، ويمكن تحويلها إلى schemas وcontract tests قابلة للقياس.

كما أن فصل guest عن الحساب، ومنع رفع البيانات افتراضياً، واشتراط preview قبل إرسال البيانات إلى AI، ومنع تسجيل Resume text وPrompts وAI responses في Observability، كلها قرارات صحيحة ومتسقة مع اتجاه Phase 17. كذلك فإن اشتراط deterministic ATS وDocument Engine وPDF عربي قابل للبحث أفضل من الاعتماد على screenshots أو درجات غير قابلة للتفسير.

## قرارات حاسمة قبل التنفيذ

| الأولوية | القرار المطلوب                                                            | سبب الحسم                                                                                                | التوصية                                                                                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | ما هو المصدر الرسمي للحقيقة: `ResumeData` الحالي أم `CareerProfileGraph`؟ | وجود نموذجين سيؤدي إلى drift بين editor وATS وPDF وAI.                                                   | ابدأ بـGraph adapter يقرأ ويكتب عبر anti-corruption layer، ثم انقل الأقسام تدريجياً.                                                                                                                                                         |
| P0       | توحيد سياسة guest في الوثائق والكود                                       | `AGENTS.md` يذكر localStorage، بينما `guest-store.ts` الحالي يعلن memory-only مع sessionStorage اختياري. | حدّث الوثائق أولاً واعتمد memory-only كالعقد الرسمي. لا تستخدم migration ضمن signup إلا بعد consent صريح.                                                                                                                                    |
| P0       | تعريف حدود CareerProfileGraph                                             | قائمة الكيانات كبيرة، وبعضها غير موجود أو غير مطلوب للـMVP.                                              | ابدأ بـIdentity, Contact, TargetRole, Summary, Experience, Achievement, Education, Skill, Language, Certification, Link, Provenance, Consent. أجل Publication, Award, Membership, Reference, CustomSection وEvidence المتقدم إلى بعد التحقق. |
| P0       | سياسة البيانات الحساسة                                                    | `sensitivity` و`confidence` وAI history تحتاج taxonomy دقيقة.                                            | عرّف enum، retention، export/delete behavior، وحق الوصول لكل مستوى قبل التخزين.                                                                                                                                                              |
| P0       | تعريف الخصوصية عند إرسال AI                                               | `AI transmission preview` يحتاج نموذج قرار وليس مجرد واجهة.                                              | كل request يحمل action، fact IDs المسموح بها، locale، consent، max payload، timeout، cancellation، وredaction result.                                                                                                                        |
| P1       | قرار Monorepo أو modules                                                  | تحويل المشروع الآن قد يستهلك Phase كاملة بلا قيمة مستخدم.                                                | لا تحول إلى Monorepo؛ أنشئ `src/modules/career` و`src/modules/privacy` تدريجياً فقط عند وجود حدود اختبار واضحة.                                                                                                                              |
| P1       | تعريف “appropriate encryption” للحساب                                     | التشفير داخل تطبيق يستخدم Supabase/RLS ليس عبارة كافية.                                                  | وثّق threat model: TLS، RLS، secrets server-side، هل توجد field-level encryption، ومن يملك مفاتيحها. لا تدّعِ encryption at rest إضافية دون تنفيذ موثق.                                                                                      |
| P1       | تعريف Offline                                                             | Offline editing وmemory-only ممكنان داخل tab، لكن Service Worker وsession recovery قد يغيران الحدود.     | ابدأ بـoffline-degraded mode داخل الذاكرة دون Service Worker. اجعل recovery opt-in منفصلاً ومراجعاً.                                                                                                                                         |
| P1       | اعتماد Rezi Resume Standard                                               | المواصفة تطلب مراجعة ترخيص ومواصفات قبل الإضافة.                                                         | لا تضف metadata أو اسم معيار إلى المنتج قبل مراجعة المصدر الرسمي والترخيص وكتابة قرار قانوني/هندسي واضح.                                                                                                                                     |
| P1       | Production target `cv.hrhbs.com`                                          | لم يُثبت في هذه المراجعة أنه يشير إلى آخر build أو أنه جاهز للتغيير.                                     | نفّذ deployment readiness check مستقل قبل أي claim إنتاجي: DNS، HTTPS، headers، build version، privacy smoke، rollback.                                                                                                                      |
| P2       | Virtual team of 50                                                        | العدد لا يغير حدود العمل الفعلية في مستودع واحد.                                                         | استخدم workstreams وملاك مراجعة واضحين بدلاً من ادعاء تنفيذ متوازٍ غير قابل للدمج.                                                                                                                                                           |

## التناقضات والمخاطر الرئيسية

### 1. حجم Phase غير واقعي

المواصفة تطلب 20 برنامجاً جديداً، 12 PRs، 11 أو أكثر من محركات المنتج، وأربعة أو خمسة Waves. هذا مناسب لخارطة طريق متعددة المراحل، وليس لفرع Phase واحد. خطر هذا التصميم هو إنتاج interfaces كثيرة بلا استخدام حقيقي، أو طبقات شكلية تكرر الوظائف القائمة.

**الإجراء:** اعتمد Phase 18A Foundation فقط، واجعل كل engine لاحقاً يملك use case فعلياً في UI أو CI أو export. أي برنامج لا يملك consumer واختباراً وfixture وتوثيقاً يجب ألا يُنشأ بعد.

### 2. CareerProfileGraph قد يصبح نموذجاً موازياً

النموذج الحالي يملك ResumeData وResume، وتوجد وظائف ATS وimport وjob-match تعتمد عليها. إنشاء Graph جديد دون adapter سيجبر الفريق على مزامنة محررين ومصدرين للحقيقة.

**الإجراء:** صمّم Graph كـcanonical domain model مستقبلي، لكن نفذه أولاً عبر `fromResumeData` و`toResumeData` مع round-trip tests وloss report. لا تُسقط الحقول التي لا يدعمها Graph؛ أظهرها كـunsupported أو legacy حتى لا يحدث فقد صامت.

### 3. Privacy claims تحتاج contract قابل للتحقق

عبارات مثل “buffer zeroing”، “appropriate encryption”، و“no real data in artifacts” ليست acceptance criteria كافية. JavaScript لا يضمن محو الذاكرة من GC، وRLS ليس تشفيراً، وredaction يجب اختباره على payloads اصطناعية متعددة.

**الإجراء:** حوّلها إلى guarantees قابلة للقياس: no remote upload by default، no PII in captured request metadata، session deletion clears memory and consented recovery، no sensitive fixture in artifacts، وprovider requests reject missing consent.

### 4. Offline وsession recovery قد يوسّعان التخزين دون قصد

المواصفة تريد تحريراً offline مع منع Service Worker لحفظ السيرة دون موافقة، وتريد أيضاً JSON backup محلياً اختيارياً. يجب الفصل بين استمرار البيانات داخل tab وبين recovery بعد reload.

**الإجراء:** عرّف ثلاثة أوضاع فقط: memory-only، consented session recovery، authenticated cloud. لكل وضع indicator وdelete semantics واختبار browser مستقل.

### 5. AI Engine واسع ويحتاج تقييم قبل التوسع

Evidence-Locked AI ممتاز كمبدأ، لكن تعدد actions واللغتين ومزود fallback وPII minimization وstructured output وcancellation وcost accounting يجعل أول release حساساً.

**الإجراء:** ابدأ بثلاثة actions فقط: `improve_bullet`, `write_summary`, و`translate`. لا تضف `match_job` أو `prepare_interview` إلى نفس PR. كل action يحتاج schema، refusal cases، synthetic fixtures، diff، approval، وevaluation set عربي/إنجليزي.

### 6. ATS وJob Match يجب ألا يعتمدا على درجة واحدة

المواصفة صحيحة في رفض keyword repetition كدليل تطابق. لكن synonym وtaxonomy وsemantic matching وexperience-level matching قد تنتج false positives، خصوصاً بالعربية والإنجليزية.

**الإجراء:** اجعل كل match يحمل `matchType`, `evidenceIds`, `confidence`, `ruleVersion`, و`explanation`. لا تعرض overall score قبل وجود calibration dataset ومراجعة بشرية منفصلة لكل لغة.

### 7. Taxonomy ليست تصنيفاً رسمياً

المواصفة تحذر من ذلك، لكن وجود “Saudi Career Taxonomy” قد يُفهم بسهولة على أنه حكومي أو رسمي.

**الإجراء:** سمّه internally `Seerati Career Taxonomy`، أضف version/date/source لكل term، واستخدم public sources فقط عند توفرها. لا تدخل taxonomy كاملة إلى initial bundle؛ حمّل القطاع عند الطلب.

### 8. Migrations والـlive database

بحسب `AGENTS.md`، توجد migration لـStage 4 ownership validation في المستودع لكنها لم تُطبق على قاعدة البيانات الحية. إضافة career tables قبل inventory وmigration ledger قد تخلق اختلافاً بين branch والبيئة الفعلية.

**الإجراء:** أنشئ أولاً `docs/PHASE_18_DATABASE_READINESS.md` أو قسماً مماثلاً يوضح applied/pending/owner/deploy method، ولا تضف migration domain جديدة قبل تأكيد live state.

## تقييم Waves المقترحة

| Wave                         | تقييم المواصفة                                    | التعديل المقترح                                                                                  |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Wave 1 — Foundations         | صحيحة لكنها واسعة                                 | Graph adapter، Privacy Runtime contracts، Provider interfaces، schemas، fixtures، no UI rewrite. |
| Wave 2 — Document Platform   | عالية المخاطر إذا بدأت قبل Graph                  | ابدأ فقط بعد round-trip Graph وPDF regression؛ استخدم renderer الحالي كمرجع compatibility.       |
| Wave 3 — Intelligence        | تحتاج بيانات تقييم قبل البناء الكامل              | نفّذ AI actions قليلة، ثم taxonomy، ثم ATS deterministic، ثم Job Match.                          |
| Wave 4 — Career Applications | قيمة مستخدمية عالية لكنها تعتمد على versioning    | لا تبدأ Workspace قبل version manager وprivacy modes وdelete/export.                             |
| Wave 5 — Operations          | يجب أن تكون parallel policy work لا منتجاً جديداً | Observability وSecurity وPerformance gates يجب أن ترافق كل PR، لا تنتظر نهاية المشروع.           |

القاعدة «لا تبدأ Wave جديدة قبل نجاح السابقة» جيدة، لكنها تحتاج تعريفاً رقمياً للنجاح. النجاح لا يعني أن كل الاختبارات نجحت فقط؛ يجب أن يشمل عدم زيادة initial bundle، عدم كسر guest privacy، ووجود consumer حقيقي لكل module.

## توصية Wave 1 التنفيذية

### PR 1 — Career schema adapter

ينشئ هذا PR `CareerProfileGraph` وZod schemas وprovenance types وconversion adapters من وإلى `ResumeData`. يجب أن يحتوي على round-trip tests، unknown-field preservation، locale/direction validation، ورفض facts غير صالحة. لا يغير UI ولا يضيف جداول جديدة.

### PR 2 — Privacy Runtime contract

ينشئ هذا PR runtime موحداً لـmemory-only، consented recovery، authenticated cloud، expiration، delete now، request cancellation، object URL revocation، وAI transmission preview. يجب أن يستخدم fake providers وsynthetic data فقط، ويضيف network inspection contract.

### PR 3 — Provider boundaries

يضيف هذا PR interfaces ومزودات mock لـAI وParser وPDF وStorage، مع timeout وcancellation وretry محدود وerror model. لا ينقل كل logic فوراً؛ يُستخدم adapter حول الخدمات الحالية لتجنب إعادة البناء غير الضرورية.

### معايير خروج Wave 1

| Gate        | معيار الخروج                                                                        |
| ----------- | ----------------------------------------------------------------------------------- |
| Schema      | Graph round-trip لا يفقد الحقول، وZod يرفض malformed input.                         |
| Privacy     | Guest لا يكتب remote أو analytics payload، وdelete يمسح memory وrecovery consented. |
| AI          | request بدون consent أو allowed facts يُرفض قبل provider.                           |
| Performance | لا زيادة غير مبررة في initial JS؛ route budgets موثقة قبل إضافة engines.            |
| Browser     | guest وdelete يعملان في Chromium/Firefox/WebKit مع RTL/LTR.                         |
| Security    | لا secrets في client bundle، وredaction tests تمر.                                  |
| Delivery    | PR مستقل، Change Manifest، rollback، وreview owner واضح.                            |

## ما يجب حذفه أو تأجيله من المواصفة الحالية

ينبغي تأجيل إنشاء `Evaluation Dashboard` و`Administration 2.0` و`Portfolio Generator` و`Interview Preparation` و`DOCX export` و`Worker sandbox` و`field-level encryption` إلى قرارات منفصلة. هذه العناصر ليست خاطئة، لكنها ستوسع سطح المخاطر قبل إثبات Graph وPrivacy Runtime وDocument compatibility.

ينبغي كذلك عدم اعتبار “إضافة Rezi Resume Standard” ميزة منتج حتى يكتمل فحص الترخيص والمواصفات. وكذلك لا ينبغي تنفيذ scraping؛ النص الحالي صحيح في قصر Job Workspace على إدخال المستخدم أو APIs رسمية مصرح بها.

## التوصية النهائية

**أوصي بالموافقة على Phase 18 كخارطة طريق، وليس كـimplementation brief واحد.** قبل البدء، حدّث `AGENTS.md` لتثبيت memory-only كالسلوك الرسمي للزائر، أنشئ Change Manifest فعلياً لـWave 1، راجع live database state، وأنشئ فرعاً جديداً من `origin/main` عند `f5840d7` باسم `feat/phase-18-career-operating-system`.

لا حاجة حالياً إلى تحويل المشروع إلى Monorepo. أفضل مسار هو بناء حدود domain تدريجية داخل `src/modules/` أو طبقات واضحة في `src/lib`، مع الحفاظ على القوالب وPDF وATS الحالية عبر adapters. بعد نجاح Wave 1 فقط تُتخذ قرارات Document Engine وTemplate SDK وAI Engine.

**قرار البدء المقترح:** Go مشروط لـWave 1 بعد معالجة قرارات P0، وNo-Go لتنفيذ المواصفة كاملة دفعة واحدة. لا يوجد في هذه المراجعة أي طلب دمج أو تغيير في الكود.
