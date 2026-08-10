import type { Resume, TemplateDef } from "./types";

export type StudioDensity = "compact" | "normal" | "airy";

export type StudioAdvice = {
  load: "light" | "balanced" | "dense";
  density: StudioDensity;
  recommendedTemplateIds: string[];
  reasons: { ar: string; en: string }[];
  pageHint: { ar: string; en: string };
};

function contentUnits(resume: Resume) {
  const d = resume.data;
  const bulletChars = d.experience.flatMap((x) => x.bullets).join(" ").length;
  const simpleChars = [
    ...d.certificates,
    ...d.projects,
    ...d.achievements,
    ...d.volunteering,
    ...d.references,
  ].reduce((sum, item) => sum + item.title.length + (item.detail?.length ?? 0), 0);
  const customChars = d.custom.reduce(
    (sum, section) =>
      sum +
      section.title.length +
      section.items.reduce((n, item) => n + item.title.length + (item.detail?.length ?? 0), 0),
    0,
  );

  return (
    d.summary.length +
    bulletChars +
    simpleChars +
    customChars +
    d.experience.length * 120 +
    d.education.length * 80 +
    d.skills.length * 24 +
    d.languages.length * 28
  );
}

export function adviseResumeStudio(resume: Resume, templates: TemplateDef[]): StudioAdvice {
  const units = contentUnits(resume);
  const load: StudioAdvice["load"] = units > 4200 ? "dense" : units < 1750 ? "light" : "balanced";
  const density: StudioDensity = load === "dense" ? "compact" : load === "light" ? "airy" : "normal";
  const target = `${resume.data.targetJob ?? ""} ${resume.data.personal.jobTitle ?? ""}`.toLowerCase();
  const senior = /director|executive|head|vp|chief|مدير|تنفيذي|رئيس/.test(target);
  const tech = /engineer|developer|software|data|product|تقني|برمج|بيانات|منتج/.test(target);
  const finance = /finance|account|investment|audit|مالي|محاسب|استثمار|تدقيق/.test(target);

  const preferred = senior
    ? ["saudi-executive", "executive", "classic-ats"]
    : tech
      ? ["technology", "riyadh-modern", "classic-ats"]
      : finance
        ? ["finance", "classic-ats", "minimal"]
        : ["classic-ats", "modern", "saudi-professional"];

  const available = new Set(templates.filter((t) => t.active).map((t) => t.id));
  const recommendedTemplateIds = preferred.filter((id) => available.has(id)).slice(0, 3);
  const reasons: StudioAdvice["reasons"] = [];

  if (load === "dense") {
    reasons.push({
      ar: "محتوى السيرة كثيف؛ الكثافة المضغوطة تقلل الامتداد بدون حذف أي معلومة.",
      en: "The resume is content-dense; compact spacing reduces overflow without deleting information.",
    });
  } else if (load === "light") {
    reasons.push({
      ar: "المحتوى خفيف نسبيًا؛ مسافات أوسع تعطي توازنًا بصريًا أفضل.",
      en: "Content is relatively light, so airy spacing creates a better visual balance.",
    });
  } else {
    reasons.push({
      ar: "حجم المحتوى متوازن؛ الإعداد المعتاد يحافظ على القراءة والمساحة.",
      en: "Content volume is balanced; normal spacing preserves readability and space.",
    });
  }

  if (senior)
    reasons.push({
      ar: "المسمى المستهدف يبدو قياديًا، لذلك نعطي أولوية للقوالب التنفيذية الهادئة.",
      en: "The target title appears senior, so restrained executive templates are prioritised.",
    });
  else if (tech)
    reasons.push({
      ar: "المسمى المستهدف تقني/منتج، لذلك نعطي أولوية لقالب سريع المسح مع مهارات ومشاريع واضحة.",
      en: "The target appears technical/product-focused, so scan-friendly templates with clear skills and projects are prioritised.",
    });
  else if (finance)
    reasons.push({
      ar: "المسمى المستهدف مالي، لذلك نعطي أولوية لقوالب رسمية منخفضة الزخرفة.",
      en: "The target appears finance-oriented, so formal low-decoration templates are prioritised.",
    });

  return {
    load,
    density,
    recommendedTemplateIds,
    reasons,
    pageHint:
      load === "dense"
        ? {
            ar: "ابدأ بهدف صفحتين. إذا ظل المحتوى مزدحمًا، اختصر التكرار بدل تصغير الخط بشكل مبالغ.",
            en: "Start with a two-page target. If it is still crowded, remove repetition rather than shrinking text aggressively.",
          }
        : {
            ar: "ابدأ بهدف صفحة واحدة، واسمح بصفحتين إذا كانت الخبرة الفعلية تحتاج ذلك.",
            en: "Start with a one-page target, and allow two pages when genuine experience needs the space.",
          },
  };
}
