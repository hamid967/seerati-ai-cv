import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/career-guides")({
  head: () => ({
    meta: [
      { title: "دليل السيرة الذاتية السعودية | سيرتي" },
      {
        name: "description",
        content:
          "دليل عملي لبناء سيرة ذاتية عربية وإنجليزية واضحة، قابلة للقراءة، ومتوافقة مع ممارسات ATS بدون وعود توظيف أو اختلاق إنجازات.",
      },
      { property: "og:title", content: "دليل سيرتي للسيرة الذاتية في السعودية" },
      {
        property: "og:description",
        content: "إرشادات عملية للسيرة، ATS، الإنجازات، العربية والإنجليزية، والتخصيص لكل وظيفة.",
      },
      { property: "og:url", content: "https://hrhbs.com/career-guides" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://hrhbs.com/career-guides" }],
  }),
  component: CareerGuidesPage,
});

const guides = [
  {
    ar: "السيرة السعودية الاحترافية",
    en: "A professional Saudi-market resume",
    arBody:
      "ابدأ باسم واضح ومسمى مهني وبريد وجوال ومدينة، ثم ملخص مركز وخبرة مرتبة وإنجازات قابلة للإثبات. لا تضف بيانات شخصية حساسة لمجرد أنها متاحة لديك.",
    enBody:
      "Start with a clear name, professional headline, email, mobile and city, followed by a focused summary, ordered experience and supportable achievements. Do not add sensitive personal data simply because you have it.",
  },
  {
    ar: "ATS بدون حشو كلمات",
    en: "ATS without keyword stuffing",
    arBody:
      "استخدم عناوين أقسام مألوفة وبنية بسيطة، واذكر المهارات الموجودة لديك عندما ترتبط بالوظيفة. التوافق لا يعني تكرار كلمات الوصف الوظيفي أو ادعاء خبرة غير موجودة.",
    enBody:
      "Use familiar section headings and a simple structure, and surface skills you genuinely have when relevant. Compatibility does not mean repeating the job description or claiming experience you do not have.",
  },
  {
    ar: "تحويل المسؤوليات إلى إنجازات",
    en: "Turn responsibilities into achievements",
    arBody:
      "صف ما فعلته، ولماذا كان مهمًا، وما النتيجة. استخدم رقمًا فقط عندما يكون صحيحًا ويمكنك الدفاع عنه؛ الإنجاز الصادق أقوى من رقم مختلق.",
    enBody:
      "Describe what you did, why it mattered and the result. Use a number only when it is accurate and defensible; an honest achievement is stronger than a fabricated metric.",
  },
  {
    ar: "العربية والإنجليزية",
    en: "Arabic and English resumes",
    arBody:
      "حافظ على أسماء المنتجات والتقنيات عندما تكون الإنجليزية أدق، لكن اجعل الجمل والعناوين متسقة مع لغة النسخة. الترجمة المهنية ليست ترجمة حرفية لكل كلمة.",
    enBody:
      "Keep product and technology names when English is more precise, while keeping sentences and headings consistent with the resume language. Professional localization is not word-for-word translation.",
  },
  {
    ar: "سيرة مختلفة لكل وظيفة",
    en: "A tailored resume for each role",
    arBody:
      "لا تحتاج إلى اختراع نسخة جديدة من حياتك المهنية. أعد ترتيب الخبرات والمهارات والنقاط الحقيقية بحيث يظهر الأكثر صلة أولًا، واحتفظ بنسخة قابلة للتراجع.",
    enBody:
      "You do not need to invent a new career story. Reorder true experience, skills and bullets so the most relevant appears first, and keep a reversible version history.",
  },
  {
    ar: "مراجعة الخصوصية قبل الإرسال",
    en: "Privacy review before sharing",
    arBody:
      "قبل تنزيل السيرة أو إرسالها، راجع ما إذا كنت قد أضفت هوية وطنية أو إقامة أو عنوانًا تفصيليًا أو معلومات لا تحتاجها الجهة في مرحلة التقديم الأولية.",
    enBody:
      "Before downloading or sharing a resume, check whether it contains national ID, residency number, detailed address or other information that is unnecessary for the initial application stage.",
  },
];

function CareerGuidesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main id="main-content">
        <section className="border-b bg-sand/60">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
                <BookOpen className="size-5" />
                {ar ? "مركز المعرفة المهنية" : "Career knowledge center"}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                {ar ? "ابنِ سيرة أوضح، لا سيرة أعلى ضجيجًا" : "Build a clearer resume, not a louder one"}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                {ar
                  ? "إرشادات سيرتي تركز على الوضوح والأدلة والخصوصية وقابلية القراءة بالعربية والإنجليزية. لا توجد صيغة واحدة تضمن مقابلة أو وظيفة."
                  : "Seerati guidance focuses on clarity, evidence, privacy and readability in Arabic and English. No resume formula can guarantee an interview or job."}
              </p>
              <Button asChild className="mt-7">
                <Link to="/auth">
                  {ar ? "ابدأ بناء سيرتك" : "Start building your resume"}
                  <Arrow className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Card key={guide.en} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{ar ? guide.ar : guide.en}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {ar ? guide.arBody : guide.enBody}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardContent className="grid gap-4 p-6 md:grid-cols-[auto_1fr] md:items-start">
              <ShieldCheck className="size-6 text-primary" />
              <div>
                <h2 className="font-extrabold">{ar ? "قاعدة سيرتي" : "The Seerati rule"}</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ar ? "لا نخترع خبرة أو مهارة أو رقمًا." : "Never invent experience, skills or metrics.",
                    ar ? "التقييمات تشرح جودة المستند، لا احتمال التوظيف." : "Scores describe document quality, not hiring probability.",
                    ar ? "التخصيص يحتاج مراجعة المستخدم." : "Tailoring stays under user review.",
                    ar ? "الخصوصية جزء من المنتج وليست صفحة قانونية فقط." : "Privacy is a product behavior, not just a legal page.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-700" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
