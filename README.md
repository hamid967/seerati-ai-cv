# Seerati AI

أنشئ مشروع SaaS احترافي كامل باسم «سيرتي | Seerati» لإنشاء السير الذاتية بالذكاء الاصطناعي. الهوية مستقلة تماماً ولا تنسخ BetterCV بصرياً، لكن رحلة الاستخدام تكون سريعة: اختيار قالب → إدخال البيانات → تحسين بالذكاء الاصطناعي → معاينة مباشرة → تنزيل PDF.

المتطلبات الأساسية:

- العربية RTL افتراضياً مع English/LTR و i18n كامل.
- Landing Page حديثة للسوق السعودي والخليجي: Hero، عرض القوالب، شرح 3 خطوات، مزايا AI، ATS، FAQ، CTA، Footer.
- تسجيل/دخول/استعادة كلمة مرور/Profile، وبعد التسجيل Onboarding ذكي.
- لكل مستخدم حد أقصى 3 سير ذاتية مع Usage 0/3 ومنع آمن server-side لاحقاً.
- Dashboard للعميل: إنشاء/استنساخ/إعادة تسمية/حذف، آخر تعديل، حالة الاكتمال، القالب، Quick Actions.
- CV Builder متعدد الخطوات مع autosave ومعاينة مباشرة. الأقسام: بيانات شخصية، ملخص، خبرات، تعليم، مهارات، لغات، شهادات، مشاريع، إنجازات، تطوع، روابط، مراجع، قسم مخصص، مع drag/reorder.
- Template Gallery بقوالب أولية: Classic ATS, Modern, Executive, Minimal, Saudi Professional, Creative. فلاتر ATS/Modern/Arabic/English. نظام templates component-driven.
- مساعد داخل الـBuilder باسم «مساعد سيرتي»: محادثة بعد التسجيل لتجميع البيانات، كتابة ملخص مهني، تحسين bullet points، تحويل المهام إلى إنجازات، اقتراح مهارات، تصحيح عربي/إنجليزي، اختصار/توسيع، ATS keywords من وصف وظيفة، ترجمة الأقسام. استخدم service abstraction/mock جاهز للربط بمزود AI لاحقاً ولا تضع أسراراً في الواجهة.
- ATS Checker score 0-100 بشكل أولي مع فحوصات الحقول والطول والعناوين ومعلومات الاتصال واقتراحات.
- PDF Export يدعم العربية RTL والقالب، Print Preview، ونسخة plain-text ATS.
- Admin محمي role=admin عبر /admin. KPIs، Users، CV metadata، Templates، AI settings placeholder، Content/FAQ، Usage limits، Audit log، Settings.
- Admin Template Designer: الاسم، الفئة، thumbnail، supportsRTL، ATS friendly، active، ترتيب العرض، typography/spacing/section style/accent مع preview حي.
- حضّر طبقة بيانات/Supabase schema للجداول profiles, resumes, templates, ai_usage, admin_audit_logs مع RLS user/admin.
- Design premium SaaS باستخدام Tailwind + shadcn، typography عربية ممتازة، كحلي/أزرق مهني مع accent أخضر زمردي خفيف، responsive كامل، dark mode اختياري.
- الصفحات: /, /templates, /features, /ats, /auth, /onboarding, /dashboard, /resumes/new, /resumes/:id/edit, /resumes/:id/preview, /account, /admin, /admin/users, /admin/templates, /admin/settings.
- UX: Autosave indicator، validation، empty states، skeletons، toasts، accessibility، mobile-first.
- Demo data وقوالب تجريبية، بدون ادعاءات تسويقية غير موثقة.
- SEO metadata عربي/إنجليزي وOG placeholders وsitemap/robots-ready.
- افصل admin/user، لا تكشف secrets، جهّز rate-limit abstraction لطلبات AI.
- جهّز المعمارية للتوسع لاحقاً إلى Cover Letter وربط الوظائف دون تشتيت MVP.

ابدأ بتنفيذ MVP متكامل بصرياً وعملياً يمكن استعراضه فوراً من Landing إلى Dashboard إلى Resume Builder إلى Admin. اجعل النصوص العربية سليمة ومهنية.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://seerati-ai-cv.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4dfc2c33-9a5e-43ba-ad24-4a32a4c71f8a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitLab and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
