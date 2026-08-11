import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  FileDown,
  LayoutList,
  ListOrdered,
  MoveVertical,
  Save,
  ShieldCheck,
  Target,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "المزايا | سيرتي — Seerati Features" },
      {
        name: "description",
        content:
          "محرر متعدد الخطوات بحفظ تلقائي، معاينة مباشرة، مساعد كتابة بالذكاء الاصطناعي، فحص ATS، وتصدير PDF ونص عادي.",
      },
      { property: "og:title", content: "مزايا منصة سيرتي" },
      {
        property: "og:description",
        content: "كل ما تحتاجه لبناء سيرة ذاتية احترافية بالعربية والإنجليزية.",
      },
      { property: "og:url", content: "https://hrhbs.com/features" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://hrhbs.com/features" }],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const groups = [
    {
      icon: LayoutList,
      title: ar ? "محرر متعدد الخطوات" : "Multi-step editor",
      items: ar
        ? [
            "بيانات شخصية وملخص",
            "خبرات وتعليم",
            "مهارات ولغات وشهادات",
            "مشاريع وإنجازات وتطوع",
            "روابط ومراجع وقسم مخصص",
          ]
        : [
            "Personal details & summary",
            "Experience & education",
            "Skills, languages, certificates",
            "Projects, achievements, volunteering",
            "Links, references, custom section",
          ],
    },
    {
      icon: Save,
      title: ar ? "حفظ تلقائي ومعاينة مباشرة" : "Autosave & live preview",
      items: ar
        ? ["مؤشر حفظ واضح", "معاينة تتحدث أثناء الكتابة", "تبديل القالب فوراً"]
        : ["Clear saving indicator", "Preview updates as you type", "Switch template instantly"],
    },
    {
      icon: MoveVertical,
      title: ar ? "ترتيب الأقسام" : "Section ordering",
      items: ar
        ? ["رفع/إنزال أي قسم", "إخفاء الأقسام الفارغة تلقائياً"]
        : ["Move any section up or down", "Empty sections hide automatically"],
    },
    {
      icon: Bot,
      title: ar ? "مساعد سيرتي" : "Seerati Assistant",
      items: ar
        ? [
            "كتابة الملخص المهني",
            "تحسين نقاط الخبرة",
            "تحويل المهام إلى إنجازات",
            "اقتراح مهارات وتصحيح لغوي",
            "اختصار وتوسيع وترجمة",
          ]
        : [
            "Draft the summary",
            "Improve bullets",
            "Duties to achievements",
            "Suggest skills & proofread",
            "Shorten, expand, translate",
          ],
    },
    {
      icon: Target,
      title: ar ? "فحص ATS" : "ATS check",
      items: ar
        ? ["نتيجة من ١٠٠", "٩ فحوصات واضحة", "كلمات مفتاحية من وصف الوظيفة"]
        : ["Score out of 100", "Nine explicit checks", "Keywords from a job description"],
    },
    {
      icon: FileDown,
      title: ar ? "التصدير" : "Export",
      items: ar
        ? ["PDF عبر معاينة الطباعة مع دعم RTL", "نسخة نصية للنماذج الإلكترونية"]
        : ["PDF via print preview with RTL support", "Plain text for online forms"],
    },
    {
      icon: ShieldCheck,
      title: ar ? "الخصوصية والحدود" : "Privacy & limits",
      items: ar
        ? ["٣ سير ذاتية لكل حساب", "لا أسرار في الواجهة", "طبقة تحكم بمعدل الطلبات"]
        : ["3 resumes per account", "No secrets in the client", "Request rate-limit layer"],
    },
    {
      icon: ListOrdered,
      title: ar ? "قادم قريباً" : "Planned next",
      items: ar
        ? ["خطاب التعريف (Cover Letter)", "مطابقة الوظائف"]
        : ["Cover letters", "Job matching"],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{ar ? "المزايا" : "Features"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {ar
            ? "كل ما هو مذكور هنا متوفر داخل المنتج الآن."
            : "Everything listed here is available in the product today."}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.title}>
              <CardContent className="pt-6">
                <span className="grid size-10 place-items-center rounded-xl bg-secondary">
                  <g.icon className="size-5 text-primary" />
                </span>
                <h2 className="mt-4 font-bold">{g.title}</h2>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {g.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-accent" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              {ar ? "ابدأ الآن" : "Get started"}
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
