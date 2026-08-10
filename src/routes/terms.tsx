import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام | سيرتي Seerati" },
      {
        name: "description",
        content: "شروط استخدام منصة سيرتي: مسؤولية المحتوى، حدود الاستخدام، وطبيعة نتائج توافق ATS الإرشادية.",
      },
      { property: "og:title", content: "شروط الاستخدام | سيرتي Seerati" },
      { property: "og:description", content: "بيان مبدئي لشروط استخدام منصة سيرتي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const sections = ar
    ? [
        {
          h: "قبول الشروط",
          p: [
            "باستخدامك منصة سيرتي فإنك توافق على هذه الشروط التوضيحية. قد تُحدَّث الشروط مع تطور المنصة.",
          ],
        },
        {
          h: "الحساب وحدود الاستخدام",
          p: [
            "يلزم حساب صحيح ببريد إلكتروني فعّال، وأنت مسؤول عن الحفاظ على بيانات الدخول.",
            "يسمح كل حساب بعدد محدود من السير الذاتية (ثلاث في الخطة الحالية) ويُفرض هذا الحد على مستوى قاعدة البيانات.",
          ],
        },
        {
          h: "مسؤولية المحتوى",
          p: [
            "أنت المسؤول عن صحة وسلامة كل ما تُدخله في سيرتك، بما في ذلك الشهادات والخبرات والأرقام.",
            "لا يجوز إدخال بيانات مضلّلة أو انتحال هوية غيرك أو رفع محتوى ينتهك حقوق الآخرين.",
          ],
        },
        {
          h: "نتائج ATS والذكاء الاصطناعي إرشادية",
          p: [
            "درجة توافق ATS ونتائج مطابقة الوصف الوظيفي مؤشرات إرشادية تعتمد على قواعد داخلية، ولا تمثل نتيجة نظام فرز فعلي لدى جهة التوظيف.",
            "اقتراحات المساعد قد تحتاج مراجعة وتعديل، ولا نضمن الحصول على مقابلة أو وظيفة.",
          ],
        },
        {
          h: "توفر الخدمة",
          p: [
            "قد تتوقف الخدمة مؤقتاً للصيانة أو التطوير. نسعى لتقليل الانقطاع لكننا لا نقدّم ضمان توفر في هذه النسخة.",
          ],
        },
        { h: "التواصل", p: ["للاستفسارات: hello@seerati.sa (عنوان تجريبي في هذه النسخة)."] },
      ]
    : [
        {
          h: "Acceptance",
          p: ["By using Seerati you agree to these informational terms. They may be updated as the product evolves."],
        },
        {
          h: "Account and usage limits",
          p: [
            "A valid account with a working email is required and you are responsible for keeping your credentials safe.",
            "Each account may keep a limited number of resumes (three on the current plan), enforced at the database level.",
          ],
        },
        {
          h: "Content responsibility",
          p: [
            "You are responsible for the accuracy of everything you enter in your resume, including credentials, roles and figures.",
            "Misleading data, impersonation and content that infringes others' rights are not allowed.",
          ],
        },
        {
          h: "ATS and AI results are advisory",
          p: [
            "The ATS score and job-description match are rule-based advisory indicators, not the output of an employer's real screening system.",
            "Assistant suggestions may need review and editing; we do not guarantee interviews or job offers.",
          ],
        },
        {
          h: "Service availability",
          p: ["Service may pause for maintenance or development. We aim to minimise downtime but offer no availability guarantee in this release."],
        },
        { h: "Contact", p: ["Questions: hello@seerati.sa (demo address in this release)."] },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight">{ar ? "شروط الاستخدام" : "Terms of use"}</h1>
        <p className="mt-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-relaxed">
          {ar
            ? "هذه صفحة توضيحية مبدئية وليست صياغة قانونية نهائية."
            : "This is an informational placeholder, not final legal drafting."}
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold">{s.h}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {s.p.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
