import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | سيرتي Seerati" },
      {
        name: "description",
        content:
          "كيف تتعامل منصة سيرتي مع بياناتك: ما نخزّنه، استخدام الذكاء الاصطناعي، ملفات السير الذاتية، وحذف الحساب.",
      },
      { property: "og:title", content: "سياسة الخصوصية | سيرتي Seerati" },
      { property: "og:description", content: "بيان مبدئي لسياسة الخصوصية في منصة سيرتي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

type Section = { h: string; p: string[] };

function PrivacyPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const sections: Section[] = ar
    ? [
        {
          h: "البيانات التي نخزّنها",
          p: [
            "بيانات الحساب: البريد الإلكتروني والاسم وتاريخ التسجيل.",
            "بيانات الملف المهني: الوظيفة المستهدفة، سنوات الخبرة، القطاع، ولغة السيرة المفضّلة.",
            "محتوى السير الذاتية الذي تُدخله بنفسك، ودرجات الاكتمال وتوافق ATS المحسوبة منه.",
            "سجل مختصر لعمليات الذكاء الاصطناعي (نوع العملية ووقتها) لأغراض الحدود والتشغيل.",
          ],
        },
        {
          h: "استخدام الذكاء الاصطناعي",
          p: [
            "تُستخدم ميزات المساعد لتحسين النصوص التي ترسلها فقط، ولا تُطبَّق أي نتيجة على سيرتك إلا بعد اعتمادك لها.",
            "في هذه النسخة يعمل المساعد بمزوّد داخلي تجريبي. عند ربط مزوّد خارجي حقيقي سنوضّح ذلك، وتُخزَّن مفاتيح المزوّد على الخادم فقط.",
          ],
        },
        {
          h: "ملفات السير الذاتية",
          p: [
            "سيرتك مرتبطة بحسابك وتُقرأ عبر سياسات وصول تمنع أي مستخدم آخر من رؤيتها.",
            "قد يرى فريق الإدارة بيانات وصفية فقط (المعرّف، القالب، اللغة، الحالة، الدرجات) لأغراض الدعم والتشغيل، دون محتواك الشخصي.",
            "تنزيل PDF يتم من متصفحك مباشرة عبر واجهة الطباعة.",
          ],
        },
        {
          h: "حذف الحساب أو البيانات",
          p: [
            "يمكنك حذف أي سيرة ذاتية من لوحة التحكم في أي وقت، ويُحذف محتواها من قاعدة البيانات.",
            "لحذف الحساب بالكامل تواصل معنا عبر بريد التواصل أدناه وسنعالج الطلب.",
          ],
        },
        {
          h: "التواصل",
          p: ["بريد مؤقت للتواصل: hello@seerati.sa (عنوان تجريبي في هذه النسخة)."],
        },
      ]
    : [
        {
          h: "Data we store",
          p: [
            "Account data: email, name and signup date.",
            "Professional profile: target role, years of experience, industry and preferred resume language.",
            "The resume content you type, plus the completion and ATS scores derived from it.",
            "A short log of AI actions (action type and timestamp) used for rate limits and operations.",
          ],
        },
        {
          h: "Use of AI",
          p: [
            "Assistant features only process the text you submit, and no suggestion is applied to your resume until you approve it.",
            "In this release the assistant runs on an internal demo provider. If a real external provider is connected we will state it, and provider keys are stored server-side only.",
          ],
        },
        {
          h: "Resume files",
          p: [
            "Your resumes are tied to your account and protected by access policies that prevent other users from reading them.",
            "Administrators may see metadata only (id, template, language, status, scores) for support and operations — never your personal content.",
            "PDF download happens in your browser through the print dialog.",
          ],
        },
        {
          h: "Deleting your account or data",
          p: [
            "You can delete any resume from your dashboard at any time; its content is removed from the database.",
            "For full account deletion, contact us at the address below and we will process the request.",
          ],
        },
        {
          h: "Contact",
          p: ["Placeholder contact address: hello@seerati.sa (demo address in this release)."],
        },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ar ? "سياسة الخصوصية" : "Privacy policy"}
        </h1>
        <p className="mt-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-relaxed">
          {ar
            ? "هذه صفحة توضيحية مبدئية وليست صياغة قانونية نهائية. ستُستبدل بنص مُراجَع قانونياً قبل التشغيل التجاري."
            : "This is an informational placeholder, not final legal drafting. It will be replaced by legally reviewed text before commercial launch."}
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
